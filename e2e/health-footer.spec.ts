import { expect, test } from '@playwright/test';
import { stubApi } from './support/api-stub';

/**
 * Story under test: "Add a GET /api/health endpoint that returns { status: 'ok' },
 * and show 'API: ok' in the page footer using it."
 *
 * The backend is stubbed with page.route; GET **\/api/health returns the contract
 * response so the only thing these tests measure is the front-end behaviour.
 */
test.describe('footer API health indicator', () => {
  test.beforeEach(async ({ page }) => {
    await stubApi(page);
    await page.route('**/api/health', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'ok' }) }),
    );
  });

  // KNOWN-DEFECT: finding "Footer never shows the API health status (story unimplemented)".
  // src/app/app.component.html renders only "© Tutorial Manager" / "Built with Angular";
  // nothing requests /api/health.
  test.fixme('shows "API: ok" in the footer when the health endpoint reports ok', async ({ page }) => {
    await page.goto('/tutorials');

    await expect(page.getByRole('contentinfo')).toContainText('API: ok');
  });

  // KNOWN-DEFECT: same finding — no request is made, so no status can be displayed.
  test.fixme('requests the health endpoint when the app loads', async ({ page }) => {
    const health = page.waitForRequest('**/api/health', { timeout: 5000 });

    await page.goto('/tutorials');

    await expect(health).resolves.toBeTruthy();
  });

  test('the footer currently renders no API status at all (documents the gap)', async ({ page }) => {
    await page.goto('/tutorials');

    const footer = page.getByRole('contentinfo');
    await expect(footer).toContainText('Tutorial Manager');
    await expect(footer).not.toContainText(/API:/i);
  });
});
