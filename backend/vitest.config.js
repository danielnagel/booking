import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/**/*.test.js'],
    setupFiles: ['./tests/setup.js'],
    // Tests share one real Postgres database and truncate tables between
    // tests, so files must not run concurrently against it.
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
