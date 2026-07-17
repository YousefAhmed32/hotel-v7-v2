import mongoose from 'mongoose';
import { RoomRequest } from '../models/RoomRequest.js';
import { Booking }     from '../models/Booking.js';
import { ApiError }    from '../utils/ApiError.js';

const TYPE_LABELS = {
  cleaning: 'Room Cleaning', maintenance: 'Maintenance', do_not_disturb: 'Do Not Disturb',
  room_service: 'Room Service', checkout_request: 'Early Checkout', extra_towels: 'Extra Towels',
  extra_pillows: 'Extra Pillows', other: 'General Request',
};

export const createRequest = async (guestId, { bookingId, type, description = '', items = [], priority = 'normal' }) => {
  const booking = await Booking.findOne({ _id: bookingId, userId: guestId, status: 'checked_in' }).select('hotelId roomId');
  if (!booking) throw ApiError.badRequest('No active stay found. You must be checked in to submit requests.');

  const itemsTotal = items.reduce((s, i) => s + (i.price || 0) * (i.quantity || 1), 0);

  const req = await RoomRequest.create({
    hotelId:     booking.hotelId,
    bookingId:   booking._id,
    roomId:      booking.roomId,
    guestId:     new mongoose.Types.ObjectId(guestId),
    type, description, items, itemsTotal, priority,
    title: TYPE_LABELS[type] || type,
  });

  return req;
};

export const getGuestRequests = async (guestId, bookingId) => {
  const filter = { guestId: new mongoose.Types.ObjectId(guestId) };
  if (bookingId) filter.bookingId = new mongoose.Types.ObjectId(bookingId);
  return RoomRequest.find(filter).sort({ createdAt: -1 }).lean();
};

export const getHotelRequests = async (hotelId, { status = '', type = '', page = 1, limit = 30 } = {}) => {
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (status) filter.status = status;
  if (type)   filter.type   = type;
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const [requests, total] = await Promise.all([
    RoomRequest.find(filter).sort({ createdAt: -1 }).skip((pageNum-1)*limitNum).limit(limitNum)
      .populate('guestId',  'name email')
      .populate('roomId',   'name roomNumber')
      .populate('assignedTo','name role')
      .lean(),
    RoomRequest.countDocuments(filter),
  ]);
  return { requests, pagination: { total, page: pageNum, totalPages: Math.ceil(total/limitNum) } };
};

export const updateRequestStatus = async (hotelId, requestId, { status, notes, assignedTo }) => {
  const updates = { status };
  if (notes)      updates.notes      = notes;
  if (assignedTo) updates.assignedTo = new mongoose.Types.ObjectId(assignedTo);
  if (status === 'acknowledged') updates.acknowledgedAt = new Date();
  if (status === 'in_progress')  updates.startedAt      = new Date();
  if (status === 'completed')    updates.completedAt    = new Date();

  const req = await RoomRequest.findOneAndUpdate(
    { _id: requestId, hotelId: new mongoose.Types.ObjectId(hotelId) },
    { $set: updates },
    { new: true }
  ).populate('guestId', 'name').populate('roomId', 'name roomNumber');
  if (!req) throw ApiError.notFound('Request not found');
  return req;
};
