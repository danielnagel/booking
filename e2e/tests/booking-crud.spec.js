import { test, expect } from '@playwright/test';

import { runBackendCli, extractCodeFromOutput } from '../helpers/dockerCli.js';

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function waitForSearchResponse(page, searchTerm) {
  return page.waitForResponse((response) => {
    if (!response.url().includes('/api/bookings')) return false;
    const url = new URL(response.url());
    return url.searchParams.get('search') === searchTerm;
  });
}

// Covers plan flow (3): login, create an entry using only the required
// field, confirm it appears in the overview, confirm search finds it, edit
// it, delete it (plans/intial-plan-simple-booking-website-for-bands.md,
// Testing / E2E).
test('Login, Eintrag anlegen, in Übersicht bestätigen, per Suche finden, bearbeiten und löschen', async ({
  page,
  request,
}) => {
  // Provision a user to log in with. The invite/registration flow itself is
  // covered by invite-registration-login.spec.js, so this test registers via
  // the API directly and focuses on the booking CRUD flow.
  const inviteCliOutput = runBackendCli('invite:create');
  const inviteCode = extractCodeFromOutput(inviteCliOutput);

  const username = `e2e-crud-${Date.now()}`;
  const password = 'Crud-E2e-Passwort-1!';

  const registerResponse = await request.post('/api/auth/register', {
    data: { inviteCode, username, password },
  });
  expect(registerResponse.ok()).toBeTruthy();

  const eventName = `E2E Stadtfest ${Date.now()}`;
  const updatedEventName = `${eventName} (bearbeitet)`;

  await page.goto('/login');
  await page.getByLabel('Benutzername').fill(username);
  await page.getByLabel('Passwort').fill(password);
  await page.getByRole('button', { name: 'Anmelden' }).click();
  await page.waitForURL((url) => url.pathname === '/');

  const totalCountText = page.getByText(/Einträge insgesamt$/);
  const totalCountBefore = Number((await totalCountText.textContent()).match(/\d+/)[0]);

  // Create an entry using only the required field (Veranstaltungsname).
  await page.getByRole('link', { name: 'Neuer Eintrag' }).click();
  await page.waitForURL((url) => url.pathname === '/eingabe');
  await page.getByLabel('Veranstaltungsname').fill(eventName);
  await page
    .getByRole('button', { name: 'Hinzufügen und zurück zur Übersicht' })
    .click();

  // Confirm it appears in the overview: the total row count grew by one.
  await page.waitForURL((url) => url.pathname === '/');
  await expect(totalCountText).toHaveText(`${totalCountBefore + 1} Einträge insgesamt`);

  // Confirm the search finds it.
  const searchInput = page.getByPlaceholder('Suche...');
  await searchInput.fill(eventName);
  await waitForSearchResponse(page, eventName);

  const row = page.getByRole('row', { name: new RegExp(escapeRegex(eventName)) });
  await expect(row).toBeVisible();

  // Edit it.
  await row.getByRole('button', { name: 'Bearbeiten' }).click();
  await page.waitForURL((url) => /^\/eingabe\/.+/.test(url.pathname));
  await expect(page.getByLabel('Veranstaltungsname')).toHaveValue(eventName);
  await page.getByLabel('Veranstaltungsname').fill(updatedEventName);
  await page
    .getByRole('button', { name: 'Speichern und zurück zur Übersicht' })
    .click();

  await page.waitForURL((url) => url.pathname === '/');
  await searchInput.fill(updatedEventName);
  await waitForSearchResponse(page, updatedEventName);
  const updatedRow = page.getByRole('row', { name: new RegExp(escapeRegex(updatedEventName)) });
  await expect(updatedRow).toBeVisible();

  // Delete it.
  await updatedRow.getByRole('button', { name: 'Löschen' }).click();
  const confirmDialog = page.locator('div.fixed', { hasText: 'wirklich gelöscht werden' });
  await confirmDialog.getByRole('button', { name: 'Löschen' }).click();

  await expect(page.getByText('Keine Einträge gefunden.')).toBeVisible();
});
