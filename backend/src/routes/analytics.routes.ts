import { Router } from 'express';
import { getAnalytics } from '../controllers/analytics.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET /api/dashboard/analytics
router.get('/', authenticateToken, requireRole('admin', 'coordinator'), getAnalytics);

export default router;
