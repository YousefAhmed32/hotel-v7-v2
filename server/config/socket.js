import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
import * as chatService from '../services/chatService.js';
import { Conversation } from '../models/Conversation.js';

const onlineUsers = new Map();
const addSocket = (userId, socketId) => { if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set()); onlineUsers.get(userId).add(socketId); };
const removeSocket = (userId, socketId) => { const s = onlineUsers.get(userId); if (!s) return; s.delete(socketId); if (s.size === 0) onlineUsers.delete(userId); };
export const isUserOnline = (userId) => onlineUsers.has(userId.toString());

export const initializeSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.SOCKET_CORS_ORIGIN || env.CLIENT_URL, methods: ['GET','POST'], credentials: true },
    pingTimeout: 60000, pingInterval: 25000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication token required'));
      let decoded;
      try { decoded = jwt.verify(token, env.JWT_SECRET); } catch { return next(new Error('Invalid or expired token')); }
      const user = await User.findById(decoded.sub).lean();
      if (!user || !user.isActive) return next(new Error('User not found or inactive'));
      socket.user = user; socket.userId = user._id.toString(); socket.hotelId = user.hotelId?.toString() || null;
      next();
    } catch (err) { logger.error('Socket auth error: ' + err.message); next(new Error('Authentication failed')); }
  });

  io.on('connection', (socket) => {
    const { userId, hotelId, user } = socket;
    logger.info('Socket connected: ' + user.name + ' | ' + socket.id);
    addSocket(userId, socket.id);
    if (hotelId) socket.join('hotel:' + hotelId);
    socket.join('user:' + userId);
    if (hotelId) socket.to('hotel:' + hotelId).emit('user:online', { userId, name: user.name, role: user.role });

    socket.on('conversation:join', async ({ conversationId }) => {
      try {
        await chatService.getConversationById(conversationId, user);
        socket.join('conversation:' + conversationId);
        socket.emit('conversation:joined', { conversationId });
      } catch (err) { socket.emit('error', { message: err.message }); }
    });

    socket.on('conversation:leave', ({ conversationId }) => { socket.leave('conversation:' + conversationId); });

    socket.on('message:send', async ({ conversationId, text, type, attachments }) => {
      try {
        if (!conversationId) return socket.emit('error', { message: 'conversationId required' });
        if (!text && (!attachments || !attachments.length)) return socket.emit('error', { message: 'Message cannot be empty' });
        const conv = await Conversation.findById(conversationId).select('hotelId guestId').lean();
        if (!conv) return socket.emit('error', { message: 'Conversation not found' });
        const msgHotelId = conv.hotelId.toString();
        if (user.role !== 'superadmin' && user.role !== 'customer' && hotelId !== msgHotelId) return socket.emit('error', { message: 'Access denied' });
        const message = await chatService.sendMessage({ conversationId, senderId: userId, senderRole: user.role, hotelId: msgHotelId, text, type, attachments });
        io.to('conversation:' + conversationId).emit('message:new', message);
        if (user.role === 'customer') io.to('hotel:' + msgHotelId).emit('inbox:new_message', { conversationId, message });
        else io.to('user:' + conv.guestId.toString()).emit('inbox:new_message', { conversationId, message });
      } catch (err) { logger.error('message:send error: ' + err.message); socket.emit('error', { message: err.message }); }
    });

    socket.on('typing:start', ({ conversationId }) => { socket.to('conversation:' + conversationId).emit('typing:start', { conversationId, userId, name: user.name }); });
    socket.on('typing:stop', ({ conversationId }) => { socket.to('conversation:' + conversationId).emit('typing:stop', { conversationId, userId }); });

    socket.on('messages:read', async ({ conversationId, hotelId: msgHotelId }) => {
      try {
        const hId = msgHotelId || hotelId;
        if (!hId) return;
        await chatService.markAsRead(conversationId, hId, userId, user.role);
        socket.to('conversation:' + conversationId).emit('messages:read', { conversationId, readBy: userId, readAt: new Date() });
      } catch (err) { logger.error('messages:read error: ' + err.message); }
    });

    socket.on('disconnect', (reason) => {
      removeSocket(userId, socket.id);
      logger.info('Socket disconnected: ' + user.name + ' | ' + reason);
      if (!isUserOnline(userId) && hotelId) socket.to('hotel:' + hotelId).emit('user:offline', { userId, name: user.name });
    });
  });

  logger.info('Socket.io initialized');
  return io;
};
