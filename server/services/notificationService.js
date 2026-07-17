import { Notification } from '../models/Notification.js';
import mongoose from 'mongoose';

export const createNotification = async ({ hotelId, recipientId, type, title, body = '', link = null, data = {}, io = null }) => {
  try {
    const n = await Notification.create({
      hotelId:     hotelId ? new mongoose.Types.ObjectId(hotelId) : null,
      recipientId: new mongoose.Types.ObjectId(recipientId),
      type, title, body, link, data,
    });
    // Push real-time
    if (io) io.to('user:' + recipientId.toString()).emit('notification:new', n);
    return n;
  } catch (err) { /* non-blocking */ return null; }
};

export const createHotelNotification = async ({ hotelId, staffFilter, type, title, body, link, data, io }) => {
  const { User } = await import('../models/User.js');
  const staff = await User.find({ hotelId, role: { $in: ['owner','manager','receptionist'] }, isActive: true }).select('_id').lean();
  for (const s of staff) {
    await createNotification({ hotelId, recipientId: s._id, type, title, body, link, data, io });
  }
};

export const getNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const filter = { recipientId: new mongoose.Types.ObjectId(userId) };
  if (unreadOnly) filter.isRead = false;
  const pageNum  = Math.max(1, parseInt(page));
  const limitNum = Math.min(50, parseInt(limit));
  const [notifications, total, unread] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((pageNum-1)*limitNum).limit(limitNum).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipientId: new mongoose.Types.ObjectId(userId), isRead: false }),
  ]);
  return { notifications, unreadCount: unread, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum) } };
};

export const markAsRead = async (userId, notificationIds = []) => {
  const filter = { recipientId: new mongoose.Types.ObjectId(userId) };
  if (notificationIds.length) filter._id = { $in: notificationIds.map(id => new mongoose.Types.ObjectId(id)) };
  await Notification.updateMany(filter, { $set: { isRead: true, readAt: new Date() } });
};
