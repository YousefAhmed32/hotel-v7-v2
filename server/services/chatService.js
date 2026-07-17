import mongoose from 'mongoose';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

export const getOrCreateConversation = async ({ hotelId, guestId, bookingId, subject }) => {
  let conversation = await Conversation.findOne({ hotelId: new mongoose.Types.ObjectId(hotelId), guestId: new mongoose.Types.ObjectId(guestId), status: 'open' }).populate('guestId','name email avatar').populate('assignedTo','name email role').lean();
  if (conversation) return { conversation, created: false };
  const newConv = await Conversation.create({ hotelId: new mongoose.Types.ObjectId(hotelId), guestId: new mongoose.Types.ObjectId(guestId), bookingId: bookingId ? new mongoose.Types.ObjectId(bookingId) : null, subject: subject||'General Inquiry', status: 'open' });
  conversation = await Conversation.findById(newConv._id).populate('guestId','name email avatar').populate('assignedTo','name email role').lean();
  return { conversation, created: true };
};

export const getHotelConversations = async (hotelId, query = {}) => {
  const { page=1, limit=20, status='open', assignedTo='', search='', sortBy='updatedAt', sortOrder='desc' } = query;
  const pageNum = Math.max(1, parseInt(page,10)); const limitNum = Math.min(50, Math.max(1, parseInt(limit,10))); const skip = (pageNum-1)*limitNum;
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (status && status !== 'all') filter.status = status;
  if (assignedTo) { if (assignedTo === 'unassigned') filter.assignedTo = null; else if (mongoose.isValidObjectId(assignedTo)) filter.assignedTo = new mongoose.Types.ObjectId(assignedTo); }
  if (search) filter.subject = { $regex: search, $options: 'i' };
  const allowedSort = ['updatedAt','createdAt','unreadStaff'];
  const sf = allowedSort.includes(sortBy) ? sortBy : 'updatedAt';
  const sort = { [sf]: sortOrder === 'asc' ? 1 : -1 };
  const [conversations, total] = await Promise.all([
    Conversation.find(filter).sort(sort).skip(skip).limit(limitNum).populate('guestId','name email avatar').populate('assignedTo','name email role').populate('bookingId','confirmationCode checkIn checkOut').lean(),
    Conversation.countDocuments(filter),
  ]);
  return { conversations, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum), hasNext: pageNum < Math.ceil(total/limitNum), hasPrev: pageNum > 1 } };
};

export const getGuestConversations = async (guestId, query = {}) => {
  const { page=1, limit=10 } = query;
  const pageNum = Math.max(1, parseInt(page,10)); const limitNum = Math.min(20, parseInt(limit,10)); const skip = (pageNum-1)*limitNum;
  const filter = { guestId: new mongoose.Types.ObjectId(guestId) };
  const [conversations, total] = await Promise.all([
    Conversation.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).populate('hotelId','name coverImage address').populate('assignedTo','name role').lean(),
    Conversation.countDocuments(filter),
  ]);
  return { conversations, pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum) } };
};

export const getConversationById = async (conversationId, requestingUser) => {
  if (!mongoose.isValidObjectId(conversationId)) throw ApiError.badRequest('Invalid conversationId');
  const conversation = await Conversation.findById(conversationId).populate('guestId','name email avatar').populate('assignedTo','name email role').populate('bookingId','confirmationCode checkIn checkOut').lean();
  if (!conversation) throw ApiError.notFound('Conversation not found');
  const isStaff = ['owner','manager','receptionist','superadmin'].includes(requestingUser.role);
  if (isStaff) {
    const userHotelId = requestingUser.hotelId?.toString();
    if (requestingUser.role !== 'superadmin' && conversation.hotelId.toString() !== userHotelId) throw ApiError.forbidden('Access denied');
  } else {
    if (conversation.guestId._id.toString() !== requestingUser._id.toString()) throw ApiError.forbidden('Access denied');
  }
  return conversation;
};

export const sendMessage = async ({ conversationId, senderId, senderRole, hotelId, text, type, attachments }) => {
  const conversation = await Conversation.findOne({ _id: new mongoose.Types.ObjectId(conversationId), hotelId: new mongoose.Types.ObjectId(hotelId) });
  if (!conversation) throw ApiError.notFound('Conversation not found');
  if (conversation.status === 'closed') throw ApiError.badRequest('Cannot send messages to a closed conversation');
  if (!text && (!attachments || !attachments.length)) throw ApiError.badRequest('Message must have text or attachments');
  const message = await Message.create({ hotelId: new mongoose.Types.ObjectId(hotelId), conversationId: new mongoose.Types.ObjectId(conversationId), senderId: new mongoose.Types.ObjectId(senderId), senderRole, type: type||'text', text: text||'', attachments: attachments||[], readBy: [{ userId: new mongoose.Types.ObjectId(senderId), readAt: new Date() }] });
  const isGuest = senderRole === 'customer';
  await Conversation.findByIdAndUpdate(conversationId, { lastMessage: { text: (text||'[attachment]').substring(0,100), senderId: new mongoose.Types.ObjectId(senderId), sentAt: new Date() }, ...(isGuest ? { $inc: { unreadStaff: 1 } } : { $inc: { unreadGuest: 1 } }), ...(conversation.status === 'resolved' ? { status: 'open' } : {}) });
  return Message.findById(message._id).populate('senderId','name avatar role').lean();
};

export const getMessages = async (conversationId, hotelId, query = {}) => {
  const { page=1, limit=50, before='' } = query;
  const pageNum = Math.max(1, parseInt(page,10)); const limitNum = Math.min(100, Math.max(1, parseInt(limit,10))); const skip = (pageNum-1)*limitNum;
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId), conversationId: new mongoose.Types.ObjectId(conversationId), isDeleted: false };
  if (before) filter.createdAt = { $lt: new Date(before) };
  const [messages, total] = await Promise.all([
    Message.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).populate('senderId','name avatar role').lean(),
    Message.countDocuments(filter),
  ]);
  return { messages: messages.reverse(), pagination: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total/limitNum), hasMore: total > skip + limitNum } };
};

export const markAsRead = async (conversationId, hotelId, userId, userRole) => {
  const isGuest = userRole === 'customer';
  await Message.updateMany({ hotelId: new mongoose.Types.ObjectId(hotelId), conversationId: new mongoose.Types.ObjectId(conversationId), isDeleted: false, 'readBy.userId': { $ne: new mongoose.Types.ObjectId(userId) } }, { $push: { readBy: { userId: new mongoose.Types.ObjectId(userId), readAt: new Date() } } });
  await Conversation.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(conversationId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { $set: isGuest ? { unreadGuest: 0 } : { unreadStaff: 0 } });
};

export const assignConversation = async (hotelId, conversationId, staffId) => {
  const conversation = await Conversation.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(conversationId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { $set: { assignedTo: staffId ? new mongoose.Types.ObjectId(staffId) : null } }, { new: true }).populate('assignedTo','name email role').lean();
  if (!conversation) throw ApiError.notFound('Conversation not found');
  return conversation;
};

export const updateConversationStatus = async (hotelId, conversationId, status, resolvedBy) => {
  const allowed = ['open','resolved','closed'];
  if (!allowed.includes(status)) throw ApiError.badRequest('Invalid status');
  const update = { status };
  if (status === 'resolved') { update.resolvedAt = new Date(); update.resolvedBy = new mongoose.Types.ObjectId(resolvedBy); }
  const conversation = await Conversation.findOneAndUpdate({ _id: new mongoose.Types.ObjectId(conversationId), hotelId: new mongoose.Types.ObjectId(hotelId) }, { $set: update }, { new: true }).populate('guestId','name email').populate('assignedTo','name role').lean();
  if (!conversation) throw ApiError.notFound('Conversation not found');
  await Message.create({ hotelId: new mongoose.Types.ObjectId(hotelId), conversationId: new mongoose.Types.ObjectId(conversationId), senderId: new mongoose.Types.ObjectId(resolvedBy), senderRole: 'system', type: 'system', text: 'Conversation marked as ' + status });
  return conversation;
};

export const deleteMessage = async (hotelId, messageId, requestingUserId) => {
  const message = await Message.findOne({ _id: new mongoose.Types.ObjectId(messageId), hotelId: new mongoose.Types.ObjectId(hotelId), isDeleted: false });
  if (!message) throw ApiError.notFound('Message not found');
  if (message.senderId.toString() !== requestingUserId.toString()) throw ApiError.forbidden('Can only delete your own messages');
  message.isDeleted = true; message.deletedAt = new Date(); message.text = '[Message deleted]';
  await message.save();
  return message;
};

export const getUnreadCounts = async (hotelId, userId, userRole) => {
  const isGuest = userRole === 'customer';
  const field = isGuest ? 'unreadGuest' : 'unreadStaff';
  const filter = { hotelId: new mongoose.Types.ObjectId(hotelId) };
  if (isGuest) filter.guestId = new mongoose.Types.ObjectId(userId);
  else filter.status = 'open';
  const result = await Conversation.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$' + field } } }]);
  return { unreadCount: result.length ? result[0].total : 0 };
};
