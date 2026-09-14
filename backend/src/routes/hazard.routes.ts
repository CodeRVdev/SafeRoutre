import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { HazardController } from '../controllers/hazard.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';

const uploadsDir = path.join(__dirname, '../../uploads/hazards');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `hazard-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPG, PNG, and WEBP image formats are allowed.'));
    }
  },
});

const router = Router();

// All hazard endpoints require user authentication
router.use(authenticateToken);

// GET /api/hazards/active is accessible to ALL authenticated users (students, staff, faculty, admin, coordinator)
router.get('/active', HazardController.getActiveHazards);

// Creating & resolving hazards is restricted to admin and coordinator roles
router.post('/', requireRole('admin', 'coordinator'), upload.single('photo'), HazardController.createHazard);
router.patch('/:id/resolve', requireRole('admin', 'coordinator'), HazardController.resolveHazard);

export default router;
