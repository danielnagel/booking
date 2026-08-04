import pool from '../../src/db/pool.js';

/**
 * Wipes all application tables so each test starts from a clean, known state.
 * Uses the real pool the app itself uses - no mocking.
 */
export async function resetDb() {
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

export async function insertUser({ username, passwordHash }) {
  const { rows } = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    [username, passwordHash],
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
