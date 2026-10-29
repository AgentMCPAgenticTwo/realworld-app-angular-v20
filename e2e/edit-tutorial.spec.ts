import { expect, test } from '@playwright/test';
import { stubApi, TUTORIALS } from './support/api-stub';

// Backend stubbed with page.route (contract shapes) — no server runs in CI.

test.describe('edit a tutorial', () => {
  test('loads the tutorial from the route id into the edit form', async ({ page }) => {
    await stubApi(page);

    await page.goto(`/tutorials/${TUTORIALS[0].id}`);

    await expect(page.getByRole('heading', { name: 'Edit Tutorial' })).toBeVisible();
    await expect(page.getByLabel('Title')).toHaveValue('Angular signals');
    await expect(page.getByLabel('Description')).toHaveValue('Reactive primitives in Angular');
  });

  test('Update sends the edited fields and confirms the update', async ({ page }) => {
    const calls = await stubApi(page);
    await page.goto(`/tutorials/${TUTORIALS[0].id}`);
    await expect(page.getByLabel('Title')).toHaveValue('Angular signals');

    await page.getByLabel('Title').fill('Angular signals, revised');
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByRole('alert')).toHaveText(/updated successfully/i);
    const put = calls.find((c) => c.method === 'PUT');
    expect(put?.url).toContain(`/api/tutorials/${TUTORIALS[0].id}`);
    expect(put?.body).toMatchObject({ title: 'Angular signals, revised' });
  });

  test('shows no confirmation when the update request fails', async ({ page }) => {
    await stubApi(page, { writeStatus: 500 });
    await page.goto(`/tutorials/${TUTORIALS[0].id}`);
    await expect(page.getByLabel('Title')).toHaveValue('Angular signals');

    await page.getByLabel('Title').fill('Will not stick');
    await page.getByRole('button', { name: 'Update' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('UnPublish on the edit page flips the status pill', async ({ page }) => {
    const calls = await stubApi(page);
    await page.goto(`/tutorials/${TUTORIALS[0].id}`);
    await expect(page.locator('.tm-pill-published')).toBeVisible();

    await page.getByRole('button', { name: 'UnPublish' }).click();

    await expect(page.locator('.tm-pill-pending')).toBeVisible();
    expect(calls.find((c) => c.method === 'PUT')?.body).toMatchObject({ published: false });
  });

  test('Delete removes the tutorial and returns to the list', async ({ page }) => {
    const calls = await stubApi(page);
    await page.goto(`/tutorials/${TUTORIALS[0].id}`);
    await expect(page.getByLabel('Title')).toHaveValue('Angular signals');

    await page.getByRole('button', { name: 'Delete' }).click();

    await expect(page).toHaveURL(/\/tutorials$/);
    await expect(page.getByRole('heading', { name: 'Tutorials', level: 4 })).toBeVisible();
    expect(calls.some((c) => c.method === 'DELETE' && c.url.includes(`/api/tutorials/${TUTORIALS[0].id}`))).toBe(true);
  });

  test('shows "Cannot access this Tutorial..." for an id that does not exist', async ({ page }) => {
    await stubApi(page, { detail: null });

    await page.goto('/tutorials/99999');

    await expect(page.getByText('Cannot access this Tutorial...')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Edit Tutorial' })).toHaveCount(0);
  });
});
