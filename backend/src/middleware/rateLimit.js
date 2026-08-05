import rateLimit from 'express-rate-limit';

// Shared limiter for the auth brute-force-relevant endpoints (/login,
// /register, /reset-password). A single shared instance is used for all
// three routes on purpose: separate per-route counters would let an
// attacker collect 10 attempts per endpoint instead of 10 in total.
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Zu viele Versuche. Bitte später erneut versuchen.' },
  // Vitest sets NODE_ENV=test by default (like Jest/Vite), and the existing
  // register/login/reset-password tests call their endpoint more than 10
  // times per test file, so without this skip they would immediately fail
  // with 429.
  skip: () => process.env.NODE_ENV === 'test',
});
