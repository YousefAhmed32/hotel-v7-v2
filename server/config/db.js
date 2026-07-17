import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';
let isConnected = false;
export const connectDB = async () => {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(env.MONGO_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    logger.info('MongoDB connected: ' + conn.connection.host);
    mongoose.connection.on('disconnected', () => { isConnected = false; logger.warn('MongoDB disconnected'); });
    mongoose.connection.on('error', (err) => logger.error('MongoDB error: ' + err.message));
  } catch (error) {
    logger.error('MongoDB connection failed: ' + error.message);
    process.exit(1);
  }
};
export const disconnectDB = async () => {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
};