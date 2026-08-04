import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { resetDb, closeDb, insertInviteCode } from './helpers/db.js';

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

  it('rejects an invite code that does not exist', async () => {
    const response = await request(app).post('/api/auth/register').send({
      inviteCode: 'does-not-exist',
      username: 'newbandmember',
      password: 'supersecret',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invite-Code/);
  });

  it('rejects an expired invite code', async () => {
    const code = await insertInviteCode({
      expiresAt: new Date(Date.now() - 1000),
    });

    const response = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'newbandmember',
      password: 'supersecret',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invite-Code/);
  });

  it('rejects a revoked invite code', async () => {
    const code = await insertInviteCode({
      revokedAt: new Date(),
    });

    const response = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'newbandmember',
      password: 'supersecret',
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/Invite-Code/);
  });

  it('registers a user with a valid invite code', async () => {
    const code = await insertInviteCode();

    const response = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'drummer',
      password: 'supersecret',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ username: 'drummer' });
  });

  it('allows the same invite code to be reused by a different user', async () => {
    const code = await insertInviteCode();

    const first = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'guitarist',
      password: 'supersecret',
    });
    const second = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'bassist',
      password: 'anothersecret',
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
  });

  it('rejects a username that is already taken', async () => {
    const code = await insertInviteCode();

    const first = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'singer',
      password: 'supersecret',
    });
    const second = await request(app).post('/api/auth/register').send({
      inviteCode: code,
      username: 'singer',
      password: 'differentsecret',
    });

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/Username/);
  });
});
