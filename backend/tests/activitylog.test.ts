import request from 'supertest';
import app from '../src/app';
import pool from '../src/config/db';
import { runMigrations } from '../src/db/migrate';
import { runSeed } from '../src/db/seed';

let authToken: string;

describe('Activity Log API Integration Tests', () => {
  beforeAll(async () => {
    await runMigrations();
    await runSeed();

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'admin@saferoute.edu',
      password: 'AdminPassword123!',
    });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/activity-logs — Retrieves audit logs list with pagination', async () => {
    // 1. Broadcast an alert to generate an activity log
    await request(app)
      .post('/api/alerts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Audit Trail Test Broadcast',
        message: 'Testing activity log generation.',
      });

    // 2. Fetch activity logs
    const res = await request(app)
      .get('/api/activity-logs')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('logs');
    expect(Array.isArray(res.body.data.logs)).toBe(true);
    expect(res.body.data.total).toBeGreaterThan(0);
  });

  it('GET /api/activity-logs — Filters by action type', async () => {
    const res = await request(app)
      .get('/api/activity-logs')
      .query({ action: 'ALERT_BROADCAST' })
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.logs.every((l: any) => l.action === 'ALERT_BROADCAST')).toBe(true);
  });
});
