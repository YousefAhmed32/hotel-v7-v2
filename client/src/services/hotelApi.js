import api from './api.js';
export const hotelApi = {
  getAll:         (params)   => api.get('/hotels', { params }),
  getById:        (id)       => api.get('/hotels/' + id),
  getBySlug:      (slug)     => api.get('/hotels/slug/' + slug),
  create:         (data)     => api.post('/hotels', data),
  update:         (id, data) => api.patch('/hotels/' + id, data),
  getStats:       (id)       => api.get('/hotels/' + id + '/stats'),
  toggleStatus:   (id)       => api.patch('/hotels/' + id + '/toggle'),
  getAdminAll:    (params)   => api.get('/hotels/admin/all', { params }),
};
