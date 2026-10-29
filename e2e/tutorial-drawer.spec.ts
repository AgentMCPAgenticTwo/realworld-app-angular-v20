import { expect, test } from '@playwright/test';
import { stubApi, tutorial } from './support/api-stub';

// The tutorials API is not running in CI; it is stubbed with page.route.
test.describe('tutorial details drawer', () => {
  const listed = tutorial({ id: 3, title: 'Signals', description: 'Reactive primitives' });

  test('opens with the selected tutorial when a card is clicked', async ({ page }) => {
    await stubApi(page, { list: [listed], byId: listed });

    await page.goto('/tutorials');
    await page.getByRole('heading', { name: 'Signals' }).click();

    const drawer = page.getByRole('dialog', { name: 'Tutorial details' });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Reactive primitives');
    await expect(drawer).toContainText('Pending');
  });

  test('closes when the close button is used', async ({ page }) => {
    await stubApi(page, { list: [listed], byId: listed });

    await page.goto('/tutorials');
    await page.getByRole('heading', { name: 'Signals' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('publishing from the drawer confirms the status update', async ({ page }) => {
    const calls = await stubApi(page, { list: [listed], byId: listed });

    await page.goto('/tutorials');
    await page.getByRole('heading', { name: 'Signals' }).click();
    await page.getByRole('button', { name: 'Publish' }).click();

    const drawer = page.getByRole('dialog');
    await expect(drawer).toContainText('updated successfully');
    await expect(drawer.getByRole('button', { name: 'UnPublish' })).toBeVisible();
    expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ published: true });
  });

  test('deleting from the drawer closes it and refreshes the list', async ({ page }) => {
    const calls = await stubApi(page, { list: [listed], byId: listed });

    await page.goto('/tutorials');
    await page.getByRole('heading', { name: 'Signals' }).click();
    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(calls.some((c) => c.method === 'DELETE' && c.url.endsWith('/api/tutorials/3'))).toBe(true);
    expect(calls.filter((c) => c.method === 'GET' && !c.url.includes('/tutorials/')).length).toBeGreaterThan(1);
  });

  test('shows Not found when the tutorial was removed behind the user', async ({ page }) => {
    await stubApi(page, { list: [listed], byId: null });

    await page.goto('/tutorials');
    await page.getByRole('heading', { name: 'Signals' }).click();

    await expect(page.getByRole('dialog')).toContainText('Not found');
  });
});
