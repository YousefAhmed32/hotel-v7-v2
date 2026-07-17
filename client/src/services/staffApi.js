import api from './api.js';
export const staffApi = {
  getStaff:           (hotelId, params)          => api.get(`/hotels/${hotelId}/staff`, { params }),
  getStaffMember:     (hotelId, staffId)          => api.get(`/hotels/${hotelId}/staff/${staffId}`),
  searchUsers:        (hotelId, q)                => api.get(`/hotels/${hotelId}/staff/search`, { params: { q } }),
  inviteStaff:        (hotelId, data)             => api.post(`/hotels/${hotelId}/staff/invite`, data),
  assignExisting:     (hotelId, data)             => api.post(`/hotels/${hotelId}/staff/assign`, data),
  updateRole:         (hotelId, staffId, data)    => api.patch(`/hotels/${hotelId}/staff/${staffId}/role`, data),
  updatePermissions:  (hotelId, staffId, data)    => api.patch(`/hotels/${hotelId}/staff/${staffId}/permissions`, data),
  toggleStatus:       (hotelId, staffId)          => api.patch(`/hotels/${hotelId}/staff/${staffId}/toggle`),
  removeStaff:        (hotelId, staffId)          => api.delete(`/hotels/${hotelId}/staff/${staffId}`),
};
