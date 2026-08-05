// Runs the given command (node-pg-migrate / vitest, see package.json
// "pretest"/"test") with DATABASE_URL forced to TEST_DATABASE_URL, so a
// local `npm test` can never end up truncating the real dev/prod database
// (see backend/tests/helpers/db.js for the matching runtime safety check).
// Falls back to an already-set DATABASE_URL when TEST_DATABASE_URL isn't
// configured (that's how CI provisions its own disposable Postgres service,
// see .github/workflows/ci.yml - no root .env file exists there).
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const rootEnvFile = resolve(repoRoot, '.env');

if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error(
    'Weder TEST_DATABASE_URL noch DATABASE_URL gesetzt. Lokal: TEST_DATABASE_URL in .env ' +
      'eintragen (siehe .env.example) und "docker compose --profile test up -d db-test" starten.',
  );
  process.exit(1);
}

const [command, ...args] = process.argv.slice(2);

const result = spawnSync(command, args, {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: databaseUrl },
});

process.exitCode = result.status ?? 1;
