import { expect, test } from '@playwright/test';
import { stubApi, TUTORIALS } from './support/api-stub';

// The backend (http://localhost:5001/api) is not running in CI; all requests are
// stubbed with page.route using the API contract response shapes.

test.describe('tutorials list', () => {
  test('shows every tutorial returned by the API with its published status', async ({ page }) => {
    await stubApi(page);

    await page.goto('/tutorials');

    const cards = page.locator('article.tutorial-card');
    await expect(cards).toHaveCount(TUTORIALS.length);
    await expect(page.getByRole('heading', { name: 'Angular signals', level: 5 })).toBeVisible();
    await expect(cards.nth(0)).toContainText('Published');
    await expect(cards.nth(1)).toContainText('Pending');
    await expect(page.getByText('map, switchMap and friends')).toBeVisible();
  });

  test('shows the empty state when the API returns no tutorials', async ({ page }) => {
    await stubApi(page, { list: [] });

    await page.goto('/tutorials');

    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    await expect(page.locator('article.tutorial-card')).toHaveCount(0);
  });

  test('shows the empty state when the tutorials request fails', async ({ page }) => {
    await stubApi(page, { listStatus: 500 });

    await page.goto('/tutorials');

    // The app has no error banner: a failed load leaves the list undefined, which the
    // template renders as the empty state.
    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    await expect(page.locator('article.tutorial-card')).toHaveCount(0);
  });

  test('searching by title requests the matching title and renders only the matches', async ({ page }) => {
    const calls = await stubApi(page);
    await page.goto('/tutorials');
    await expect(page.locator('article.tutorial-card')).toHaveCount(2);

    await page.getByPlaceholder('Search by title').fill('RxJS');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.locator('article.tutorial-card')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'RxJS operators', level: 5 })).toBeVisible();
    expect(calls.some((c) => c.method === 'GET' && c.url.includes('title=RxJS'))).toBe(true);
  });

  test('searching for a title that does not exist shows the empty state', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await expect(page.locator('article.tutorial-card')).toHaveCount(2);

    await page.getByPlaceholder('Search by title').fill('nothing-matches-this');
    await page.getByRole('button', { name: 'Search' }).click();

    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
  });

  test('Remove All deletes the whole collection and reloads an empty list', async ({ page }) => {
    // stateful stub: the server starts with two tutorials and is emptied by the DELETE
    let list = [...TUTORIALS];
    let deleted = false;
    await page.route('**/api/tutorials**', async (route, request) => {
      const json = (payload: unknown) =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
      if (request.method() === 'DELETE') {
        deleted = true;
        list = [];
        return json({ message: 'All tutorials were deleted successfully!' });
      }
      return json(list);
    });

    await page.goto('/tutorials');
    await expect(page.locator('article.tutorial-card')).toHaveCount(2);

    await page.getByRole('button', { name: 'Remove All' }).click();

    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    expect(deleted).toBe(true);
  });

  test('keeps the tutorials on screen when Remove All fails', async ({ page }) => {
    await stubApi(page, { writeStatus: 500 });
    await page.goto('/tutorials');
    await expect(page.locator('article.tutorial-card')).toHaveCount(2);

    await page.getByRole('button', { name: 'Remove All' }).click();

    await expect(page.locator('article.tutorial-card')).toHaveCount(2);
  });
});
