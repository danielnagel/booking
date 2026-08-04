import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import { insertUser } from './db.js';

const PASSWORD = 'password123';

/**
 * Creates a user directly in the DB and logs them in via the real HTTP
 * endpoint, returning a supertest agent that carries the session cookie.
 */
export async function createAndLoginUser(username = `user-${Math.random().toString(36).slice(2)}`) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  await insertUser({ username, passwordHash });

  const agent = request.agent(app);
  const loginResponse = await agent
    .post('/api/auth/login')
    .send({ username, password: PASSWORD });

  if (loginResponse.status !== 200) {
    throw new Error(`Test login failed: ${JSON.stringify(loginResponse.body)}`);
  }

  return { agent, username };
}
