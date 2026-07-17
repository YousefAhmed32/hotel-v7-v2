import winston from 'winston';
import { env } from '../config/env.js';
const { combine, timestamp, printf, colorize, errors } = winston.format;
const devFmt = combine(colorize({ all: true }), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }),
  printf(({ timestamp, level, message, stack }) => stack ? `[${timestamp}] ${level}: ${message}\n${stack}` : `[${timestamp}] ${level}: ${message}`));
const prodFmt = combine(timestamp(), errors({ stack: true }), winston.format.json());
export const logger = winston.createLogger({
  level: env.isDev() ? 'debug' : 'info',
  format: env.isDev() ? devFmt : prodFmt,
  transports: [new winston.transports.Console()],
});