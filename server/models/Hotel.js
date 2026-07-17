import mongoose from 'mongoose';

const hotelSchema = new mongoose.Schema({
  name: { type: String, required: [true,'Name required'], trim: true, minlength: 3, maxlength: 120 },
  slug: { type: String, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  starRating: { type: Number, min: 1, max: 5, default: 3 },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  address: {
    street: { type: String, default: '' }, city: { type: String, required: true },
    state: { type: String, default: '' }, country: { type: String, required: true },
    zipCode: { type: String, default: '' },
    coordinates: { lat: { type: Number, default: null }, lng: { type: Number, default: null } },
  },
  contact: {
    phone: { type: String, default: '' }, email: { type: String, default: '' }, website: { type: String, default: '' },
  },
  images: { type: [String], default: [] },
  coverImage: { type: String, default: null },
  amenities: { type: [String], default: [] },
  avgRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  branding: {
    primaryColor: { type: String, default: '#C9A84C' },
    secondaryColor: { type: String, default: '#1a1c2e' },
    tagline: { type: String, default: '' },
  },
  policies: {
    checkInTime: { type: String, default: '14:00' },
    checkOutTime: { type: String, default: '12:00' },
    cancellationHours: { type: Number, default: 24 },
    petsAllowed: { type: Boolean, default: false },
    smokingAllowed: { type: Boolean, default: false },
  },
  isActive: { type: Boolean, default: true, index: true },
  isVerified: { type: Boolean, default: false },
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } },
});

hotelSchema.index({ 'address.city': 1, 'address.country': 1 });
hotelSchema.index({ isActive: 1, starRating: -1 });
hotelSchema.index({ name: 'text', description: 'text', 'address.city': 'text' });

hotelSchema.pre('save', async function(next) {
  if (!this.isModified('name') && this.slug) return next();
  const base = this.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,'').replace(/\s+/g,'-').replace(/-+/g,'-');
  let slug = base; let count = 0;
  while (true) {
    const exists = await mongoose.model('Hotel').findOne({ slug, _id: { $ne: this._id } });
    if (!exists) break;
    count++; slug = base + '-' + count;
  }
  this.slug = slug;
  next();
});

hotelSchema.virtual('location').get(function() {
  return [this.address?.city, this.address?.country].filter(Boolean).join(', ');
});

export const Hotel = mongoose.model('Hotel', hotelSchema);
