import mongoose from 'mongoose';
import { Review } from '../models/Review.js';
import { Booking } from '../models/Booking.js';
import { Hotel } from '../models/Hotel.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

const recalcRating = async (hotelId) => {
  const result = await Review.aggregate([{ $match: { hotelId: new mongoose.Types.ObjectId(hotelId), status: 'published' } }, { $group: { _id: '$hotelId', avgRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }]);
  const avgRating = result.length ? Math.round(result[0].avgRating * 10) / 10 : 0;
  const totalReviews = result.length ? result[0].totalReviews : 0;
  await Hotel.findByIdAndUpdate(hotelId, { avgRating, totalReviews });
  return { avgRating, totalReviews };
};

export const createReview = async ({ hotelId, userId, bookingId, rating, title, comment, categoryRatings, travelType }) => {
  const booking = await Booking.findOne({ _id: new mongoose.Types.ObjectId(bookingId), hotelId: new mongoose.Types.ObjectId(hotelId), userId: new mongoose.Types.ObjectId(userId), status: 'completed' }).lean();
  if (!booking) throw ApiError.forbidden('You can only review hotels after a completed stay');
  const existing = await Review.findOne({ bookingId: new mongoose.Types.ObjectId(bookingId) }).lean();
  if (existing) throw ApiError.conflict('You have already reviewed this stay');
  const checkIn = new Date(booking.checkIn);
  const review = await Review.create({ hotelId: new mongoose.Types.ObjectId(hotelId), userId: new mongoose.Types.ObjectId(userId), bookingId: new mongoose.Types.ObjectId(bookingId), roomId: booking.roomId, rating: Math.round(rating), title: title||'', comment, categoryRatings: categoryRatings||{}, travelType: travelType||null, stayMonth: checkIn.getMonth()+1, stayYear: checkIn.getFullYear(), isVerified: true, status: 'published' });
  await Booking.findByIdAndUpdate(bookingId, { hasReview: true, reviewId: review._id });
  const { avgRating, totalReviews } = await recalcRating(hotelId);
  return { review: await Review.findById(review._id).populate('userId','name avatar').lean(), hotelStats: { avgRating, totalReviews } };
};

export const getHotelReviews = async (hotelId, query = {}) => {
  const { page=1, limit=10, rating='', sortBy='createdAt', sortOrder='desc', travelType='', featured='' } = query;
  const pageNum = Math.max(1, parseInt(page,10)); const limitNum = Math.min(50, Math.max(1, parseInt(limit,10))); const skip = (pageNum-1)*limitNum;
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId), status: 'published' };
  if (rating) filter.rating = parseInt(rating,10);
  if (travelType) filter.travelType = travelType;
  if (featured === 'true') filter.isFeatured = true;
  const allowedSort = ['createdAt','rating','helpfulVotes'];
  const sf = allowedSort.includes(sortBy) ? sortBy : 'createdAt';
  const sort = { [sf]: sortOrder === 'asc' ? 1 : -1 };
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort(sort).skip(skip).limit(limitNum).populate('userId','name avatar').populate('roomId','name type').select('-flaggedBy -moderationNote').lean(),
    Review.countDocuments(filter),
  ]);
  const distribution = await Review.aggregate([{ $match: { hotelId: new mongoose.Types.ObjectId(hotelId), status: 'published' } }, { $group: { _id: '$rating', count: { $sum: 1 } } }]);
  const ratingDist = { 5:0, 4:0, 3:0, 2:0, 1:0 };
  distribution.forEach(d => { ratingDist[d._id] = d.count; });
  return { reviews, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum), hasNext: pageNum < Math.ceil(total/limitNum), hasPrev: pageNum > 1 }, stats: { ratingDistribution: ratingDist } };
};

export const getAdminReviews = async (hotelId, query = {}) => {
  const { page=1, limit=20, status='', rating='', sortBy='createdAt', sortOrder='desc' } = query;
  const pageNum = Math.max(1, parseInt(page,10)); const limitNum = Math.min(50, Math.max(1, parseInt(limit,10))); const skip = (pageNum-1)*limitNum;
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (status) filter.status = status;
  if (rating) filter.rating = parseInt(rating,10);
  const sf = ['createdAt','rating','helpfulVotes','status'].includes(sortBy) ? sortBy : 'createdAt';
  const sort = { [sf]: sortOrder === 'asc' ? 1 : -1 };
  const [reviews, total] = await Promise.all([
    Review.find(filter).sort(sort).skip(skip).limit(limitNum).populate('userId','name email avatar').populate('bookingId','confirmationCode checkIn checkOut').populate('roomId','name type').lean(),
    Review.countDocuments(filter),
  ]);
  return { reviews, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum) } };
};

export const getReviewById = async (hotelId, reviewId) => {
  if (!mongoose.isValidObjectId(reviewId)) throw ApiError.badRequest('Invalid reviewId');
  const review = await Review.findOne({ _id: new mongoose.Types.ObjectId(reviewId), hotelId: new mongoose.Types.ObjectId(hotelId) }).populate('userId','name avatar').populate('bookingId','confirmationCode checkIn checkOut').lean();
  if (!review) throw ApiError.notFound('Review not found');
  return review;
};

export const respondToReview = async (hotelId, reviewId, respondedBy, text) => {
  if (!text || text.trim().length < 5) throw ApiError.badRequest('Response must be at least 5 characters');
  const review = await Review.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(reviewId), hotelId: new mongoose.Types.ObjectId(hotelId), status: 'published' }, { $set: { 'hotelResponse.text': text.trim(), 'hotelResponse.respondedAt': new Date(), 'hotelResponse.respondedBy': new mongoose.Types.ObjectId(respondedBy) } }, { new: true }).populate('userId','name avatar').lean();
  if (!review) throw ApiError.notFound('Review not found');
  return review;
};

export const moderateReview = async (hotelId, reviewId, status, moderationNote) => {
  const allowed = ['published','pending','rejected'];
  if (!allowed.includes(status)) throw ApiError.badRequest('Invalid status');
  const review = await Review.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(reviewId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { $set: { status, moderationNote: moderationNote||null } }, { new: true }).lean();
  if (!review) throw ApiError.notFound('Review not found');
  await recalcRating(hotelId);
  return review;
};

export const toggleFeatured = async (hotelId, reviewId) => {
  const review = await Review.findOne({ _id: new mongoose.Types.ObjectId(reviewId), hotelId: new mongoose.Types.ObjectId(hotelId) });
  if (!review) throw ApiError.notFound('Review not found');
  review.isFeatured = !review.isFeatured;
  await review.save();
  return review;
};

export const voteHelpful = async (hotelId, reviewId, userId) => {
  const review = await Review.findOne({ _id: new mongoose.Types.ObjectId(reviewId), hotelId: new mongoose.Types.ObjectId(hotelId), status: 'published' });
  if (!review) throw ApiError.notFound('Review not found');
  const uid = new mongoose.Types.ObjectId(userId);
  const alreadyVoted = review.helpfulVotedBy.some(v => v.toString() === uid.toString());
  if (alreadyVoted) { review.helpfulVotedBy = review.helpfulVotedBy.filter(v => v.toString() !== uid.toString()); review.helpfulVotes = Math.max(0, review.helpfulVotes-1); }
  else { review.helpfulVotedBy.push(uid); review.helpfulVotes += 1; }
  await review.save();
  return { helpfulVotes: review.helpfulVotes, voted: !alreadyVoted };
};

export const checkCanReview = async (hotelId, userId) => {
  const eligibleBookings = await Booking.find({ hotelId: new mongoose.Types.ObjectId(hotelId), userId: new mongoose.Types.ObjectId(userId), status: 'completed', hasReview: false }).select('_id confirmationCode checkIn checkOut').lean();
  return { canReview: eligibleBookings.length > 0, eligibleBookings };
};
