import { Router } from 'express';
import { SosController } from '../controllers/sos.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// POST /api/sos — Send SOS message (any authenticated student, faculty, staff, coordinator, admin)
router.post('/', authenticateToken, SosController.sendSos);

// GET /api/sos?alertId= — Get all SOS messages for an alert (coordinators & admins only)
router.get('/', authenticateToken, requireRole('admin', 'coordinator'), SosController.getSosForAlert);

// POST /api/sos/:id/reply — Coordinator replies to user's SOS message (coordinators & admins only)
router.post('/:id/reply', authenticateToken, requireRole('admin', 'coordinator'), SosController.replySos);

// PATCH /api/sos/:id/read — Mark SOS message as read (coordinators & admins only)
router.patch('/:id/read', authenticateToken, requireRole('admin', 'coordinator'), SosController.markRead);

export default router;
