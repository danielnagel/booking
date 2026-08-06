import { afterEach, describe, expect, it, vi } from 'vitest';

// app.js reads TRUST_PROXY_HOPS once at module-load time, so each case here
// resets the module registry and re-imports it under a different env value
// rather than asserting against the already-imported singleton used by the
// other test files.
const ORIGINAL_TRUST_PROXY_HOPS = process.env.TRUST_PROXY_HOPS;

afterEach(() => {
  if (ORIGINAL_TRUST_PROXY_HOPS === undefined) {
    delete process.env.TRUST_PROXY_HOPS;
  } else {
    process.env.TRUST_PROXY_HOPS = ORIGINAL_TRUST_PROXY_HOPS;
  }
  vi.resetModules();
});

describe('trust proxy configuration', () => {
  it('trusts no hops by default when TRUST_PROXY_HOPS is unset', async () => {
    delete process.env.TRUST_PROXY_HOPS;
    vi.resetModules();

    const { default: app } = await import('../src/app.js');

    expect(app.get('trust proxy')).toBe(0);
  });

  it('trusts exactly the configured number of hops', async () => {
    process.env.TRUST_PROXY_HOPS = '2';
    vi.resetModules();

    const { default: app } = await import('../src/app.js');

    expect(app.get('trust proxy')).toBe(2);
  });
});
