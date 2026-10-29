import { expect, test } from '@playwright/test';
import { stubApi, tutorial } from './support/api-stub';

// The tutorials API is not running in CI; it is stubbed with page.route.
test.describe('navigation and bulk delete', () => {
  test('the root url redirects to the tutorials list', async ({ page }) => {
    await stubApi(page, { list: [] });

    await page.goto('/');

    await expect(page).toHaveURL(/\/tutorials$/);
    await expect(page.getByRole('heading', { name: 'Tutorials', exact: true })).toBeVisible();
  });

  test('the header links move between the list and the add form', async ({ page }) => {
    await stubApi(page, { list: [] });

    await page.goto('/tutorials');
    await page.getByRole('link', { name: 'Add Tutorial' }).click();

    await expect(page).toHaveURL(/\/add$/);
    await expect(page.getByRole('heading', { name: 'Add Tutorial' })).toBeVisible();

    await page.getByRole('link', { name: 'Tutorials', exact: true }).click();

    await expect(page).toHaveURL(/\/tutorials$/);
  });

  test('Remove All deletes the collection and leaves the empty state', async ({ page }) => {
    let cleared = false;
    const calls: string[] = [];
    await page.route('**/api/tutorials**', async (route, request) => {
      calls.push(`${request.method()} ${request.url()}`);
      if (request.method() === 'DELETE') {
        cleared = true;
        return route.fulfill({ status: 200, contentType: 'application/json', body: '{"message":"ok"}' });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cleared ? [] : [tutorial({ id: 1, title: 'Angular Basics' })]),
      });
    });

    await page.goto('/tutorials');
    await expect(page.getByRole('heading', { name: 'Angular Basics' })).toBeVisible();

    await page.getByRole('button', { name: 'Remove All' }).click();

    await expect(page.getByRole('heading', { name: 'No tutorials yet' })).toBeVisible();
    expect(calls.some((c) => c.startsWith('DELETE'))).toBe(true);
  });

  test('an unknown url leaves the user on a rendered page rather than a blank screen', async ({ page }) => {
    await stubApi(page, { list: [] });

    await page.goto('/no-such-page');

    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
