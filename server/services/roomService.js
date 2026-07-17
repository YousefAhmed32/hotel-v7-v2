import mongoose from 'mongoose';
import { Room } from '../models/Room.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';

const buildPagination = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total/limit), hasNext: page < Math.ceil(total/limit), hasPrev: page > 1 });

export const createRoom = async (hotelId, data) => Room.create({ ...data, hotelId });

export const getRoomsByHotel = async (hotelId, query = {}) => {
  const { page=1, limit=20, type='', minPrice=0, maxPrice='', adults='', isActive='true', sortBy='basePrice', sortOrder='asc' } = query;
  const pageNum = Math.max(1, parseInt(page,10)); const limitNum = Math.min(50, Math.max(1, parseInt(limit,10))); const skip = (pageNum-1)*limitNum;
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (isActive !== 'all') filter.isActive = isActive !== 'false';
  if (type) filter.type = type;
  if (adults) filter.maxAdults = { $gte: parseInt(adults,10) };
  const priceFilter = {};
  if (minPrice) priceFilter.$gte = parseFloat(minPrice);
  if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
  if (Object.keys(priceFilter).length) filter.basePrice = priceFilter;
  const allowedSort = ['basePrice','name','createdAt','maxAdults'];
  const sf = allowedSort.includes(sortBy) ? sortBy : 'basePrice';
  const sort = { [sf]: sortOrder === 'desc' ? -1 : 1 };
  const [rooms, total] = await Promise.all([Room.find(filter).sort(sort).skip(skip).limit(limitNum).lean(), Room.countDocuments(filter)]);
  return { rooms, pagination: buildPagination(total, pageNum, limitNum) };
};

export const getRoomById = async (hotelId, roomId) => {
  if (!mongoose.isValidObjectId(roomId)) throw ApiError.badRequest('Invalid roomId');
  const room = await Room.findOne({ _id: new mongoose.Types.ObjectId(roomId), hotelId: new mongoose.Types.ObjectId(hotelId), isActive: true }).lean();
  if (!room) throw ApiError.notFound('Room not found');
  return room;
};

export const updateRoom = async (hotelId, roomId, updates) => {
  delete updates.hotelId;
  const room = await Room.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(roomId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { $set: updates }, { new: true, runValidators: true });
  if (!room) throw ApiError.notFound('Room not found');
  return room;
};

export const deleteRoom = async (hotelId, roomId) => {
  const activeBooking = await Booking.findOne({ hotelId: new mongoose.Types.ObjectId(hotelId), roomId: new mongoose.Types.ObjectId(roomId), status: { $in: ['confirmed','pending','locked'] }, checkOut: { $gte: new Date() } });
  if (activeBooking) throw ApiError.conflict('Cannot deactivate room with active future bookings');
  const room = await Room.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(roomId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { isActive: false }, { new: true });
  if (!room) throw ApiError.notFound('Room not found');
  return room;
};

export const addPricingRule = async (hotelId, roomId, rule) => {
  const room = await Room.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(roomId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { $push: { pricingRules: rule } }, { new: true, runValidators: true });
  if (!room) throw ApiError.notFound('Room not found');
  return room;
};

export const removePricingRule = async (hotelId, roomId, ruleId) => {
  const room = await Room.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(roomId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { $pull: { pricingRules: { _id: new mongoose.Types.ObjectId(ruleId) } } }, { new: true });
  if (!room) throw ApiError.notFound('Room not found');
  return room;
};

export const blockDates = async (hotelId, roomId, dates) => {
  const parsedDates = dates.map(d => new Date(d));
  const room = await Room.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(roomId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { $addToSet: { blockedDates: { $each: parsedDates } } }, { new: true });
  if (!room) throw ApiError.notFound('Room not found');
  return room;
};

export const getAvailableRooms = async (hotelId, checkIn, checkOut, query = {}) => {
  const checkInDate = new Date(checkIn); const checkOutDate = new Date(checkOut);
  if (isNaN(checkInDate) || isNaN(checkOutDate)) throw ApiError.badRequest('Invalid dates');
  if (checkOutDate <= checkInDate) throw ApiError.badRequest('Check-out must be after check-in');
  const bookedRoomIds = await Booking.distinct('roomId', { hotelId: new mongoose.Types.ObjectId(hotelId), status: { $in: ['confirmed','pending','locked'] }, checkIn: { $lt: checkOutDate }, checkOut: { $gt: checkInDate } });
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId), isActive: true, _id: { $nin: bookedRoomIds }, blockedDates: { $not: { $elemMatch: { $gte: checkInDate, $lt: checkOutDate } } } };
  if (query.adults) filter.maxAdults = { $gte: parseInt(query.adults,10) };
  if (query.type) filter.type = query.type;
  return Room.find(filter).lean();
};
