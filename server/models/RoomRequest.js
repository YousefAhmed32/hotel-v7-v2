import mongoose from 'mongoose';

const roomRequestSchema = new mongoose.Schema({
  hotelId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel',   required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  roomId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Room',    required: true },
  guestId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },

  type: {
    type: String,
    enum: ['cleaning', 'maintenance', 'do_not_disturb', 'room_service', 'checkout_request', 'extra_towels', 'extra_pillows', 'other'],
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'acknowledged', 'in_progress', 'completed', 'cancelled'],
    default: 'pending',
    index: true,
  },

  priority:    { type: String, enum: ['low','normal','high','urgent'], default: 'normal' },
  title:       { type: String, default: '' },
  description: { type: String, default: '' },
  notes:       { type: String, default: '' },    // staff notes

  assignedTo:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  acknowledgedAt:   { type: Date, default: null },
  startedAt:        { type: Date, default: null },
  completedAt:      { type: Date, default: null },

  // For room service orders
  items: [{
    name:     { type: String },
    quantity: { type: Number, default: 1 },
    price:    { type: Number, default: 0 },
    _id: false,
  }],
  itemsTotal: { type: Number, default: 0 },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
});

roomRequestSchema.index({ hotelId: 1, status: 1, createdAt: -1 });
roomRequestSchema.index({ bookingId: 1, status: 1 });

export const RoomRequest = mongoose.model('RoomRequest', roomRequestSchema);
