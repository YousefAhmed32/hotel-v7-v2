import { Router } from 'express';
import * as hk from '../controllers/housekeepingController.js';
import { authenticate, authorize } from '../middlewares/authenticate.js';
import { resolveHotel, enforceTenantAccess } from '../middlewares/tenantScope.js';

const router = Router({ mergeParams: true });
router.use(authenticate, resolveHotel, enforceTenantAccess);

router.get('/', hk.getRoomStatuses);
router.get('/stats', hk.getHousekeepingStats);
router.patch('/rooms/:roomId/status', authorize('owner','manager','receptionist','superadmin'), hk.updateRoomStatus);

export default router;
