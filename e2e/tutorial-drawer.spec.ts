import { expect, test } from '@playwright/test';
import { API_GLOB, stubApi } from './support/api';

// The tutorials API is stubbed with `page.route` (see e2e/support/api.ts).

test.describe('Tutorial details drawer', () => {
  test('shows the full details of the tutorial that was clicked', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');

    await page.getByRole('article').filter({ hasText: 'RxJS operators' }).click();

    const drawer = page.getByRole('dialog', { name: 'Tutorial details' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('RxJS operators');
    await expect(drawer).toContainText('map, switchMap and friends.');
    await expect(drawer).toContainText('Pending');
  });

  test('publishes a pending tutorial and persists the new status', async ({ page }) => {
    const api = await stubApi(page);
    await page.goto('/tutorials');
    await page.getByRole('article').filter({ hasText: 'RxJS operators' }).click();

    const drawer = page.getByRole('dialog', { name: 'Tutorial details' });
    await drawer.getByRole('button', { name: 'Publish' }).click();

    await expect(drawer).toContainText('Tutorial was updated successfully.');
    await expect(drawer.getByRole('button', { name: 'UnPublish' })).toBeVisible();
    expect(api.tutorials.find((t) => t.id === 2)?.published).toBe(true);
  });

  test('unpublishes a published tutorial', async ({ page }) => {
    const api = await stubApi(page);
    await page.goto('/tutorials');
    await page.getByRole('article').filter({ hasText: 'Angular routing basics' }).click();

    const drawer = page.getByRole('dialog', { name: 'Tutorial details' });
    await drawer.getByRole('button', { name: 'UnPublish' }).click();

    await expect(drawer.getByRole('button', { name: 'Publish', exact: true })).toBeVisible();
    expect(api.tutorials.find((t) => t.id === 1)?.published).toBe(false);
  });

  test('removes the tutorial from the list and closes the drawer when it is deleted', async ({ page }) => {
    const api = await stubApi(page);
    await page.goto('/tutorials');
    await page.getByRole('article').filter({ hasText: 'RxJS operators' }).click();

    const drawer = page.getByRole('dialog', { name: 'Tutorial details' });
    await drawer.getByRole('button', { name: 'Delete' }).click();

    await expect(drawer).toBeHidden();
    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(page.getByRole('article').filter({ hasText: 'RxJS operators' })).toHaveCount(0);
    expect(api.tutorials.map((t) => t.id)).toEqual([1, 3]);
  });

  test('shows "Not found" when the tutorial no longer exists on the server', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');

    // The tutorial disappears between the list fetch and the detail fetch.
    await page.route(API_GLOB, (route, request) => {
      if (request.method() === 'GET' && /\/tutorials\/2$/.test(new URL(request.url()).pathname)) {
        return route.fulfill({
          status: 404,
          contentType: 'application/json',
          headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' },
          body: JSON.stringify({ message: 'Cannot find Tutorial with id=2.' }),
        });
      }
      return route.fallback();
    });

    await page.getByRole('article').filter({ hasText: 'RxJS operators' }).click();

    const drawer = page.getByRole('dialog', { name: 'Tutorial details' });
    await expect(drawer).toContainText('Not found');
    await expect(drawer.getByRole('button', { name: 'Delete' })).toHaveCount(0);
  });

  test('closes the drawer when the backdrop is clicked', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await page.getByRole('article').first().click();

    const drawer = page.getByRole('dialog', { name: 'Tutorial details' });
    await expect(drawer).toBeVisible();

    await page.locator('.drawer-backdrop').click({ position: { x: 5, y: 5 } });

    await expect(drawer).toBeHidden();
  });

  test('navigates to the edit page from the drawer', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await page.getByRole('article').filter({ hasText: 'RxJS operators' }).click();

    await page
      .getByRole('dialog', { name: 'Tutorial details' })
      .getByRole('link', { name: 'Edit' })
      .click();

    await expect(page).toHaveURL(/\/tutorials\/2$/);
    await expect(page.getByRole('heading', { name: 'Edit Tutorial' })).toBeVisible();
  });
});
