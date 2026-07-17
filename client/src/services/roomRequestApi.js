import api from './api.js';
export const roomRequestApi = {
  create:         (data)                    => api.post('/requests/my', data),
  getMyRequests:  (bookingId)               => api.get('/requests/my', { params: { bookingId } }),
  getHotelRequests:(hotelId, params)        => api.get(`/hotels/${hotelId}/requests`, { params }),  // reuse hotel scope
  updateRequest:  (hotelId, requestId, d)  => api.patch(`/hotels/${hotelId}/requests/${requestId}`, d),
};
