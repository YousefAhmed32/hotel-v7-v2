/**
 * superSeeder.js
 * ═══════════════════════════════════════════════════════════════════════════
 * COMPREHENSIVE DATABASE SEEDER - Main Orchestrator
 * 
 * ✅ Standalone & Complete (no dependencies on baseSeeder/advancedSeeder)
 * ✅ Realistic Data with Deep Relationships
 * ✅ Large-Scale Dataset (100+ bookings, 50+ reviews, 30+ conversations)
 * ✅ AI Pricing Simulation with 12 months history
 * ✅ Divided into 3 files for managability
 * 
 * Usage:
 *   node backend/seeders/superSeeder.js
 * 
 * Time: ~30-45 seconds on typical hardware
 * ═══════════════════════════════════════════════════════════════════════════
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

import { SEED_DATA } from './seeddata.js';
import {
  randInt, randFloat, pick, shuffle, randomDate, toMidnight,
  addDays, dayKey, dateRange, calculatePrice, genConfCode, slugify
} from './seedhelpers.js';

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA DEFINITIONS (Inline for standalone execution)
// ─────────────────────────────────────────────────────────────────────────────

const hash = (pw) => bcrypt.hash(pw, 12);

// User
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', default: null, index: true },
  role: { type: String, enum: ['superadmin','owner','manager','receptionist','customer'], default: 'customer' },
  permissions: { type: [String], default: [] },
  phone: { type: String, default: null },
  avatar: { type: String, default: null },
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
  isActive: { type: Boolean, default: true, index: true },
  isEmailVerified: { type: Boolean, default: true },
  refreshToken: { type: String, select: false },
  lastLoginAt: { type: Date },
}, { timestamps: true, toJSON: { transform: (_, ret) => { delete ret.password; delete ret.__v; return ret; } } });

// Hotel
const hotelSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, unique: true, lowercase: true, trim: true, index: true },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  starRating: { type: Number, min: 1, max: 5, default: 3 },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  address: {
    street: { type: String, default: '' },
    city: { type: String, required: true },
    state: { type: String, default: '' },
    country: { type: String, required: true },
    zipCode: { type: String, default: '' },
    coordinates: { lat: { type: Number, default: null }, lng: { type: Number, default: null } },
  },
  contact: { phone: { type: String, default: '' }, email: { type: String, default: '' }, website: { type: String, default: '' } },
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
  isVerified: { type: Boolean, default: true },
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } } });

// Room
const bedSchema = new mongoose.Schema({ type: { type: String, enum: ['single','double','queen','king','sofa','bunk'], required: true }, count: { type: Number, default: 1 } }, { _id: false });
const pricingRuleSchema = new mongoose.Schema({ name: String, type: String, multiplier: { type: Number, default: 1.0 }, fixedPrice: { type: Number, default: null }, startDate: Date, endDate: Date, daysOfWeek: [Number], isActive: { type: Boolean, default: true } });

const roomSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  name: { type: String, required: true, trim: true },
  roomNumber: { type: String, default: null },
  type: { type: String, enum: ['standard','deluxe','suite','penthouse','villa','studio','connecting','accessible'], required: true },
  description: { type: String, default: '' },
  maxAdults: { type: Number, default: 2 },
  maxChildren: { type: Number, default: 0 },
  beds: { type: [bedSchema], default: [] },
  sizeM2: { type: Number, default: null },
  floor: { type: Number, default: null },
  basePrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  pricingRules: { type: [pricingRuleSchema], default: [] },
  amenities: { type: [String], default: [] },
  view: { type: String, enum: ['none','sea','pool','city','garden','mountain','courtyard'], default: 'none' },
  images: { type: [String], default: [] },
  coverImage: { type: String, default: null },
  isActive: { type: Boolean, default: true, index: true },
  blockedDates: { type: [Date], default: [] },
  currentStatus: { type: String, enum: ['available','occupied','dirty','cleaning','maintenance','blocked'], default: 'available', index: true },
  lastStatusChangedAt: { type: Date, default: null },
  currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  totalRooms: { type: Number, default: 4 },
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } } });

// Booking
const guestDetailsSchema = new mongoose.Schema({
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  nationality: { type: String, default: '' },
  idType: { type: String, enum: ['passport','national_id','driving_license',''], default: '' },
  idNumber: { type: String, default: '' },
  specialRequests: { type: String, default: '' },
}, { _id: false });

const priceBreakdownSchema = new mongoose.Schema({
  baseAmount: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  extraAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, default: 0 },
  currency: { type: String, default: 'USD' },
  nightlyRates: [{ date: Date, price: Number, _id: false }],
}, { _id: false });

const bookingSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
  confirmationCode: { type: String, unique: true, index: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  nights: { type: Number, min: 1 },
  adults: { type: Number, default: 1, min: 1 },
  children: { type: Number, default: 0, min: 0 },
  guestDetails: { type: guestDetailsSchema, default: () => ({}) },
  pricing: { type: priceBreakdownSchema, default: () => ({}) },
  status: { type: String, enum: ['locked','pending','confirmed','checked_in','checked_out','cancelled','no_show'], default: 'pending', index: true },
  requiresApproval: { type: Boolean, default: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  rejectedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'], default: 'pending', index: true },
  paymentMethod: { type: String, enum: ['cash_on_arrival', 'card', 'online_gateway', 'bank_transfer'], default: 'cash_on_arrival' },
  totalPaid: { type: Number, default: 0 },
  cancelledAt: { type: Date, default: null },
  cancellationReason: { type: String, default: null },
  cancelledBy: { type: String, enum: ['guest','hotel','system',null], default: null },
  refundAmount: { type: Number, default: 0 },
  hasReview: { type: Boolean, default: false },
  internalNotes: { type: String, default: '' },
  source: { type: String, enum: ['direct','phone','walkin','ota','reception'], default: 'direct' },
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } } });

// Review
const reviewSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, unique: true, index: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  categoryRatings: {
    cleanliness: { type: Number, min:1,max:5,default:null },
    comfort: { type: Number, min:1,max:5,default:null },
    location: { type: Number, min:1,max:5,default:null },
    service: { type: Number, min:1,max:5,default:null },
    value: { type: Number, min:1,max:5,default:null },
    facilities: { type: Number, min:1,max:5,default:null },
  },
  title: { type: String, trim: true, maxlength: 120, default: '' },
  comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  hotelResponse: {
    text: { type: String, default: null },
    respondedAt: { type: Date, default: null },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  status: { type: String, enum: ['published','pending','rejected'], default: 'published', index: true },
  isVerified: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  stayMonth: { type: Number, default: null },
  stayYear: { type: Number, default: null },
  travelType: { type: String, enum: ['solo','couple','family','business','group',null], default: null },
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } } });

// Conversation
const conversationSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  subject: { type: String, trim: true, maxlength: 200, default: 'General Inquiry' },
  lastMessage: {
    text: { type: String, default: '' },
    senderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    sentAt: { type: Date, default: null },
  },
  unreadGuest: { type: Number, default: 0, min: 0 },
  unreadStaff: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['open','resolved','closed'], default: 'open', index: true },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } } });

// Message
const messageSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['customer','owner','manager','receptionist','superadmin','system'], required: true },
  type: { type: String, enum: ['text','image','file','system'], default: 'text' },
  text: { type: String, trim: true, maxlength: 2000, default: '' },
  attachments: [],
  readBy: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, readAt: { type: Date, default: Date.now }, _id: false }],
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null },
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } } });

// PriceHistory
const priceHistorySchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  date: { type: Date, required: true },
  basePrice: { type: Number, required: true },
  suggestedPrice: { type: Number, required: true },
  appliedPrice: { type: Number, default: null },
  signals: {
    occupancyRate: { type: Number, default: 0 },
    seasonScore: { type: Number, default: 0 },
    demandScore: { type: Number, default: 0 },
    leadTimeDays: { type: Number, default: 0 },
    dayOfWeekScore: { type: Number, default: 0 },
    reviewScore: { type: Number, default: 0 },
    finalMultiplier: { type: Number, default: 1 },
  },
  action: { type: String, enum: ['suggested','auto','manual','overridden','ignored'], default: 'suggested' },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actionAt: { type: Date, default: null },
}, { timestamps: true });

// Coupon
const couponSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  code: { type: String, required: true, uppercase: true, trim: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage','fixed'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscountAmount: { type: Number, default: null },
  minBookingAmount: { type: Number, default: 0 },
  applicableRooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  validForCheckIn: { from: { type: Date, default: null }, to: { type: Date, default: null } },
  usageLimit: { type: Number, default: null },
  perUserLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  usedBy: [],
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null, index: true },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true, toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; return ret; } } });

// Register models
const User      = mongoose.models.User      || mongoose.model('User', userSchema);
const Hotel     = mongoose.models.Hotel     || mongoose.model('Hotel', hotelSchema);
const Room      = mongoose.models.Room      || mongoose.model('Room', roomSchema);
const Booking   = mongoose.models.Booking   || mongoose.model('Booking', bookingSchema);
const Review    = mongoose.models.Review    || mongoose.model('Review', reviewSchema);
const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);
const Message   = mongoose.models.Message   || mongoose.model('Message', messageSchema);
const PriceHistory = mongoose.models.PriceHistory || mongoose.model('PriceHistory', priceHistorySchema);
const Coupon    = mongoose.models.Coupon    || mongoose.model('Coupon', couponSchema);

// ═════════════════════════════════════════════════════════════════════════════
// MAIN SEEDER FUNCTION
// ═════════════════════════════════════════════════════════════════════════════

async function runSuperSeeder() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) throw new Error('❌ MONGO_URI not defined in .env');

  console.log('\n🔌  Connecting to MongoDB…');
  await mongoose.connect(MONGO_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 });
  console.log('✅  Connected.\n');

  const startTime = Date.now();

  // ────────────────────────────────────────────────────────────────────────
  // 1. CLEAR ALL COLLECTIONS
  // ────────────────────────────────────────────────────────────────────────
  console.log('🗑   Clearing all collections…');
  await Promise.all([
    User.deleteMany({}),
    Hotel.deleteMany({}),
    Room.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
    Conversation.deleteMany({}),
    Message.deleteMany({}),
    PriceHistory.deleteMany({}),
    Coupon.deleteMany({}),
  ]);
  console.log('✅  Collections cleared.\n');

  // ────────────────────────────────────────────────────────────────────────
  // 2. USERS (Owners, Staff, Customers)
  // ────────────────────────────────────────────────────────────────────────
  console.log('👤  Seeding users (owners, staff, customers)…');

  const ownerDocs = await Promise.all(
    SEED_DATA.OWNERS.map(async (o, i) => ({
      ...o,
      password: await hash(SEED_DATA.PASSWORDS.OWNERS[i]),
      role: 'owner',
      isEmailVerified: true,
      lastLoginAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    }))
  );
  const owners = await User.insertMany(ownerDocs);
  console.log(`    ✔ ${owners.length} owners`);

  const staffDocs = await Promise.all(
    SEED_DATA.STAFF.map(async (s) => ({
      ...s,
      password: await hash(SEED_DATA.PASSWORDS.STAFF),
      role: s.role,
      isEmailVerified: true,
      lastLoginAt: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000),
    }))
  );
  const staffUsers = await User.insertMany(staffDocs);
  console.log(`    ✔ ${staffUsers.length} staff`);

  const custDocs = await Promise.all(
    SEED_DATA.CUSTOMERS.map(async (c) => ({
      ...c,
      password: await hash(SEED_DATA.PASSWORDS.CUSTOMER),
      role: 'customer',
      isEmailVerified: true,
      lastLoginAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000),
    }))
  );
  const customers = await User.insertMany(custDocs);
  console.log(`    ✔ ${customers.length} customers\n`);

  // Assign staff to hotels
  await User.updateMany(
    { email: { $in: SEED_DATA.STAFF.slice(0, 3).map(s => s.email) } },
    { hotelId: owners[0]._id }
  );
  await User.updateMany(
    { email: { $in: SEED_DATA.STAFF.slice(3).map(s => s.email) } },
    { hotelId: owners[1]._id }
  );

  // ────────────────────────────────────────────────────────────────────────
  // 3. HOTELS
  // ────────────────────────────────────────────────────────────────────────
  console.log('🏨  Seeding hotels…');

  const hotelDocs = SEED_DATA.HOTELS.map((h, i) => ({
    ...h,
    ownerId: owners[i]._id,
    slug: slugify(h.name),
    isActive: true,
    isVerified: true,
  }));
  const hotels = await Hotel.insertMany(hotelDocs);
  console.log(`    ✔ ${hotels.length} hotels\n`);

  // ────────────────────────────────────────────────────────────────────────
  // 4. ROOMS
  // ────────────────────────────────────────────────────────────────────────
  console.log('🛏   Seeding rooms (6 types × 2 hotels)…');

  const allRoomDocs = [];
  hotels.forEach((hotel, hi) => {
    SEED_DATA.ROOM_CATALOG.forEach((rc, ri) => {
      const floor = Math.floor(ri / 2) + 1;
      const viewOptions = ['city', 'city', 'sea', 'garden', 'city', 'sea'];

      allRoomDocs.push({
        hotelId: hotel._id,
        name: rc.name,
        roomNumber: `${(hi + 1) * 100 + (ri + 1) * 10}`,
        type: rc.type,
        description: rc.description,
        maxAdults: rc.maxAdults,
        maxChildren: rc.maxChildren,
        beds: rc.beds,
        sizeM2: rc.sizeM2,
        floor,
        basePrice: hi === 0 ? rc.basePrice : Math.round(rc.basePrice * 0.85),
        currency: 'USD',
        pricingRules: [
          {
            name: 'Weekend Premium',
            type: 'weekend',
            multiplier: 1.25,
            daysOfWeek: [5, 6],
            isActive: true,
          },
        ],
        amenities: rc.amenities,
        view: viewOptions[ri],
        images: [
          `https://images.unsplash.com/photo-${1631049307264 + ri * 1000}-da0ec9d70304?w=800`,
          `https://images.unsplash.com/photo-${1582719508461 + ri * 500}-905c673771fd?w=800`,
        ],
        coverImage: `https://images.unsplash.com/photo-${1631049307264 + ri * 1000}-da0ec9d70304?w=800`,
        isActive: true,
        totalRooms: rc.totalRooms,
      });
    });
  });

  const rooms = await Room.insertMany(allRoomDocs);
  console.log(`    ✔ ${rooms.length} rooms\n`);

  // ────────────────────────────────────────────────────────────────────────
  // 5. COUPONS
  // ────────────────────────────────────────────────────────────────────────
  console.log('🎟   Seeding coupons…');

  const couponDocs = [];
  hotels.forEach((hotel) => {
    const now = new Date();
    const past = (d) => new Date(now - d * 24 * 60 * 60 * 1000);
    const future = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

    couponDocs.push(
      {
        hotelId: hotel._id,
        code: `WELCOME${hotel._id.toString().slice(-4).toUpperCase()}`,
        name: 'Welcome Discount',
        description: '15% off your first booking',
        discountType: 'percentage',
        discountValue: 15,
        maxDiscountAmount: 200,
        minBookingAmount: 100,
        usageLimit: 500,
        perUserLimit: 1,
        usedCount: randInt(30, 60),
        startsAt: past(30),
        expiresAt: future(60),
        isActive: true,
      },
      {
        hotelId: hotel._id,
        code: `SAVE50${hotel._id.toString().slice(-4).toUpperCase()}`,
        name: 'Flat $50 Off',
        description: '$50 off bookings over $300',
        discountType: 'fixed',
        discountValue: 50,
        minBookingAmount: 300,
        usageLimit: 200,
        perUserLimit: 2,
        usedCount: randInt(80, 120),
        startsAt: past(15),
        expiresAt: future(45),
        isActive: true,
      },
      {
        hotelId: hotel._id,
        code: `SUMMER25${hotel._id.toString().slice(-4).toUpperCase()}`,
        name: 'Summer Escape',
        description: '25% off all bookings this summer',
        discountType: 'percentage',
        discountValue: 25,
        maxDiscountAmount: 400,
        minBookingAmount: 200,
        usageLimit: 300,
        perUserLimit: 1,
        usedCount: randInt(150, 250),
        startsAt: past(60),
        expiresAt: future(30),
        isActive: true,
      }
    );
  });

  const coupons = await Coupon.insertMany(couponDocs);
  console.log(`    ✔ ${coupons.length} coupons\n`);

  // ────────────────────────────────────────────────────────────────────────
  // 6. BOOKINGS
  // ────────────────────────────────────────────────────────────────────────
  console.log('📅  Seeding bookings (100+ with smart occupancy)…');

  const now = new Date();
  const past12m = addDays(now, -365);
  const future3m = addDays(now, 90);

  const bookingDocs = [];
  const occupancyMap = new Map();

  function canBook(roomId, checkIn, checkOut, totalRooms) {
    const keys = dateRange(roomId.toString(), checkIn, checkOut);
    for (const k of keys) {
      if ((occupancyMap.get(k) || 0) >= totalRooms) return false;
    }
    return true;
  }

  function recordBooking(roomId, checkIn, checkOut) {
    const keys = dateRange(roomId.toString(), checkIn, checkOut);
    for (const k of keys) {
      occupancyMap.set(k, (occupancyMap.get(k) || 0) + 1);
    }
  }

  const confirmedBookings = []; // for reviews
  let attempts = 0;
  const maxAttempts = 1000;

  while (bookingDocs.length < 120 && attempts < maxAttempts) {
    attempts++;

    const hotelIdx = attempts % 2;
    const hotel = hotels[hotelIdx];
    const hotelRooms = rooms.filter(r => r.hotelId.toString() === hotel._id.toString());
    const room = pick(hotelRooms);
    const customer = pick(customers);

    const isFuture = Math.random() < 0.25;
    const checkIn = isFuture
      ? toMidnight(randomDate(addDays(now, 1), future3m))
      : toMidnight(randomDate(past12m, addDays(now, -1)));

    const nights = randInt(1, 7);
    const checkOut = addDays(checkIn, nights);
    const totalRooms = room.totalRooms || 4;

    if (!canBook(room._id.toString(), checkIn, checkOut, totalRooms)) continue;
    recordBooking(room._id.toString(), checkIn, checkOut);

    let status, paymentStatus, cancelledAt, cancelledBy;
    if (isFuture) {
      status = pick(['confirmed', 'confirmed', 'confirmed', 'pending']);
      paymentStatus = status === 'confirmed' ? 'paid' : 'pending';
    } else {
      status = pick(['checked_out', 'checked_out', 'checked_out', 'cancelled', 'no_show']);
      paymentStatus = status === 'cancelled' ? pick(['pending','refunded']) : 'paid';
    }

    if (status === 'cancelled') {
      cancelledAt = randomDate(checkIn, addDays(checkIn, 1));
      cancelledBy = pick(['guest', 'hotel', 'system']);
    }

    const discountPct = Math.random() < 0.25 ? pick([10, 15, 20, 25]) : 0;
    const pricing = calculatePrice(room.basePrice, checkIn, checkOut, discountPct);
    const [firstName, ...lastParts] = customer.name.split(' ');
    const lastName = lastParts.join(' ');

    const doc = {
      hotelId: hotel._id,
      roomId: room._id,
      userId: customer._id,
      confirmationCode: genConfCode(checkIn),
      checkIn,
      checkOut,
      nights,
      adults: randInt(1, room.maxAdults || 2),
      children: Math.random() < 0.3 ? randInt(1, room.maxChildren || 1) : 0,
      guestDetails: {
        firstName,
        lastName,
        email: customer.email,
        phone: customer.phone || '+1-000-000-0000',
        nationality: pick(['American','British','French','German','Australian','Canadian','Japanese']),
        idType: pick(['passport','national_id','driving_license']),
        idNumber: `ID${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        specialRequests: Math.random() < 0.25 ? pick(SEED_DATA.SPECIAL_REQUESTS) : '',
      },
      pricing,
      status,
      paymentStatus,
      paymentMethod: pick(['card', 'card', 'card', 'bank_transfer']),
      cancelledAt: cancelledAt || null,
      cancelledBy: cancelledBy || null,
      refundAmount: status === 'cancelled' && paymentStatus === 'refunded' ? Math.round(pricing.totalAmount * 0.8 * 100) / 100 : 0,
      hasReview: false,
      internalNotes: Math.random() < 0.1 ? 'VIP guest — prepare welcome amenity.' : '',
      source: pick(['direct', 'direct', 'direct', 'phone', 'ota']),
    };

    bookingDocs.push(doc);

    if (status === 'checked_out') {
      confirmedBookings.push({ ...doc, _customer: customer, _room: room });
    }
  }

  const bookings = await Booking.insertMany(bookingDocs);
  console.log(`    ✔ ${bookings.length} bookings created (${attempts} attempts).\n`);

  // ────────────────────────────────────────────────────────────────────────
  // 7. REVIEWS
  // ────────────────────────────────────────────────────────────────────────
  console.log('⭐  Seeding reviews (40+)…');

  const completedBookings = await Booking.find({ status: 'checked_out' }).lean();
  const seenBookingIds = new Set();
  const reviewDocs = [];
  const reviewableBookings = shuffle(completedBookings).slice(0, 50);

  for (const booking of reviewableBookings) {
    if (seenBookingIds.has(booking._id.toString())) continue;
    seenBookingIds.add(booking._id.toString());

    const template = pick(SEED_DATA.REVIEW_TEMPLATES);
    const checkInDate = new Date(booking.checkIn);

    reviewDocs.push({
      hotelId: booking.hotelId,
      userId: booking.userId,
      bookingId: booking._id,
      roomId: booking.roomId,
      rating: template.rating,
      categoryRatings: {
        cleanliness: randInt(Math.max(1, template.rating - 1), 5),
        comfort: randInt(Math.max(1, template.rating - 1), 5),
        location: randInt(Math.max(1, template.rating - 1), 5),
        service: randInt(Math.max(1, template.rating - 1), 5),
        value: randInt(Math.max(1, template.rating - 1), 5),
        facilities: randInt(Math.max(1, template.rating - 1), 5),
      },
      title: template.title,
      comment: template.comment,
      hotelResponse: Math.random() < 0.6 ? {
        text: pick(SEED_DATA.HOTEL_RESPONSES),
        respondedAt: new Date(checkInDate.getTime() + randInt(1, 14) * 24 * 60 * 60 * 1000),
        respondedBy: staffUsers[0]._id,
      } : { text: null, respondedAt: null, respondedBy: null },
      status: pick(['published', 'published', 'published', 'pending']),
      isVerified: true,
      isFeatured: Math.random() < 0.2,
      helpfulVotes: randInt(0, 50),
      stayMonth: checkInDate.getMonth() + 1,
      stayYear: checkInDate.getFullYear(),
      travelType: template.travelType,
    });
  }

  const reviews = await Review.insertMany(reviewDocs);
  console.log(`    ✔ ${reviews.length} reviews\n`);

  // Update bookings as reviewed
  const reviewedBookingIds = reviews.map(r => r.bookingId);
  await Booking.updateMany({ _id: { $in: reviewedBookingIds } }, { $set: { hasReview: true } });

  // Update hotel ratings
  for (const hotel of hotels) {
    const hotelReviews = reviews.filter(r => r.hotelId.toString() === hotel._id.toString());
    if (hotelReviews.length > 0) {
      const avgRating = hotelReviews.reduce((sum, r) => sum + r.rating, 0) / hotelReviews.length;
      await Hotel.updateOne(
        { _id: hotel._id },
        { $set: { avgRating: Math.round(avgRating * 10) / 10, totalReviews: hotelReviews.length } }
      );
    }
  }

  // ────────────────────────────────────────────────────────────────────────
  // 8. CONVERSATIONS & MESSAGES
  // ────────────────────────────────────────────────────────────────────────
  console.log('💬  Seeding conversations & messages (30+)…');

  const convBookings = await Booking.find({ status: { $in: ['confirmed','checked_out','pending'] } })
    .limit(30).lean();

  const conversationDocs = [];
  for (let ci = 0; ci < Math.min(convBookings.length, 30); ci++) {
    const booking = convBookings[ci];
    const hotelIdx = hotels.findIndex(h => h._id.toString() === booking.hotelId.toString());
    const hotelStaff = staffUsers.filter(s => s.hotelId?.toString() === hotels[hotelIdx]?._id?.toString());
    const assignedStaff = hotelStaff.length > 0 ? pick(hotelStaff) : staffUsers[0];

    const msgIdx = ci % SEED_DATA.GUEST_OPENING_MESSAGES.length;
    const isResolved = ci < 15;
    const lastText = isResolved
      ? SEED_DATA.STAFF_CLOSINGS[msgIdx % SEED_DATA.STAFF_CLOSINGS.length]
      : SEED_DATA.STAFF_RESPONSES[msgIdx % SEED_DATA.STAFF_RESPONSES.length];
    const lastSender = isResolved ? assignedStaff._id : booking.userId;
    const sentAt = randomDate(new Date(booking.createdAt || past12m), addDays(new Date(booking.checkIn), -1));

    conversationDocs.push({
      hotelId: booking.hotelId,
      guestId: booking.userId,
      assignedTo: assignedStaff._id,
      bookingId: booking._id,
      subject: SEED_DATA.CONVERSATION_SUBJECTS[ci % SEED_DATA.CONVERSATION_SUBJECTS.length],
      lastMessage: {
        text: lastText.slice(0, 100),
        senderId: lastSender,
        sentAt,
      },
      unreadGuest: isResolved ? 0 : randInt(0, 2),
      unreadStaff: isResolved ? 0 : randInt(0, 3),
      status: isResolved ? 'resolved' : 'open',
      resolvedAt: isResolved ? sentAt : null,
      resolvedBy: isResolved ? assignedStaff._id : null,
    });
  }

  const conversations = await Conversation.insertMany(conversationDocs);
  console.log(`    ✔ ${conversations.length} conversations`);

  // Messages
  const allMessageDocs = [];
  for (let ci = 0; ci < conversations.length; ci++) {
    const conv = conversations[ci];
    const booking = convBookings[ci];
    const hotelIdx = hotels.findIndex(h => h._id.toString() === conv.hotelId.toString());
    const hotelStaff = staffUsers.filter(s => s.hotelId?.toString() === hotels[hotelIdx]?._id?.toString());
    const assignedStaff = hotelStaff.length > 0 ? pick(hotelStaff) : staffUsers[0];
    const msgIdx = ci % SEED_DATA.GUEST_OPENING_MESSAGES.length;

    const baseTime = new Date(conv.createdAt || past12m);

    // Guest opens
    const t1 = new Date(baseTime.getTime() + randInt(5, 30) * 60 * 1000);
    allMessageDocs.push({
      hotelId: conv.hotelId,
      conversationId: conv._id,
      senderId: conv.guestId,
      senderRole: 'customer',
      type: 'text',
      text: SEED_DATA.GUEST_OPENING_MESSAGES[msgIdx],
      readBy: [
        { userId: conv.guestId, readAt: t1 },
        { userId: assignedStaff._id, readAt: new Date(t1.getTime() + randInt(2, 15) * 60 * 1000) },
      ],
      createdAt: t1,
      updatedAt: t1,
    });

    // Staff responds
    const t2 = new Date(t1.getTime() + randInt(5, 60) * 60 * 1000);
    allMessageDocs.push({
      hotelId: conv.hotelId,
      conversationId: conv._id,
      senderId: assignedStaff._id,
      senderRole: assignedStaff.role,
      type: 'text',
      text: SEED_DATA.STAFF_RESPONSES[msgIdx % SEED_DATA.STAFF_RESPONSES.length],
      readBy: [
        { userId: assignedStaff._id, readAt: t2 },
        { userId: conv.guestId, readAt: new Date(t2.getTime() + randInt(3, 30) * 60 * 1000) },
      ],
      createdAt: t2,
      updatedAt: t2,
    });

    // Guest follow-up
    const t3 = new Date(t2.getTime() + randInt(10, 120) * 60 * 1000);
    allMessageDocs.push({
      hotelId: conv.hotelId,
      conversationId: conv._id,
      senderId: conv.guestId,
      senderRole: 'customer',
      type: 'text',
      text: SEED_DATA.GUEST_FOLLOW_UPS[msgIdx % SEED_DATA.GUEST_FOLLOW_UPS.length],
      readBy: [
        { userId: conv.guestId, readAt: t3 },
        ...(conv.status === 'resolved' ? [{ userId: assignedStaff._id, readAt: new Date(t3.getTime() + randInt(2, 20) * 60 * 1000) }] : []),
      ],
      createdAt: t3,
      updatedAt: t3,
    });

    // Staff closes (if resolved)
    if (conv.status === 'resolved') {
      const t4 = new Date(t3.getTime() + randInt(5, 45) * 60 * 1000);
      allMessageDocs.push({
        hotelId: conv.hotelId,
        conversationId: conv._id,
        senderId: assignedStaff._id,
        senderRole: assignedStaff.role,
        type: 'text',
        text: SEED_DATA.STAFF_CLOSINGS[msgIdx % SEED_DATA.STAFF_CLOSINGS.length],
        readBy: [
          { userId: assignedStaff._id, readAt: t4 },
          { userId: conv.guestId, readAt: new Date(t4.getTime() + randInt(5, 60) * 60 * 1000) },
        ],
        createdAt: t4,
        updatedAt: t4,
      });
    }
  }

  const messages = await Message.insertMany(allMessageDocs);
  console.log(`    ✔ ${messages.length} messages\n`);

  // ────────────────────────────────────────────────────────────────────────
  // 9. PRICE HISTORY (AI Simulation)
  // ────────────────────────────────────────────────────────────────────────
  console.log('📈  Seeding price history (12 months + 30 days forecast)…');

  const priceHistoryDocs = [];
  const historyStartDate = addDays(now, -365);
  const historyEndDate = addDays(now, 30);

  for (const hotel of hotels) {
    const hotelRooms = rooms.filter(r => r.hotelId.toString() === hotel._id.toString());

    for (const room of hotelRooms) {
      let cursor = new Date(historyStartDate);

      while (cursor <= historyEndDate) {
        const month = cursor.getMonth() + 1;
        const profile = SEED_DATA.DEMAND_PROFILES.find(p => p.month === month) || SEED_DATA.DEMAND_PROFILES[0];
        const dow = cursor.getDay();
        const isWeekend = dow === 5 || dow === 6;

        const occupancyRate = randFloat(profile.baseDemand * 0.7, Math.min(0.99, profile.baseDemand * 1.15));
        const seasonScore = profile.seasonScore + randFloat(-0.05, 0.05);
        const demandScore = randFloat(0.5, 1.0);
        const leadTimeDays = randInt(1, 90);
        const dayOfWeekScore = isWeekend ? randFloat(0.8, 1.0) : randFloat(0.4, 0.75);
        const reviewScore = randFloat(0.6, 1.0);

        const finalMultiplier = parseFloat((
          0.30 * occupancyRate +
          0.20 * seasonScore +
          0.15 * demandScore +
          0.10 * (1 - leadTimeDays / 90) +
          0.15 * dayOfWeekScore +
          0.10 * reviewScore
        ).toFixed(4));

        const suggestedPrice = Math.round(room.basePrice * (0.85 + finalMultiplier * 0.6) * 100) / 100;
        const actionType = pick(['suggested', 'auto', 'auto', 'manual', 'overridden', 'ignored']);
        const wasActioned = actionType !== 'suggested' && actionType !== 'ignored';

        priceHistoryDocs.push({
          hotelId: hotel._id,
          roomId: room._id,
          date: new Date(cursor),
          basePrice: room.basePrice,
          suggestedPrice,
          appliedPrice: wasActioned ? suggestedPrice + randFloat(-10, 10) : null,
          signals: {
            occupancyRate: parseFloat(occupancyRate.toFixed(4)),
            seasonScore: parseFloat(seasonScore.toFixed(4)),
            demandScore: parseFloat(demandScore.toFixed(4)),
            leadTimeDays,
            dayOfWeekScore: parseFloat(dayOfWeekScore.toFixed(4)),
            reviewScore: parseFloat(reviewScore.toFixed(4)),
            finalMultiplier,
          },
          action: actionType,
          actionBy: wasActioned ? pick([...staffUsers, ...owners])._id : null,
          actionAt: wasActioned ? new Date(cursor.getTime() + randInt(1, 6) * 60 * 60 * 1000) : null,
        });

        cursor = addDays(cursor, 7);
      }
    }
  }

  const priceHistories = await PriceHistory.insertMany(priceHistoryDocs);
  console.log(`    ✔ ${priceHistories.length} price history records\n`);

  // ════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ════════════════════════════════════════════════════════════════════════

  const duration = (Date.now() - startTime) / 1000;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉  SUPER SEEDER COMPLETE');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📊  Data Summary:`);
  console.log(`    Users:        ${owners.length + staffUsers.length + customers.length} (owners: ${owners.length}, staff: ${staffUsers.length}, customers: ${customers.length})`);
  console.log(`    Hotels:       ${hotels.length}`);
  console.log(`    Rooms:        ${rooms.length}`);
  console.log(`    Coupons:      ${coupons.length}`);
  console.log(`    Bookings:     ${bookings.length}`);
  console.log(`    Reviews:      ${reviews.length}`);
  console.log(`    Conversations:${conversations.length}`);
  console.log(`    Messages:     ${messages.length}`);
  console.log(`    PriceHistory: ${priceHistories.length}`);
  console.log(`⏱   Duration:    ${duration.toFixed(1)}s`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n🔑  TEST CREDENTIALS\n');
  SEED_DATA.OWNERS.forEach((o, i) => {
    console.log(`    Owner ${i + 1}:    ${o.email} / ${SEED_DATA.PASSWORDS.OWNERS[i]}`);
  });
  console.log(`    Manager:    ${SEED_DATA.STAFF[0].email} / ${SEED_DATA.PASSWORDS.STAFF}`);
  console.log(`    Reception:  ${SEED_DATA.STAFF[1].email} / ${SEED_DATA.PASSWORDS.STAFF}`);
  SEED_DATA.CUSTOMERS.slice(0, 3).forEach((c) => {
    console.log(`    Customer:   ${c.email} / ${SEED_DATA.PASSWORDS.CUSTOMER}`);
  });
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  return { owners, staffUsers, customers, hotels, rooms, bookings, reviews, conversations, messages, priceHistories };
}

// ─────────────────────────────────────────────────────────────────────────
// RUN
// ─────────────────────────────────────────────────────────────────────────

if (process.argv[1].endsWith('superSeeder.js')) {
  runSuperSeeder()
    .then(() => {
      console.log('✅  superSeeder finished successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌  superSeeder failed:', err.message);
      console.error(err.stack);
      process.exit(1);
    });
}

export { runSuperSeeder };