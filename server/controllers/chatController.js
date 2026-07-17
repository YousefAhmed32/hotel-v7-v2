import * as chatService from '../services/chatService.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';

export const startConversation = async (req, res, next) => {
  try {
    const { bookingId, subject } = req.body;
    const { conversation, created } = await chatService.getOrCreateConversation({ hotelId: req.hotelId, guestId: req.user._id, bookingId, subject });
    return created ? ApiResponse.created(res, { conversation }, 'Conversation started') : ApiResponse.success(res, { conversation }, 'Existing conversation returned');
  } catch (err) { next(err); }
};

export const getHotelConversations = async (req, res, next) => {
  try {
    const { conversations, pagination } = await chatService.getHotelConversations(req.hotelId, req.query);
    return ApiResponse.paginated(res, conversations, pagination);
  } catch (err) { next(err); }
};

export const getMyConversations = async (req, res, next) => {
  try {
    const { conversations, pagination } = await chatService.getGuestConversations(req.user._id, req.query);
    return ApiResponse.paginated(res, conversations, pagination);
  } catch (err) { next(err); }
};

export const getConversationById = async (req, res, next) => {
  try {
    const conversation = await chatService.getConversationById(req.params.conversationId, req.user);
    return ApiResponse.success(res, { conversation });
  } catch (err) { next(err); }
};

export const getMessages = async (req, res, next) => {
  try {
    const conversation = await chatService.getConversationById(req.params.conversationId, req.user);
    const { messages, pagination } = await chatService.getMessages(req.params.conversationId, conversation.hotelId.toString(), req.query);
    return ApiResponse.paginated(res, messages, pagination);
  } catch (err) { next(err); }
};

export const sendMessage = async (req, res, next) => {
  try {
    const { text, type, attachments } = req.body;
    const conversation = await chatService.getConversationById(req.params.conversationId, req.user);
    const message = await chatService.sendMessage({ conversationId: req.params.conversationId, senderId: req.user._id, senderRole: req.user.role, hotelId: conversation.hotelId.toString(), text, type, attachments });
    return ApiResponse.created(res, { message }, 'Message sent');
  } catch (err) { next(err); }
};

export const markAsRead = async (req, res, next) => {
  try {
    const conversation = await chatService.getConversationById(req.params.conversationId, req.user);
    await chatService.markAsRead(req.params.conversationId, conversation.hotelId.toString(), req.user._id, req.user.role);
    return ApiResponse.success(res, null, 'Messages marked as read');
  } catch (err) { next(err); }
};

export const assignConversation = async (req, res, next) => {
  try {
    const { staffId } = req.body;
    const conversation = await chatService.assignConversation(req.hotelId, req.params.conversationId, staffId);
    return ApiResponse.success(res, { conversation }, 'Conversation assigned');
  } catch (err) { next(err); }
};

export const updateConversationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) throw ApiError.badRequest('status is required');
    const conversation = await chatService.updateConversationStatus(req.hotelId, req.params.conversationId, status, req.user._id);
    return ApiResponse.success(res, { conversation }, 'Conversation ' + status);
  } catch (err) { next(err); }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const hotelId = req.hotelId || req.user.hotelId?.toString();
    const message = await chatService.deleteMessage(hotelId, req.params.messageId, req.user._id);
    return ApiResponse.success(res, { message }, 'Message deleted');
  } catch (err) { next(err); }
};

export const getUnreadCounts = async (req, res, next) => {
  try {
    const hotelId = req.hotelId || req.user.hotelId?.toString();
    if (!hotelId) throw ApiError.badRequest('hotelId required');
    const result = await chatService.getUnreadCounts(hotelId, req.user._id, req.user.role);
    return ApiResponse.success(res, result);
  } catch (err) { next(err); }
};
