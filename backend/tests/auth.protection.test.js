import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import { resetDb, closeDb, pool, insertUser } from './helpers/db.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('access protection without a token', () => {
  it('rejects GET /api/auth/me without a session', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });

  it('rejects GET /api/bookings without a session', async () => {
    const response = await request(app).get('/api/bookings');
    expect(response.status).toBe(401);
  });

  it('rejects POST /api/bookings without a session', async () => {
    const response = await request(app)
      .post('/api/bookings')
      .send({ event_name: 'Sommerfest' });
    expect(response.status).toBe(401);
  });

  it('rejects PUT /api/bookings/:id without a session', async () => {
    const response = await request(app)
      .put('/api/bookings/00000000-0000-0000-0000-000000000000')
      .send({ event_name: 'Sommerfest' });
    expect(response.status).toBe(401);
  });

  it('rejects DELETE /api/bookings/:id without a session', async () => {
    const response = await request(app).delete(
      '/api/bookings/00000000-0000-0000-0000-000000000000',
    );
    expect(response.status).toBe(401);
  });

  it('rejects requests with a garbage token cookie', async () => {
    const response = await request(app)
      .get('/api/bookings')
      .set('Cookie', ['token=not-a-real-jwt']);
    expect(response.status).toBe(401);
  });
});

describe('access with a still-valid session for a since-deleted user', () => {
  it('rejects GET /api/auth/me once the user behind the session no longer exists', async () => {
    const passwordHash = await bcrypt.hash('correcthorsebatterystaple', 10);
    const user = await insertUser({ username: 'ghosted', passwordHash });

    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ username: 'ghosted', password: 'correcthorsebatterystaple' });

    await pool.query('DELETE FROM users WHERE id = $1', [user.id]);

    const response = await agent.get('/api/auth/me');

    expect(response.status).toBe(401);
  });
});
