import { Router } from 'express';
import * as bookingController from '../controllers/bookingController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { resolveHotel, enforceTenantAccess } from '../middlewares/tenantScope.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

// Customer
router.get('/my', bookingController.getMyBookings);
router.post('/lock', resolveHotel, bookingController.lockBooking);
router.post('/:bookingId/confirm', resolveHotel, bookingController.confirmBooking);
router.post('/:bookingId/cancel', resolveHotel, bookingController.cancelBooking);
router.get('/calendar/:roomId', resolveHotel, bookingController.getAvailabilityCalendar);
router.get('/:bookingId', resolveHotel, bookingController.getBookingById);

// Staff
router.get('/', resolveHotel, enforceTenantAccess, authorize('owner','manager','receptionist','superadmin'), bookingController.getHotelBookings);
router.get('/stats', resolveHotel, enforceTenantAccess, authorize('owner','manager','superadmin'), bookingController.getBookingStats);
router.post('/reception', resolveHotel, enforceTenantAccess, authorize('owner','manager','receptionist','superadmin'), bookingController.createReceptionBooking);
router.patch('/:bookingId/approve', resolveHotel, enforceTenantAccess, authorize('owner','manager','superadmin','receptionist'), bookingController.approveBooking);
router.patch('/:bookingId/reject', resolveHotel, enforceTenantAccess, authorize('owner','manager','superadmin','receptionist'), bookingController.rejectBooking);
router.patch('/:bookingId/checkin', resolveHotel, enforceTenantAccess, authorize('owner','manager','receptionist','superadmin'), bookingController.checkIn);
router.patch('/:bookingId/checkout', resolveHotel, enforceTenantAccess, authorize('owner','manager','receptionist','superadmin'), bookingController.checkOut);
router.patch('/:bookingId/status', resolveHotel, enforceTenantAccess, authorize('owner','manager','receptionist','superadmin'), bookingController.updateBookingStatus);

export default router;
