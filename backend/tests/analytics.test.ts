import request from 'supertest';
import app from '../src/app';
import pool from '../src/config/db';
import { runMigrations } from '../src/db/migrate';
import { runSeed } from '../src/db/seed';

describe('SafeRoute Analytics API Integration Tests', () => {
  let adminToken: string;
  let studentToken: string;

  beforeAll(async () => {
    await runMigrations();
    await runSeed();

    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@saferoute.edu',
      password: 'AdminPassword123!',
    });
    adminToken = adminLogin.body.token;

    const studentLogin = await request(app).post('/api/auth/login').send({
      email: 'student@saferoute.edu',
      password: 'StudentPassword123!',
    });
    studentToken = studentLogin.body.token;
  }, 30000);

  afterAll(async () => {
    await pool.end();
  });

  describe('GET /api/dashboard/analytics', () => {
    it('1. should reject unauthenticated request (401 Unauthorized)', async () => {
      const res = await request(app).get('/api/dashboard/analytics');
      expect(res.status).toBe(401);
    });

    it('2. should reject student role access (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', `Bearer ${studentToken}`);
      expect(res.status).toBe(403);
    });

    it('3. should return analytics data for admin for 30d range', async () => {
      const res = await request(app)
        .get('/api/dashboard/analytics?range=30d')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('kpis');
      expect(res.body.data.kpis).toHaveProperty('total_alerts');
      expect(res.body.data.kpis).toHaveProperty('avg_response_time_minutes');
      expect(res.body.data.kpis).toHaveProperty('overall_completion_rate');
      expect(res.body.data.kpis).toHaveProperty('total_hazards');
      expect(Array.isArray(res.body.data.response_times)).toBe(true);
      expect(Array.isArray(res.body.data.status_breakdown)).toBe(true);
      expect(Array.isArray(res.body.data.role_rates)).toBe(true);
      expect(Array.isArray(res.body.data.alert_history)).toBe(true);
      expect(Array.isArray(res.body.data.hazard_frequency)).toBe(true);
    });

    it('4. should handle range=7d and range=all query parameters', async () => {
      const res7d = await request(app)
        .get('/api/dashboard/analytics?range=7d')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res7d.status).toBe(200);

      const resAll = await request(app)
        .get('/api/dashboard/analytics?range=all')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(resAll.status).toBe(200);
    });
  });
});
