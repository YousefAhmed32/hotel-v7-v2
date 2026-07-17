import mongoose from 'mongoose';
import { Payment } from '../models/Payment.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

// ── Record a payment (cash, card, gateway) ─────────────────────────
export const createPayment = async (hotelId, bookingId, { method, amount, currency = 'USD', notes = '', cardLast4 = null, cardBrand = null, gatewayName = null, gatewayReference = null, gatewayResponse = null }) => {
  const booking = await Booking.findOne({ _id: bookingId, hotelId }).select('pricing paymentStatus status userId');
  if (!booking) throw ApiError.notFound('Booking not found');

  if (['cancelled', 'no_show'].includes(booking.status))
    throw ApiError.badRequest('Cannot add payment to a cancelled or no-show booking');

  const payment = await Payment.create({
    hotelId:   new mongoose.Types.ObjectId(hotelId),
    bookingId: new mongoose.Types.ObjectId(bookingId),
    userId:    booking.userId,
    amount, currency,
    method, notes,
    cardLast4, cardBrand,
    gatewayName, gatewayReference, gatewayResponse,
    status: method === 'cash_on_arrival' ? 'pending' : 'paid',
    paidAt: method === 'cash_on_arrival' ? null : new Date(),
  });

  // Reconcile booking paymentStatus
  await reconcileBookingPayment(hotelId, bookingId);
  return payment;
};

// ── Mark cash payment as received ─────────────────────────────────
export const markCashPaid = async (hotelId, paymentId, staffUserId) => {
  const payment = await Payment.findOne({ _id: paymentId, hotelId, method: 'cash_on_arrival', status: 'pending' });
  if (!payment) throw ApiError.notFound('Pending cash payment not found');
  payment.status = 'paid';
  payment.paidAt = new Date();
  payment.notes  = (payment.notes || '') + ` [Marked paid by staff ${staffUserId} at ${new Date().toISOString()}]`;
  await payment.save();
  await reconcileBookingPayment(hotelId, payment.bookingId.toString());
  return payment;
};

// ── Refund ─────────────────────────────────────────────────────────
export const refundPayment = async (hotelId, paymentId, { amount, reason, reference = null }) => {
  const payment = await Payment.findOne({ _id: paymentId, hotelId, status: 'paid' });
  if (!payment) throw ApiError.notFound('Paid payment not found');

  const maxRefund = payment.amount - payment.refundAmount;
  if (amount > maxRefund) throw ApiError.badRequest(`Max refundable: ${maxRefund}`);

  payment.refundAmount    += amount;
  payment.refundReason     = reason;
  payment.refundReference  = reference;
  payment.refundedAt       = new Date();
  payment.status           = payment.refundAmount >= payment.amount ? 'refunded' : 'partially_refunded';
  await payment.save();

  await reconcileBookingPayment(hotelId, payment.bookingId.toString());
  return payment;
};

// ── Get payments for a booking ─────────────────────────────────────
export const getBookingPayments = async (hotelId, bookingId) => {
  return Payment.find({ hotelId, bookingId }).sort({ createdAt: -1 }).lean();
};

// ── Generate invoice data ──────────────────────────────────────────
export const generateInvoice = async (hotelId, bookingId) => {
  const [booking, payments] = await Promise.all([
    Booking.findOne({ _id: bookingId, hotelId })
      .populate('roomId', 'name type roomNumber floor basePrice')
      .populate('userId', 'name email phone')
      .populate('hotelId', 'name address contact')
      .lean(),
    Payment.find({ hotelId, bookingId, status: { $in: ['paid','partially_refunded'] } }).lean(),
  ]);
  if (!booking) throw ApiError.notFound('Booking not found');

  const totalPaid    = payments.reduce((s, p) => s + p.amount - p.refundAmount, 0);
  const totalRefunded= payments.reduce((s, p) => s + (p.refundAmount || 0), 0);

  return {
    invoiceNumber: payments[0]?.invoiceNumber || 'DRAFT',
    issuedAt: new Date(),
    hotel: booking.hotelId,
    guest: booking.userId,
    booking: {
      confirmationCode: booking.confirmationCode,
      checkIn:  booking.checkIn,
      checkOut: booking.checkOut,
      nights:   booking.nights,
      adults:   booking.adults,
      children: booking.children,
      source:   booking.source,
    },
    room: booking.roomId,
    pricing: booking.pricing,
    payments,
    summary: {
      subtotal:       booking.pricing.baseAmount,
      discount:       booking.pricing.discountAmount,
      tax:            booking.pricing.taxAmount,
      total:          booking.pricing.totalAmount,
      paid:           Math.round(totalPaid * 100) / 100,
      refunded:       Math.round(totalRefunded * 100) / 100,
      balance:        Math.round((booking.pricing.totalAmount - totalPaid) * 100) / 100,
    },
  };
};

// ── Revenue stats for dashboard ───────────────────────────────────
export const getRevenueStats = async (hotelId, from, to) => {
  const fromDate = from ? new Date(from) : new Date(Date.now() - 30*86400000);
  const toDate   = to   ? new Date(to)   : new Date();

  const [daily, total] = await Promise.all([
    Payment.aggregate([
      { $match: { hotelId: new mongoose.Types.ObjectId(hotelId), status: { $in: ['paid','partially_refunded'] }, paidAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: { y: { $year:'$paidAt' }, m: { $month:'$paidAt' }, d: { $dayOfMonth:'$paidAt' } }, revenue: { $sum: { $subtract: ['$amount','$refundAmount'] } }, count: { $sum: 1 } } },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } },
    ]),
    Payment.aggregate([
      { $match: { hotelId: new mongoose.Types.ObjectId(hotelId), status: { $in: ['paid','partially_refunded'] }, paidAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: null, total: { $sum: { $subtract: ['$amount','$refundAmount'] } }, refunded: { $sum: '$refundAmount' }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    totalRevenue:   Math.round((total[0]?.total   || 0) * 100) / 100,
    totalRefunded:  Math.round((total[0]?.refunded || 0) * 100) / 100,
    paymentCount:   total[0]?.count || 0,
    daily: daily.map(d => ({
      date:    `${d._id.y}-${String(d._id.m).padStart(2,'0')}-${String(d._id.d).padStart(2,'0')}`,
      revenue: Math.round(d.revenue * 100) / 100,
      count:   d.count,
    })),
  };
};

// ── Reconcile: update booking.paymentStatus from payments ─────────
export const reconcileBookingPayment = async (hotelId, bookingId) => {
  const payments = await Payment.find({ hotelId, bookingId, status: { $in: ['paid','partially_refunded'] } }).lean();
  const booking  = await Booking.findOne({ _id: bookingId, hotelId }).select('pricing paymentStatus totalPaid');
  if (!booking) return;

  const totalPaid    = payments.reduce((s,p) => s + p.amount - (p.refundAmount||0), 0);
  const totalRefunded= payments.reduce((s,p) => s + (p.refundAmount||0), 0);
  const target       = booking.pricing?.totalAmount || 0;

  let paymentStatus = 'pending';
  if (totalPaid >= target)         paymentStatus = 'paid';
  else if (totalRefunded >= target) paymentStatus = 'refunded';
  else if (totalRefunded > 0)       paymentStatus = 'partially_refunded';
  else if (totalPaid > 0)           paymentStatus = 'pending'; // partial payment

  await Booking.findByIdAndUpdate(bookingId, { $set: { paymentStatus, totalPaid: Math.round(totalPaid*100)/100 } });
  logger.info(`Payment reconciled for booking ${bookingId}: ${paymentStatus}`);
};
