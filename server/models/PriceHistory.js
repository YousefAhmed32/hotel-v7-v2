import mongoose from 'mongoose';
const priceHistorySchema = new mongoose.Schema({
  hotelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hotel', required: true, index: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  date: { type: Date, required: true },
  basePrice: { type: Number, required: true },
  suggestedPrice: { type: Number, required: true },
  appliedPrice: { type: Number, default: null },
  signals: {
    occupancyRate: { type: Number, default: 0 }, seasonScore: { type: Number, default: 0 },
    demandScore: { type: Number, default: 0 }, leadTimeDays: { type: Number, default: 0 },
    dayOfWeekScore: { type: Number, default: 0 }, reviewScore: { type: Number, default: 0 },
    finalMultiplier: { type: Number, default: 1 },
  },
  action: { type: String, enum: ['suggested','auto','manual','overridden','ignored'], default: 'suggested' },
  actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  actionAt: { type: Date, default: null },
}, { timestamps: true });
priceHistorySchema.index({ hotelId: 1, roomId: 1, date: -1 });
export const PriceHistory = mongoose.model('PriceHistory', priceHistorySchema);
