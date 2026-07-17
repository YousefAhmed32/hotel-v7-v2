import mongoose from 'mongoose';
const reviewSchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  rating: { type: Number, required: true, min: 1, max: 5 },
  categoryRatings: {
    cleanliness: { type: Number, min:1,max:5,default:null }, comfort: { type: Number, min:1,max:5,default:null },
    location: { type: Number, min:1,max:5,default:null }, service: { type: Number, min:1,max:5,default:null },
    value: { type: Number, min:1,max:5,default:null }, facilities: { type: Number, min:1,max:5,default:null },
  },
  title: { type: String, trim: true, maxlength: 120, default: '' },
  comment: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  hotelResponse: {
    text: { type: String, default: null }, respondedAt: { type: Date, default: null },
    respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  status: { type: String, enum: ['published','pending','rejected'], default: 'published', index: true },
  isVerified: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  helpfulVotes: { type: Number, default: 0 },
  helpfulVotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  stayMonth: { type: Number, default: null },
  stayYear: { type: Number, default: null },
  travelType: { type: String, enum: ['solo','couple','family','business','group',null], default: null },
  flaggedBy: [{ userId: mongoose.Schema.Types.ObjectId, reason: String, flaggedAt: { type: Date, default: Date.now }, _id: false }],
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (_, ret) => { delete ret.__v; delete ret.helpfulVotedBy; return ret; } },
});
reviewSchema.index({ hotelId: 1, status: 1, createdAt: -1 });
reviewSchema.index({ bookingId: 1 }, { unique: true });
export const Review = mongoose.model('Review', reviewSchema);
