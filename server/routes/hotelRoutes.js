import { Router } from 'express';
import * as hotelController from '../controllers/hotelController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { resolveHotel, enforceTenantAccess } from '../middlewares/tenantScope.js';

const router = Router();

// Public
router.get('/',             hotelController.getAllHotels);
router.get('/slug/:slug',   hotelController.getHotelBySlug);
router.get('/:hotelId',     hotelController.getHotelById);

// Owner creates a new hotel (no hotelId yet — token gets reissued)
router.post('/', authenticate, hotelController.createHotel);

// Admin — all hotels (superadmin only)
router.get('/admin/all', authenticate, authorize('superadmin'), hotelController.getAdminAllHotels);

// Hotel-scoped
router.patch('/:hotelId',        authenticate, resolveHotel, enforceTenantAccess, authorize('owner','manager','superadmin'), hotelController.updateHotel);
router.get('/:hotelId/stats',    authenticate, resolveHotel, enforceTenantAccess, authorize('owner','manager','superadmin'), hotelController.getHotelStats);
router.get('/:hotelId/dashboard', authenticate, resolveHotel, enforceTenantAccess, authorize('owner','manager','receptionist','superadmin'), hotelController.getHotelDashboard);
router.patch('/:hotelId/toggle', authenticate, authorize('superadmin'), hotelController.toggleHotelStatus);

export default router;
