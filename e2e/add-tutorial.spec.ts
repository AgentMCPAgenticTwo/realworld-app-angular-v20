import { expect, test } from '@playwright/test';
import { stubApi } from './support/api-stub';

// Backend stubbed with page.route (contract shapes) — no server runs in CI.

test.describe('add a tutorial', () => {
  test('submits the typed title and description and confirms the tutorial was saved', async ({ page }) => {
    const calls = await stubApi(page);

    await page.goto('/add');
    await page.getByLabel('Title').fill('Playwright basics');
    await page.getByLabel('Description').fill('Driving a real browser');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('alert')).toHaveText(/submitted successfully/i);
    const post = calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({ title: 'Playwright basics', description: 'Driving a real browser' });
  });

  test('offers "Add another", which clears the form for a new tutorial', async ({ page }) => {
    await stubApi(page);

    await page.goto('/add');
    await page.getByLabel('Title').fill('First one');
    await page.getByLabel('Description').fill('desc');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    await page.getByRole('button', { name: 'Add another' }).click();

    await expect(page.getByLabel('Title')).toHaveValue('');
    await expect(page.getByLabel('Description')).toHaveValue('');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('stays on the form without a success message when the API rejects the tutorial', async ({ page }) => {
    await stubApi(page, { writeStatus: 400 });

    await page.goto('/add');
    await page.getByLabel('Title').fill('Rejected');
    await page.getByLabel('Description').fill('nope');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByLabel('Title')).toHaveValue('Rejected');
  });

  // KNOWN-DEFECT: see finding "Add Tutorial submits an empty form with no validation".
  // The inputs are marked `required` but no validation runs: an empty submit POSTs
  // {title: "", description: ""} and the UI reports success.
  test.fixme('does not submit an empty form and reports a validation error', async ({ page }) => {
    const calls = await stubApi(page);

    await page.goto('/add');
    await page.getByRole('button', { name: 'Submit' }).click();

    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
    await expect(page.getByText(/submitted successfully/i)).toHaveCount(0);
  });

  test('empty submit currently POSTs an empty tutorial and shows success (documents the defect)', async ({ page }) => {
    const calls = await stubApi(page);

    await page.goto('/add');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('alert')).toHaveText(/submitted successfully/i);
    expect(calls.find((c) => c.method === 'POST')?.body).toEqual({ title: '', description: '' });
  });
});
