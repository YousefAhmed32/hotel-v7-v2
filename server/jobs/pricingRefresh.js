import cron from 'node-cron';
import { Room } from '../models/Room.js';
import { Hotel } from '../models/Hotel.js';
import { PriceHistory } from '../models/PriceHistory.js';
import { computeSuggestedPrice } from '../services/pricingService.js';
import { logger } from '../utils/logger.js';
export const startPricingRefreshJob = () => {
  cron.schedule('0 2 * * *', async () => {
    logger.info('Pricing refresh job started');
    const startedAt = Date.now();
    try {
      const hotels = await Hotel.find({ isActive: true }).select('_id name').lean();
      let totalProcessed = 0; let totalFailed = 0;
      for (const hotel of hotels) {
        const rooms = await Room.find({ hotelId: hotel._id, isActive: true }).select('_id name basePrice').lean();
        for (const room of rooms) {
          try {
            const suggestion = await computeSuggestedPrice(hotel._id.toString(), room._id.toString(), new Date());
            await Room.findByIdAndUpdate(room._id, { aiSuggestedPrice: suggestion.suggestedPrice, aiPriceUpdatedAt: new Date() });
            await PriceHistory.create({ hotelId: hotel._id, roomId: room._id, date: new Date(), basePrice: room.basePrice, suggestedPrice: suggestion.suggestedPrice, appliedPrice: null, signals: suggestion.signals, action: 'suggested' });
            totalProcessed++;
          } catch (roomErr) { logger.error('Pricing refresh failed for room ' + room._id + ': ' + roomErr.message); totalFailed++; }
        }
      }
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      logger.info('Pricing refresh complete: ' + totalProcessed + ' rooms updated, ' + totalFailed + ' failed | ' + elapsed + 's');
    } catch (err) { logger.error('Pricing refresh job error: ' + err.message); }
  });
  logger.info('Pricing refresh job started (runs nightly at 02:00)');
};
