import mongoose from 'mongoose';

const pricingRuleSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['seasonal','weekend','event','earlybird','lastminute'], default: 'seasonal' },
  multiplier: { type: Number, default: 1.0, min: 0.1, max: 10 },
  fixedPrice: { type: Number, default: null },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  daysOfWeek: { type: [Number], default: [] },
  isActive: { type: Boolean, default: true },
}, { _id: true });

const bedSchema = new mongoose.Schema({
  type: { type: String, enum: ['single','double','queen','king','sofa','bunk'], required: true },
  count: { type: Number, default: 1, min: 1 },
}, { _id: false });

const roomSchema = new mongoose.Schema({
  hotelId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  name:        { type: String, required: true, trim: true, maxlength: 100 },
  roomNumber:  { type: String, trim: true, default: null },
  type:        { type: String, enum: ['standard','deluxe','suite','penthouse','villa','studio','connecting','accessible'], required: true },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  maxAdults:   { type: Number, default: 2, min: 1 },
  maxChildren: { type: Number, default: 0, min: 0 },
  beds:        { type: [bedSchema], default: [] },
  sizeM2:      { type: Number, default: null },
  floor:       { type: Number, default: null },
  basePrice:   { type: Number, required: true, min: 0 },
  currency:    { type: String, default: 'USD', uppercase: true, trim: true },
  pricingRules:{ type: [pricingRuleSchema], default: [] },
  amenities:   { type: [String], default: [] },
  view:        { type: String, enum: ['none','sea','pool','city','garden','mountain','courtyard'], default: 'none' },
  images:      { type: [String], default: [] },
  coverImage:  { type: String, default: null },
  isActive:    { type: Boolean, default: true, index: true },
  blockedDates:{ type: [Date], default: [] },
  aiSuggestedPrice:  { type: Number, default: null },
  aiPriceUpdatedAt:  { type: Date, default: null },

  // ── HOUSEKEEPING ──────────────────────────────
  currentStatus: {
    type: String,
    enum: ['available', 'occupied', 'dirty', 'cleaning', 'maintenance', 'blocked'],
    default: 'available',
    index: true,
  },
  lastStatusChangedAt: { type: Date, default: null },
  lastStatusChangedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  housekeepingNotes:   { type: String, default: '' },
  currentBookingId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
});

roomSchema.index({ hotelId: 1, isActive: 1 });
roomSchema.index({ hotelId: 1, type: 1 });
roomSchema.index({ hotelId: 1, basePrice: 1 });
roomSchema.index({ hotelId: 1, currentStatus: 1 });
roomSchema.index({ hotelId: 1, roomNumber: 1 }, { unique: true, sparse: true });

// Effective price for a given date (pricing rules)
roomSchema.methods.getEffectivePrice = function(date) {
  const d = date instanceof Date ? date : new Date(date);
  let price = this.basePrice;
  for (const rule of (this.pricingRules || [])) {
    if (!rule.isActive) continue;
    const inDateRange = (!rule.startDate || d >= rule.startDate) && (!rule.endDate || d <= rule.endDate);
    const inDayOfWeek = !rule.daysOfWeek?.length || rule.daysOfWeek.includes(d.getDay());
    if (inDateRange && inDayOfWeek) {
      price = rule.fixedPrice !== null ? rule.fixedPrice : Math.round(price * rule.multiplier * 100) / 100;
    }
  }
  return price;
};

export const Room = mongoose.model('Room', roomSchema);
