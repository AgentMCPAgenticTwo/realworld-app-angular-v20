---
type: Module
title: Test suite (unit, integration, e2e)
description: Karma/Jasmine unit and integration specs under src/app plus Playwright end-to-end specs under e2e.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/e2e
tags: [testing, karma, jasmine, playwright, angular]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T14:16:12Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 19da638a38938f3e8b1b478977983659baa67ea2
    title: Codebase knowledge graph
status: stable
---

# Layers

| Layer | Location | Runner | Command |
| --- | --- | --- | --- |
| Unit | `*.spec.ts` beside the code, plus `*.component.behaviour.spec.ts` | Karma + Jasmine | `npm run test` |
| Integration | `src/app/integration/*.integration.spec.ts` | Karma + Jasmine | `npm run test` |
| End-to-end | `e2e/*.spec.ts` | Playwright (`playwright.config.ts`) | `npm run test:e2e` |

Karma picks up every `*.spec.ts` under `src/`, so unit and integration specs run in the
same browser session; `playwright.config.ts` sets `testDir: './e2e'`, keeping the two
suites disjoint.

# Unit specs

Alongside the original per-file specs (`src/app/services/tutorial.service.spec.ts`,
`src/app/interceptors/api.interceptor.spec.ts`, `src/app/app.component.spec.ts`) each
screen has a behaviour spec that drives the component through `TestBed` with
`HttpClientTestingModule`:

| File | Unit under test |
| --- | --- |
| `src/app/components/tutorials-list/tutorials-list.component.behaviour.spec.ts` | [tutorials-list](/modules/components-tutorials-list.md) |
| `src/app/components/tutorial-details/tutorial-details.component.behaviour.spec.ts` | [tutorial-details](/modules/components-tutorial-details.md) |
| `src/app/components/tutorial-drawer/tutorial-drawer.component.behaviour.spec.ts` | [tutorial-drawer](/modules/components-tutorial-drawer.md) |
| `src/app/components/add-tutorial/add-tutorial.component.behaviour.spec.ts` | [add-tutorial](/modules/components-add-tutorial.md) |

# Integration specs

`src/app/integration/` wires real collaborators — the real `AppRoutingModule`, the real
`ApiInterceptor` registered through `HTTP_INTERCEPTORS`, `RouterTestingModule`,
`FormsModule` — and mocks only the network through `HttpTestingController`. Request URLs
are asserted against `environment.apiUrl` from [Environments](/modules/environments.md),
which is what proves the interceptor rewrite end to end.

| File | Scope |
| --- | --- |
| `app-shell.integration.spec.ts` | Shell + routing + footer health ([app-shell](/modules/app-shell.md)) |
| `api-client.integration.spec.ts` | `TutorialService` through `ApiInterceptor` ([services](/modules/services.md), [interceptors](/modules/interceptors.md)) |
| `tutorials-list.integration.spec.ts` | List, search and bulk delete |
| `tutorials-list-drawer.integration.spec.ts` | List ↔ drawer `@Input`/`@Output` round trip |
| `tutorial-details.integration.spec.ts` | Routed edit screen at `tutorials/:id` |
| `add-tutorial.integration.spec.ts` | Create form submit |

# End-to-end specs

`playwright.config.ts` runs chromium only, starts the dev server with
`command: 'npm run start'` on `APP_PORT` (default 4200) with
`reuseExistingServer: true`, and keeps a trace on failure.

The real backend at `http://localhost:5001/api` is never contacted: every spec installs
`page.route` stubs from `e2e/support/api-stub.ts`, which exports the shared `Tutorial`
fixtures (`TUTORIALS`) and an `ApiCall` recorder so specs can assert the method, URL and
body the app actually sent.

| Spec | Covers |
| --- | --- |
| `e2e/tutorials-list.spec.ts` | List, search, empty and error states |
| `e2e/tutorial-drawer.spec.ts` | Opening, mutating and closing the drawer |
| `e2e/add-tutorial.spec.ts` | Creating a tutorial |
| `e2e/edit-tutorial.spec.ts` | Editing at `tutorials/:id` |
| `e2e/health-footer.spec.ts` | `API: checking…` → `API: ok` / `unavailable` in the footer |
| `e2e/accessibility.spec.ts` | `@axe-core/playwright` scan of each route |

# Dev dependencies added for tests

`@playwright/test` and `@axe-core/playwright` in `devDependencies`; the Karma stack
(`karma`, `karma-jasmine`, `karma-coverage`, `jasmine-core`) was already present.
