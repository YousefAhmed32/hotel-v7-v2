import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  hotelId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null, index: true },
  recipientId:{ type: mongoose.Schema.Types.ObjectId, ref: 'User',  required: true, index: true },
  type: {
    type: String,
    enum: [
      'booking_created', 'booking_approved', 'booking_rejected',
      'booking_checkin', 'booking_checkout', 'booking_cancelled',
      'payment_received', 'payment_approved', 'payment_rejected',
      'room_request', 'chat_message', 'review_posted',
    ],
    required: true,
  },
  title:      { type: String, required: true },
  body:       { type: String, default: '' },
  link:       { type: String, default: null },
  data:       { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead:     { type: Boolean, default: false, index: true },
  readAt:     { type: Date, default: null },
}, {
  timestamps: true,
  toJSON: { transform: (_, ret) => { delete ret.__v; return ret; } },
});

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
