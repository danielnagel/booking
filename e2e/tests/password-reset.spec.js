import { test, expect } from '@playwright/test';

import { runBackendCli, extractCodeFromOutput } from '../helpers/dockerCli.js';

// Covers plan flow (2): admin creates a password-reset code for an existing
// user via the backend CLI inside the running container, then the user
// resets the password with the code, then login with the new password
// (plans/intial-plan-simple-booking-website-for-bands.md, Testing / E2E).
test('Admin creates a password-reset code via the CLI, the user resets the password and logs in with the new one', async ({
  page,
  request,
}) => {
  // Set up an existing user directly through the public register endpoint
  // (the invite-code registration path itself is covered by
  // invite-registration-login.spec.js), so this test can focus on the
  // password-reset flow for an already-existing account.
  const inviteCliOutput = runBackendCli('invite:create');
  const inviteCode = extractCodeFromOutput(inviteCliOutput);

  const username = `e2e-reset-${Date.now()}`;
  const oldPassword = 'Reset-E2e-Altes-Pw-1!';
  const newPassword = 'Reset-E2e-Neues-Pw-2!';

  const registerResponse = await request.post('/api/auth/register', {
    data: { inviteCode, username, password: oldPassword },
  });
  expect(registerResponse.ok()).toBeTruthy();

  const resetCliOutput = runBackendCli('password-reset:create', [username]);
  const resetCode = extractCodeFromOutput(resetCliOutput);

  await page.goto('/passwort-zuruecksetzen');
  await page.getByLabel('Reset code').fill(resetCode);
  await page.getByLabel('New password').fill(newPassword);
  await page.getByRole('button', { name: 'Reset password' }).click();

  await page.waitForURL((url) => url.pathname === '/login');

  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(newPassword);
  await page.getByRole('button', { name: 'Log in' }).click();

  await page.waitForURL((url) => url.pathname === '/');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});
