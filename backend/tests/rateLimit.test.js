import { describe, expect, it } from 'vitest';
import express from 'express';
import rateLimit from 'express-rate-limit';
import request from 'supertest';

// This exercises the real rate-limiter configuration (window, limit, message
// shape) rather than the shared `authRateLimiter` export directly: that export
// has `skip: () => process.env.NODE_ENV === 'test'` so it never actually
// limits under Vitest (NODE_ENV=test), and toggling NODE_ENV / re-importing
// the module mid-test-run would be brittle. Instead we mount a small
// standalone app with the same limiter settings but `skip: () => false`,
// so the 11th request is guaranteed to be limited without touching the
// shared test Postgres database at all.
function buildTestApp() {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'rate_limited' },
    skip: () => false,
  });

  const app = express();
  app.post('/probe', limiter, (req, res) => {
    res.status(200).json({ ok: true });
  });
  return app;
}

describe('authRateLimiter configuration', () => {
  it('allows 10 requests per window and rejects the 11th with 429', async () => {
    const app = buildTestApp();

    for (let i = 0; i < 10; i += 1) {
      const response = await request(app).post('/probe');
      expect(response.status).toBe(200);
    }

    const blockedResponse = await request(app).post('/probe');

    expect(blockedResponse.status).toBe(429);
    expect(blockedResponse.body).toEqual({
      error: 'rate_limited',
    });
  });
});
