import api from './api.js';
export const paymentApi = {
  create:           (hotelId, data)         => api.post(`/hotels/${hotelId}/payments`, data),
  getForBooking:    (hotelId, bookingId)    => api.get(`/hotels/${hotelId}/payments/booking/${bookingId}`),
  getInvoice:       (hotelId, bookingId)    => api.get(`/hotels/${hotelId}/payments/invoice/${bookingId}`),
  markCashPaid:     (hotelId, paymentId)    => api.patch(`/hotels/${hotelId}/payments/${paymentId}/cash-paid`),
  refund:           (hotelId, paymentId, d) => api.patch(`/hotels/${hotelId}/payments/${paymentId}/refund`, d),
  getRevenueStats:  (hotelId, params)       => api.get(`/hotels/${hotelId}/payments/revenue`, { params }),
};
