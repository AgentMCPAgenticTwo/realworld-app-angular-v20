import { expect, test } from '@playwright/test';
import { stubApi, TUTORIALS } from './support/api-stub';

// Backend stubbed with page.route (contract shapes) — no server runs in CI.

const drawer = (page: import('@playwright/test').Page) =>
  page.getByRole('dialog', { name: 'Tutorial details' });

test.describe('tutorial details drawer', () => {
  test('opens with the details of the tutorial card that was clicked', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');

    await page.locator('article.tutorial-card').first().click();

    await expect(drawer(page)).toBeVisible();
    await expect(drawer(page)).toContainText('Angular signals');
    await expect(drawer(page)).toContainText('Reactive primitives in Angular');
    await expect(drawer(page)).toContainText('Published');
  });

  test('shows "Not found" when the tutorial no longer exists', async ({ page }) => {
    await stubApi(page, { detail: null });
    await page.goto('/tutorials');

    await page.locator('article.tutorial-card').first().click();

    await expect(drawer(page).getByText('Not found')).toBeVisible();
  });

  test('publishing a pending tutorial sends published=true and confirms the change', async ({ page }) => {
    const calls = await stubApi(page);
    await page.goto('/tutorials');

    await page.locator('article.tutorial-card').nth(1).click();
    await expect(drawer(page)).toContainText('Pending');
    await drawer(page).getByRole('button', { name: 'Publish' }).click();

    await expect(drawer(page)).toContainText('Tutorial was updated successfully.');
    await expect(drawer(page).getByRole('button', { name: 'UnPublish' })).toBeVisible();
    const put = calls.find((c) => c.method === 'PUT');
    expect(put?.url).toContain(`/api/tutorials/${TUTORIALS[1].id}`);
    expect(put?.body).toMatchObject({ published: true });
  });

  test('unpublishing a published tutorial sends published=false', async ({ page }) => {
    const calls = await stubApi(page);
    await page.goto('/tutorials');

    await page.locator('article.tutorial-card').first().click();
    await drawer(page).getByRole('button', { name: 'UnPublish' }).click();

    await expect(drawer(page).getByRole('button', { name: 'Publish', exact: true })).toBeVisible();
    expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ published: false });
  });

  test('deleting from the drawer closes it and refreshes the list', async ({ page }) => {
    const calls = await stubApi(page);
    await page.goto('/tutorials');

    await page.locator('article.tutorial-card').first().click();
    await drawer(page).getByRole('button', { name: 'Delete' }).click();

    await expect(drawer(page)).toHaveCount(0);
    expect(calls.some((c) => c.method === 'DELETE' && c.url.includes(`/api/tutorials/${TUTORIALS[0].id}`))).toBe(true);
  });

  test('leaves the drawer open when the delete request fails', async ({ page }) => {
    await stubApi(page, { writeStatus: 500 });
    await page.goto('/tutorials');

    await page.locator('article.tutorial-card').first().click();
    await drawer(page).getByRole('button', { name: 'Delete' }).click();

    await expect(drawer(page)).toBeVisible();
    await expect(drawer(page)).toContainText('Angular signals');
  });

  test('the Close button dismisses the drawer', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await page.locator('article.tutorial-card').first().click();
    await expect(drawer(page)).toBeVisible();

    await page.getByRole('button', { name: 'Close' }).click();

    await expect(drawer(page)).toHaveCount(0);
  });

  test('Edit navigates to the edit page for that tutorial', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await page.locator('article.tutorial-card').first().click();

    await drawer(page).getByRole('link', { name: 'Edit' }).click();

    await expect(page).toHaveURL(new RegExp(`/tutorials/${TUTORIALS[0].id}$`));
    await expect(page.getByRole('heading', { name: 'Edit Tutorial' })).toBeVisible();
  });
});
