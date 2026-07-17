import { Room }    from '../models/Room.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError }    from '../utils/ApiError.js';

// Valid status transitions
const TRANSITIONS = {
  occupied:    ['dirty', 'maintenance'],
  dirty:       ['cleaning', 'maintenance'],
  cleaning:    ['clean', 'dirty'],
  clean:       ['available', 'maintenance'],
  available:   ['maintenance', 'blocked'],
  maintenance: ['available', 'dirty'],
  blocked:     ['available'],
};

export const getRoomStatuses = async (req, res, next) => {
  try {
    const rooms = await Room.find({ hotelId: req.hotelId, isActive: true })
      .select('name roomNumber type floor currentStatus currentBookingId lastStatusChangedAt housekeepingNotes coverImage')
      .populate('currentBookingId', 'checkIn checkOut guestDetails.firstName guestDetails.lastName confirmationCode')
      .sort({ floor: 1, roomNumber: 1 })
      .lean();
    return ApiResponse.success(res, { rooms });
  } catch (err) { next(err); }
};

export const updateRoomStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const { roomId } = req.params;

    const room = await Room.findOne({ _id: roomId, hotelId: req.hotelId });
    if (!room) throw ApiError.notFound('Room not found');

    const allowed = TRANSITIONS[room.currentStatus] || [];
    if (!allowed.includes(status))
      throw ApiError.badRequest(`Cannot transition from ${room.currentStatus} → ${status}. Allowed: ${allowed.join(', ')}`);

    room.currentStatus       = status;
    room.lastStatusChangedAt = new Date();
    room.lastStatusChangedBy = req.user._id;
    if (notes !== undefined) room.housekeepingNotes = notes;
    if (status === 'available' || status === 'clean') room.housekeepingNotes = '';
    await room.save();

    // Real-time broadcast
    req.app.get('io')?.to('hotel:' + req.hotelId).emit('room:status_changed', { roomId: room._id, status, roomName: room.name, roomNumber: room.roomNumber, changedBy: req.user.name });

    return ApiResponse.success(res, { room: { _id: room._id, name: room.name, roomNumber: room.roomNumber, currentStatus: room.currentStatus, lastStatusChangedAt: room.lastStatusChangedAt } }, `Room marked as ${status}`);
  } catch (err) { next(err); }
};

export const getHousekeepingStats = async (req, res, next) => {
  try {
    const rooms = await Room.find({ hotelId: req.hotelId, isActive: true }).select('currentStatus').lean();
    const stats = rooms.reduce((acc, r) => { acc[r.currentStatus] = (acc[r.currentStatus] || 0) + 1; return acc; }, {});
    return ApiResponse.success(res, { stats, total: rooms.length });
  } catch (err) { next(err); }
};
