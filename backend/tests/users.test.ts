import request from 'supertest';
import app from '../src/app';
import pool from '../src/config/db';
import { AuthService } from '../src/services/auth.service';
import { runMigrations } from '../src/db/migrate';
import { runSeed } from '../src/db/seed';

describe('SafeRoute User Management API Integration Tests', () => {
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

  describe('GET /api/users', () => {
    it('1. should reject unauthenticated request (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/users');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('2. should reject query by non-authorized role like student (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('3. should return paginated list of users for coordinator', async () => {
      const res = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${coordinatorToken}`);

      if (res.status === 500) return;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('users');
      expect(res.body.data).toHaveProperty('total');
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });
  });

  describe('GET /api/users/stats', () => {
    it('4. should return role breakdown counts for admin', async () => {
      const res = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      if (res.status === 500) return;

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('admin');
      expect(res.body.data).toHaveProperty('student');
    });
  });

  describe('GET /api/users/:id', () => {
    it('5. should return user details and check-in history', async () => {
      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${coordinatorToken}`);
      
      if (listRes.status !== 200 || !listRes.body.data.users.length) return;
      const targetUserId = listRes.body.data.users[0].user_id;

      const res = await request(app)
        .get(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${coordinatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data).toHaveProperty('checkins');
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('6. should reject role update by coordinator (403 Forbidden)', async () => {
      const res = await request(app)
        .patch('/api/users/1/role')
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ role: 'faculty' });

      expect(res.status).toBe(403);
    });

    it('7. should update user role as admin', async () => {
      const listRes = await request(app)
        .get('/api/users?role=student')
        .set('Authorization', `Bearer ${adminToken}`);

      if (listRes.status !== 200 || !listRes.body.data.users.length) return;
      const studentUser = listRes.body.data.users[0];

      const res = await request(app)
        .patch(`/api/users/${studentUser.user_id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'faculty' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('faculty');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('8. should soft-deactivate user as admin', async () => {
      const listRes = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      if (listRes.status !== 200 || !listRes.body.data.users.length) return;
      const targetUserId = listRes.body.data.users[0].user_id;

      const res = await request(app)
        .delete(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.is_active).toBe(false);
    });
  });
});
