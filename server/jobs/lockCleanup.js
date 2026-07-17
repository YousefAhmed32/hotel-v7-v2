import cron from 'node-cron';
import { Booking } from '../models/Booking.js';
import { logger } from '../utils/logger.js';
export const startLockCleanupJob = () => {
  cron.schedule('*/2 * * * *', async () => {
    try {
      const result = await Booking.updateMany(
        { status: 'locked', lockExpiresAt: { $lt: new Date() } },
        { $set: { status: 'cancelled', cancelledAt: new Date(), cancelledBy: 'system', cancellationReason: 'Lock expired', lockToken: null, lockExpiresAt: null } }
      );
      if (result.modifiedCount > 0) logger.info('Lock cleanup: cancelled ' + result.modifiedCount + ' expired lock(s)');
    } catch (err) { logger.error('Lock cleanup job failed: ' + err.message); }
  });
  logger.info('Lock cleanup job started (runs every 2 minutes)');
};
