import mongoose from 'mongoose';
const conversationSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  subject: { type: String, trim: true, maxlength: 200, default: 'General Inquiry' },
  lastMessage: { text: { type: String, default: '' }, senderId: { type: mongoose.Schema.Types.ObjectId, default: null }, sentAt: { type: Date, default: null } },
  unreadGuest: { type: Number, default: 0, min: 0 },
  unreadStaff: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['open','resolved','closed'], default: 'open', index: true },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } } });
conversationSchema.index({ hotelId: 1, status: 1, updatedAt: -1 });
export const Conversation = mongoose.model('Conversation', conversationSchema);
