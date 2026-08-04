import pool from '../db/pool.js';
import { generateCode } from '../lib/codes.js';

const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

async function main() {
  const username = process.argv[2];
  if (!username) {
    console.error('Verwendung: npm run password-reset:create -- <username>');
    process.exitCode = 1;
    return;
  }

  const { rows } = await pool.query(
    'SELECT id FROM users WHERE username = $1',
    [username],
  );

  if (rows.length === 0) {
    console.error(`Kein Nutzer mit Username "${username}" gefunden.`);
    process.exitCode = 1;
    return;
  }

  const userId = rows[0].id;
  const code = generateCode();
  const expiresAt = new Date(Date.now() + SEVENTY_TWO_HOURS_MS);

  await pool.query(
    'INSERT INTO password_reset_codes (code, user_id, expires_at) VALUES ($1, $2, $3)',
    [code, userId, expiresAt],
  );

  console.log(`Passwort-Reset-Code fuer "${username}" erstellt:`);
  console.log(`  Code:       ${code}`);
  console.log(`  Gueltig bis: ${expiresAt.toISOString()}`);
}

main()
  .catch((error) => {
    console.error('Fehler beim Erstellen des Passwort-Reset-Codes:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
