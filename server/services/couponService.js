import mongoose from 'mongoose';
import { Coupon } from '../models/Coupon.js';
import { Booking } from '../models/Booking.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const createCoupon = async (hotelId, data) => {
  const { code, name, description, discountType, discountValue, maxDiscountAmount, minBookingAmount, applicableRooms, validForCheckIn, usageLimit, perUserLimit, startsAt, expiresAt } = data;
  if (discountType === 'percentage' && discountValue > 100) throw ApiError.badRequest('Percentage discount cannot exceed 100%');
  if (startsAt && expiresAt && new Date(startsAt) >= new Date(expiresAt)) throw ApiError.badRequest('expiresAt must be after startsAt');
  return Coupon.create({ hotelId: new mongoose.Types.ObjectId(hotelId), code: code.toUpperCase().trim(), name, description: description||'', discountType, discountValue, maxDiscountAmount: maxDiscountAmount||null, minBookingAmount: minBookingAmount||0, applicableRooms: (applicableRooms||[]).map(id => new mongoose.Types.ObjectId(id)), validForCheckIn: { from: validForCheckIn?.from ? new Date(validForCheckIn.from) : null, to: validForCheckIn?.to ? new Date(validForCheckIn.to) : null }, usageLimit: usageLimit||null, perUserLimit: perUserLimit||1, startsAt: startsAt ? new Date(startsAt) : new Date(), expiresAt: expiresAt ? new Date(expiresAt) : null, isActive: true });
};

export const getHotelCoupons = async (hotelId, query = {}) => {
  const { page=1, limit=20, isActive='', search='', sortBy='createdAt', sortOrder='desc' } = query;
  const pageNum = Math.max(1, parseInt(page,10)); const limitNum = Math.min(50, Math.max(1, parseInt(limit,10))); const skip = (pageNum-1)*limitNum;
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (isActive !== '') filter.isActive = isActive !== 'false';
  if (search) filter.$or = [{ code: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }];
  const allowedSort = ['createdAt','expiresAt','usedCount','code'];
  const sf = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
  const sort = { [sf]: sortOrder === 'asc' ? 1 : -1 };
  const [coupons, total] = await Promise.all([Coupon.find(filter).sort(sort).skip(skip).limit(limitNum).lean({ virtuals: true }), Coupon.countDocuments(filter)]);
  return { coupons, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum), hasNext: pageNum < Math.ceil(total/limitNum), hasPrev: pageNum > 1 } };
};

export const getCouponById = async (hotelId, couponId) => {
  if (!mongoose.isValidObjectId(couponId)) throw ApiError.badRequest('Invalid couponId');
  const coupon = await Coupon.findOne({ _id: new mongoose.Types.ObjectId(couponId), hotelId: new mongoose.Types.ObjectId(hotelId) }).lean({ virtuals: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return coupon;
};

export const updateCoupon = async (hotelId, couponId, updates) => {
  delete updates.hotelId; delete updates.usedCount; delete updates.usedBy;
  if (updates.code) updates.code = updates.code.toUpperCase().trim();
  if (updates.discountType === 'percentage' && updates.discountValue > 100) throw ApiError.badRequest('Percentage discount cannot exceed 100%');
  const coupon = await Coupon.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(couponId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { $set: updates }, { new: true, runValidators: true }).lean({ virtuals: true });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return coupon;
};

export const toggleCouponStatus = async (hotelId, couponId) => {
  const coupon = await Coupon.findOne({ _id: new mongoose.Types.ObjectId(couponId), hotelId: new mongoose.Types.ObjectId(hotelId) });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  return coupon;
};

export const deleteCoupon = async (hotelId, couponId) => {
  const usedInBooking = await Booking.findOne({ hotelId: new mongoose.Types.ObjectId(hotelId), couponId: new mongoose.Types.ObjectId(couponId), status: { $in: ['confirmed','completed'] } }).lean();
  if (usedInBooking) {
    const coupon = await Coupon.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(couponId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { isActive: false }, { new: true });
    if (!coupon) throw ApiError.notFound('Coupon not found');
    return { deleted: false, deactivated: true, coupon };
  }
  const coupon = await Coupon.findOneAndDelete({ _id: new mongoose.Types.ObjectId(couponId), hotelId: new mongoose.Types.ObjectId(hotelId) });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return { deleted: true, deactivated: false };
};

export const applyCoupon = async ({ hotelId, code, userId, roomId, checkIn, baseAmount }) => {
  const coupon = await Coupon.findOne({ hotelId: new mongoose.Types.ObjectId(hotelId), code: code.toUpperCase().trim() }).lean({ virtuals: true });
  if (!coupon) throw ApiError.notFound('Coupon code not found');
  if (!coupon.isActive) throw ApiError.badRequest('This coupon is no longer active');
  if (new Date() < new Date(coupon.startsAt)) throw ApiError.badRequest('This coupon is not yet valid');
  if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) throw ApiError.badRequest('This coupon has expired');
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) throw ApiError.badRequest('This coupon has reached its usage limit');
  const userUsage = (coupon.usedBy||[]).find(u => u.userId.toString() === userId.toString());
  if (userUsage && userUsage.usedCount >= coupon.perUserLimit) throw ApiError.badRequest(`You have already used this coupon ${coupon.perUserLimit} time(s)`);
  if (baseAmount < coupon.minBookingAmount) throw ApiError.badRequest(`Minimum booking amount is ${coupon.minBookingAmount}`);
  if (coupon.applicableRooms && coupon.applicableRooms.length > 0) {
    const roomAllowed = coupon.applicableRooms.some(r => r.toString() === roomId.toString());
    if (!roomAllowed) throw ApiError.badRequest('This coupon is not applicable to the selected room');
  }
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (baseAmount * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  } else {
    discountAmount = coupon.discountValue;
  }
  discountAmount = Math.min(discountAmount, baseAmount);
  discountAmount = Math.round(discountAmount * 100) / 100;
  return { coupon: { _id: coupon._id, code: coupon.code, name: coupon.name, discountType: coupon.discountType, discountValue: coupon.discountValue }, discountAmount, finalAmount: Math.round((baseAmount - discountAmount) * 100) / 100 };
};

export const confirmCouponUsage = async (hotelId, couponId, userId) => {
  if (!mongoose.isValidObjectId(couponId)) return;
  await Coupon.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(couponId), hotelId: new mongoose.Types.ObjectId(hotelId), $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount','$usageLimit'] } }] }, { $inc: { usedCount: 1 } }, { new: true });
  const updated = await Coupon.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(couponId), 'usedBy.userId': new mongoose.Types.ObjectId(userId) }, { $inc: { 'usedBy.$.usedCount': 1 }, $set: { 'usedBy.$.lastUsedAt': new Date() } });
  if (!updated) await Coupon.findByIdAndUpdate(couponId, { $push: { usedBy: { userId: new mongoose.Types.ObjectId(userId), usedCount: 1, lastUsedAt: new Date() } } });
};
