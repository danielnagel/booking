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
test('Login, create an entry, confirm it in the overview, find it via search, edit and delete it', async ({
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
  const updatedEventName = `${eventName} (edited)`;

  await page.goto('/login');
  await page.getByLabel('Username').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
  await page.waitForURL((url) => url.pathname === '/');

  const totalCountText = page.getByText(/entries total$/);
  const totalCountBefore = Number((await totalCountText.textContent()).match(/\d+/)[0]);

  // Create an entry using only the required field (event name).
  await page.getByRole('link', { name: 'New entry' }).click();
  await page.waitForURL((url) => url.pathname === '/eingabe');
  await page.getByLabel('Event name').fill(eventName);
  await page
    .getByRole('button', { name: 'Add and back to overview' })
    .click();

  // Confirm it appears in the overview: the total row count grew by one.
  await page.waitForURL((url) => url.pathname === '/');
  await expect(totalCountText).toHaveText(`${totalCountBefore + 1} entries total`);

  // Confirm the search finds it.
  const searchInput = page.getByPlaceholder('Search...');
  await searchInput.fill(eventName);
  await waitForSearchResponse(page, eventName);

  const row = page.getByRole('row', { name: new RegExp(escapeRegex(eventName)) });
  await expect(row).toBeVisible();

  // Edit it.
  await row.getByRole('button', { name: 'Edit' }).click();
  await page.waitForURL((url) => /^\/eingabe\/.+/.test(url.pathname));
  await expect(page.getByLabel('Event name')).toHaveValue(eventName);
  await page.getByLabel('Event name').fill(updatedEventName);
  await page
    .getByRole('button', { name: 'Save and back to overview' })
    .click();

  await page.waitForURL((url) => url.pathname === '/');
  await searchInput.fill(updatedEventName);
  await waitForSearchResponse(page, updatedEventName);
  const updatedRow = page.getByRole('row', { name: new RegExp(escapeRegex(updatedEventName)) });
  await expect(updatedRow).toBeVisible();

  // Delete it.
  await updatedRow.getByRole('button', { name: 'Delete' }).click();
  const confirmDialog = page.locator('div.fixed', { hasText: 'really want to delete' });
  await confirmDialog.getByRole('button', { name: 'Delete' }).click();

  await expect(page.getByText('No entries found.')).toBeVisible();
});
