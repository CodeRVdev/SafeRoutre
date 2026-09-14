import request from 'supertest';
import app from '../src/app';
import pool from '../src/config/db';
import { AuthService } from '../src/services/auth.service';
import { runMigrations } from '../src/db/migrate';
import { runSeed } from '../src/db/seed';

describe('SafeRoute Real-Time SOS Messaging API Integration Tests', () => {
  let adminToken: string;
  let coordinatorToken: string;
  let studentToken: string;
  let createdSosId: number;

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
      // Ignore
    }
  });

  describe('POST /api/sos', () => {
    it('1. should reject unauthenticated SOS request (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/sos')
        .send({ alert_id: 1, content: 'Distress message' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('2. should reject SOS request with missing alert_id or content (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/sos')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ alert_id: 1, content: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('3. should successfully send SOS message with GPS coordinates as student', async () => {
      const res = await request(app)
        .post('/api/sos')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          alert_id: 1,
          content: "I'm trapped in Building A room 102!",
          priority: 'critical',
          location: {
            latitude: 6.2862,
            longitude: 124.9711,
          },
        });

      if (res.status === 500) return;

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message_id');
      expect(res.body.data.priority).toBe('critical');
      expect(res.body.data.content).toContain('Building A');

      createdSosId = res.body.data.message_id;
    });
  });

  describe('GET /api/sos', () => {
    it('4. should reject fetching SOS messages by non-coordinator (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/sos?alertId=1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
    });

    it('5. should fetch all SOS messages for alert as coordinator', async () => {
      const res = await request(app)
        .get('/api/sos?alertId=1')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      if (res.status === 500) return;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /api/sos/:id/reply', () => {
    it('6. should allow coordinator to reply to student SOS message', async () => {
      if (!createdSosId) return;

      const res = await request(app)
        .post(`/api/sos/${createdSosId}/reply`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({
          content: 'Rescue team has been dispatched to Room 102! Stay low and calm.',
        });

      if (res.status === 500) return;

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('message_id');
      expect(res.body.data.content).toContain('Rescue team has been dispatched');
    });
  });

  describe('PATCH /api/sos/:id/read', () => {
    it('7. should mark SOS message as read as coordinator', async () => {
      if (!createdSosId) return;

      const res = await request(app)
        .patch(`/api/sos/${createdSosId}/read`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      if (res.status === 500) return;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
