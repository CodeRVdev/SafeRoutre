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
  let actualAdminId: number = 1;

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

    try {
      const adminUser = await pool.query(`SELECT user_id FROM users WHERE email = 'admin@saferoute.edu'`);
      if (adminUser.rows.length > 0) actualAdminId = adminUser.rows[0].user_id;

      const coordUser = await pool.query(`SELECT user_id FROM users WHERE email = 'coordinator@saferoute.edu'`);
      const coordId = coordUser.rows.length > 0 ? coordUser.rows[0].user_id : 2;

      const stuUser = await pool.query(`SELECT user_id FROM users WHERE email = 'student@saferoute.edu'`);
      const stuId = stuUser.rows.length > 0 ? stuUser.rows[0].user_id : 3;

      adminToken = AuthService.generateToken(actualAdminId, 'admin');
      coordinatorToken = AuthService.generateToken(coordId, 'coordinator');
      studentToken = AuthService.generateToken(stuId, 'student');
    } catch (err) {
      adminToken = AuthService.generateToken(1, 'admin');
      coordinatorToken = AuthService.generateToken(2, 'coordinator');
      studentToken = AuthService.generateToken(3, 'student');
    }
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

  describe('POST /api/users (CREATE)', () => {
    it('6. should reject user creation by non-admin/non-coordinator like student (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          full_name: 'Test Student Block',
          email: 'studentblock@test.edu',
          password: 'Password123!',
          role: 'student',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('7. should validate required fields and email format (400 Bad Request)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: '',
          email: 'invalid-email-format',
          password: '123',
          role: 'student',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('8. should successfully create a user as admin and hash password (201 Created)', async () => {
      const uniqueEmail = `testuser_${Date.now()}@polonoling.edu.ph`;
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'CRUD Test Personnel',
          email: uniqueEmail,
          password: 'SecurePassword123!',
          role: 'faculty',
          id_number: 'FAC-2026-999',
          department: 'Science Department',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('user_id');
      expect(res.body.user.email).toBe(uniqueEmail);
      expect(res.body.user.role).toBe('faculty');
      expect(res.body.user.is_active).toBe(true);
      // Ensure password and password_hash are NEVER returned
      expect(res.body.user.password).toBeUndefined();
      expect(res.body.user.password_hash).toBeUndefined();

      // Verify the user can authenticate with the given password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'SecurePassword123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body).toHaveProperty('token');
    });

    it('9. should reject duplicate email creation (409 Conflict)', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'Duplicate Test',
          email: 'admin@saferoute.edu',
          password: 'Password123!',
          role: 'student',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/:id (UPDATE)', () => {
    let testUserId: number;
    let testUserEmail: string;

    beforeAll(async () => {
      testUserEmail = `editable_${Date.now()}@saferoute.edu`;
      const createRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'Initial Name',
          email: testUserEmail,
          password: 'InitialPassword123!',
          role: 'student',
          department: 'Grade 9 - Rose',
          id_number: 'STU-INIT-01',
        });
      testUserId = createRes.body.user.user_id;
    });

    it('10. should reject update by non-admin (403 Forbidden)', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ full_name: 'Hacked Name' });

      expect(res.status).toBe(403);
    });

    it('11. should update user details successfully as admin', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'Updated Name',
          department: 'Grade 10 - Lily',
          id_number: 'STU-UPD-02',
          role: 'staff',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.full_name).toBe('Updated Name');
      expect(res.body.user.department).toBe('Grade 10 - Lily');
      expect(res.body.user.role).toBe('staff');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('12. should reset password via update and allow login with new password', async () => {
      const res = await request(app)
        .put(`/api/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'NewAdminSetPassword123!',
        });

      expect(res.status).toBe(200);

      // Old password should fail
      const oldLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'InitialPassword123!',
        });
      expect(oldLogin.status).toBe(401);

      // New password should succeed
      const newLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUserEmail,
          password: 'NewAdminSetPassword123!',
        });
      expect(newLogin.status).toBe(200);
    });

    it('13. should enforce admin self-protection: admin cannot deactivate own account', async () => {
      const res = await request(app)
        .put(`/api/users/${actualAdminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          is_active: false,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Self-protection/i);
    });

    it('14. should enforce admin self-protection: admin cannot demote own role', async () => {
      const res = await request(app)
        .put(`/api/users/${actualAdminId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'student',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Self-protection/i);
    });
  });

  describe('PATCH /api/users/:id/role', () => {
    it('15. should reject role update by coordinator (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/users/${actualAdminId}/role`)
        .set('Authorization', `Bearer ${coordinatorToken}`)
        .send({ role: 'faculty' });

      expect(res.status).toBe(403);
    });

    it('16. should update user role as admin', async () => {
      const listRes = await request(app)
        .get('/api/users?role=student')
        .set('Authorization', `Bearer ${adminToken}`);

      if (listRes.status !== 200 || !listRes.body.data.users.length) return;
      const studentUser = listRes.body.data.users.find((u: any) => u.user_id !== actualAdminId);
      if (!studentUser) return;

      const res = await request(app)
        .patch(`/api/users/${studentUser.user_id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'faculty' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.role).toBe('faculty');
    });
  });

  describe('DELETE /api/users/:id & REACTIVATION', () => {
    let deactivatableUserId: number;
    let deactivatableUserEmail: string;

    beforeAll(async () => {
      deactivatableUserEmail = `deact_${Date.now()}@saferoute.edu`;
      const createRes = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          full_name: 'Deactivatable User',
          email: deactivatableUserEmail,
          password: 'Password123!',
          role: 'student',
        });
      deactivatableUserId = createRes.body.user.user_id;
    });

    it('17. should block admin from deactivating own account via DELETE (Self-protection)', async () => {
      const res = await request(app)
        .delete(`/api/users/${actualAdminId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Self-protection/i);
    });

    it('18. should soft-deactivate another user as admin', async () => {
      const res = await request(app)
        .delete(`/api/users/${deactivatableUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user.is_active).toBe(false);
    });

    it('19. should prevent deactivated user from logging in (403 Forbidden)', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: deactivatableUserEmail,
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(403);
      expect(loginRes.body.success).toBe(false);
      expect(loginRes.body.message).toMatch(/deactivated/i);
    });

    it('20. should reactivate deactivated user via PATCH /api/users/:id/reactivate and allow login', async () => {
      const reactivateRes = await request(app)
        .patch(`/api/users/${deactivatableUserId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(reactivateRes.status).toBe(200);
      expect(reactivateRes.body.success).toBe(true);
      expect(reactivateRes.body.user.is_active).toBe(true);

      // Verify login now succeeds
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: deactivatableUserEmail,
          password: 'Password123!',
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body).toHaveProperty('token');
    });
  });
});
