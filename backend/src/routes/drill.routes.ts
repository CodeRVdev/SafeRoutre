import { Router } from 'express';
import { DrillController } from '../controllers/drill.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET /api/drills/upcoming is accessible to all authenticated users
router.get('/upcoming', authenticateToken, DrillController.getUpcomingDrills);
router.get('/', authenticateToken, DrillController.getDrills);
router.get('/:id', authenticateToken, DrillController.getDrillById);

// Drill management operations (admin & coordinator only)
router.post('/', authenticateToken, requireRole('admin', 'coordinator'), DrillController.createDrill);
router.patch('/:id', authenticateToken, requireRole('admin', 'coordinator'), DrillController.updateDrill);
router.delete('/:id', authenticateToken, requireRole('admin', 'coordinator'), DrillController.deleteDrill);

// Drill Execution Triggers
router.post('/:id/start', authenticateToken, requireRole('admin', 'coordinator'), DrillController.startDrill);
router.post('/:id/complete', authenticateToken, requireRole('admin', 'coordinator'), DrillController.completeDrill);

export default router;
