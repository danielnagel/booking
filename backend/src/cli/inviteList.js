import pool from '../db/pool.js';

async function main() {
  const { rows } = await pool.query(
    `SELECT code, created_at, expires_at
     FROM invite_codes
     WHERE revoked_at IS NULL AND expires_at > now()
     ORDER BY created_at DESC`,
  );

  if (rows.length === 0) {
    console.log('Keine aktiven Invite-Codes.');
    return;
  }

  console.log('Aktive Invite-Codes:');
  for (const row of rows) {
    console.log(
      `  ${row.code}  (erstellt: ${row.created_at.toISOString()}, gueltig bis: ${row.expires_at.toISOString()})`,
    );
  }
}

main()
  .catch((error) => {
    console.error('Fehler beim Auflisten der Invite-Codes:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
