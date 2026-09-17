import request from 'supertest';
import app from '../src/app';
import pool from '../src/config/db';
import { runMigrations } from '../src/db/migrate';
import { runSeed } from '../src/db/seed';

let authToken: string;

describe('Routing API Integration Tests', () => {
  beforeAll(async () => {
    await runMigrations();
    await runSeed();

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'student@saferoute.edu',
      password: 'StudentPassword123!',
    });

    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    await pool.end();
  });

  it('GET /api/routing/safe-path — Returns safe route waypoints and hazard avoidance details', async () => {
    const res = await request(app)
      .get('/api/routing/safe-path')
      .query({ fromLat: 6.2882, fromLng: 124.9675 })
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('destination_zone');
    expect(res.body).toHaveProperty('distance_meters');
    expect(res.body).toHaveProperty('estimated_duration_minutes');
    expect(Array.isArray(res.body.route_waypoints)).toBe(true);
    expect(res.body.route_waypoints.length).toBeGreaterThan(0);
  });

  it('GET /api/routing/safe-path — Fails when missing fromLat or fromLng query parameters', async () => {
    const res = await request(app)
      .get('/api/routing/safe-path')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
