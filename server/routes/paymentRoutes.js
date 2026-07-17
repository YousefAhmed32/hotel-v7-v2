import { Router } from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { resolveHotel, enforceTenantAccess } from '../middlewares/tenantScope.js';

const router = Router({ mergeParams: true });
router.use(authenticate, resolveHotel, enforceTenantAccess);

router.get('/revenue', authorize('owner','manager','superadmin'), paymentController.getRevenueStats);
router.post('/', authorize('owner','manager','receptionist','superadmin'), paymentController.createPayment);
router.get('/booking/:bookingId', authorize('owner','manager','receptionist','superadmin'), paymentController.getBookingPayments);
router.get('/invoice/:bookingId', authorize('owner','manager','receptionist','superadmin'), paymentController.getInvoice);
router.patch('/:paymentId/cash-paid', authorize('owner','manager','receptionist','superadmin'), paymentController.markCashPaid);
router.patch('/:paymentId/refund', authorize('owner','manager','superadmin'), paymentController.refundPayment);

export default router;
