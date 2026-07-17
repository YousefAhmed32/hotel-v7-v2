import api from './api.js';
export const reviewApi = {
  getHotelReviews:  (hotelId, params) => api.get('/hotels/' + hotelId + '/reviews', { params }),
  getAdminReviews:  (hotelId, params) => api.get('/hotels/' + hotelId + '/reviews/admin/all', { params }),
  createReview:     (hotelId, data)   => api.post('/hotels/' + hotelId + '/reviews', data),
  checkCanReview:   (hotelId)         => api.get('/hotels/' + hotelId + '/reviews/check/can-review'),
  respondToReview:  (hotelId, reviewId, data) => api.post('/hotels/' + hotelId + '/reviews/' + reviewId + '/respond', data),
  moderateReview:   (hotelId, reviewId, data) => api.patch('/hotels/' + hotelId + '/reviews/' + reviewId + '/moderate', data),
  toggleFeatured:   (hotelId, reviewId) => api.patch('/hotels/' + hotelId + '/reviews/' + reviewId + '/feature'),
  voteHelpful:      (hotelId, reviewId) => api.post('/hotels/' + hotelId + '/reviews/' + reviewId + '/helpful'),
  flagReview:       (hotelId, reviewId, data) => api.post('/hotels/' + hotelId + '/reviews/' + reviewId + '/flag', data),
};
