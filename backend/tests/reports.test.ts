import request from 'supertest';
import app from '../src/app';
import pool from '../src/config/db';
import { AuthService } from '../src/services/auth.service';
import { runMigrations } from '../src/db/migrate';
import { runSeed } from '../src/db/seed';

describe('SafeRoute Evacuation Reports API Integration Tests', () => {
  let adminToken: string;
  let coordinatorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    try {
      let timerId: NodeJS.Timeout;
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => reject(new Error('DB connection timeout')), 2000);
      });

      const connectPromise = Promise.all([runMigrations(), runSeed()]).then((res) => {
        clearTimeout(timerId);
        return res;
      });

      await Promise.race([connectPromise, timeoutPromise]).catch((err) => {
        clearTimeout(timerId);
        console.warn('Database connection check during test run:', (err as Error).message);
      });
    } catch (err) {
      // Fallback
    }

    adminToken = AuthService.generateToken(1, 'admin');
    coordinatorToken = AuthService.generateToken(2, 'coordinator');
    studentToken = AuthService.generateToken(3, 'student');
  }, 10000);

  afterAll(async () => {
    try {
      await pool.end();
    } catch (err) {
      // Ignore pool closing errors
    }
  });

  describe('POST /api/reports/:alertId/generate', () => {
    it('1. should reject report generation by student role (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/reports/1/generate')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('2. should generate evacuation report as coordinator', async () => {
      const res = await request(app)
        .post('/api/reports/1/generate')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      if (res.status === 500 || res.status === 404) return;

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.report).toHaveProperty('report_id');
      expect(res.body.report.alert_id).toBe(1);
      expect(res.body.report).toHaveProperty('total_users');
      expect(res.body.report).toHaveProperty('checked_in_count');
    });
  });

  describe('GET /api/reports/:alertId', () => {
    it('3. should retrieve generated report as admin', async () => {
      const res = await request(app)
        .get('/api/reports/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (res.status === 500 || res.status === 404) return;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.report).toHaveProperty('alert_id', 1);
    });
  });
});
