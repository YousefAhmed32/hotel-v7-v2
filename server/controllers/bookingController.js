import * as emailService from '../services/emailService.js';
import * as notifSvc from '../services/notificationService.js';
import * as bookingService from '../services/bookingService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const lockBooking = async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut, adults, children, guestDetails } = req.body;
    if (!roomId || !checkIn || !checkOut) throw ApiError.badRequest('roomId, checkIn, checkOut required');
    const result = await bookingService.lockBookingSlot({ hotelId: req.hotelId, roomId, userId: req.user._id, checkIn, checkOut, adults: adults || 1, children: children || 0, guestDetails: guestDetails || {} });
    return ApiResponse.created(res, result, 'Room locked for 10 minutes');
  } catch (err) { next(err); }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const { lockToken, paymentMethod, couponId, couponDiscount, guestDetails } = req.body;
    if (!lockToken) throw ApiError.badRequest('lockToken required');
    const booking = await bookingService.confirmBooking({ hotelId: req.hotelId, bookingId: req.params.bookingId, userId: req.user._id, lockToken, paymentMethod, couponId,couponDiscount: couponDiscount ? parseFloat(couponDiscount) : 0, guestDetails });
    // Send confirmation email (non-blocking)
    try {
      const fullBooking = await (await import('../models/Booking.js')).Booking.findById(booking._id)
        .populate('userId', 'name email').populate('roomId', 'name type').populate('hotelId', 'name address contact').lean();
      if (fullBooking?.userId?.email)
        emailService.sendBookingConfirmation({ booking: fullBooking, hotel: fullBooking.hotelId, guest: fullBooking.userId }).catch(() => { });
    } catch { }
    return ApiResponse.success(res, { booking }, 'Booking submitted — awaiting hotel approval');
  } catch (err) { next(err); }
};

export const approveBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.approveBooking(req.hotelId, req.params.bookingId, req.user._id);
    const io = req.app.get('io');
    io?.to('hotel:' + req.hotelId).emit('booking:approved', { bookingId: booking._id, confirmationCode: booking.confirmationCode });
    // Notify guest
    if (booking.userId) {
      await notifSvc.createNotification({
        recipientId: booking.userId, type: 'booking_approved',
        title: 'Booking Approved!', body: `Your booking ${booking.confirmationCode} has been confirmed.`,
        link: '/profile/bookings', data: { bookingId: booking._id }, io
      });
    }
    // Send approval email (non-blocking)
    try {
      const fullBooking = await (await import('../models/Booking.js')).Booking.findById(booking._id)
        .populate('userId', 'name email').populate('roomId', 'name type').populate('hotelId', 'name address contact').lean();
      if (fullBooking?.userId?.email)
        emailService.sendBookingApproved({ booking: fullBooking, hotel: fullBooking.hotelId, guest: fullBooking.userId }).catch(() => { });
    } catch { }
    return ApiResponse.success(res, { booking }, 'Booking approved');
  } catch (err) { next(err); }
};

export const rejectBooking = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await bookingService.rejectBooking(req.hotelId, req.params.bookingId, req.user._id, reason);
    const io = req.app.get('io');
    io?.to('hotel:' + req.hotelId).emit('booking:rejected', { bookingId: booking._id });
    if (booking.userId) {
      await notifSvc.createNotification({
        recipientId: booking.userId, type: 'booking_rejected',
        title: 'Booking Not Approved', body: reason || 'Your booking could not be approved.',
        link: '/profile/bookings', data: { bookingId: booking._id }, io
      });
    }
    return ApiResponse.success(res, { booking }, 'Booking rejected');
  } catch (err) { next(err); }
};

export const checkIn = async (req, res, next) => {
  try {
    const booking = await bookingService.checkIn(req.hotelId, req.params.bookingId, req.user._id);
    req.app.get('io')?.to('hotel:' + req.hotelId).emit('room:status_changed', { roomId: booking.roomId, status: 'occupied' });
    try {
      const fullB = await (await import('../models/Booking.js')).Booking.findById(booking._id)
        .populate('userId', 'name email').populate('roomId', 'name type').populate('hotelId', 'name address contact').lean();
      if (fullB?.userId?.email)
        emailService.sendCheckInConfirmation({ booking: fullB, hotel: fullB.hotelId, guest: fullB.userId }).catch(() => { });
    } catch { }
    return ApiResponse.success(res, { booking }, 'Guest checked in');
  } catch (err) { next(err); }
};

export const checkOut = async (req, res, next) => {
  try {
    const booking = await bookingService.checkOut(req.hotelId, req.params.bookingId, req.user._id);
    req.app.get('io')?.to('hotel:' + req.hotelId).emit('room:status_changed', { roomId: booking.roomId, status: 'dirty' });
    return ApiResponse.success(res, { booking }, 'Guest checked out — room marked for housekeeping');
  } catch (err) { next(err); }
};

export const createReceptionBooking = async (req, res, next) => {
  try {
    const { roomId, checkIn, checkOut, adults, children, guestDetails, paymentMethod, source } = req.body;
    if (!roomId || !checkIn || !checkOut) throw ApiError.badRequest('roomId, checkIn, checkOut required');
    const booking = await bookingService.createReceptionBooking({ hotelId: req.hotelId, roomId, staffUserId: req.user._id, checkIn, checkOut, adults, children, guestDetails, paymentMethod, source });
    req.app.get('io')?.to('hotel:' + req.hotelId).emit('booking:new', { bookingId: booking._id, confirmationCode: booking.confirmationCode });
    return ApiResponse.created(res, { booking }, 'Booking created');
  } catch (err) { next(err); }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { reason, refundAmount } = req.body;
    const booking = await bookingService.cancelBooking({ hotelId: req.hotelId, bookingId: req.params.bookingId, requestingUserId: req.user._id, requestingUserRole: req.user.role, reason, refundAmount: refundAmount ? parseFloat(refundAmount) : 0 });
    return ApiResponse.success(res, { booking }, 'Booking cancelled');
  } catch (err) { next(err); }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    if (!status) throw ApiError.badRequest('status required');
    const booking = await bookingService.updateBookingStatus(req.hotelId, req.params.bookingId, status, req.user._id, notes);
    return ApiResponse.success(res, { booking }, 'Status updated');
  } catch (err) { next(err); }
};

export const getHotelBookings = async (req, res, next) => {
  try {
    const { bookings, pagination } = await bookingService.getHotelBookings(req.hotelId, req.query);
    return ApiResponse.paginated(res, bookings, pagination);
  } catch (err) { next(err); }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const { bookings, pagination } = await bookingService.getUserBookings(req.user._id, req.query);
    return ApiResponse.paginated(res, bookings, pagination);
  } catch (err) { next(err); }
};

export const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.hotelId, req.params.bookingId);
    return ApiResponse.success(res, { booking });
  } catch (err) { next(err); }
};

export const getBookingStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const stats = await bookingService.getBookingStats(req.hotelId, from, to);
    return ApiResponse.success(res, stats);
  } catch (err) { next(err); }
};

export const getAvailabilityCalendar = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) throw ApiError.badRequest('from and to required');
    const calendar = await bookingService.getAvailabilityCalendar(req.hotelId, req.params.roomId, from, to);
    return ApiResponse.success(res, { calendar });
  } catch (err) { next(err); }
};
