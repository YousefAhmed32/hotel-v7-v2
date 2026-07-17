import api from './api.js';
export const housekeepingApi = {
  getRoomStatuses:  (hotelId)              => api.get(`/hotels/${hotelId}/housekeeping`),
  getStats:         (hotelId)              => api.get(`/hotels/${hotelId}/housekeeping/stats`),
  updateRoomStatus: (hotelId, roomId, d)   => api.patch(`/hotels/${hotelId}/housekeeping/rooms/${roomId}/status`, d),
};
