import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { Booking } from '../models/Booking.js';
import { Hotel } from '../models/Hotel.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

const computeOccupancyScore = async (hotelId, targetDate) => {
  const windowStart = new Date(targetDate);
  const windowEnd = new Date(targetDate);
  windowEnd.setDate(windowEnd.getDate() + 30);
  const totalRooms = await Room.countDocuments({ hotelId: new mongoose.Types.ObjectId(hotelId), isActive: true });
  if (!totalRooms) return { score: 0, occupancyRate: 0 };
  const bookings = await Booking.find({ hotelId: new mongoose.Types.ObjectId(hotelId), status: { $in: ['confirmed','pending'] }, checkIn: { $lt: windowEnd }, checkOut: { $gt: windowStart } }).select('checkIn checkOut').lean();
  let bookedNights = 0;
  for (const b of bookings) {
    const overlapStart = new Date(Math.max(b.checkIn, windowStart));
    const overlapEnd = new Date(Math.min(b.checkOut, windowEnd));
    bookedNights += Math.max(0, Math.round((overlapEnd - overlapStart) / (1000*60*60*24)));
  }
  const occupancyRate = Math.min(1, bookedNights / (totalRooms * 30));
  let score;
  if (occupancyRate >= 0.85) score = 0.9 + (occupancyRate - 0.85) / 1.5;
  else if (occupancyRate >= 0.60) score = 0.5 + (occupancyRate - 0.60) / 0.5;
  else if (occupancyRate >= 0.30) score = 0.2 + (occupancyRate - 0.30) / 1.0;
  else score = occupancyRate / 1.5;
  return { score: Math.min(1, Math.round(score*100)/100), occupancyRate };
};

const computeSeasonScore = (date) => {
  const month = date.getMonth() + 1;
  const map = { 1:0.90, 2:0.88, 3:0.70, 4:0.68, 5:0.35, 6:0.40, 7:0.82, 8:0.85, 9:0.38, 10:0.65, 11:0.70, 12:0.92 };
  return map[month] || 0.5;
};

const computeDayOfWeekScore = (date) => {
  const map = { 0:0.75, 1:0.30, 2:0.30, 3:0.35, 4:0.55, 5:0.85, 6:0.90 };
  return map[date.getDay()] || 0.5;
};

const computeLeadTimeScore = (targetDate) => {
  const daysOut = Math.max(0, Math.round((new Date(targetDate) - new Date()) / (1000*60*60*24)));
  if (daysOut === 0) return { score: 0.50, days: daysOut };
  if (daysOut <= 2) return { score: 0.60, days: daysOut };
  if (daysOut <= 7) return { score: 0.80, days: daysOut };
  if (daysOut <= 21) return { score: 1.00, days: daysOut };
  if (daysOut <= 60) return { score: 0.90, days: daysOut };
  if (daysOut <= 120) return { score: 0.80, days: daysOut };
  return { score: 0.70, days: daysOut };
};

const computeDemandScore = async (hotelId) => {
  const sevenDaysAgo = new Date(Date.now() - 7*24*60*60*1000);
  const recent = await Booking.countDocuments({ hotelId: new mongoose.Types.ObjectId(hotelId), status: { $in: ['confirmed','pending'] }, createdAt: { $gte: sevenDaysAgo } });
  return { score: Math.min(1, recent / 20), recentBookings: recent };
};

const computeReviewScore = async (hotelId) => {
  const hotel = await Hotel.findById(hotelId).select('avgRating').lean();
  if (!hotel || !hotel.avgRating) return 0.5;
  return Math.round(((hotel.avgRating - 1) / 4) * 100) / 100;
};

const buildExplanation = (signals, multiplier) => {
  const parts = [];
  if (signals.occupancyScore >= 0.75) parts.push(`High hotel occupancy (${Math.round(signals.occupancyRate*100)}%) is driving demand up`);
  else if (signals.occupancyScore <= 0.25) parts.push(`Low hotel occupancy (${Math.round(signals.occupancyRate*100)}%) - consider a discount`);
  if (signals.seasonScore >= 0.80) parts.push('Peak season pricing applies');
  else if (signals.seasonScore <= 0.40) parts.push('Off-peak season - lower rates recommended');
  if (signals.dayOfWeekScore >= 0.80) parts.push('Weekend premium applies');
  if (signals.demandScore >= 0.70) parts.push('High recent booking velocity');
  if (signals.leadTimeDays <= 2) parts.push('Last-minute booking - slight discount to convert');
  else if (signals.leadTimeDays >= 60) parts.push('Early booking - incentivize with modest discount');
  if (signals.reviewScore >= 0.80) parts.push('Strong guest ratings support premium pricing');
  if (!parts.length) parts.push('Standard pricing conditions');
  const direction = multiplier > 1.0 ? 'above' : 'below';
  const pct = Math.abs(Math.round((multiplier - 1) * 100));
  parts.push(`Overall: ${pct}% ${direction} base price (multiplier: ${multiplier}x)`);
  return parts;
};

export const computeSuggestedPrice = async (hotelId, roomId, targetDate = new Date()) => {
  const room = await Room.findOne({ _id: new mongoose.Types.ObjectId(roomId), hotelId: new mongoose.Types.ObjectId(hotelId) }).lean();
  if (!room) throw ApiError.notFound('Room not found');
  const [occupancyResult, demandResult] = await Promise.all([computeOccupancyScore(hotelId, targetDate), computeDemandScore(hotelId)]);
  const leadTimeResult = computeLeadTimeScore(targetDate);
  const seasonScore = computeSeasonScore(targetDate);
  const dayOfWeekScore = computeDayOfWeekScore(targetDate);
  const reviewScore = await computeReviewScore(hotelId);
  const signals = { occupancyRate: occupancyResult.occupancyRate, occupancyScore: occupancyResult.score, seasonScore, demandScore: demandResult.score, leadTimeDays: leadTimeResult.days, leadTimeScore: leadTimeResult.score, dayOfWeekScore, reviewScore };
  const weights = { occupancy: 0.30, season: 0.25, demand: 0.20, leadTime: 0.10, dayOfWeek: 0.10, review: 0.05 };
  const weightedScore = weights.occupancy*signals.occupancyScore + weights.season*signals.seasonScore + weights.demand*signals.demandScore + weights.leadTime*signals.leadTimeScore + weights.dayOfWeek*signals.dayOfWeekScore + weights.review*signals.reviewScore;
  const finalMultiplier = Math.round((0.70 + weightedScore * (1.50 - 0.70)) * 100) / 100;
  const rawSuggested = room.basePrice * finalMultiplier;
  const suggestedPrice = Math.max(Math.round(room.basePrice*0.60/5)*5, Math.min(Math.round(room.basePrice*2.00/5)*5, Math.round(rawSuggested/5)*5));
  return {
    roomId: room._id, roomName: room.name, basePrice: room.basePrice, suggestedPrice, currentPrice: room.aiSuggestedPrice || room.basePrice, targetDate: new Date(targetDate).toISOString().slice(0,10), finalMultiplier,
    signals: { occupancyRate: Math.round(signals.occupancyRate*100), seasonScore: Math.round(signals.seasonScore*100), demandScore: Math.round(signals.demandScore*100), leadTimeDays: signals.leadTimeDays, dayOfWeekScore: Math.round(signals.dayOfWeekScore*100), reviewScore: Math.round(signals.reviewScore*100), finalMultiplier },
    explanation: buildExplanation(signals, finalMultiplier),
  };
};

export const suggestHotelPrices = async (hotelId, targetDate = new Date()) => {
  const rooms = await Room.find({ hotelId: new mongoose.Types.ObjectId(hotelId), isActive: true }).select('_id name basePrice').lean();
  const suggestions = await Promise.all(rooms.map(room => computeSuggestedPrice(hotelId, room._id.toString(), targetDate).catch(err => { logger.error('Pricing failed for room ' + room._id + ': ' + err.message); return null; })));
  return suggestions.filter(Boolean);
};

export const applySuggestedPrice = async ({ hotelId, roomId, suggestedPrice, appliedBy, action, overridePrice }) => {
  const room = await Room.findOne({ _id: new mongoose.Types.ObjectId(roomId), hotelId: new mongoose.Types.ObjectId(hotelId) });
  if (!room) throw ApiError.notFound('Room not found');
  const finalPrice = overridePrice || suggestedPrice;
  room.aiSuggestedPrice = suggestedPrice; room.aiPriceUpdatedAt = new Date();
  await room.save();
  const suggestion = await computeSuggestedPrice(hotelId, roomId);
  await PriceHistory.create({ hotelId: new mongoose.Types.ObjectId(hotelId), roomId: new mongoose.Types.ObjectId(roomId), date: new Date(), basePrice: room.basePrice, suggestedPrice, appliedPrice: finalPrice, signals: suggestion.signals, action: action||'manual', actionBy: appliedBy ? new mongoose.Types.ObjectId(appliedBy) : null, actionAt: new Date() });
  return room;
};

export const ignoreSuggestion = async (hotelId, roomId, userId) => {
  const room = await Room.findOne({ _id: new mongoose.Types.ObjectId(roomId), hotelId: new mongoose.Types.ObjectId(hotelId) }).lean();
  if (!room) throw ApiError.notFound('Room not found');
  await PriceHistory.create({ hotelId: new mongoose.Types.ObjectId(hotelId), roomId: new mongoose.Types.ObjectId(roomId), date: new Date(), basePrice: room.basePrice, suggestedPrice: room.aiSuggestedPrice||room.basePrice, appliedPrice: null, signals: {}, action: 'ignored', actionBy: new mongoose.Types.ObjectId(userId), actionAt: new Date() });
  return { ignored: true };
};

export const getPriceHistory = async (hotelId, roomId, query = {}) => {
  const { page=1, limit=30, from='', to='' } = query;
  const pageNum = Math.max(1, parseInt(page,10)); const limitNum = Math.min(90, Math.max(1, parseInt(limit,10))); const skip = (pageNum-1)*limitNum;
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId), roomId: new mongoose.Types.ObjectId(roomId) };
  if (from || to) { filter.date = {}; if (from) filter.date.$gte = new Date(from); if (to) filter.date.$lte = new Date(to); }
  const [history, total] = await Promise.all([PriceHistory.find(filter).sort({ date: -1 }).skip(skip).limit(limitNum).populate('actionBy','name role').lean(), PriceHistory.countDocuments(filter)]);
  return { history, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum), hasNext: pageNum < Math.ceil(total/limitNum), hasPrev: pageNum > 1 } };
};

export const getPricingAnalytics = async (hotelId, query = {}) => {
  const { from='', to='' } = query;
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30*24*60*60*1000);
  const toDate = to ? new Date(to) : new Date();
  const baseFilter = { hotelId: new mongoose.Types.ObjectId(hotelId), date: { $gte: fromDate, $lte: toDate } };
  const [actionBreakdown, avgMultipliers, roomSummary] = await Promise.all([
    PriceHistory.aggregate([{ $match: baseFilter }, { $group: { _id: '$action', count: { $sum: 1 } } }]),
    PriceHistory.aggregate([{ $match: { ...baseFilter, 'signals.finalMultiplier': { $exists: true } } }, { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' }, day: { $dayOfMonth: '$date' } }, avgMultiplier: { $avg: '$signals.finalMultiplier' }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }]),
    PriceHistory.aggregate([{ $match: baseFilter }, { $group: { _id: '$roomId', avgSuggested: { $avg: '$suggestedPrice' }, avgApplied: { $avg: '$appliedPrice' }, totalSuggestions: { $sum: 1 }, applied: { $sum: { $cond: [{ $ne: ['$appliedPrice', null] }, 1, 0] } } } }, { $lookup: { from: 'rooms', localField: '_id', foreignField: '_id', as: 'room' } }, { $unwind: { path: '$room', preserveNullAndEmpty: true } }, { $project: { roomName: '$room.name', roomType: '$room.type', avgSuggested: { $round: ['$avgSuggested', 2] }, avgApplied: { $round: ['$avgApplied', 2] }, totalSuggestions: 1, applied: 1 } }]),
  ]);
  return {
    period: { from: fromDate, to: toDate },
    actionBreakdown: actionBreakdown.reduce((acc, a) => { acc[a._id] = a.count; return acc; }, {}),
    multiplierTrend: avgMultipliers.map(d => ({ date: `${d._id.year}-${String(d._id.month).padStart(2,'0')}-${String(d._id.day).padStart(2,'0')}`, avgMultiplier: Math.round(d.avgMultiplier*100)/100, count: d.count })),
    roomSummary,
  };
};
