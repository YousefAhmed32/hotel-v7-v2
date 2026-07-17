import api from './api.js';
export const notificationApi = {
  getAll:   (params) => api.get('/notifications', { params }),
  markRead: (ids)    => api.patch('/notifications/read', { ids }),
};
