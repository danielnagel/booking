import pool from '../db/pool.js';

async function main() {
  const { rows } = await pool.query(
    `SELECT username, created_at, last_login_at
     FROM users
     ORDER BY created_at DESC`,
  );

  if (rows.length === 0) {
    console.log('Keine Benutzer vorhanden.');
    return;
  }

  console.log('Benutzer:');
  for (const row of rows) {
    const lastLogin = row.last_login_at ? row.last_login_at.toISOString() : 'nie';

    console.log(
      `  ${row.username}  (erstellt: ${row.created_at.toISOString()}, letzter Login: ${lastLogin})`,
    );
  }
}

main()
  .catch((error) => {
    console.error('Fehler beim Auflisten der Benutzer:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
