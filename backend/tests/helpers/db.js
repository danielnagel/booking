import pool from '../../src/db/pool.js';

/**
 * Wipes all application tables so each test starts from a clean, known state.
 * Uses the real pool the app itself uses - no mocking.
 *
 * Refuses to run against anything whose database name doesn't look like a
 * disposable test database: this truncates every table, and a misconfigured
 * DATABASE_URL (e.g. accidentally pointing at the dev or a production
 * database) must not be able to wipe it. See backend/scripts/run-with-test-db.js
 * for how "test" DB npm scripts set DATABASE_URL from TEST_DATABASE_URL.
 */
export async function resetDb() {
  const {
    rows: [{ current_database: dbName }],
  } = await pool.query('SELECT current_database()');

  if (!dbName.includes('test')) {
    throw new Error(
      `resetDb() weigert sich, Datenbank "${dbName}" zu leeren, da der Name nicht "test" ` +
        'enthaelt. Isolierte Test-DB starten: docker compose --profile test up -d db-test, ' +
        'TEST_DATABASE_URL in .env setzen (siehe .env.example).',
    );
  }

  await pool.query(
    'TRUNCATE TABLE bookings, password_reset_codes, invite_codes, users RESTART IDENTITY CASCADE',
  );
}

export async function closeDb() {
  await pool.end();
}

export async function insertInviteCode(overrides = {}) {
  const code = overrides.code ?? `invite-${Math.random().toString(36).slice(2)}`;
  const createdAt = overrides.createdAt ?? new Date();
  const expiresAt =
    overrides.expiresAt ?? new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  const revokedAt = overrides.revokedAt ?? null;

  await pool.query(
    'INSERT INTO invite_codes (code, created_at, expires_at, revoked_at) VALUES ($1, $2, $3, $4)',
    [code, createdAt, expiresAt, revokedAt],
  );

  return code;
}

export async function insertUser({ username, passwordHash, createdAt, lastLoginAt }) {
  const { rows } = await pool.query(
    `INSERT INTO users (username, password_hash, created_at, last_login_at)
     VALUES ($1, $2, COALESCE($3, now()), $4)
     RETURNING id, username, created_at, last_login_at`,
    [username, passwordHash, createdAt ?? null, lastLoginAt ?? null],
  );

  return rows[0];
}

export async function insertPasswordResetCode({ userId, overrides = {} }) {
  const code = overrides.code ?? `reset-${Math.random().toString(36).slice(2)}`;
  const createdAt = overrides.createdAt ?? new Date();
  const expiresAt =
    overrides.expiresAt ?? new Date(createdAt.getTime() + 72 * 60 * 60 * 1000);
  const usedAt = overrides.usedAt ?? null;

  await pool.query(
    `INSERT INTO password_reset_codes (code, user_id, created_at, expires_at, used_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [code, userId, createdAt, expiresAt, usedAt],
  );

  return code;
}

export async function findUserByUsername(username) {
  const { rows } = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username],
  );

  return rows[0] ?? null;
}

export async function insertBooking(fields = {}) {
  const { rows } = await pool.query(
    `INSERT INTO bookings (event_name, organizer, fee, created_by)
     VALUES ($1, $2, $3, $4)
     RETURNING id, event_name, organizer, fee, created_by, created_at`,
    [
      fields.event_name ?? 'Sommerfest',
      fields.organizer ?? null,
      fields.fee ?? null,
      fields.created_by ?? 'seed-script',
    ],
  );

  return rows[0];
}

export { pool };
