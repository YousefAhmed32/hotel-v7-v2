import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  hotelId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel',   required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },

  amount:    { type: Number, required: true, min: 0 },
  currency:  { type: String, default: 'USD', uppercase: true },
  taxAmount: { type: Number, default: 0 },

  method: {
    type: String,
    enum: ['cash_on_arrival', 'card', 'online_gateway', 'bank_transfer'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    default: 'pending',
    index: true,
  },

  // Gateway data (Stripe-ready)
  gatewayName:      { type: String, default: null },       // 'stripe', 'paymob', etc.
  gatewayReference: { type: String, default: null },       // external transaction ID
  gatewayResponse:  { type: mongoose.Schema.Types.Mixed, default: null },

  // Card info (masked)
  cardLast4:  { type: String, default: null },
  cardBrand:  { type: String, default: null },

  paidAt:     { type: Date, default: null },
  refundedAt: { type: Date, default: null },
  refundAmount:    { type: Number, default: 0 },
  refundReason:    { type: String, default: null },
  refundReference: { type: String, default: null },

  notes:      { type: String, default: '' },
  receiptUrl: { type: String, default: null },

  // Invoice
  invoiceNumber: { type: String, default: null, index: true },
  invoiceData:   { type: mongoose.Schema.Types.Mixed, default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
});

paymentSchema.index({ hotelId: 1, status: 1, createdAt: -1 });
paymentSchema.index({ bookingId: 1, status: 1 });

// Auto-generate invoice number
paymentSchema.pre('save', async function(next) {
  if (this.invoiceNumber || this.status !== 'paid') return next();
  const date  = new Date().toISOString().slice(0,7).replace('-','');
  const count = await this.constructor.countDocuments({ hotelId: this.hotelId });
  this.invoiceNumber = `INV-${date}-${String(count + 1).padStart(4, '0')}`;
  next();
});

export const Payment = mongoose.model('Payment', paymentSchema);
