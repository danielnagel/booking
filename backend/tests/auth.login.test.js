import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import { resetDb, closeDb, insertUser } from './helpers/db.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('POST /api/auth/login', () => {
  it('rejects missing fields', async () => {
    const response = await request(app).post('/api/auth/login').send({});

    expect(response.status).toBe(400);
  });

  it('rejects an unknown username', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'ghost', password: 'whatever' });

    expect(response.status).toBe(401);
  });

  it('rejects a wrong password', async () => {
    const passwordHash = await bcrypt.hash('correcthorsebatterystaple', 10);
    await insertUser({ username: 'keyboarder', passwordHash });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'keyboarder', password: 'wrongpassword' });

    expect(response.status).toBe(401);
  });

  it('logs in with correct credentials and sets an httpOnly session cookie', async () => {
    const passwordHash = await bcrypt.hash('correcthorsebatterystaple', 10);
    await insertUser({ username: 'keyboarder', passwordHash });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'keyboarder', password: 'correcthorsebatterystaple' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ username: 'keyboarder' });

    const cookies = response.headers['set-cookie'];
    expect(cookies).toBeTruthy();
    const tokenCookie = cookies.find((cookie) => cookie.startsWith('token='));
    expect(tokenCookie).toBeTruthy();
    expect(tokenCookie.toLowerCase()).toContain('httponly');
    expect(tokenCookie.toLowerCase()).toContain('samesite=strict');
  });

  it('allows access to a protected route using the session cookie from login', async () => {
    const passwordHash = await bcrypt.hash('correcthorsebatterystaple', 10);
    await insertUser({ username: 'keyboarder', passwordHash });

    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ username: 'keyboarder', password: 'correcthorsebatterystaple' });

    const meResponse = await agent.get('/api/auth/me');

    expect(meResponse.status).toBe(200);
    expect(meResponse.body.username).toBe('keyboarder');
  });
});
