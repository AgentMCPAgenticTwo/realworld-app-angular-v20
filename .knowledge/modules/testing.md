---
type: Module
title: test suites (unit, integration, e2e)
description: The three-tier test suite — Karma/Jasmine unit and integration specs under `src/app`, and Playwright browser specs under `e2e/`.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/e2e
tags: [testing, karma, jasmine, playwright, accessibility]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T13:16:13Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ e44c79b17c2cab7387ac4928b2086bb0ef8c39c7
    title: Codebase knowledge graph
status: stable
---

# Tiers

| Tier | Location | Runner | Command |
| --- | --- | --- | --- |
| Unit | `src/app/**/*.spec.ts` (including `*.component.behaviour.spec.ts`) | Karma + Jasmine | `npm test` |
| Integration | `src/app/integration/*.integration.spec.ts` | Karma + Jasmine | `npm test` |
| E2E | `e2e/*.spec.ts` | Playwright (chromium) | `npm run test:e2e` |

Karma collects every `*.spec.ts` under `src`, so unit and integration specs run in
the same browser session; `playwright.config.ts` sets `testDir: './e2e'`, which keeps
the two runners disjoint.

# Unit specs

Each component/service/interceptor keeps its original `<name>.spec.ts` plus, for the
four screens, a behaviour spec that drives the component class directly:

| File | Covers |
| --- | --- |
| `src/app/components/tutorials-list/tutorials-list.component.behaviour.spec.ts` | list load, search, bulk delete, drawer id handling |
| `src/app/components/tutorial-details/tutorial-details.component.behaviour.spec.ts` | load by route param, update, publish toggle, delete |
| `src/app/components/tutorial-drawer/tutorial-drawer.component.behaviour.spec.ts` | `open` getter, `notFound` 404 branch, `closed`/`changed` outputs |
| `src/app/components/add-tutorial/add-tutorial.component.behaviour.spec.ts` | create, `message` feedback, `newTutorial` reset |
| `src/app/services/tutorial.service.spec.ts` | the five REST methods against `HttpTestingController` |
| `src/app/interceptors/api.interceptor.spec.ts` | relative-URL rewriting to `environment.apiUrl` |

See [tutorials-list](/modules/components-tutorials-list.md),
[tutorial-details](/modules/components-tutorial-details.md),
[tutorial-drawer](/modules/components-tutorial-drawer.md),
[add-tutorial](/modules/components-add-tutorial.md),
[services](/modules/services.md) and [interceptors](/modules/interceptors.md).

# Integration specs

`src/app/integration/` wires real components with the real router/template and mocks
only the HTTP boundary via `HttpClientTestingModule`:

| File | Covers |
| --- | --- |
| `app-shell.integration.spec.ts` | the shell renders header, `<router-outlet>` and the footer health text from the `/health` probe ([app-shell](/modules/app-shell.md)) |
| `tutorials-list.integration.spec.ts` | loading, empty, error and populated states of the list screen |
| `tutorials-list-drawer.integration.spec.ts` | list ↔ drawer interaction through `@Input`/`@Output` |
| `tutorial-details.integration.spec.ts` | the `tutorials/:id` screen with an activated-route id |
| `add-tutorial.integration.spec.ts` | template-driven form submit through `ngModel` |
| `api-client.integration.spec.ts` | `ApiInterceptor` + the services together, asserting the absolute URLs that reach the backend |

# E2E specs

`e2e/support/api-stub.ts` exports `stubApi(page, options)`, which installs
`page.route` handlers for the backend (which is not running in CI) and returns the
recorded `ApiCall[]` so a spec can assert the request the UI actually sent. It also
exports the `TUTORIALS` fixture and the `Tutorial` / `ApiCall` / `StubOptions` types.
`StubOptions` has `list`, `detail`, `listStatus` and `writeStatus` so a spec can force
empty, 404 and failed-mutation paths.

| Spec | Covers |
| --- | --- |
| `e2e/tutorials-list.spec.ts` | list render, title search, empty and error states |
| `e2e/tutorial-drawer.spec.ts` | opening, publishing and deleting from the drawer |
| `e2e/add-tutorial.spec.ts` | create flow and success message |
| `e2e/edit-tutorial.spec.ts` | `tutorials/:id` update and delete |
| `e2e/health-footer.spec.ts` | `API: ok` / `API: unavailable` in the footer |
| `e2e/accessibility.spec.ts` | `@axe-core/playwright` scan (`scan`, `BLOCKING`) — serious/critical violations fail |

# Config

`playwright.config.ts` — chromium only, `baseURL` from `APP_URL`/`APP_PORT`
(default `http://localhost:4200`), `retries: 1` under CI, `trace: 'retain-on-failure'`,
`screenshot: 'only-on-failure'`, and a `webServer` running `npm run start` with
`reuseExistingServer: true`.
