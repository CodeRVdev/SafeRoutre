import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const router = Router();

// Public authentication routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected user profile route
router.get('/me', authenticateToken, AuthController.getMe);

// Register & Unregister FCM device token
router.post('/device-token', authenticateToken, AuthController.updateDeviceToken);
router.delete('/device-token', authenticateToken, AuthController.removeDeviceToken);

// Example protected route demonstrating role-check middleware
router.get(
  '/admin-only',
  authenticateToken,
  requireRole('admin', 'coordinator'),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: `Access granted to admin/coordinator endpoint for user_id=${req.user?.user_id} with role '${req.user?.role}'.`,
    });
  }
);

export default router;
