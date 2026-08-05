import { beforeEach, afterAll, describe, expect, it } from 'vitest';
import bcrypt from 'bcrypt';
import { resetDb, closeDb, pool, insertInviteCode, insertUser } from './helpers/db.js';
import { runCli } from './helpers/cli.js';

beforeEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeDb();
});

describe('invite:create CLI', () => {
  it('creates a new invite code valid for 30 days, reusable indefinitely until then', async () => {
    const result = runCli('inviteCreate.js');

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Invite-Code erstellt/);

    const codeMatch = result.stdout.match(/Code:\s*(\S+)/);
    expect(codeMatch).toBeTruthy();
    const code = codeMatch[1];

    const { rows } = await pool.query(
      'SELECT code, expires_at, revoked_at FROM invite_codes WHERE code = $1',
      [code],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].revoked_at).toBeNull();

    const daysUntilExpiry =
      (rows[0].expires_at.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    expect(daysUntilExpiry).toBeGreaterThan(29);
    expect(daysUntilExpiry).toBeLessThan(31);
  });
});

describe('invite:list CLI', () => {
  it('reports when there are no active invite codes', async () => {
    const result = runCli('inviteList.js');

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Keine aktiven Invite-Codes/);
  });

  it('lists only active invite codes, excluding expired and revoked ones', async () => {
    const activeCode = await insertInviteCode();
    const expiredCode = await insertInviteCode({ expiresAt: new Date(Date.now() - 1000) });
    const revokedCode = await insertInviteCode({ revokedAt: new Date() });

    const result = runCli('inviteList.js');

    expect(result.status).toBe(0);
    expect(result.stdout).toContain(activeCode);
    expect(result.stdout).not.toContain(expiredCode);
    expect(result.stdout).not.toContain(revokedCode);
  });
});

describe('invite:revoke CLI', () => {
  it('deactivates an active invite code', async () => {
    const code = await insertInviteCode();

    const result = runCli('inviteRevoke.js', [code]);

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/deaktiviert/);

    const { rows } = await pool.query(
      'SELECT revoked_at FROM invite_codes WHERE code = $1',
      [code],
    );
    expect(rows[0].revoked_at).not.toBeNull();
  });

  it('fails for an unknown invite code', async () => {
    const result = runCli('inviteRevoke.js', ['unknown-code']);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Kein aktiver Invite-Code/);
  });

  it('fails without a code argument', async () => {
    const result = runCli('inviteRevoke.js', []);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Verwendung/);
  });

  it('fails to revoke an already-revoked code again', async () => {
    const code = await insertInviteCode({ revokedAt: new Date() });

    const result = runCli('inviteRevoke.js', [code]);

    expect(result.status).toBe(1);
  });
});

describe('password-reset:create CLI', () => {
  it('creates a reset code bound to an existing user, valid for 72 hours', async () => {
    const passwordHash = await bcrypt.hash('irrelevant', 10);
    const user = await insertUser({ username: 'trumpeter', passwordHash });

    const result = runCli('passwordResetCreate.js', ['trumpeter']);

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Passwort-Reset-Code/);

    const codeMatch = result.stdout.match(/Code:\s*(\S+)/);
    expect(codeMatch).toBeTruthy();
    const code = codeMatch[1];

    const { rows } = await pool.query(
      'SELECT user_id, expires_at, used_at FROM password_reset_codes WHERE code = $1',
      [code],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].user_id).toBe(user.id);
    expect(rows[0].used_at).toBeNull();

    const hoursUntilExpiry =
      (rows[0].expires_at.getTime() - Date.now()) / (60 * 60 * 1000);
    expect(hoursUntilExpiry).toBeGreaterThan(71);
    expect(hoursUntilExpiry).toBeLessThan(73);
  });

  it('fails for an unknown username', async () => {
    const result = runCli('passwordResetCreate.js', ['nobody']);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Kein Nutzer/);
  });

  it('fails without a username argument', async () => {
    const result = runCli('passwordResetCreate.js', []);

    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Verwendung/);
  });
});

describe('user:list CLI', () => {
  it('reports when there are no users', async () => {
    const result = runCli('userList.js');

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/Keine Benutzer/);
  });

  it('lists users with creation date and last login', async () => {
    const passwordHash = await bcrypt.hash('irrelevant', 10);
    await insertUser({
      username: 'returning-user',
      passwordHash,
      lastLoginAt: new Date(),
    });
    await insertUser({ username: 'never-logged-in', passwordHash });

    const result = runCli('userList.js');

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/returning-user\s+\(erstellt:.*letzter Login: \d{4}-\d{2}-\d{2}T.*\)/);
    expect(result.stdout).toMatch(/never-logged-in\s+\(erstellt:.*letzter Login: nie\)/);
  });
});
