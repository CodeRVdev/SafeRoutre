import request from 'supertest';
import app from '../src/app';
import { runMigrations } from '../src/db/migrate';
import { runSeed } from '../src/db/seed';

describe('Emergency Contacts API', () => {
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

  it('should fetch active emergency contacts', async () => {
    const res = await request(app)
      .get('/api/emergency-contacts')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('should create a new emergency contact as admin', async () => {
    const newContact = {
      name: 'Test Emergency Response Unit',
      organization: 'Tupi Local Responders',
      phone: '0999-000-1111',
      category: 'disaster',
      is_active: true,
      sort_order: 99,
    };

    const res = await request(app)
      .post('/api/emergency-contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send(newContact);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe(newContact.name);
    expect(res.body.data.phone).toBe(newContact.phone);

    const contactId = res.body.data.contact_id;

    // Clean up created contact
    await request(app)
      .delete(`/api/emergency-contacts/${contactId}`)
      .set('Authorization', `Bearer ${authToken}`);
  });

  it('should update an emergency contact as admin', async () => {
    // Create temp contact
    const createRes = await request(app)
      .post('/api/emergency-contacts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Temp Contact',
        phone: '12345',
        category: 'fire',
      });

    const contactId = createRes.body.data.contact_id;

    const updateRes = await request(app)
      .put(`/api/emergency-contacts/${contactId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Temp Contact',
        phone: '54321',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.name).toBe('Updated Temp Contact');
    expect(updateRes.body.data.phone).toBe('54321');

    // Clean up
    await request(app)
      .delete(`/api/emergency-contacts/${contactId}`)
      .set('Authorization', `Bearer ${authToken}`);
  });
});
