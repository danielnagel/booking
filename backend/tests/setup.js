// Runs once per test file before its imports execute (vitest `setupFiles`).
// DB connection env vars (DATABASE_URL or PGHOST/PGPORT/PGUSER/PGPASSWORD/PGDATABASE)
// are intentionally NOT touched here: tests connect to whatever real Postgres
// instance is already configured via the exact same env vars `src/db/pool.js`
// reads in the running app (see backend/README.md / CI workflow for how that
// instance is provisioned). Only JWT_SECRET gets a fallback, since it is not a
// DB setting and is required for the auth routes to sign/verify tokens at all.
if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'test-jwt-secret-do-not-use-in-production';
}
