import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const backendRoot = path.resolve(fileURLToPath(import.meta.url), '../../..');

/**
 * Runs one of the backend CLI scripts (src/cli/*.js) as a real child process
 * against the same Postgres instance the tests use, and returns its exit
 * code and captured stdout/stderr.
 */
export function runCli(scriptName, args = []) {
  const scriptPath = path.join(backendRoot, 'src', 'cli', scriptName);

  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: backendRoot,
    env: process.env,
    encoding: 'utf8',
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}
