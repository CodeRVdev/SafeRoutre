import { Router } from 'express';
import { ContactController } from '../controllers/contact.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// GET /api/emergency-contacts is accessible to all authenticated users
router.get('/', authenticateToken, ContactController.getContacts);

// Creating, updating, deleting emergency contacts is restricted to admin and coordinator roles
router.post('/', authenticateToken, requireRole('admin', 'coordinator'), ContactController.createContact);
router.put('/:id', authenticateToken, requireRole('admin', 'coordinator'), ContactController.updateContact);
router.delete('/:id', authenticateToken, requireRole('admin', 'coordinator'), ContactController.deleteContact);

export default router;
