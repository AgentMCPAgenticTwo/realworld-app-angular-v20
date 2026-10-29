import { expect, test } from '@playwright/test';
import { stubApi, tutorial } from './support/api-stub';

// The tutorials API is not running in CI; it is stubbed with page.route.
test.describe('tutorials list', () => {
  test('shows every tutorial returned by the API with its published status', async ({ page }) => {
    await stubApi(page, {
      list: [
        tutorial({ id: 1, title: 'Angular Basics', published: true }),
        tutorial({ id: 2, title: 'RxJS Operators', description: 'map, switchMap', published: false }),
      ],
    });

    await page.goto('/tutorials');

    await expect(page.getByRole('heading', { name: 'Angular Basics' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'RxJS Operators' })).toBeVisible();
    await expect(page.getByText('map, switchMap')).toBeVisible();
    await expect(page.getByText('Published')).toBeVisible();
    await expect(page.getByText('Pending')).toBeVisible();
  });

  test('shows the empty state when the API returns no tutorials', async ({ page }) => {
    await stubApi(page, { list: [] });

    await page.goto('/tutorials');

    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    await expect(page.locator('.tutorial-card')).toHaveCount(0);
  });

  test('keeps the page usable while the tutorials request is still in flight', async ({ page }) => {
    await stubApi(page, { list: [tutorial({ title: 'Slow Tutorial' })], delayMs: 1500 });

    await page.goto('/tutorials');

    // no cards yet while loading, search controls already available
    await expect(page.locator('.tutorial-card')).toHaveCount(0);
    await expect(page.getByPlaceholder('Search by title')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Slow Tutorial' })).toBeVisible({ timeout: 10_000 });
  });

  test('shows the empty state instead of crashing when the API fails with 500', async ({ page }) => {
    await stubApi(page, { failStatus: 500 });

    await page.goto('/tutorials');

    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tutorials', exact: true })).toBeVisible();
  });

  test('searching by title sends the title query and renders only the matches', async ({ page }) => {
    const calls = await stubApi(page, {
      list: [tutorial({ id: 1, title: 'Angular Basics' }), tutorial({ id: 2, title: 'RxJS Operators' })],
    });

    await page.goto('/tutorials');
    await expect(page.getByRole('heading', { name: 'RxJS Operators' })).toBeVisible();

    await page.getByPlaceholder('Search by title').fill('Angular');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByRole('heading', { name: 'RxJS Operators' })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Angular Basics' })).toBeVisible();
    expect(calls.some((c) => c.method === 'GET' && c.url.includes('title=Angular'))).toBe(true);
  });

  test('shows the empty state when a search matches nothing', async ({ page }) => {
    await stubApi(page, { list: [tutorial({ title: 'Angular Basics' })], searchResult: [] });

    await page.goto('/tutorials');
    await page.getByPlaceholder('Search by title').fill('nothing-matches-this');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
  });
});
