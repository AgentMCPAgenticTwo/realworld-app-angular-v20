---
type: Module
title: test suites (unit, integration, e2e)
description: The three-tier test layer — Karma/Jasmine unit and integration specs under src, and Playwright e2e specs under e2e.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/e2e
tags: [testing, karma, jasmine, playwright, axe]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T13:46:25Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 3a87e8e68c23204246655d54df5961c9299323ce
    title: Codebase knowledge graph
status: stable
---

# Tiers

| Tier | Location | Runner | Entry command |
| --- | --- | --- | --- |
| Unit | `*.spec.ts` beside the code, plus `*.component.behaviour.spec.ts` | Karma + Jasmine | `npm test` |
| Integration | `src/app/integration/*.integration.spec.ts` | Karma + Jasmine | `npm test` |
| E2E | `e2e/*.spec.ts` | Playwright (chromium) | `npm run test:e2e` |

`tsconfig.spec.json` includes `src/**/*.spec.ts`, so the unit and integration tiers
run in the same Karma browser; `e2e/` is outside that glob and is driven only by
`playwright.config.ts`.

# Unit specs

Two specs per component directory:

| File | Role |
| --- | --- |
| `<name>.component.spec.ts` | Original creation/render spec |
| `<name>.component.behaviour.spec.ts` | Behaviour-per-test spec, `describe('<Name>Component (behaviour)')` |

Behaviour specs exist for
[add-tutorial](/modules/components-add-tutorial.md),
[tutorial-details](/modules/components-tutorial-details.md),
[tutorial-drawer](/modules/components-tutorial-drawer.md) and
[tutorials-list](/modules/components-tutorials-list.md).
`src/app/services/tutorial.service.spec.ts`,
`src/app/services/health.service.spec.ts`,
`src/app/interceptors/api.interceptor.spec.ts` and
`src/app/models/tutorial.model.spec.ts` cover the non-component layers;
`src/app/app.component.spec.ts` covers the shell and its footer health states
(see [app-shell](/modules/app-shell.md)).

# Integration specs

`src/app/integration/` wires real collaborators together and fakes only the HTTP
transport, via `HttpClientTestingModule` + `HttpTestingController`:

| File | Describe block | Scope |
| --- | --- | --- |
| `app-shell.integration.spec.ts` | `App shell routing` | `AppComponent` + `AppRoutingModule` + every routed screen, asserting on `Location` |
| `tutorials-list.integration.spec.ts` | `Tutorials list screen` | List + real `TutorialService` |
| `tutorials-list-drawer.integration.spec.ts` | `Tutorials list and detail drawer` | List with the child drawer and its `closed` / `changed` outputs |
| `tutorial-details.integration.spec.ts` | `Tutorial details screen` | Routed detail screen |
| `add-tutorial.integration.spec.ts` | `Add tutorial screen` | Template-driven create form |
| `api-client.integration.spec.ts` | `TutorialService through the ApiInterceptor` | `TutorialService` with the real `ApiInterceptor` registered as `HTTP_INTERCEPTORS`, asserting the rewritten `environment.apiUrl` URLs |

Expected URLs are derived from `environment.apiUrl`
(see [environments](/modules/environments.md)), never hard-coded.

# E2E specs

`playwright.config.ts` at the repo root: `testDir: './e2e'`, chromium only,
`baseURL` from `APP_URL` or `http://localhost:${APP_PORT ?? 4200}`,
`webServer` running `npm run start` with `reuseExistingServer: true`,
`trace: 'retain-on-failure'`, `retries: 1` under CI.

| Spec | Scope |
| --- | --- |
| `e2e/tutorials-list.spec.ts` | List, title search, remove-all |
| `e2e/tutorial-drawer.spec.ts` | Opening, mutating and closing the inline drawer |
| `e2e/edit-tutorial.spec.ts` | Routed `tutorials/:id` edit screen |
| `e2e/add-tutorial.spec.ts` | Create form |
| `e2e/health-footer.spec.ts` | Footer `API: …` indicator |
| `e2e/accessibility.spec.ts` | `@axe-core/playwright` scan, failing on `serious` / `critical` impacts |

## The backend stub

`e2e/support/api-stub.ts` is the single e2e helper and the graph's only entry
point. `stubApi(page, options)` (line 58) installs `page.route` handlers for the
`/api/tutorials` surface and **returns the array of `ApiCall` records** the app
made, so a spec can assert on the method, URL and payload the UI actually sent.

| Export | Line | Role |
| --- | --- | --- |
| `Tutorial` | 9 | Local copy of the response shape in `src/app/models/tutorial.model.ts` |
| `TUTORIALS` | 18 | Two-record default fixture (one published, one pending) |
| `ApiCall` | 37 | `{ method, url, body }` recorded per request |
| `StubOptions` | 43 | `list`, `detail`, `listStatus`, `writeStatus` — the error and empty states |
| `stubApi` | 58 | Installs the stub, returns the call log |
| `json` | 81 | Internal fulfil helper |

No real backend runs during e2e: `environment.apiUrl`
(`http://localhost:5001/api`) is never reachable in CI, which is why every spec
stubs at the network boundary.

# Known-defect markers

Several e2e tests are parked with `test.fixme` and a `KNOWN-DEFECT:` comment
naming the finding they record — the `serious` axe violations in
`e2e/accessibility.spec.ts` (`color-contrast` on `.app-footer-note`,
`.tm-subtitle` and `.badge-primary`; `listitem` on the header nav), and the
footer-health assertions in `e2e/health-footer.spec.ts`.

> The `health-footer.spec.ts` markers predate the footer indicator: its third
> test asserts the footer renders no `API:` text at all, which no longer matches
> `src/app/app.component.html`. Treat that spec as stale rather than as a
> description of current behaviour.

# Dev dependencies

`@playwright/test` and `@axe-core/playwright` are the only test dependencies added
on top of the Angular CLI's Karma/Jasmine stack; see
[Overview](/overview.md) for the full script list.
