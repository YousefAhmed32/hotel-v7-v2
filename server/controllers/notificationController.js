import * as svc from '../services/notificationService.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getNotifications = async (req, res, next) => {
  try {
    const { page, limit, unreadOnly } = req.query;
    const result = await svc.getNotifications(req.user._id, { page, limit, unreadOnly: unreadOnly === 'true' });
    return ApiResponse.success(res, result);
  } catch (err) { next(err); }
};

export const markRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    await svc.markAsRead(req.user._id, ids || []);
    return ApiResponse.success(res, null, 'Marked as read');
  } catch (err) { next(err); }
};
