import * as couponService from '../services/couponService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const createCoupon = async (req, res, next) => {
  try {
    const { code, name, discountType, discountValue } = req.body;
    if (!code || !name || !discountType || discountValue === undefined) throw ApiError.badRequest('code, name, discountType, discountValue required');
    const coupon = await couponService.createCoupon(req.hotelId, req.body);
    return ApiResponse.created(res, { coupon }, 'Coupon created');
  } catch (err) { next(err); }
};

export const getHotelCoupons = async (req, res, next) => {
  try {
    const { coupons, pagination } = await couponService.getHotelCoupons(req.hotelId, req.query);
    return ApiResponse.paginated(res, coupons, pagination);
  } catch (err) { next(err); }
};

export const getCouponById = async (req, res, next) => {
  try {
    const coupon = await couponService.getCouponById(req.hotelId, req.params.couponId);
    return ApiResponse.success(res, { coupon });
  } catch (err) { next(err); }
};

export const updateCoupon = async (req, res, next) => {
  try {
    const coupon = await couponService.updateCoupon(req.hotelId, req.params.couponId, req.body);
    return ApiResponse.success(res, { coupon }, 'Coupon updated');
  } catch (err) { next(err); }
};

export const toggleCouponStatus = async (req, res, next) => {
  try {
    const coupon = await couponService.toggleCouponStatus(req.hotelId, req.params.couponId);
    return ApiResponse.success(res, { coupon }, coupon.isActive ? 'Coupon activated' : 'Coupon deactivated');
  } catch (err) { next(err); }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const result = await couponService.deleteCoupon(req.hotelId, req.params.couponId);
    return ApiResponse.success(res, result, result.deleted ? 'Coupon deleted' : 'Coupon deactivated (has bookings)');
  } catch (err) { next(err); }
};

export const applyCoupon = async (req, res, next) => {
  try {
    const { code, roomId, checkIn, baseAmount } = req.body;
    if (!code || !roomId || !checkIn || baseAmount === undefined) throw ApiError.badRequest('code, roomId, checkIn, baseAmount required');
    const result = await couponService.applyCoupon({ hotelId: req.hotelId, code, userId: req.user._id, roomId, checkIn, baseAmount: parseFloat(baseAmount) });
    return ApiResponse.success(res, result, 'Coupon applied');
  } catch (err) { next(err); }
};
