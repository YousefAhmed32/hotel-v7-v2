import mongoose from 'mongoose';
import { Hotel } from '../models/Hotel.js';
import { ApiError } from '../utils/ApiError.js';

export const resolveHotel = async (req, res, next) => {
  try {
    const rawId = req.params.hotelId || req.body.hotelId || req.query.hotelId || req.user?.hotelId?.toString();
    if (!rawId) throw ApiError.badRequest('hotelId is required');
    if (!mongoose.isValidObjectId(rawId)) throw ApiError.badRequest('Invalid hotelId');
    const hotel = await Hotel.findOne({ _id: rawId, isActive: true }).lean();
    if (!hotel) throw ApiError.notFound('Hotel not found or inactive');
    req.hotelId = hotel._id.toString();
    req.hotel = hotel;
    next();
  } catch (err) { next(err); }
};

export const enforceTenantAccess = (req, res, next) => {
  try {
    if (!req.user) throw ApiError.unauthorized();
    if (!req.hotelId) throw ApiError.badRequest('hotelId not resolved');
    if (req.user.role === 'superadmin') return next();
    const userHotelId = req.user.hotelId?.toString();
    if (!userHotelId) throw ApiError.forbidden('Not associated with any hotel');
    if (userHotelId !== req.hotelId) throw ApiError.forbidden('Access denied - wrong hotel');
    next();
  } catch (err) { next(err); }
};

export const injectHotelId = (req, res, next) => {
  const hotelId = req.user?.hotelId?.toString();
  if (!hotelId) return next(ApiError.forbidden('No hotel associated with this account'));
  req.hotelId = hotelId;
  next();
};

export const assertHotelOwner = (req, res, next) => {
  try {
    if (!req.user || !req.hotel) throw ApiError.unauthorized();
    if (req.user.role === 'superadmin') return next();
    if (req.hotel.ownerId.toString() !== req.user._id.toString()) throw ApiError.forbidden('Only hotel owner can perform this');
    next();
  } catch (err) { next(err); }
};
