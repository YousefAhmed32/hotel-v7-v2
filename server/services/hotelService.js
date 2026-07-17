import { Hotel } from '../models/Hotel.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import mongoose from 'mongoose';
const buildPagination = (total, page, limit) => ({
  total, page, limit, totalPages: Math.ceil(total/limit), hasNext: page < Math.ceil(total/limit), hasPrev: page > 1,
});

export const createHotel = async (ownerId, data) => {
  const hotel = await Hotel.create({ ...data, ownerId });
  await User.findByIdAndUpdate(ownerId, { hotelId: hotel._id, role: 'owner' });
  return hotel;
};

export const getAllHotels = async (query = {}) => {
  const { page=1, limit=12, search='', city='', country='', minRating=0, amenities='', sortBy='avgRating', sortOrder='desc' } = query;
  const pageNum = Math.max(1, parseInt(page,10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit,10)));
  const skip = (pageNum-1)*limitNum;
  const filter = query.includeInactive === true ? {} : { isActive: true };
  if (search) filter.$text = { $search: search };
  if (city) filter['address.city'] = { $regex: city, $options: 'i' };
  if (country) filter['address.country'] = { $regex: country, $options: 'i' };
  if (minRating) filter.avgRating = { $gte: parseFloat(minRating) };
  if (amenities) {
    const list = amenities.split(',').map(a => a.trim()).filter(Boolean);
    if (list.length) filter.amenities = { $all: list };
  }
  const allowedSort = ['avgRating','starRating','createdAt','name'];
  const sf = allowedSort.includes(sortBy) ? sortBy : 'avgRating';
  const sort = { [sf]: sortOrder === 'asc' ? 1 : -1 };
  const [hotels, total] = await Promise.all([
    Hotel.find(filter).sort(sort).skip(skip).limit(limitNum).select('-__v').lean(),
    Hotel.countDocuments(filter),
  ]);
  return { hotels, pagination: buildPagination(total, pageNum, limitNum) };
};

export const getHotelById = async (hotelId) => {
  const hotel = await Hotel.findOne({ _id: hotelId, isActive: true }).populate('ownerId','name email').lean();
  if (!hotel) throw ApiError.notFound('Hotel not found');
  return hotel;
};

export const getHotelBySlug = async (slug) => {
  const hotel = await Hotel.findOne({ slug, isActive: true }).populate('ownerId','name email').lean();
  if (!hotel) throw ApiError.notFound('Hotel not found');
  return hotel;
};

export const updateHotel = async (hotelId, updates) => {
  delete updates.ownerId; delete updates.slug; delete updates.avgRating; delete updates.totalReviews;
  const hotel = await Hotel.findByIdAndUpdate(hotelId, { $set: updates }, { new: true, runValidators: true });
  if (!hotel) throw ApiError.notFound('Hotel not found');
  return hotel;
};

export const toggleHotelStatus = async (hotelId) => {
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw ApiError.notFound('Hotel not found');
  hotel.isActive = !hotel.isActive;
  await hotel.save();
  return hotel;
};

export const getHotelStats = async (hotelId) => {
  const [hotel, staffCount] = await Promise.all([
    Hotel.findById(hotelId).lean(),
    User.countDocuments({ hotelId, isActive: true }),
  ]);
  if (!hotel) throw ApiError.notFound('Hotel not found');
  return { hotel, staffCount };
};

export const recalculateRating = async (hotelId, newAvg, newTotal) => {
  return Hotel.findByIdAndUpdate(hotelId, { avgRating: newAvg, totalReviews: newTotal }, { new: true });
};

// Real dashboard data — no fake numbers
export const getHotelDashboard = async (hotelId) => {
  const hId  = new mongoose.Types.ObjectId(hotelId);
  const now  = new Date();
  const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
  const todayEnd   = new Date(now); todayEnd.setHours(23,59,59,999);

  const { Booking } = await import('../models/Booking.js');
  const { Room }    = await import('../models/Room.js');
  const { Payment } = await import('../models/Payment.js');
  const { RoomRequest } = await import('../models/RoomRequest.js');

  const [
    rooms, activeBookings,
    todayCheckins, todayCheckouts,
    pendingApprovals,
    revenueToday, revenueMonth,
    pendingRequests,
    recentBookings,
  ] = await Promise.all([
    Room.find({ hotelId: hId, isActive: true }).select('currentStatus name roomNumber type basePrice').lean(),
    Booking.find({ hotelId: hId, status: { $in: ['confirmed','checked_in'] } }).select('status checkIn checkOut roomId userId').lean(),
    Booking.countDocuments({ hotelId: hId, status:'confirmed', checkIn: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({ hotelId: hId, status:'checked_in', checkOut: { $gte: todayStart, $lte: todayEnd } }),
    Booking.countDocuments({ hotelId: hId, status:'pending' }),
    Payment.aggregate([{ $match: { hotelId: hId, status:'paid', paidAt: { $gte: todayStart, $lte: todayEnd } } }, { $group: { _id:null, total: { $sum: { $subtract:['$amount','$refundAmount'] } } } }]),
    Payment.aggregate([{ $match: { hotelId: hId, status:'paid', paidAt: { $gte: new Date(now.getFullYear(), now.getMonth(), 1) } } }, { $group: { _id:null, total: { $sum: { $subtract:['$amount','$refundAmount'] } } } }]),
    RoomRequest.countDocuments({ hotelId: hId, status: { $in: ['pending','acknowledged'] } }),
    Booking.find({ hotelId: hId }).sort({ createdAt:-1 }).limit(5).select('confirmationCode status checkIn checkOut pricing.totalAmount').populate('userId','name').populate('roomId','name roomNumber').lean(),
  ]);

  const statusCounts = rooms.reduce((acc, r) => { acc[r.currentStatus] = (acc[r.currentStatus]||0)+1; return acc; }, {});
  const occupiedRooms   = statusCounts.occupied || 0;
  const availableRooms  = statusCounts.available || 0;
  const dirtyRooms      = statusCounts.dirty || 0;
  const maintenanceRooms= statusCounts.maintenance || 0;
  const occupancyRate   = rooms.length > 0 ? Math.round((occupiedRooms/rooms.length)*100) : 0;

  return {
    rooms: {
      total:       rooms.length,
      occupied:    occupiedRooms,
      available:   availableRooms,
      dirty:       dirtyRooms,
      maintenance: maintenanceRooms,
      occupancyRate,
    },
    bookings: {
      active:          activeBookings.length,
      todayCheckins,
      todayCheckouts,
      pendingApprovals,
    },
    revenue: {
      today:    Math.round((revenueToday[0]?.total||0)*100)/100,
      thisMonth:Math.round((revenueMonth[0]?.total||0)*100)/100,
    },
    pendingRequests,
    recentBookings,
  };
};
