import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Live dashboard endpoint is restricted to admin and coordinator roles
router.use(authenticateToken);
router.use(requireRole('admin', 'coordinator'));

router.get('/checkins/:alertId', DashboardController.getCheckinsByAlert);
router.get('/capacity/:alertId', DashboardController.getCapacityByAlert);

export default router;
