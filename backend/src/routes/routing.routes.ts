import { Router } from 'express';
import { RoutingController } from '../controllers/routing.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// GET /api/routing/safe-path?fromLat=&fromLng=&toLat=&toLng=
router.get('/safe-path', authenticateToken, RoutingController.getSafePath);

export default router;
