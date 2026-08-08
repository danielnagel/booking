import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb, closeDb, insertInviteCode } from './helpers/db.js';
import { PASSWORD_POLICY_ERROR_CODE } from '../src/lib/passwordPolicy.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('POST /api/auth/register', () => {
  it('rejects missing fields', async () => {
    const response = await request(app).post('/api/auth/register').send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBeTruthy();
  });

  it('rejects a password that violates the password policy', async () => {
    const code = await insertInviteCode();

    const response = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'newbandmember',
      password: 'weakpassword',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(PASSWORD_POLICY_ERROR_CODE);
  });

  it('rejects an invite code that does not exist', async () => {
    const response = await request(app).post('/api/auth/register').send({
      inviteCode: 'does-not-exist',
      username: 'newbandmember',
      password: 'Sup3rSecret!123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('invite_code_invalid');
  });

  it('rejects an expired invite code', async () => {
    const code = await insertInviteCode({
      expiresAt: new Date(Date.now() - 1000),
    });

    const response = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'newbandmember',
      password: 'Sup3rSecret!123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('invite_code_invalid');
  });

  it('rejects a revoked invite code', async () => {
    const code = await insertInviteCode({
      revokedAt: new Date(),
    });

    const response = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'newbandmember',
      password: 'Sup3rSecret!123',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('invite_code_invalid');
  });

  it('registers a user with a valid invite code', async () => {
    const code = await insertInviteCode();

    const response = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'drummer',
      password: 'Sup3rSecret!123',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ username: 'drummer' });
  });

  it('allows the same invite code to be reused by a different user', async () => {
    const code = await insertInviteCode();

    const first = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'guitarist',
      password: 'Sup3rSecret!123',
    });
    const second = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'bassist',
      password: 'Anoth3rSecret!12',
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });

  it('rejects a username that is already taken', async () => {
    const code = await insertInviteCode();

    const first = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'singer',
      password: 'Sup3rSecret!123',
    });
    const second = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'singer',
      password: 'D1fferentSecret!',
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.error).toBe('username_taken');
  });
});
