import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../src/app.js';
import {
  resetDb,
  closeDb,
  insertUser,
  insertPasswordResetCode,
} from './helpers/db.js';
import { PASSWORD_POLICY_ERROR_CODE } from '../src/lib/passwordPolicy.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

async function createUser(username) {
  const passwordHash = await bcrypt.hash('originalpassword', 10);
  return insertUser({ username, passwordHash });
}

describe('POST /api/auth/reset-password', () => {
  it('rejects missing fields', async () => {
    const response = await request(app).post('/api/auth/reset-password').send({});

    expect(response.status).toBe(400);
  });

  it('rejects a password that violates the password policy', async () => {
    const user = await createUser('violinist');
    const code = await insertPasswordResetCode({ userId: user.id });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetCode: code, newPassword: 'weakpassword' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe(PASSWORD_POLICY_ERROR_CODE);
  });

  it('rejects a reset code that does not exist', async () => {
    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetCode: 'does-not-exist', newPassword: 'Br4ndNewPassword!' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('reset_code_invalid');
  });

  it('rejects an expired reset code', async () => {
    const user = await createUser('violinist');
    const code = await insertPasswordResetCode({
      userId: user.id,
      overrides: { expiresAt: new Date(Date.now() - 1000) },
    });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetCode: code, newPassword: 'Br4ndNewPassword!' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('reset_code_invalid');
  });

  it('rejects an already-used reset code', async () => {
    const user = await createUser('violinist');
    const code = await insertPasswordResetCode({
      userId: user.id,
      overrides: { usedAt: new Date() },
    });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetCode: code, newPassword: 'Br4ndNewPassword!' });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('reset_code_invalid');
  });

  it('resets the password of the user the code is bound to, and login works with the new password', async () => {
    const user = await createUser('violinist');
    const code = await insertPasswordResetCode({ userId: user.id });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetCode: code, newPassword: 'Br4ndNewPassword!' });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });

    const oldPasswordLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'violinist', password: 'originalpassword' });
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'violinist', password: 'Br4ndNewPassword!' });
    expect(newPasswordLogin.status).toBe(200);
  });

  it('does not allow a reset code to be used a second time', async () => {
    const user = await createUser('violinist');
    const code = await insertPasswordResetCode({ userId: user.id });

    const first = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetCode: code, newPassword: 'Br4ndNewPassword!' });
    const second = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetCode: code, newPassword: 'Y3tAnotherPassword!' });

    expect(first.status).toBe(200);
    expect(second.status).toBe(400);
  });

  it('only changes the password of the user the code is bound to, not other users', async () => {
    const targetUser = await createUser('violinist');
    await createUser('cellist');
    const code = await insertPasswordResetCode({ userId: targetUser.id });

    const response = await request(app)
      .post('/api/auth/reset-password')
      .send({ resetCode: code, newPassword: 'Br4ndNewPassword!' });
    expect(response.status).toBe(200);

    const otherUserOldPasswordLogin = await request(app)
      .post('/api/auth/login')
      .send({ username: 'cellist', password: 'originalpassword' });
    expect(otherUserOldPasswordLogin.status).toBe(200);
  });
});
