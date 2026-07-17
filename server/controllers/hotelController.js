import * as hotelService from '../services/hotelService.js';
import { reissueTokensForUser } from '../services/authService.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createHotel = async (req, res, next) => {
  try {
    const hotel = await hotelService.createHotel(req.user._id, req.body);
    // بعد إنشاء الفندق — بنجيب tokens جديدة مع الـ hotelId المحدّث
    const { tokens } = await reissueTokensForUser(req.user._id, res);
    return ApiResponse.created(res, { hotel, accessToken: tokens.accessToken }, 'Hotel created successfully');
  } catch (err) { next(err); }
};

export const getAllHotels = async (req, res, next) => {
  try {
    const { hotels, pagination } = await hotelService.getAllHotels(req.query);
    return ApiResponse.paginated(res, hotels, pagination);
  } catch (err) { next(err); }
};

export const getHotelById = async (req, res, next) => {
  try {
    const hotel = await hotelService.getHotelById(req.params.hotelId);
    return ApiResponse.success(res, { hotel });
  } catch (err) { next(err); }
};

export const getHotelBySlug = async (req, res, next) => {
  try {
    const hotel = await hotelService.getHotelBySlug(req.params.slug);
    return ApiResponse.success(res, { hotel });
  } catch (err) { next(err); }
};

export const updateHotel = async (req, res, next) => {
  try {
    const hotel = await hotelService.updateHotel(req.hotelId, req.body);
    return ApiResponse.success(res, { hotel }, 'Hotel updated successfully');
  } catch (err) { next(err); }
};

export const toggleHotelStatus = async (req, res, next) => {
  try {
    const hotel = await hotelService.toggleHotelStatus(req.params.hotelId);
    return ApiResponse.success(res, { hotel }, 'Hotel status toggled');
  } catch (err) { next(err); }
};

export const getHotelStats = async (req, res, next) => {
  try {
    const stats = await hotelService.getHotelStats(req.hotelId);
    return ApiResponse.success(res, stats);
  } catch (err) { next(err); }
};

// SuperAdmin — get all hotels
export const getAdminAllHotels = async (req, res, next) => {
  try {
    const { hotels, pagination } = await hotelService.getAllHotels({ ...req.query, includeInactive: true });
    return ApiResponse.paginated(res, hotels, pagination);
  } catch (err) { next(err); }
};

export const getHotelDashboard = async (req, res, next) => {
  try {
    const { getHotelDashboard } = await import('../services/hotelService.js');
    const data = await getHotelDashboard(req.params.hotelId || req.hotelId);
    return ApiResponse.success(res, data);
  } catch (err) { next(err); }
};
