import { expect, test } from '@playwright/test';
import { stubApi, stubApiFailure } from './support/api';

// The tutorials API is stubbed with `page.route` (see e2e/support/api.ts).

test.describe('Edit a tutorial', () => {
  test('loads the tutorial addressed by the url into the form', async ({ page }) => {
    await stubApi(page);

    await page.goto('/tutorials/2');

    await expect(page.getByRole('heading', { name: 'Edit Tutorial' })).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('RxJS operators');
    await expect(page.getByLabel('Description')).toHaveValue('map, switchMap and friends.');
    await expect(page.getByText('Pending')).toBeVisible();
  });

  test('saves the edited title and description', async ({ page }) => {
    const api = await stubApi(page);
    await page.goto('/tutorials/2');
    await expect(page.getByLabel('Title')).toHaveValue('RxJS operators');

    await page.getByLabel('Title').fill('RxJS operators, revisited');
    await page.getByLabel('Description').fill('Now with concatMap.');
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByRole('alert')).toHaveText('Tutorial was updated successfully.');
    expect(api.tutorials.find((t) => t.id === 2)).toMatchObject({
      title: 'RxJS operators, revisited',
      description: 'Now with concatMap.',
    });
  });

  test('publishes the tutorial from the edit page', async ({ page }) => {
    const api = await stubApi(page);
    await page.goto('/tutorials/2');
    await expect(page.getByLabel('Title')).toHaveValue('RxJS operators');

    await page.getByRole('button', { name: 'Publish', exact: true }).click();

    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'UnPublish' })).toBeVisible();
    expect(api.tutorials.find((t) => t.id === 2)?.published).toBe(true);
  });

  test('returns to the list after the tutorial is deleted', async ({ page }) => {
    const api = await stubApi(page);
    await page.goto('/tutorials/2');
    await expect(page.getByLabel('Title')).toHaveValue('RxJS operators');

    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page).toHaveURL(/\/tutorials$/);
    await expect(page.getByRole('article')).toHaveCount(2);
    expect(api.tutorials.map((t) => t.id)).toEqual([1, 3]);
  });

  test('shows "Cannot access this Tutorial..." for an id that does not exist', async ({ page }) => {
    await stubApi(page);

    await page.goto('/tutorials/999');

    await expect(page.getByText('Cannot access this Tutorial...')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update' })).toHaveCount(0);
  });

  test('shows "Cannot access this Tutorial..." when the tutorial request fails', async ({ page }) => {
    await stubApiFailure(page, 500);

    await page.goto('/tutorials/2');

    await expect(page.getByText('Cannot access this Tutorial...')).toBeVisible();
  });

  test('does not confirm an update that the server rejected', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials/2');
    await expect(page.getByLabel('Title')).toHaveValue('RxJS operators');

    await stubApiFailure(page, 500);
    await page.getByLabel('Title').fill('Will not be saved');
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
