import { Router } from 'express';
import * as ctrl from '../controllers/roomRequestController.js';
import { authenticate, authorize, requirePermission } from '../middlewares/authenticate.js';
import { resolveHotel, enforceTenantAccess } from '../middlewares/tenantScope.js';

const router = Router({ mergeParams: true });
router.use(authenticate);

// Customer endpoints
router.post('/my', ctrl.createRequest);
router.get('/my', ctrl.getMyRequests);

// Staff endpoints
router.get('/', resolveHotel, enforceTenantAccess, requirePermission('housekeeping:view'), ctrl.getHotelRequests);
router.patch('/:requestId', resolveHotel, enforceTenantAccess, requirePermission('housekeeping:update'), ctrl.updateRequest);

export default router;
