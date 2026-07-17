import mongoose from 'mongoose';
const couponSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  code: { type: String, required: true, uppercase: true, trim: true, minlength: 3, maxlength: 32 },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500, default: '' },
  discountType: { type: String, enum: ['percentage','fixed'], required: true },
  discountValue: { type: Number, required: true, min: 0.01 },
  maxDiscountAmount: { type: Number, default: null },
  minBookingAmount: { type: Number, default: 0, min: 0 },
  applicableRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  validForCheckIn: { from: { type: Date, default: null }, to: { type: Date, default: null } },
  usageLimit: { type: Number, default: null },
  perUserLimit: { type: Number, default: 1, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  usedBy: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, usedCount: { type: Number, default: 1 }, lastUsedAt: { type: Date, default: Date.now }, _id: false }],
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null, index: true },
  isActive: { type: Boolean, default: true, index: true },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; delete ret.usedBy; return ret; } },
});
couponSchema.index({ hotelId: 1, code: 1 }, { unique: true });
couponSchema.virtual('isExpired').get(function() { if (!this.expiresAt) return false; return new Date() > this.expiresAt; });
couponSchema.virtual('remainingUses').get(function() { if (!this.usageLimit) return null; return Math.max(0, this.usageLimit - this.usedCount); });
couponSchema.virtual('isValid').get(function() {
  const now = new Date();
  if (!this.isActive) return false;
  if (now < this.startsAt) return false;
  if (this.expiresAt && now > this.expiresAt) return false;
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) return false;
  return true;
});
export const Coupon = mongoose.model('Coupon', couponSchema);
