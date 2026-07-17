import api from './api.js';
export const chatApi = {
  startConversation:    (hotelId, data) => api.post('/hotels/' + hotelId + '/chat/conversations', data),
  getMyConversations:   (params)        => api.get('/chat/conversations/my', { params }),
  getConversation:      (convId)        => api.get('/chat/conversations/' + convId),
  getMessages:          (convId, params)=> api.get('/chat/conversations/' + convId + '/messages', { params }),
  sendMessage:          (convId, data)  => api.post('/chat/conversations/' + convId + '/messages', data),
  markAsRead:           (convId)        => api.post('/chat/conversations/' + convId + '/read'),
  getUnreadCounts:      (hotelId)       => api.get('/hotels/' + hotelId + '/chat/unread'),
};
