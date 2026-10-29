import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { stubApi, tutorial } from './support/api-stub';

// The tutorials API is not running in CI; it is stubbed with page.route.
const blocking = (violations: { impact?: string | null }[]) =>
  violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');

test.describe('accessibility smoke', () => {
  // KNOWN-DEFECT: finding "serious accessibility violations on every page" -- axe reports
  // `listitem` (<li> nav items are not inside a <ul>, header.component.html) and
  // `color-contrast` on the shared chrome, so this fails on every page of the app.
  test.fixme('thetutorials list has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page, { list: [tutorial({ id: 1 }), tutorial({ id: 2, published: true })] });
    await page.goto('/tutorials');
    await expect(page.getByRole('heading', { name: 'Tutorials' })).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();

    expect(blocking(violations).map((v: any) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  // KNOWN-DEFECT: finding "serious accessibility violations on every page" -- axe reports
  // `listitem` (<li> nav items are not inside a <ul>, header.component.html) and
  // `color-contrast` on the shared chrome, so this fails on every page of the app.
  test.fixme('theadd tutorial form has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page);
    await page.goto('/add');
    await expect(page.getByRole('heading', { name: 'Add Tutorial' })).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();

    expect(blocking(violations).map((v: any) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  // KNOWN-DEFECT: finding "serious accessibility violations on every page" -- axe reports
  // `listitem` (<li> nav items are not inside a <ul>, header.component.html) and
  // `color-contrast` on the shared chrome, so this fails on every page of the app.
  test.fixme('theedit tutorial page has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page, { byId: tutorial({ id: 7 }) });
    await page.goto('/tutorials/7');
    await expect(page.getByRole('heading', { name: 'Edit Tutorial' })).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();

    expect(blocking(violations).map((v: any) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  // KNOWN-DEFECT: finding "serious accessibility violations on every page" -- axe reports
  // `listitem` (<li> nav items are not inside a <ul>, header.component.html) and
  // `color-contrast` on the shared chrome, so this fails on every page of the app.
  test.fixme('thedetails drawer has no serious or critical accessibility violations', async ({ page }) => {
    const row = tutorial({ id: 3, title: 'Signals' });
    await stubApi(page, { list: [row], byId: row });
    await page.goto('/tutorials');
    await page.getByRole('heading', { name: 'Signals' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();

    const { violations } = await new AxeBuilder({ page }).analyze();

    expect(blocking(violations).map((v: any) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
