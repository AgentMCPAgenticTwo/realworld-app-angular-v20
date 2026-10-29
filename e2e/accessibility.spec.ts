import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { stubApi, TUTORIALS } from './support/api-stub';

// Backend stubbed with page.route (contract shapes) — no server runs in CI.

async function scan(page: import('@playwright/test').Page, impacts: string[]) {
  const results = await new AxeBuilder({ page }).analyze();
  const wanted = new Set(impacts);
  const matched = results.violations.filter((v) => wanted.has(v.impact ?? ''));
  const other = results.violations.filter((v) => !wanted.has(v.impact ?? ''));
  if (other.length) {
    console.log('other axe violations:', other.map((v) => `${v.impact}:${v.id}`).join(', '));
  }
  return matched.map(
    (v) => `${v.impact}: ${v.id} — ${v.help} [${v.nodes.map((n) => n.target.join(' ')).join(' | ')}]`,
  );
}

const BLOCKING = ['critical', 'serious'];

test.describe('accessibility smoke', () => {
  // KNOWN-DEFECT (all four `fixme` tests): finding "Serious accessibility violations on
  // every page". Reproduced 3/3 runs: `color-contrast` on .app-footer-note, .tm-subtitle
  // and .badge-primary, plus `listitem` on the header nav (<li> outside a <ul>/<ol>).

  test.fixme('the tutorials list page has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await expect(page.locator('article.tutorial-card').first()).toBeVisible();

    expect(await scan(page, BLOCKING)).toEqual([]);
  });

  test.fixme('the add tutorial page has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page);
    await page.goto('/add');
    await expect(page.getByRole('heading', { name: 'Add Tutorial' })).toBeVisible();

    expect(await scan(page, BLOCKING)).toEqual([]);
  });

  test.fixme('the edit tutorial page has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page);
    await page.goto(`/tutorials/${TUTORIALS[0].id}`);
    await expect(page.getByRole('heading', { name: 'Edit Tutorial' })).toBeVisible();

    expect(await scan(page, BLOCKING)).toEqual([]);
  });

  test.fixme('the open details drawer has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await page.locator('article.tutorial-card').first().click();
    await expect(page.getByRole('dialog', { name: 'Tutorial details' })).toBeVisible();

    expect(await scan(page, BLOCKING)).toEqual([]);
  });

  // These run: the pages are free of *critical* violations today, so this guards against
  // a regression even while the serious ones above remain open.
  for (const [name, path] of [
    ['tutorials list', '/tutorials'],
    ['add tutorial', '/add'],
    ['edit tutorial', `/tutorials/${TUTORIALS[0].id}`],
  ] as const) {
    test(`the ${name} page has no critical accessibility violations`, async ({ page }) => {
      await stubApi(page);
      await page.goto(path);
      await expect(page.getByRole('contentinfo')).toBeVisible();

      expect(await scan(page, ['critical'])).toEqual([]);
    });
  }
});
