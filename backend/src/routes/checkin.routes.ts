import { Router } from 'express';
import { CheckinController } from '../controllers/checkin.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Safety check-in endpoint accessible to ALL authenticated users
router.use(authenticateToken);
router.get('/my', CheckinController.getMyCheckins);
router.post('/', CheckinController.createCheckin);

export default router;
