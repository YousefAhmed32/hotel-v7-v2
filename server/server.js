import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { initGridFS } from './config/gridfs.js';
import { logger } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler.js';
import { authenticate } from './middlewares/authenticate.js';
import { resolveHotel, enforceTenantAccess } from './middlewares/tenantScope.js';
import { startLockCleanupJob } from './jobs/lockCleanup.js';
import { startPricingRefreshJob } from './jobs/pricingRefresh.js';
import { initializeSocket } from './config/socket.js';
import authRoutes from './routes/authRoutes.js';
import hotelRoutes from './routes/hotelRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import rbacRoutes from './routes/rbacRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import pricingRoutes from './routes/pricingRoutes.js';
import mediaRoutes from './routes/mediaRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import housekeepingRoutes from './routes/housekeepingRoutes.js';
import roomRequestRoutes from './routes/roomRequestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { downloadInvoice } from './controllers/invoiceController.js';

const app = express();
const server = http.createServer(app);
const io = initializeSocket(server);
app.set('io', io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: env.CLIENT_URL, credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','Authorization','Range'] }));

// const limiter = rateLimit({ windowMs: env.RATE_LIMIT_WINDOW_MS, max: env.RATE_LIMIT_MAX, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests' }, skip: (req) => req.path.startsWith('/api/v1/media/') });
// app.use(env.API_PREFIX, limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(hpp());
app.use(compression());

if (env.isDev()) app.use(morgan('dev'));
else app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.get('/health', (req, res) => res.status(200).json({ success: true, status: 'ok', environment: env.NODE_ENV, uptime: Math.floor(process.uptime()), timestamp: new Date().toISOString() }));

app.get(env.API_PREFIX, (req, res) => res.status(200).json({ success: true, message: 'Hotel SaaS API v1', version: '1.0.0' }));

app.use(env.API_PREFIX + '/auth', authRoutes);
app.use(env.API_PREFIX + '/hotels', hotelRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/rooms', roomRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/bookings', bookingRoutes);
app.use(env.API_PREFIX + '/bookings', bookingRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/staff', rbacRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/reviews', reviewRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/coupons', couponRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/chat', chatRoutes);
app.use(env.API_PREFIX + '/chat', chatRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/pricing', pricingRoutes);
app.use(env.API_PREFIX + '/media', mediaRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/payments', paymentRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/housekeeping', housekeepingRoutes);
app.use(env.API_PREFIX + '/requests', roomRequestRoutes);
app.use(env.API_PREFIX + '/hotels/:hotelId/requests', roomRequestRoutes);
app.use(env.API_PREFIX + '/notifications', notificationRoutes);
app.get(env.API_PREFIX + '/hotels/:hotelId/bookings/:bookingId/invoice', authenticate, resolveHotel, enforceTenantAccess, downloadInvoice);

app.use(notFoundHandler);
app.use(errorHandler);

const shutdown = async (signal) => {
  logger.info(signal + ' received - shutting down');
  server.close(async () => {
    const { disconnectDB } = await import('./config/db.js');
    await disconnectDB();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (r) => { logger.error('Unhandled Rejection: ' + r); shutdown('unhandledRejection'); });
process.on('uncaughtException', (e) => { logger.error('Uncaught Exception: ' + e.message); shutdown('uncaughtException'); });

const start = async () => {
  await connectDB();
  initGridFS();
  startLockCleanupJob();
  startPricingRefreshJob();
  server.listen(env.PORT, () => {
    logger.info('Server on port ' + env.PORT + ' [' + env.NODE_ENV + ']');
    logger.info('API: http://localhost:' + env.PORT + env.API_PREFIX);
    logger.info('Socket: ws://localhost:' + env.PORT);
  });
};

start();
export { app, server, io };

// ── New routes (appended) ─────────────────────────────────────────
