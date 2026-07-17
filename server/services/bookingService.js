import mongoose from 'mongoose';
import crypto from 'crypto';
import { Booking } from '../models/Booking.js';
import { Room }    from '../models/Room.js';
import { Hotel }   from '../models/Hotel.js';
import { Payment } from '../models/Payment.js';
import { ApiError } from '../utils/ApiError.js';
import { logger }   from '../utils/logger.js';

const LOCK_MINUTES = 10;
const TAX_RATE     = 0.14;

// Statuses that block availability
const BLOCKING = ['confirmed', 'pending', 'locked', 'checked_in'];

// ── Date validation ────────────────────────────────────────────────
const validateDates = (checkIn, checkOut) => {
  const inDate  = new Date(checkIn);
  const outDate = new Date(checkOut);
  if (isNaN(inDate) || isNaN(outDate)) throw ApiError.badRequest('Invalid date format');
  const today = new Date(); today.setHours(0,0,0,0);
  if (inDate < today) throw ApiError.badRequest('Check-in cannot be in the past');
  if (outDate <= inDate) throw ApiError.badRequest('Check-out must be after check-in');
  const nights = Math.round((outDate - inDate) / 86400000);
  if (nights > 365) throw ApiError.badRequest('Maximum stay is 365 nights');
  return { inDate, outDate, nights };
};

// ── Price computation ──────────────────────────────────────────────
const computePricing = (room, inDate, outDate, couponDiscount = 0) => {
  const nights = Math.round((outDate - inDate) / 86400000);
  const nightlyRates = [];
  let baseAmount = 0;
  for (let i = 0; i < nights; i++) {
    const d = new Date(inDate); d.setDate(d.getDate() + i);
    const price = room.getEffectivePrice ? room.getEffectivePrice(d) : room.basePrice;
    nightlyRates.push({ date: new Date(d), price });
    baseAmount += price;
  }
  const taxAmount      = Math.round(baseAmount * TAX_RATE * 100) / 100;
  const discountAmount = Math.min(Math.max(0, couponDiscount), baseAmount);
  const totalAmount    = Math.round((baseAmount + taxAmount - discountAmount) * 100) / 100;
  return { baseAmount, taxAmount, discountAmount, extraAmount: 0, totalAmount, currency: room.currency || 'USD', nightlyRates };
};

// ── Core: check availability (atomic-safe) ─────────────────────────
export const checkRoomAvailability = async (hotelId, roomId, checkIn, checkOut, excludeId = null) => {
  const filter = {
    hotelId: new mongoose.Types.ObjectId(hotelId),
    roomId:  new mongoose.Types.ObjectId(roomId),
    status:  { $in: BLOCKING },
    checkIn:  { $lt: new Date(checkOut) },
    checkOut: { $gt: new Date(checkIn) },
  };
  if (excludeId) filter._id = { $ne: new mongoose.Types.ObjectId(excludeId) };
  const conflict = await Booking.findOne(filter).select('_id confirmationCode checkIn checkOut status').lean();
  return { available: !conflict, conflict };
};

// ── STEP 1: Lock a room slot (10-min hold) ─────────────────────────
export const lockBookingSlot = async ({ hotelId, roomId, userId, checkIn, checkOut, adults, children, guestDetails }) => {
  const { inDate, outDate } = validateDates(checkIn, checkOut);

  const room = await Room.findOne({ _id: roomId, hotelId, isActive: true });
  if (!room) throw ApiError.notFound('Room not found or inactive');

  // Housekeeping guard — cannot lock a dirty/maintenance room
  if (['dirty', 'maintenance', 'cleaning'].includes(room.currentStatus))
    throw ApiError.badRequest(`Room is currently ${room.currentStatus}. Cannot accept new bookings.`);

  // Strict overlap check
  const { available, conflict } = await checkRoomAvailability(hotelId, roomId, inDate, outDate);
  if (!available)
    throw ApiError.conflict(`Room already booked from ${conflict.checkIn?.toDateString()} to ${conflict.checkOut?.toDateString()}`);

  const lockToken = crypto.randomBytes(24).toString('hex');
  const lockExpiry = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);

  const pricing = computePricing(room, inDate, outDate, 0);

  const booking = await Booking.create({
    hotelId: new mongoose.Types.ObjectId(hotelId),
    roomId:  room._id,
    userId:  new mongoose.Types.ObjectId(userId),
    checkIn: inDate, checkOut: outDate,
    adults: adults || 1, children: children || 0,
    guestDetails: guestDetails || {},
    pricing,
    status: 'locked',
    lockToken, lockExpiresAt: lockExpiry,
    paymentMethod: 'cash_on_arrival',
  });

  return { booking, lockToken, expiresAt: lockExpiry, pricing };
};

// ── STEP 2: Confirm booking (payment method choice) ────────────────
export const confirmBooking = async ({ hotelId, bookingId, userId, lockToken, paymentMethod = 'cash_on_arrival', couponId, couponDiscount = 0, guestDetails }) => {
  const booking = await Booking.findOne({ _id: bookingId, hotelId, status: 'locked', lockToken }).populate('roomId');
  if (!booking) throw ApiError.notFound('Lock not found or expired');
  if (booking.isLockExpired) throw ApiError.gone('Booking lock has expired. Please restart.');

  // Re-check availability excluding this lock
  const { available } = await checkRoomAvailability(hotelId, booking.roomId._id, booking.checkIn, booking.checkOut, bookingId);
  if (!available) throw ApiError.conflict('Room was taken while you were checking out. Please search again.');

  // Recompute pricing with coupon
  const pricing = computePricing(booking.roomId, booking.checkIn, booking.checkOut, couponDiscount);

  // Booking → pending (requires manager approval) or direct confirmed if staff-created
  booking.status        = 'pending';
  booking.paymentMethod = paymentMethod;
  booking.pricing       = pricing;
  booking.lockToken     = null;
  booking.lockExpiresAt = null;
  booking.requiresApproval = true;
  if (couponId) booking.couponId = new mongoose.Types.ObjectId(couponId);
  if (guestDetails) booking.guestDetails = { ...booking.guestDetails, ...guestDetails };

  await booking.save();

  // If payment method is not cash-on-arrival, create a pending payment record
  if (paymentMethod !== 'cash_on_arrival') {
    await Payment.create({
      hotelId: new mongoose.Types.ObjectId(hotelId),
      bookingId: booking._id,
      userId: booking.userId,
      amount: pricing.totalAmount,
      currency: pricing.currency,
      method: paymentMethod,
      status: 'pending',
    });
  }

  logger.info(`Booking ${booking.confirmationCode} → pending (awaiting approval)`);
  return booking.populate([{ path:'roomId', select:'name type roomNumber' }, { path:'userId', select:'name email' }]);
};

// ── Staff: Approve booking ─────────────────────────────────────────
export const approveBooking = async (hotelId, bookingId, staffUserId) => {
  const booking = await Booking.findOne({ _id: bookingId, hotelId, status: 'pending' });
  if (!booking) throw ApiError.notFound('Pending booking not found');

  booking.status     = 'confirmed';
  booking.approvedBy = new mongoose.Types.ObjectId(staffUserId);
  booking.approvedAt = new Date();
  booking.requiresApproval = false;
  await booking.save();

  logger.info(`Booking ${booking.confirmationCode} approved by ${staffUserId}`);
  return booking;
};

// ── Staff: Reject booking ──────────────────────────────────────────
export const rejectBooking = async (hotelId, bookingId, staffUserId, reason) => {
  const booking = await Booking.findOne({ _id: bookingId, hotelId, status: 'pending' });
  if (!booking) throw ApiError.notFound('Pending booking not found');

  booking.status          = 'cancelled';
  booking.rejectedBy      = new mongoose.Types.ObjectId(staffUserId);
  booking.rejectedAt      = new Date();
  booking.rejectionReason = reason || 'Rejected by hotel staff';
  booking.cancelledAt     = new Date();
  booking.cancelledBy     = 'hotel';
  await booking.save();

  return booking;
};

// ── CHECK-IN ──────────────────────────────────────────────────────
export const checkIn = async (hotelId, bookingId, staffUserId) => {
  const booking = await Booking.findOne({ _id: bookingId, hotelId, status: 'confirmed' }).populate('roomId');
  if (!booking) throw ApiError.notFound('Confirmed booking not found. Cannot check in.');

  const room = booking.roomId;

  // Room must be clean/available
  if (room.currentStatus === 'dirty')
    throw ApiError.badRequest('Room is dirty. Housekeeping must clean it first.');
  if (room.currentStatus === 'maintenance')
    throw ApiError.badRequest('Room is under maintenance.');

  booking.status        = 'checked_in';
  booking.actualCheckIn = new Date();
  booking.checkedInBy   = new mongoose.Types.ObjectId(staffUserId);
  await booking.save();

  // Mark room occupied
  await Room.findByIdAndUpdate(room._id, {
    $set: {
      currentStatus:       'occupied',
      currentBookingId:     booking._id,
      lastStatusChangedAt:  new Date(),
      lastStatusChangedBy:  new mongoose.Types.ObjectId(staffUserId),
    },
  });

  logger.info(`Check-in: booking ${booking.confirmationCode} | room ${room.roomNumber || room.name}`);
  return booking;
};

// ── CHECK-OUT ─────────────────────────────────────────────────────
export const checkOut = async (hotelId, bookingId, staffUserId) => {
  const booking = await Booking.findOne({ _id: bookingId, hotelId, status: 'checked_in' }).populate('roomId');
  if (!booking) throw ApiError.notFound('Checked-in booking not found. Cannot check out.');

  booking.status         = 'checked_out';
  booking.actualCheckOut = new Date();
  booking.checkedOutBy   = new mongoose.Types.ObjectId(staffUserId);
  await booking.save();

  // Mark room dirty automatically
  await Room.findByIdAndUpdate(booking.roomId._id, {
    $set: {
      currentStatus:       'dirty',
      currentBookingId:    null,
      lastStatusChangedAt: new Date(),
      lastStatusChangedBy: new mongoose.Types.ObjectId(staffUserId),
      housekeepingNotes:   `Needs cleaning after checkout ${new Date().toLocaleDateString()}`,
    },
  });

  logger.info(`Check-out: booking ${booking.confirmationCode} → room marked dirty`);
  return booking;
};

// ── Update general status (no_show etc) ───────────────────────────
export const updateBookingStatus = async (hotelId, bookingId, status, staffUserId, notes = '') => {
  const allowed = ['confirmed', 'no_show', 'checked_out'];
  if (!allowed.includes(status)) throw ApiError.badRequest(`Use dedicated endpoints for: pending, checked_in, cancelled`);

  const booking = await Booking.findOneAndUpdate(
    { _id: bookingId, hotelId },
    { $set: { status, ...(notes ? { internalNotes: notes } : {}), ...(status === 'no_show' ? { cancelledAt: new Date(), cancelledBy: 'hotel' } : {}) } },
    { new: true }
  ).populate('roomId','name type roomNumber').populate('userId','name email');
  if (!booking) throw ApiError.notFound('Booking not found');

  // If no_show → free the room
  if (status === 'no_show' && booking.roomId) {
    await Room.findByIdAndUpdate(booking.roomId._id, { $set: { currentStatus: 'available', currentBookingId: null } });
  }

  return booking;
};

// ── Cancel booking ────────────────────────────────────────────────
export const cancelBooking = async ({ hotelId, bookingId, requestingUserId, requestingUserRole, reason, refundAmount = 0 }) => {
  const booking = await Booking.findOne({ _id: bookingId, hotelId, status: { $in: ['confirmed','pending','locked'] } });
  if (!booking) throw ApiError.notFound('Booking not found or cannot be cancelled');

  const isStaff = ['owner','manager','receptionist','superadmin'].includes(requestingUserRole);
  if (!isStaff && booking.userId.toString() !== requestingUserId.toString())
    throw ApiError.forbidden('Can only cancel your own bookings');

  booking.status             = 'cancelled';
  booking.cancelledAt        = new Date();
  booking.cancellationReason = reason;
  booking.cancelledBy        = requestingUserRole === 'customer' ? 'guest' : 'hotel';
  booking.refundAmount       = Math.max(0, refundAmount);
  booking.lockToken          = null;
  await booking.save();

  // Free room if it was occupied
  if (booking.roomId) {
    const room = await Room.findById(booking.roomId).select('currentBookingId');
    if (room?.currentBookingId?.toString() === bookingId) {
      await Room.findByIdAndUpdate(booking.roomId, { $set: { currentStatus: 'available', currentBookingId: null } });
    }
  }

  return booking;
};

// ── Reception: Create booking directly (confirmed) ────────────────
export const createReceptionBooking = async ({ hotelId, roomId, staffUserId, checkIn, checkOut, adults, children, guestDetails, paymentMethod, source = 'reception' }) => {
  const { inDate, outDate } = validateDates(checkIn, checkOut);

  const room = await Room.findOne({ _id: roomId, hotelId, isActive: true });
  if (!room) throw ApiError.notFound('Room not found');

  if (['dirty', 'maintenance'].includes(room.currentStatus))
    throw ApiError.badRequest(`Room is ${room.currentStatus}. Cannot assign.`);

  const { available, conflict } = await checkRoomAvailability(hotelId, roomId, inDate, outDate);
  if (!available) throw ApiError.conflict(`Room already booked (${conflict.confirmationCode})`);

  const pricing = computePricing(room, inDate, outDate, 0);

  const booking = await Booking.create({
    hotelId: new mongoose.Types.ObjectId(hotelId),
    roomId:  room._id,
    userId:  new mongoose.Types.ObjectId(staffUserId),
    checkIn: inDate, checkOut: outDate,
    adults: adults || 1, children: children || 0,
    guestDetails: guestDetails || {},
    pricing,
    status:          'confirmed',   // Staff bookings skip approval
    requiresApproval: false,
    approvedBy:       new mongoose.Types.ObjectId(staffUserId),
    approvedAt:       new Date(),
    paymentMethod:    paymentMethod || 'cash_on_arrival',
    source,
  });

  logger.info(`Reception booking created: ${booking.confirmationCode}`);
  return booking;
};

// ── Read: hotel bookings list ─────────────────────────────────────
export const getHotelBookings = async (hotelId, query = {}) => {
  const { page=1, limit=20, status='', from='', to='', search='', roomId='', sortBy='createdAt', sortOrder='desc' } = query;
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
  const skip     = (pageNum - 1) * limitNum;

  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (status) filter.status = status;
  if (roomId && mongoose.isValidObjectId(roomId)) filter.roomId = new mongoose.Types.ObjectId(roomId);
  if (search) filter.confirmationCode = { $regex: search, $options: 'i' };
  if (from || to) {
    filter.checkIn = {};
    if (from) filter.checkIn.$gte = new Date(from);
    if (to)   filter.checkIn.$lte = new Date(to);
  }

  const sort = { [['createdAt','checkIn','pricing.totalAmount','status'].includes(sortBy) ? sortBy : 'createdAt']: sortOrder === 'asc' ? 1 : -1 };

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort(sort).skip(skip).limit(limitNum)
      .populate('roomId', 'name type roomNumber floor coverImage')
      .populate('userId', 'name email phone')
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return { bookings, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum), hasNext: pageNum < Math.ceil(total/limitNum), hasPrev: pageNum > 1 } };
};

// ── Read: single booking ──────────────────────────────────────────
export const getBookingById = async (hotelId, bookingId) => {
  if (!mongoose.isValidObjectId(bookingId)) throw ApiError.badRequest('Invalid bookingId');
  const booking = await Booking.findOne({ _id: bookingId, hotelId })
    .populate('roomId', 'name type roomNumber basePrice coverImage amenities floor')
    .populate('userId', 'name email phone avatar')
    .populate('couponId', 'code discountType discountValue')
    .populate('approvedBy', 'name role')
    .populate('checkedInBy', 'name role')
    .populate('checkedOutBy', 'name role')
    .lean();
  if (!booking) throw ApiError.notFound('Booking not found');
  return booking;
};

// ── Read: user's own bookings ─────────────────────────────────────
export const getUserBookings = async (userId, query = {}) => {
  const { page=1, limit=10, status='' } = query;
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(20, Math.max(1, parseInt(limit)));
  const filter   = { userId: new mongoose.Types.ObjectId(userId) };
  if (status) filter.status = status;

  const [bookings, total] = await Promise.all([
    Booking.find(filter).sort({ createdAt: -1 }).skip((pageNum-1)*limitNum).limit(limitNum)
      .populate('hotelId', 'name address slug coverImage avgRating')
      .populate('roomId', 'name type')
      .lean(),
    Booking.countDocuments(filter),
  ]);

  return { bookings, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum) } };
};

// ── Stats: dashboard ──────────────────────────────────────────────
export const getBookingStats = async (hotelId, from, to) => {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30*86400000);
  const toDate   = to   ? new Date(to)   : new Date();
  const hId      = new mongoose.Types.ObjectId(hotelId);

  const [statusBreakdown, revenueData, topRooms, todayCheckins, todayCheckouts] = await Promise.all([
    Booking.aggregate([
      { $match: { hotelId: hId, createdAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { hotelId: hId, status: { $in: ['confirmed','checked_in','checked_out'] }, paymentStatus: 'paid', createdAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: { y:{$year:'$createdAt'}, m:{$month:'$createdAt'}, d:{$dayOfMonth:'$createdAt'} }, revenue:{$sum:'$pricing.totalAmount'}, bookings:{$sum:1} } },
      { $sort: { '_id.y':1, '_id.m':1, '_id.d':1 } },
    ]),
    Booking.aggregate([
      { $match: { hotelId: hId, status: { $in: ['confirmed','checked_in','checked_out'] }, createdAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id:'$roomId', count:{$sum:1}, revenue:{$sum:'$pricing.totalAmount'} } },
      { $sort: { count:-1 } }, { $limit: 5 },
      { $lookup: { from:'rooms', localField:'_id', foreignField:'_id', as:'room' } },
      { $unwind: '$room' },
      { $project: { count:1, revenue:1, 'room.name':1, 'room.type':1 } },
    ]),
    // Today's arrivals
    Booking.countDocuments({ hotelId: hId, status:'confirmed', checkIn: { $gte: new Date(new Date().setHours(0,0,0,0)), $lt: new Date(new Date().setHours(23,59,59,999)) } }),
    // Today's departures
    Booking.countDocuments({ hotelId: hId, status:'checked_in', checkOut: { $gte: new Date(new Date().setHours(0,0,0,0)), $lt: new Date(new Date().setHours(23,59,59,999)) } }),
  ]);

  const byStatus     = statusBreakdown.reduce((a, s) => { a[s._id] = s.count; return a; }, {});
  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);

  return {
    period: { from: fromDate, to: toDate },
    totalBookings:    statusBreakdown.reduce((s,x) => s + x.count, 0),
    confirmedBookings:(byStatus.confirmed||0) + (byStatus.checked_in||0) + (byStatus.checked_out||0),
    totalRevenue:     Math.round(totalRevenue * 100) / 100,
    pendingApprovals: byStatus.pending || 0,
    todayCheckins, todayCheckouts,
    statusBreakdown: byStatus,
    dailyRevenue: revenueData.map(d => ({
      date:     `${d._id.y}-${String(d._id.m).padStart(2,'0')}-${String(d._id.d).padStart(2,'0')}`,
      revenue:  Math.round(d.revenue*100)/100,
      bookings: d.bookings,
    })),
    topRooms,
  };
};

// ── Availability calendar ─────────────────────────────────────────
export const getAvailabilityCalendar = async (hotelId, roomId, from, to) => {
  const fromDate = new Date(from); const toDate = new Date(to);
  if (isNaN(fromDate) || isNaN(toDate)) throw ApiError.badRequest('Invalid dates');

  const room = await Room.findOne({ _id: roomId, hotelId }).select('blockedDates isActive').lean();
  if (!room) throw ApiError.notFound('Room not found');

  const bookings = await Booking.find({
    hotelId, roomId,
    status: { $in: BLOCKING },
    checkIn: { $lt: toDate },
    checkOut: { $gt: fromDate },
  }).select('checkIn checkOut status confirmationCode').lean();

  const unavailable = new Set(room.blockedDates?.map(d => d.toISOString().slice(0,10)) || []);
  for (const b of bookings) {
    let cur = new Date(b.checkIn);
    while (cur < b.checkOut) {
      unavailable.add(cur.toISOString().slice(0,10));
      cur.setDate(cur.getDate() + 1);
    }
  }

  return { unavailableDates: [...unavailable], bookings };
};
