import * as pricingService from '../services/pricingService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const getSuggestion = async (req, res, next) => {
  try {
    const { targetDate } = req.query;
    const date = targetDate ? new Date(targetDate) : new Date();
    if (isNaN(date.getTime())) throw ApiError.badRequest('Invalid targetDate');
    const suggestion = await pricingService.computeSuggestedPrice(req.hotelId, req.params.roomId, date);
    return ApiResponse.success(res, suggestion);
  } catch (err) { next(err); }
};

export const getAllSuggestions = async (req, res, next) => {
  try {
    const { targetDate } = req.query;
    const date = targetDate ? new Date(targetDate) : new Date();
    if (isNaN(date.getTime())) throw ApiError.badRequest('Invalid targetDate');
    const suggestions = await pricingService.suggestHotelPrices(req.hotelId, date);
    return ApiResponse.success(res, { suggestions, count: suggestions.length, targetDate: date.toISOString().slice(0,10) });
  } catch (err) { next(err); }
};

export const applyPrice = async (req, res, next) => {
  try {
    const { suggestedPrice, overridePrice } = req.body;
    if (suggestedPrice === undefined) throw ApiError.badRequest('suggestedPrice is required');
    const room = await pricingService.applySuggestedPrice({ hotelId: req.hotelId, roomId: req.params.roomId, suggestedPrice: parseFloat(suggestedPrice), appliedBy: req.user._id, action: overridePrice ? 'overridden' : 'manual', overridePrice: overridePrice ? parseFloat(overridePrice) : null });
    return ApiResponse.success(res, { room }, overridePrice ? 'Custom price applied' : 'AI suggested price applied');
  } catch (err) { next(err); }
};

export const ignoreSuggestion = async (req, res, next) => {
  try {
    const result = await pricingService.ignoreSuggestion(req.hotelId, req.params.roomId, req.user._id);
    return ApiResponse.success(res, result, 'Suggestion dismissed');
  } catch (err) { next(err); }
};

export const getPriceHistory = async (req, res, next) => {
  try {
    const { history, pagination } = await pricingService.getPriceHistory(req.hotelId, req.params.roomId, req.query);
    return ApiResponse.paginated(res, history, pagination);
  } catch (err) { next(err); }
};

export const getPricingAnalytics = async (req, res, next) => {
  try {
    const analytics = await pricingService.getPricingAnalytics(req.hotelId, req.query);
    return ApiResponse.success(res, analytics);
  } catch (err) { next(err); }
};
