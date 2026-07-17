import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true,'Name required'], trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: [true,'Email required'], unique: true, lowercase: true, trim: true },
  password: { type: String, required: [true,'Password required'], minlength: 8, select: false },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null, index: true },
  role: { type: String, enum: ['superadmin','owner','manager','receptionist','customer'], default: 'customer' },
  permissions: { type: [String], default: [] },
  phone: { type: String, default: null },
  avatar: { type: String, default: null },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  refreshToken: { type: String, select: false },
  lastLoginAt: { type: Date },
}, {
  timestamps: true,
  toJSON: { transform: (_, ret) => { delete ret.password; delete ret.refreshToken; delete ret.__v; return ret; } },
});

userSchema.index({ email: 1 });
userSchema.index({ hotelId: 1, role: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidate) {
  return bcrypt.compare(candidate, this.password);
};
userSchema.methods.hasPermission = function(p) { return this.permissions.includes(p); };
userSchema.methods.hasRole = function(...roles) { return roles.includes(this.role); };

export const User = mongoose.model('User', userSchema);
