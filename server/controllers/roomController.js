import * as roomService from '../services/roomService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const createRoom = async (req, res, next) => {
  try {
    const room = await roomService.createRoom(req.hotelId, req.body);
    return ApiResponse.created(res, { room }, 'Room created successfully');
  } catch (err) { next(err); }
};

export const getRooms = async (req, res, next) => {
  try {
    const { rooms, pagination } = await roomService.getRoomsByHotel(req.hotelId, req.query);
    return ApiResponse.paginated(res, rooms, pagination);
  } catch (err) { next(err); }
};

export const getAvailableRooms = async (req, res, next) => {
  try {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) throw ApiError.badRequest('checkIn and checkOut are required');
    const rooms = await roomService.getAvailableRooms(req.hotelId, checkIn, checkOut, req.query);
    return ApiResponse.success(res, { rooms, count: rooms.length });
  } catch (err) { next(err); }
};

export const getRoomById = async (req, res, next) => {
  try {
    const room = await roomService.getRoomById(req.hotelId, req.params.roomId);
    return ApiResponse.success(res, { room });
  } catch (err) { next(err); }
};

export const updateRoom = async (req, res, next) => {
  try {
    const room = await roomService.updateRoom(req.hotelId, req.params.roomId, req.body);
    return ApiResponse.success(res, { room }, 'Room updated successfully');
  } catch (err) { next(err); }
};

export const deleteRoom = async (req, res, next) => {
  try {
    await roomService.deleteRoom(req.hotelId, req.params.roomId);
    return ApiResponse.success(res, null, 'Room deactivated successfully');
  } catch (err) { next(err); }
};

export const addPricingRule = async (req, res, next) => {
  try {
    const room = await roomService.addPricingRule(req.hotelId, req.params.roomId, req.body);
    return ApiResponse.success(res, { room }, 'Pricing rule added');
  } catch (err) { next(err); }
};

export const removePricingRule = async (req, res, next) => {
  try {
    const room = await roomService.removePricingRule(req.hotelId, req.params.roomId, req.params.ruleId);
    return ApiResponse.success(res, { room }, 'Pricing rule removed');
  } catch (err) { next(err); }
};

export const blockDates = async (req, res, next) => {
  try {
    const { dates } = req.body;
    if (!Array.isArray(dates) || !dates.length) throw ApiError.badRequest('dates must be a non-empty array');
    const room = await roomService.blockDates(req.hotelId, req.params.roomId, dates);
    return ApiResponse.success(res, { room }, 'Dates blocked');
  } catch (err) { next(err); }
};
