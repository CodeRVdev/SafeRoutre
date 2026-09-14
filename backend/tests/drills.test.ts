import request from 'supertest';
import app from '../src/app';
import { runMigrations } from '../src/db/migrate';
import { runSeed } from '../src/db/seed';

describe('Scheduled Drills API Integration Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    try {
      let timerId: NodeJS.Timeout;
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => reject(new Error('DB connection timeout')), 2000);
      });

      const connectPromise = (async () => {
        await runMigrations();
        await runSeed();
      })().then((res) => {
        clearTimeout(timerId);
        return res;
      });

      await Promise.race([connectPromise, timeoutPromise]).catch((err) => {
        clearTimeout(timerId);
        console.warn('Database connection check during test run:', (err as Error).message);
      });
    } catch (err) {
      console.warn('Failed setup:', err);
    }

    // Authenticate as Admin to get JWT token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@saferoute.edu',
        password: 'AdminPassword123!',
      });
    authToken = loginRes.body.token || loginRes.body.data?.token;
  });

  it('should fetch upcoming scheduled drills', async () => {
    const res = await request(app)
      .get('/api/drills/upcoming')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should schedule a new evacuation drill as coordinator/admin', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 5).toISOString();

    const newDrill = {
      title: 'Test Integration Fire Drill',
      description: 'Simulated fire evacuation for testing API endpoints.',
      scheduled_date: futureDate,
    };

    const res = await request(app)
      .post('/api/drills')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newDrill);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe(newDrill.title);
    expect(res.body.data.status).toBe('scheduled');

    const drillId = res.body.data.drill_id;

    // Clean up created drill
    await request(app)
      .delete(`/api/drills/${drillId}`)
      .set('Authorization', `Bearer ${authToken}`);
  });

  it('should trigger live drill start and mark drill in_progress with drill alert', async () => {
    const futureDate = new Date(Date.now() + 86400000 * 2).toISOString();

    const createRes = await request(app)
      .post('/api/drills')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Live Practice Drill Test',
        description: 'Testing live drill execution.',
        scheduled_date: futureDate,
      });

    const drillId = createRes.body.data.drill_id;

    const startRes = await request(app)
      .post(`/api/drills/${drillId}/start`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(startRes.status).toBe(200);
    expect(startRes.body.success).toBe(true);
    expect(startRes.body.data.drill.status).toBe('in_progress');
    expect(startRes.body.data.alert.is_drill).toBe(true);

    // Complete drill
    const completeRes = await request(app)
      .post(`/api/drills/${drillId}/complete`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('completed');
    expect(completeRes.body.data.metrics).toBeDefined();

    // Clean up
    await request(app)
      .delete(`/api/drills/${drillId}`)
      .set('Authorization', `Bearer ${authToken}`);
  });
});
