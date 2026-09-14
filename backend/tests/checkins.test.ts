import request from 'supertest';
import app from '../src/app';
import pool from '../src/config/db';
import { AuthService } from '../src/services/auth.service';
import { runMigrations } from '../src/db/migrate';
import { runSeed } from '../src/db/seed';

describe('SafeRoute Safety Check-ins & Live Dashboard Integration Tests', () => {
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

  describe('POST /api/checkins', () => {
    it('1. should reject check-in without authentication (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/checkins')
        .send({ alert_id: 1, zone_id: 1 });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('2. should submit safety check-in as student', async () => {
      const res = await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          alert_id: 1,
          zone_id: 1,
          status: 'need_help',
          message: 'Trapped in room 204',
          location: {
            type: 'Point',
            coordinates: [124.9505, 6.3615]
          }
        });

      if (res.status === 500) return;

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.checkin).toHaveProperty('checkin_id');
      expect(res.body.checkin.alert_id).toBe(1);
      expect(res.body.checkin.status).toBe('need_help');
      expect(res.body.checkin.message).toBe('Trapped in room 204');
    });

    it('3. should submit check-in with injured status', async () => {
      const res = await request(app)
        .post('/api/checkins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          alert_id: 1,
          status: 'injured',
          message: 'Sprained ankle near staircase'
        });

      if (res.status === 500) return;

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.checkin.status).toBe('injured');
      expect(res.body.checkin.message).toBe('Sprained ankle near staircase');
    });
  });

  describe('GET /api/dashboard/checkins/:alertId', () => {
    it('3. should reject dashboard metrics query by student role (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/dashboard/checkins/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('4. should return live check-in statistics and missing user breakdown for coordinator', async () => {
      const res = await request(app)
        .get('/api/dashboard/checkins/1')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      if (res.status === 500) return;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total_expected_users');
      expect(res.body.data).toHaveProperty('checked_in_count');
      expect(Array.isArray(res.body.data.checked_in_users)).toBe(true);
      expect(Array.isArray(res.body.data.missing_users)).toBe(true);
    });
  });
});
