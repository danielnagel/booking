import pool from '../db/pool.js';
import { generateCode } from '../lib/codes.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

async function main() {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + THIRTY_DAYS_MS);

  await pool.query(
    'INSERT INTO invite_codes (code, expires_at) VALUES ($1, $2)',
    [code, expiresAt],
  );

  console.log('Invite-Code erstellt:');
  console.log(`  Code:       ${code}`);
  console.log(`  Gueltig bis: ${expiresAt.toISOString()}`);
}

main()
  .catch((error) => {
    console.error('Fehler beim Erstellen des Invite-Codes:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
