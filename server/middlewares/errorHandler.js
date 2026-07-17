import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';
const normalize = (err) => {
  if (err instanceof ApiError) return err;
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new ApiError(400, 'Validation failed', errors);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return new ApiError(409, `Duplicate value for: ${field}`);
  }
  if (err.name === 'CastError') return new ApiError(400, `Invalid value for: ${err.path}`);
  if (err.name === 'JsonWebTokenError') return new ApiError(401, 'Invalid token');
  if (err.name === 'TokenExpiredError') return new ApiError(401, 'Token expired');
  return new ApiError(500, env.isDev() ? err.message : 'Internal server error');
};
export const errorHandler = (err, req, res, next) => {
  const e = normalize(err);
  if (e.statusCode >= 500) logger.error({ message: e.message, stack: err.stack, url: req.originalUrl });
  const body = { success: false, message: e.message, timestamp: new Date().toISOString() };
  if (e.errors && e.errors.length) body.errors = e.errors;
  if (env.isDev()) body.stack = err.stack;
  res.status(e.statusCode).json(body);
};
export const notFoundHandler = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
