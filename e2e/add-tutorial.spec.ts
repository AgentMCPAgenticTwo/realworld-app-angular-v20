import { expect, test } from '@playwright/test';
import { stubApi, stubApiFailure } from './support/api';

// The tutorials API is stubbed with `page.route` (see e2e/support/api.ts).

test.describe('Add a tutorial', () => {
  test('creates the tutorial and confirms the submission', async ({ page }) => {
    const api = await stubApi(page, { tutorials: [] });

    await page.goto('/add');
    await page.getByLabel('Title').fill('Signals in Angular');
    await page.getByLabel('Description').fill('Fine grained reactivity.');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('alert')).toHaveText('Tutorial was submitted successfully!');
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect(api.calls.find((c) => c.method === 'POST')?.body).toEqual({
      title: 'Signals in Angular',
      description: 'Fine grained reactivity.',
    });
  });

  test('shows the new tutorial on the list after it is created', async ({ page }) => {
    await stubApi(page, { tutorials: [] });

    await page.goto('/add');
    await page.getByLabel('Title').fill('Signals in Angular');
    await page.getByLabel('Description').fill('Fine grained reactivity.');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    await page.getByRole('link', { name: 'Tutorials', exact: true }).click();

    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(page.getByRole('article').first()).toContainText('Signals in Angular');
    await expect(page.getByRole('article').first()).toContainText('Pending');
  });

  test('clears the form when another tutorial is added after a submission', async ({ page }) => {
    await stubApi(page, { tutorials: [] });

    await page.goto('/add');
    await page.getByLabel('Title').fill('Signals in Angular');
    await page.getByLabel('Description').fill('Fine grained reactivity.');
    await page.getByRole('button', { name: 'Submit' }).click();
    await expect(page.getByRole('alert')).toBeVisible();

    await page.getByRole('button', { name: 'Add another' }).click();

    await expect(page.getByRole('alert')).toBeHidden();
    await expect(page.getByLabel('Title')).toHaveValue('');
    await expect(page.getByLabel('Description')).toHaveValue('');
  });

  test('submits an empty title and description when the form is submitted blank', async ({ page }) => {
    const api = await stubApi(page, { tutorials: [] });

    await page.goto('/add');
    await page.getByRole('button', { name: 'Submit' }).click();

    // KNOWN DEFECT (see findings): the required inputs are not validated, so a blank
    // tutorial is posted and reported as a success.
    await expect(page.getByRole('alert')).toHaveText('Tutorial was submitted successfully!');
    expect(api.calls.find((c) => c.method === 'POST')?.body).toEqual({
      title: '',
      description: '',
    });
  });

  test('keeps the form on screen when the server rejects the creation', async ({ page }) => {
    await stubApiFailure(page, 500);

    await page.goto('/add');
    await page.getByLabel('Title').fill('Signals in Angular');
    await page.getByLabel('Description').fill('Fine grained reactivity.');
    await page.getByRole('button', { name: 'Submit' }).click();

    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByLabel('Title')).toHaveValue('Signals in Angular');
  });

  test('replaces the form after a submission so the tutorial cannot be posted twice', async ({ page }) => {
    const api = await stubApi(page, { tutorials: [] });

    await page.goto('/add');
    await page.getByLabel('Title').fill('Double submit');
    await page.getByLabel('Description').fill('Clicked twice.');
    const submit = page.getByRole('button', { name: 'Submit' });
    await submit.click();
    await expect(page.getByRole('alert')).toBeVisible();

    // KNOWN DEFECT (see findings): nothing disables Submit, but after the first
    // success the button is swapped out, so a second click cannot duplicate.
    expect(api.calls.filter((c) => c.method === 'POST')).toHaveLength(1);
    expect(api.tutorials).toHaveLength(1);
  });
});
