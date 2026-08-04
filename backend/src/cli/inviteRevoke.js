import pool from '../db/pool.js';

async function main() {
  const code = process.argv[2];
  if (!code) {
    console.error('Verwendung: npm run invite:revoke -- <code>');
    process.exitCode = 1;
    return;
  }

  const { rowCount } = await pool.query(
    `UPDATE invite_codes
     SET revoked_at = now()
     WHERE code = $1 AND revoked_at IS NULL AND expires_at > now()`,
    [code],
  );

  if (rowCount === 0) {
    console.error('Kein aktiver Invite-Code mit diesem Code gefunden.');
    process.exitCode = 1;
    return;
  }

  console.log(`Invite-Code deaktiviert: ${code}`);
}

main()
  .catch((error) => {
    console.error('Fehler beim Deaktivieren des Invite-Codes:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
