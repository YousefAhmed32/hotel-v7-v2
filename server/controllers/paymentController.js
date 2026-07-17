import * as paymentService from '../services/paymentService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const createPayment = async (req, res, next) => {
  try {
    const { bookingId, method, amount, notes, cardLast4, cardBrand, gatewayName, gatewayReference } = req.body;
    if (!bookingId || !method || !amount) throw ApiError.badRequest('bookingId, method, and amount are required');
    if (amount <= 0) throw ApiError.badRequest('Amount must be positive');
    const payment = await paymentService.createPayment(
      req.hotelId, bookingId,
      { method, amount: parseFloat(amount), notes, cardLast4, cardBrand, gatewayName, gatewayReference }
    );
    return ApiResponse.created(res, { payment }, 'Payment recorded');
  } catch (err) { next(err); }
};

export const markCashPaid = async (req, res, next) => {
  try {
    const payment = await paymentService.markCashPaid(req.hotelId, req.params.paymentId, req.user._id);
    return ApiResponse.success(res, { payment }, 'Cash payment marked as paid');
  } catch (err) { next(err); }
};

export const refundPayment = async (req, res, next) => {
  try {
    const { amount, reason, reference } = req.body;
    if (!amount || amount <= 0) throw ApiError.badRequest('Refund amount must be positive');
    const payment = await paymentService.refundPayment(req.hotelId, req.params.paymentId, { amount: parseFloat(amount), reason, reference });
    return ApiResponse.success(res, { payment }, 'Payment refunded');
  } catch (err) { next(err); }
};

export const getBookingPayments = async (req, res, next) => {
  try {
    const payments = await paymentService.getBookingPayments(req.hotelId, req.params.bookingId);
    return ApiResponse.success(res, { payments });
  } catch (err) { next(err); }
};

export const getInvoice = async (req, res, next) => {
  try {
    const invoice = await paymentService.generateInvoice(req.hotelId, req.params.bookingId);
    return ApiResponse.success(res, { invoice });
  } catch (err) { next(err); }
};

export const getRevenueStats = async (req, res, next) => {
  try {
    const { from, to } = req.query;
    const stats = await paymentService.getRevenueStats(req.hotelId, from, to);
    return ApiResponse.success(res, stats);
  } catch (err) { next(err); }
};
