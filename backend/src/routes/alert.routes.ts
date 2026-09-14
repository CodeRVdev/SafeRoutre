import { Router } from 'express';
import { AlertController } from '../controllers/alert.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

// GET /api/alerts/active is accessible to ALL authenticated users
router.get('/active', AlertController.getActiveAlerts);

// Emergency alert creation and deactivation are restricted to admin and coordinator
router.post('/', requireRole('admin', 'coordinator'), AlertController.createAlert);
router.patch('/:id/deactivate', requireRole('admin', 'coordinator'), AlertController.deactivateAlert);

export default router;
