import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Evacuation report generation & lookup endpoints are restricted to admin and coordinator roles
router.use(authenticateToken);
router.use(requireRole('admin', 'coordinator'));

router.post('/:alertId/generate', ReportController.generateReport);
router.get('/:alertId', ReportController.getReport);

export default router;
