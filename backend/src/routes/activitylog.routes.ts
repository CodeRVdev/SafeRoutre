import { Router } from 'express';
import { ActivityLogController } from '../controllers/activitylog.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET /api/activity-logs (Admin & Coordinator only)
router.get(
  '/',
  authenticateToken,
  requireRole('admin', 'coordinator'),
  ActivityLogController.getActivityLogs
);

export default router;
