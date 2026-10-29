import { expect, test } from '@playwright/test';
import { stubApi, tutorial } from './support/api-stub';

// The tutorials API is not running in CI; it is stubbed with page.route.
test.describe('edit tutorial', () => {
  test('loads the tutorial into the edit form', async ({ page }) => {
    await stubApi(page, { byId: tutorial({ id: 7, title: 'NgRx', description: 'State management' }) });

    await page.goto('/tutorials/7');

    await expect(page.getByRole('heading', { name: 'Edit Tutorial' })).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('NgRx');
    await expect(page.getByLabel('Description')).toHaveValue('State management');
    await expect(page.getByText('Pending')).toBeVisible();
  });

  test('sends the edited values and confirms the update', async ({ page }) => {
    const calls = await stubApi(page, { byId: tutorial({ id: 7 }) });

    await page.goto('/tutorials/7');
    await page.getByLabel('Title').fill('Updated title');
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByRole('alert')).toHaveText(/updated successfully/i);
    const put = calls.find((c) => c.method === 'PUT');
    expect(put?.url).toContain('/api/tutorials/7');
    expect(put?.body).toMatchObject({ title: 'Updated title' });
  });

  test('publishing a pending tutorial swaps the action to UnPublish', async ({ page }) => {
    const calls = await stubApi(page, { byId: tutorial({ id: 7, published: false }) });

    await page.goto('/tutorials/7');
    await page.getByRole('button', { name: 'Publish' }).click();

    await expect(page.getByRole('button', { name: 'UnPublish' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Publish', exact: true })).toHaveCount(0);
    expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ published: true });
  });

  test('unpublishing a published tutorial swaps the action back to Publish', async ({ page }) => {
    const calls = await stubApi(page, { byId: tutorial({ id: 7, published: true }) });

    await page.goto('/tutorials/7');
    await page.getByRole('button', { name: 'UnPublish' }).click();

    await expect(page.getByRole('button', { name: 'Publish', exact: true })).toBeVisible();
    expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ published: false });
  });

  test('deleting the tutorial returns the user to the list', async ({ page }) => {
    const calls = await stubApi(page, { byId: tutorial({ id: 7 }), list: [] });

    await page.goto('/tutorials/7');
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page).toHaveURL(/\/tutorials$/);
    expect(calls.some((c) => c.method === 'DELETE' && c.url.endsWith('/api/tutorials/7'))).toBe(true);
  });

  test('shows a cannot-access message when the tutorial does not exist', async ({ page }) => {
    await stubApi(page, { byId: null });

    await page.goto('/tutorials/does-not-exist');

    await expect(page.getByText('Cannot access this Tutorial...')).toBeVisible();
  });

  test('shows a cannot-access message when the API fails', async ({ page }) => {
    await stubApi(page, { failStatus: 500 });

    await page.goto('/tutorials/7');

    await expect(page.getByText('Cannot access this Tutorial...')).toBeVisible();
  });
});
