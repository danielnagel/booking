import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb, closeDb } from './helpers/db.js';

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
