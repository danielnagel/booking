// Populates the served logo/favicon from LOGO_FILE/FAVICON_FILE (read from
// the repo-root .env, same variables the Docker bind-mount in
// docker-compose.yml uses) or falls back to the generic defaults shipped in
// the repo. Runs before `vite`/`vite build` so both dev server and build
// output serve the right file at a stable path (/logo.svg, /favicon.svg).
import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = resolve(import.meta.dirname, '..', '..');
const publicDir = resolve(import.meta.dirname, '..', 'public');

const rootEnvFile = resolve(repoRoot, '.env');
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

const assets = [
  { envVar: 'LOGO_FILE', defaultFile: 'logo.default.svg', target: 'logo.svg' },
  { envVar: 'FAVICON_FILE', defaultFile: 'favicon.default.svg', target: 'favicon.svg' },
];

for (const { envVar, defaultFile, target } of assets) {
  const override = process.env[envVar];
  const source = override ? resolve(repoRoot, override) : resolve(publicDir, defaultFile);
  copyFileSync(source, resolve(publicDir, target));
}
