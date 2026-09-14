import { Router } from 'express';
import { ZoneController } from '../controllers/zone.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All zone operations require admin or coordinator authorization
router.use(authenticateToken);
router.use(requireRole('admin', 'coordinator'));

router.get('/', ZoneController.getZones);
router.post('/', ZoneController.createZone);
router.patch('/:id', ZoneController.updateZone);
router.delete('/:id', ZoneController.deleteZone);

export default router;
