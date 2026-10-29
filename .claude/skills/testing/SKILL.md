---
name: testing
description: Stack-specific recipes for writing and running unit, integration, e2e (Playwright) and exploratory QA tests in this repo. Load it whenever you write or run tests here.
---

# Testing recipes

Use these only where the repo has no established pattern of its own. CLAUDE.md's
"Testing agent" block always wins.

## React / Vite / Next (Vitest + Testing Library + MSW)

Never edit `vite.config.*` — it is application config, and the workflow reverts any change
to it before the tests are measured. Put every test setting (environment, setup files, the
env vars the app needs under test) in `vitest.config.*`, which takes precedence over
`vite.config.*` and keeps the app's plugins and aliases via `mergeConfig`:

```ts
// vitest.config.ts  (extend the repo's own one if it already has it)
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';
export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['e2e/**', 'node_modules/**'],
    // env the app reads at import time (e.g. VITE_API_BASE_URL); MSW answers that host
    env: { VITE_API_BASE_URL: 'http://api.test' },
    coverage: { provider: 'v8', reporter: ['text', 'json-summary'] },
  },
}));
```
If `vite.config.*` exports a function, call it first: `mergeConfig(viteConfig({ mode: 'test', command: 'serve' }), ...)`.

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```tsx
it('shows a validation error when the email is malformed', async () => {
  const user = userEvent.setup();
  render(<SignupForm />);
  await user.type(screen.getByLabelText(/email/i), 'not-an-email');
  await user.click(screen.getByRole('button', { name: /sign up/i }));
  expect(await screen.findByRole('alert')).toHaveTextContent(/valid email/i);
});
```

- Query by role/label/text (`getByRole`, `findByText`), `data-testid` only as a last resort.
- Wrap components that need providers (router, query client, store, theme) with the
  repo's own test render helper, or write one `renderWithProviders` in `src/test/`.
- Network: MSW handlers per test (`server.use(...)`) for error/empty/slow cases.

## Playwright e2e (UI repos)

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';
const PORT = Number(process.env.APP_PORT ?? 5173);
export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 1 : 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npm run dev', port: PORT, reuseExistingServer: true, timeout: 120_000 },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
```

```ts
test('a user can add an item to the cart', async ({ page }) => {
  await page.goto('/products');
  await page.getByRole('button', { name: 'Add to cart' }).first().click();
  await expect(page.getByRole('link', { name: /cart/i })).toContainText('1');
});
```

- Web-first assertions only (`await expect(locator).toBeVisible()`), never `waitForTimeout`.
- Stub backend calls the UI repo cannot reach with `page.route('**/api/**', ...)`, using
  response shapes from the module contract — and say so in the test name/comment.
- Accessibility smoke per key page: `new AxeBuilder({ page }).analyze()` from
  `@axe-core/playwright`; assert no `critical`/`serious` violations, report the rest.

## Node API (Jest/Vitest + Supertest)

```ts
describe('POST /orders', () => {
  it('rejects an order with no items with 400', async () => {
    const res = await request(app).post('/orders').send({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/items/i);
  });
});
```

- NestJS: build the app with `Test.createTestingModule({ imports: [AppModule] })`, override
  only external providers (`.overrideProvider(MailService).useValue(fake)`), `app.init()`.
- Real DB for integration tests when TASK.md lists a service container; truncate tables
  in `beforeEach`. Otherwise use the repo's in-memory/sqlite option, never a shared DB.

## Python (pytest)

```python
def test_create_user_rejects_duplicate_email(client, user_factory):
    user_factory(email="a@example.com")
    resp = client.post("/users", json={"email": "a@example.com", "name": "A"})
    assert resp.status_code == 409
    assert "already" in resp.json()["detail"].lower()
```

- Fixtures in `tests/conftest.py`; `TestClient`/`httpx.AsyncClient(transport=ASGITransport(app))`
  for FastAPI, Django's `client` fixture via pytest-django if present.
- `@pytest.mark.parametrize` for boundary tables; `freezegun`/`time-machine` for time.

## JVM / .NET / Go (brief)

- Spring: `@WebMvcTest` slices for controllers, `@DataJpaTest` for repositories,
  `@SpringBootTest` + Testcontainers only for true integration tests (`*IT.java`).
- .NET: a `<Project>.Tests` xUnit project referencing the app; `WebApplicationFactory<Program>`
  for API tests.
- Go: table-driven tests with `t.Run`, `httptest.NewRecorder` / `httptest.NewServer`.

## Exploratory QA with the Playwright MCP browser

1. Open `$APP_URL`. For each user story's acceptance criteria, perform the flow as a user
   would, through the browser tools — not by reading code.
2. At each key screen: check the console for errors, failed network requests, broken
   images/links, unlabeled controls, layout at 375px / 768px / 1280px widths.
3. Try the unhappy paths: empty submit, invalid formats, very long input, double-click
   submit, back button mid-flow, refresh mid-flow.
4. Take a screenshot of every issue; save under `.test-gen/qa/` with a descriptive name.
5. Every issue goes to `findings` with `source: "qa"`, steps to reproduce in `evidence`.
