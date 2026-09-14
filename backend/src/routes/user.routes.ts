import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Require JWT authentication for all user management routes
router.use(authenticateToken);

// GET /api/users/stats — User role breakdown count (admin, coordinator)
router.get('/stats', requireRole('admin', 'coordinator'), UserController.getUserStats);

// GET /api/users — List paginated users with search & role filter (admin, coordinator)
router.get('/', requireRole('admin', 'coordinator'), UserController.getUsers);

// GET /api/users/:id — Get user details and check-in history (admin, coordinator)
router.get('/:id', requireRole('admin', 'coordinator'), UserController.getUserById);

// PATCH /api/users/:id/role — Update user role (admin only)
router.patch('/:id/role', requireRole('admin'), UserController.updateUserRole);

// DELETE /api/users/:id — Soft-delete / deactivate user (admin only)
router.delete('/:id', requireRole('admin'), UserController.deactivateUser);

export default router;
