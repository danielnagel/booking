import { test, expect } from '@playwright/test';

import { runBackendCli, extractCodeFromOutput } from '../helpers/dockerCli.js';

// Covers plan flow (1): admin creates an invite code via the backend CLI
// inside the running container, then registration with that code, then
// login (plans/intial-plan-simple-booking-website-for-bands.md, Testing / E2E).
test('Admin erzeugt Invite-Code per CLI, Nutzer registriert sich damit und loggt sich ein', async ({
  page,
}) => {
  const cliOutput = runBackendCli('invite:create');
  const inviteCode = extractCodeFromOutput(cliOutput);

  const username = `e2e-invite-${Date.now()}`;
  const password = 'Invite-E2e-Passwort-1!';

  await page.goto('/registrieren');
  await page.getByLabel('Invite-Code').fill(inviteCode);
  await page.getByLabel('Benutzername').fill(username);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Registrieren' }).click();

  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Benutzername').fill(username);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Anmelden' }).click();

  await page.waitForURL((url) => url.pathname === '/');
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
});
