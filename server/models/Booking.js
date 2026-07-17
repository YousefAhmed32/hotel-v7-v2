import mongoose from 'mongoose';

const guestDetailsSchema = new mongoose.Schema({
  firstName: { type: String, default: '' },
  lastName:  { type: String, default: '' },
  email:     { type: String, default: '' },
  phone:     { type: String, default: '' },
  nationality:    { type: String, default: '' },
  idType:         { type: String, enum: ['passport','national_id','driving_license',''], default: '' },
  idNumber:       { type: String, default: '' },
  specialRequests:{ type: String, default: '' },
}, { _id: false });

const priceBreakdownSchema = new mongoose.Schema({
  baseAmount:     { type: Number, default: 0 },
  taxAmount:      { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  extraAmount:    { type: Number, default: 0 },
  totalAmount:    { type: Number, default: 0 },
  currency:       { type: String, default: 'USD' },
  nightlyRates:   [{ date: Date, price: Number, _id: false }],
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  hotelId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel',   required: true, index: true },
  roomId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Room',    required: true, index: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon',  default: null  },

  confirmationCode: { type: String, unique: true, index: true },

  checkIn:  { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights:   { type: Number, min: 1 },
  adults:   { type: Number, default: 1, min: 1 },
  children: { type: Number, default: 0, min: 0 },

  guestDetails: { type: guestDetailsSchema, default: () => ({}) },
  pricing:      { type: priceBreakdownSchema, default: () => ({}) },

  // ── LIFECYCLE ────────────────────────────────
  status: {
    type: String,
    enum: ['locked','pending','confirmed','checked_in','checked_out','cancelled','no_show'],
    default: 'locked',
    index: true,
  },

  // ── APPROVAL ─────────────────────────────────
  requiresApproval: { type: Boolean, default: true },
  approvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt:   { type: Date, default: null },
  rejectedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectedAt:   { type: Date, default: null },
  rejectionReason: { type: String, default: null },

  // ── CHECK-IN/OUT ─────────────────────────────
  actualCheckIn:  { type: Date, default: null },
  actualCheckOut: { type: Date, default: null },
  checkedInBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  checkedOutBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  // ── PAYMENT ──────────────────────────────────
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ['cash_on_arrival', 'card', 'online_gateway', 'bank_transfer'],
    default: 'cash_on_arrival',
  },
  totalPaid:      { type: Number, default: 0 },

  // ── LOCK ─────────────────────────────────────
  lockToken:      { type: String, default: null, index: true },
  lockExpiresAt:  { type: Date, default: null },

  // ── CANCEL ───────────────────────────────────
  cancelledAt:       { type: Date, default: null },
  cancellationReason:{ type: String, default: null },
  cancelledBy:       { type: String, enum: ['guest','hotel','system',null], default: null },
  refundAmount:      { type: Number, default: 0 },

  // ── META ──────────────────────────────────────
  reviewId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Review', default: null },
  hasReview:     { type: Boolean, default: false },
  internalNotes: { type: String, default: '' },
  source:        { type: String, enum: ['direct','phone','walkin','ota','reception'], default: 'direct' },

}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
});

// ── Indexes ──────────────────────────────────────────────────────────
bookingSchema.index({ hotelId: 1, roomId: 1, status: 1, checkIn: 1, checkOut: 1 });
bookingSchema.index({ hotelId: 1, userId: 1 });
bookingSchema.index({ hotelId: 1, status: 1, checkIn: 1 });
bookingSchema.index({ hotelId: 1, paymentStatus: 1 });
bookingSchema.index({ lockExpiresAt: 1 }, { expireAfterSeconds: 0, partialFilterExpression: { status: 'locked' } });

// ── Hooks ─────────────────────────────────────────────────────────────
bookingSchema.pre('validate', function(next) {
  if (this.checkIn && this.checkOut)
    this.nights = Math.round((new Date(this.checkOut) - new Date(this.checkIn)) / (1000*60*60*24));
  next();
});

bookingSchema.pre('save', function(next) {
  if (this.checkOut <= this.checkIn) return next(new Error('Check-out must be after check-in'));
  next();
});

bookingSchema.pre('save', async function(next) {
  if (this.confirmationCode) return next();
  const date   = new Date().toISOString().slice(0,10).replace(/-/g,'');
  const suffix = Math.random().toString(36).substring(2,6).toUpperCase();
  this.confirmationCode = 'LX-' + date + '-' + suffix;
  next();
});

bookingSchema.virtual('isLockExpired').get(function() {
  return this.lockExpiresAt ? new Date() > this.lockExpiresAt : false;
});

export const Booking = mongoose.model('Booking', bookingSchema);
