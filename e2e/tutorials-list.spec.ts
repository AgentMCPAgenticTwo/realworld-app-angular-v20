import { expect, test } from '@playwright/test';
import { API_GLOB, sampleTutorials, stubApi, stubApiFailure } from './support/api';

// The tutorials API is stubbed with `page.route` (see e2e/support/api.ts) because the
// Express backend the app points at is not running in CI.

test.describe('Tutorials list', () => {
  test('shows every tutorial returned by the API with its published status', async ({ page }) => {
    await stubApi(page);

    await page.goto('/tutorials');

    const cards = page.getByRole('article');
    await expect(cards).toHaveCount(3);
    await expect(cards.first()).toContainText('Angular routing basics');
    await expect(cards.first()).toContainText('How the router resolves a url to a component.');
    await expect(cards.first()).toContainText('Published');
    await expect(cards.nth(1)).toContainText('Pending');
  });

  test('shows the empty state when the API returns no tutorials', async ({ page }) => {
    await stubApi(page, { tutorials: [] });

    await page.goto('/tutorials');

    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
  });

  test('shows the empty state while the tutorials request is still in flight', async ({ page }) => {
    await stubApi(page, { delayMs: 1500 });

    await page.goto('/tutorials');

    // Loading state: the app renders the "no tutorials" block until data arrives.
    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(3, { timeout: 10_000 });
  });

  test('stays on the empty state when the tutorials request fails', async ({ page }) => {
    await stubApiFailure(page, 500);

    await page.goto('/tutorials');

    await expect(page.getByRole('heading', { name: 'Tutorials', exact: true })).toBeVisible();
    // KNOWN BEHAVIOUR (see findings): a 500 is only logged to the console, so the
    // screen is indistinguishable from "there are no tutorials".
    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(0);
  });

  test('filters the list to the tutorials whose title matches the search term', async ({ page }) => {
    const api = await stubApi(page);
    await page.goto('/tutorials');
    await expect(page.getByRole('article')).toHaveCount(3);

    await page.getByPlaceholder('Search by title').fill('Angular');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(page.getByRole('article').first()).toContainText('Angular routing basics');
    expect(api.calls.some((c) => c.method === 'GET' && c.url.includes('title=Angular'))).toBe(true);
  });

  test('shows the empty state when no title matches the search term', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await expect(page.getByRole('article')).toHaveCount(3);

    await page.getByPlaceholder('Search by title').fill('nothing-matches-this');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByRole('article')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
  });

  test('blocks the page behind a backdrop while the details drawer is open', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');

    await page.getByRole('article').first().click();
    await expect(page.getByRole('dialog', { name: 'Tutorial details' })).toBeVisible();

    // The modal backdrop swallows clicks aimed at the page behind it.
    await expect(
      page.getByRole('button', { name: 'Search' }).click({ timeout: 2_000 })
    ).rejects.toThrow(/intercepts pointer events/);
  });

  test('reopens the drawer on another tutorial after the first one is closed', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');

    await page.getByRole('article').first().click();
    const drawer = page.getByRole('dialog', { name: 'Tutorial details' });
    await expect(drawer).toContainText('Angular routing basics');

    await drawer.getByRole('button', { name: 'Close' }).click();
    await expect(drawer).toBeHidden();

    await page.getByRole('article').nth(1).click();
    await expect(drawer).toContainText('RxJS operators');
  });

  test('empties the list and the backing collection when Remove All is confirmed', async ({ page }) => {
    const api = await stubApi(page);
    await page.goto('/tutorials');
    await expect(page.getByRole('article')).toHaveCount(3);

    await page.getByRole('button', { name: 'Remove All' }).click();

    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    expect(api.tutorials).toHaveLength(0);
    expect(api.calls.filter((c) => c.method === 'DELETE')).toHaveLength(1);
  });

  test('keeps the tutorials on screen when Remove All fails on the server', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await expect(page.getByRole('article')).toHaveCount(3);

    // Re-route only the bulk delete to fail.
    await page.route(API_GLOB, (route, request) => {
      if (request.method() === 'DELETE') {
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
          body: JSON.stringify({ message: 'Could not remove all tutorials.' }),
        });
      }
      return route.fallback();
    });

    await page.getByRole('button', { name: 'Remove All' }).click();

    await expect(page.getByRole('article')).toHaveCount(sampleTutorials.length);
  });
});
