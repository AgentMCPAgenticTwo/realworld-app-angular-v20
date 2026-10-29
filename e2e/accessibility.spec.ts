import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { stubApi } from './support/api';

// The tutorials API is stubbed with `page.route` (see e2e/support/api.ts).

async function scan(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const blocking = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical'
  );
  return {
    blocking: blocking.map(
      (v) => `${v.id} (${v.impact}) on ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`
    ),
    other: results.violations
      .filter((v) => v.impact !== 'serious' && v.impact !== 'critical')
      .map((v) => `${v.id} (${v.impact})`),
  };
}

// KNOWN-DEFECT: every page in this app fails two serious axe rules, so all four smoke
// checks below are red against the app as it is and are marked `fixme`:
//   * `listitem` — the nav in src/app/components/header/header.component.html puts two
//     <li> elements directly inside <div class="navbar-nav">, with no <ul>/<ol> parent.
//   * `color-contrast` — `.app-footer-note`, `.tm-subtitle` and `.badge-primary` do not
//     meet the 4.5:1 WCAG AA contrast ratio.
// See findings "navigation list items are not inside a list" and
// "text below the WCAG AA contrast ratio on every page".

test.describe('Accessibility smoke', () => {
  test.fixme('the tutorials list has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await expect(page.getByRole('article')).toHaveCount(3);

    const { blocking, other } = await scan(page);
    console.log('tutorials list – non-blocking violations:', other);
    expect(blocking).toEqual([]);
  });

  test.fixme('the open details drawer has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials');
    await page.getByRole('article').first().click();
    await expect(page.getByRole('dialog', { name: 'Tutorial details' })).toBeVisible();

    const { blocking, other } = await scan(page);
    console.log('details drawer – non-blocking violations:', other);
    expect(blocking).toEqual([]);
  });

  test.fixme('the add tutorial page has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page, { tutorials: [] });
    await page.goto('/add');
    await expect(page.getByLabel('Title')).toBeVisible();

    const { blocking, other } = await scan(page);
    console.log('add tutorial – non-blocking violations:', other);
    expect(blocking).toEqual([]);
  });

  test.fixme('the edit tutorial page has no serious or critical accessibility violations', async ({ page }) => {
    await stubApi(page);
    await page.goto('/tutorials/2');
    await expect(page.getByLabel('Title')).toHaveValue('RxJS operators');

    const { blocking, other } = await scan(page);
    console.log('edit tutorial – non-blocking violations:', other);
    expect(blocking).toEqual([]);
  });
});
