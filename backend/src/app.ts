import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import authRoutes from './routes/auth.routes';
import zoneRoutes from './routes/zone.routes';
import hazardRoutes from './routes/hazard.routes';
import alertRoutes from './routes/alert.routes';
import checkinRoutes from './routes/checkin.routes';
import dashboardRoutes from './routes/dashboard.routes';
import reportRoutes from './routes/report.routes';
import userRoutes from './routes/user.routes';
import analyticsRoutes from './routes/analytics.routes';
import routingRoutes from './routes/routing.routes';
import activityLogRoutes from './routes/activitylog.routes';
import sosRoutes from './routes/sos.routes';
import contactRoutes from './routes/contact.routes';
import drillRoutes from './routes/drill.routes';

const app = express();

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded hazard images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'SafeRoute Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use('/api/auth', authRoutes);
app.use('/api/zones', zoneRoutes);
app.use('/api/hazards', hazardRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/checkins', checkinRoutes);
app.use('/api/routing', routingRoutes);
app.use('/api/dashboard/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/sos', sosRoutes);
app.use('/api/emergency-contacts', contactRoutes);
app.use('/api/drills', drillRoutes);

// 404 Not Found Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Application Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
