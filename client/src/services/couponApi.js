import api from './api.js';
export const couponApi = { apply: (hotelId, data) => api.post('/hotels/' + hotelId + '/coupons/apply', data), getHotelCoupons: (hotelId, params) => api.get('/hotels/' + hotelId + '/coupons', { params }) };
