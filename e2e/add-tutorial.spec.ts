import { expect, test } from '@playwright/test';
import { stubApi } from './support/api-stub';

// The tutorials API is not running in CI; it is stubbed with page.route.
test.describe('add tutorial', () => {
  test('creates a tutorial and confirms the submission', async ({ page }) => {
    const calls = await stubApi(page);

    await page.goto('/add');
    await page.getByLabel('Title').fill('Testing with Playwright');
    await page.getByLabel('Description').fill('End to end flows');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('alert')).toHaveText(/submitted successfully/i);

    const post = calls.find((c) => c.method === 'POST');
    expect(post?.body).toEqual({
      title: 'Testing with Playwright',
      description: 'End to end flows',
    });
  });

  test('clears the form when adding another tutorial after a successful submit', async ({ page }) => {
    await stubApi(page);

    await page.goto('/add');
    await page.getByLabel('Title').fill('First');
    await page.getByLabel('Description').fill('First description');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    await page.getByRole('button', { name: 'Add another' }).click();

    await expect(page.getByLabel('Title')).toHaveValue('');
    await expect(page.getByLabel('Description')).toHaveValue('');
    await expect(page.getByRole('alert')).toHaveCount(0);
  });

  test('keeps the form open and does not confirm success when the API rejects the create', async ({ page }) => {
    await stubApi(page, { failStatus: 500 });

    await page.goto('/add');
    await page.getByLabel('Title').fill('Will fail');
    await page.getByLabel('Description').fill('server is down');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByLabel('Title')).toHaveValue('Will fail');
  });

  // KNOWN-DEFECT: finding "Add Tutorial submits an empty tutorial" -- the Submit
  // button posts to the API even when the required title/description are blank,
  // and the UI then reports success for an empty record.
  test.fixme('does not submit when the required title and description are empty', async ({ page }) => {
    const calls = await stubApi(page);

    await page.goto('/add');
    await page.getByRole('button', { name: 'Submit' }).click();

    expect(calls.filter((c) => c.method === 'POST')).toHaveLength(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});
