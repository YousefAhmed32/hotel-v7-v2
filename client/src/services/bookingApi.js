import api from './api.js';
export const bookingApi = {
  // Customer
  getMyBookings:        (params)               => api.get('/bookings/my', { params }),
  lockBooking:          (data)                 => api.post('/bookings/lock', data),
  confirmBooking:       (bookingId, data)      => api.post(`/bookings/${bookingId}/confirm`, data),
  cancelMyBooking:      (bookingId, data)      => api.post(`/bookings/${bookingId}/cancel`, data),
  getMyBookingById:     (bookingId)            => api.get(`/bookings/${bookingId}`),

  // Hotel-scoped
  getHotelBookings:     (hotelId, params)      => api.get(`/hotels/${hotelId}/bookings`, { params }),
  getBookingById:       (hotelId, bookingId)   => api.get(`/hotels/${hotelId}/bookings/${bookingId}`),
  getBookingStats:      (hotelId, params)      => api.get(`/hotels/${hotelId}/bookings/stats`, { params }),
  getAvailabilityCalendar:(hotelId, roomId, p) => api.get(`/hotels/${hotelId}/bookings/calendar/${roomId}`, { params: p }),

  // Lifecycle
  createReceptionBooking:(hotelId, data)       => api.post(`/hotels/${hotelId}/bookings/reception`, data),
  approveBooking:        (hotelId, bookingId)  => api.patch(`/hotels/${hotelId}/bookings/${bookingId}/approve`),
  rejectBooking:         (hotelId, bookingId, d) => api.patch(`/hotels/${hotelId}/bookings/${bookingId}/reject`, d),
  checkIn:               (hotelId, bookingId)  => api.patch(`/hotels/${hotelId}/bookings/${bookingId}/checkin`),
  checkOut:              (hotelId, bookingId)  => api.patch(`/hotels/${hotelId}/bookings/${bookingId}/checkout`),
  updateBookingStatus:   (hotelId, bookingId, d)=> api.patch(`/hotels/${hotelId}/bookings/${bookingId}/status`, d),
  cancelBooking:         (hotelId, bookingId, d)=> api.post(`/hotels/${hotelId}/bookings/${bookingId}/cancel`, d),
};
