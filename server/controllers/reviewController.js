import * as reviewService from '../services/reviewService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const createReview = async (req, res, next) => {
  try {
    const { bookingId, rating, title, comment, categoryRatings, travelType } = req.body;
    if (!bookingId || !rating || !comment) throw ApiError.badRequest('bookingId, rating, and comment are required');
    if (rating < 1 || rating > 5) throw ApiError.badRequest('Rating must be between 1 and 5');
    const result = await reviewService.createReview({ hotelId: req.hotelId, userId: req.user._id, bookingId, rating: parseFloat(rating), title, comment, categoryRatings, travelType });
    return ApiResponse.created(res, result, 'Review submitted successfully');
  } catch (err) { next(err); }
};

export const getHotelReviews = async (req, res, next) => {
  try {
    const { reviews, pagination, stats } = await reviewService.getHotelReviews(req.hotelId, req.query);
    return ApiResponse.paginated(res, reviews, pagination, 'Reviews fetched', stats);
  } catch (err) { next(err); }
};

export const getAdminReviews = async (req, res, next) => {
  try {
    const { reviews, pagination } = await reviewService.getAdminReviews(req.hotelId, req.query);
    return ApiResponse.paginated(res, reviews, pagination);
  } catch (err) { next(err); }
};

export const checkCanReview = async (req, res, next) => {
  try {
    const result = await reviewService.checkCanReview(req.hotelId, req.user._id);
    return ApiResponse.success(res, result);
  } catch (err) { next(err); }
};

export const getReviewById = async (req, res, next) => {
  try {
    const review = await reviewService.getReviewById(req.hotelId, req.params.reviewId);
    return ApiResponse.success(res, { review });
  } catch (err) { next(err); }
};

export const respondToReview = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) throw ApiError.badRequest('Response text is required');
    const review = await reviewService.respondToReview(req.hotelId, req.params.reviewId, req.user._id, text);
    return ApiResponse.success(res, { review }, 'Response added');
  } catch (err) { next(err); }
};

export const moderateReview = async (req, res, next) => {
  try {
    const { status, moderationNote } = req.body;
    if (!status) throw ApiError.badRequest('status is required');
    const review = await reviewService.moderateReview(req.hotelId, req.params.reviewId, status, moderationNote);
    return ApiResponse.success(res, { review }, 'Review moderated');
  } catch (err) { next(err); }
};

export const toggleFeatured = async (req, res, next) => {
  try {
    const review = await reviewService.toggleFeatured(req.hotelId, req.params.reviewId);
    return ApiResponse.success(res, { review }, review.isFeatured ? 'Review featured' : 'Review unfeatured');
  } catch (err) { next(err); }
};

export const voteHelpful = async (req, res, next) => {
  try {
    const result = await reviewService.voteHelpful(req.hotelId, req.params.reviewId, req.user._id);
    return ApiResponse.success(res, result, result.voted ? 'Marked as helpful' : 'Removed helpful vote');
  } catch (err) { next(err); }
};

export const flagReview = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const result = await reviewService.flagReview ? await reviewService.flagReview(req.hotelId, req.params.reviewId, req.user._id, reason) : { flagged: true };
    return ApiResponse.success(res, result, 'Review flagged');
  } catch (err) { next(err); }
};
