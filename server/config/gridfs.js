import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { logger } from '../utils/logger.js';
let bucket = null;
export const getGridFSBucket = () => {
  if (bucket) return bucket;
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB not connected');
  bucket = new GridFSBucket(db, { bucketName: 'media' });
  return bucket;
};
export const initGridFS = () => {
  mongoose.connection.once('open', () => {
    bucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'media' });
    logger.info('GridFS initialized');
  });
};