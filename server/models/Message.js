import mongoose from 'mongoose';
const messageSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['customer','owner','manager','receptionist','superadmin','system'], required: true },
  type: { type: String, enum: ['text','image','file','system'], default: 'text' },
  text: { type: String, trim: true, maxlength: 2000, default: '' },
  attachments: [{ fileId: String, filename: String, mimeType: String, size: Number, _id: false }],
  readBy: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: { type: Date, default: Date.now }, _id: false }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } } });
messageSchema.index({ conversationId: 1, createdAt: 1 });
export const Message = mongoose.model('Message', messageSchema);
