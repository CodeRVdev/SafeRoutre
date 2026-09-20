import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import pool from './config/db';
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
const isProduction = process.env.NODE_ENV === 'production';

// Dynamic CORS configuration supporting environment-defined origins
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (mobile native apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // In development mode, allow all origins
    if (!isProduction) return callback(null, true);

    // In production, match configured origins
    if (allowedOrigins.length === 0 || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Security and utility middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded hazard images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check Endpoint (Operational status + safe database connectivity verification)
app.get('/health', async (req: Request, res: Response) => {
  let dbStatus = 'connected';
  try {
    await pool.query('SELECT 1');
  } catch {
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'connected';
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    service: 'SafeRoute Backend API',
    database: dbStatus,
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
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
  const status = err.status || 500;
  const message =
    isProduction && status === 500
      ? 'Internal Server Error'
      : err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message,
  });
});

export default app;
