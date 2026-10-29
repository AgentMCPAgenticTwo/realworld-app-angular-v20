# Test plan

One section per phase; each phase planned its own work.

## unit

# Unit phase plan — risk-ranked

Runner: Karma + Jasmine (`npm run test`, `--browsers=ChromeHeadless --watch=false` in CI).
Conventions taken from the 9 existing `*.spec.ts`: `TestBed.configureTestingModule`,
`HttpClientTestingModule` + `HttpTestingController`, `afterEach(() => httpMock.verify())`,
relative urls (`/tutorials`) because `ApiInterceptor` is not registered in the TestBed.

| # | Risk | What | Where | Why |
|---|------|------|-------|-----|
| 1 | high | `TutorialService` — every CRUD call's method/url/body | `src/app/services/tutorial.service.spec.ts` (rewrite: the existing spec fails, no `HttpClient` provider) | all data mutation goes through here; a wrong verb/url silently destroys data |
| 2 | high | `ApiInterceptor` — relative prefixing, leading slash, absolute passthrough, query string, body/method/header preservation | `src/app/interceptors/api.interceptor.spec.ts` (add real assertions; existing specs assert nothing) | every request in the app is rewritten here |
| 3 | high | `TutorialDrawerComponent` — ngOnChanges reset, `open` boundaries (`0`, `''`), 404 branch, update message fallback, delete | `tutorial-drawer.component.behaviour.spec.ts` | most branching logic in the app |
| 4 | high | `TutorialDetailsComponent` — viewMode branch in `ngOnInit`, update/publish message fallback, delete → navigate | `tutorial-details.component.behaviour.spec.ts` | mutation + routing |
| 5 | med | `TutorialsListComponent` — search, delete-all, refresh/selection reset, error paths | `tutorials-list.component.behaviour.spec.ts` | selection state + bulk delete |
| 6 | med | `AddTutorialComponent` — create payload, submitted flag, reset, error path | `add-tutorial.component.behaviour.spec.ts` | creation payload correctness |
| 7 | low | header/model/app shell | already covered by existing specs | trivial |

Out of scope for this phase: e2e and the `/api/health` + "API: ok" footer story — no code
implements it anywhere in `src/` (reported as a finding).

## integration

# Integration test plan — Angular 17 Tutorial Manager

Boundary: network only. Real components + real `TutorialService` + real `ApiInterceptor`
+ real `RouterModule`, with `HttpClientTestingModule` as the HTTP boundary mock
(the Angular-native equivalent of MSW; the repo already uses it).

Files live in `src/app/integration/` and are named `*.integration.spec.ts` so they match
`tsconfig.spec.json` (`src/**/*.spec.ts`) and the `integration` path rule.

| # | Risk | What | Where | Why |
|---|------|------|-------|-----|
| 1 | high | ApiInterceptor + TutorialService wired for real: every CRUD call hits `http://localhost:5001/api/...`, absolute URLs untouched | `api-client.integration.spec.ts` | Wrong base URL ⇒ whole app talks to nothing; interceptor is only tested in isolation today |
| 2 | high | Tutorials list screen: loading / populated / empty / error states, search, remove-all (data mutation) | `tutorials-list.integration.spec.ts` | Main data-fetching screen; destructive action |
| 3 | high | List + drawer together: open, 404 not-found, publish toggle re-fetches list, delete refreshes and closes | `tutorials-list-drawer.integration.spec.ts` | Cross-component mutation + refresh contract |
| 4 | high | Details screen driven by the real router (`/tutorials/:id`): populated, not-found, update, publish, delete→navigate | `tutorial-details.integration.spec.ts` | Route param parsing + mutation + navigation |
| 5 | med | Add tutorial: success → confirmation, server error → form stays, reset | `add-tutorial.integration.spec.ts` | Creation path, error branch |
| 6 | med | App shell: routing through header links renders the right screen | `app-shell.integration.spec.ts` | Router config regressions |
| 7 | med | Story: `GET /api/health` → footer shows "API: ok" | `app-shell.integration.spec.ts` | Requested story — expected to be unimplemented |

Out of scope here (owned by the unit phase): per-method service unit tests, model, header.

## e2e

# e2e plan (Playwright)

App: Angular 17 "Tutorial Manager" SPA on `http://localhost:4200`.
Backend (`http://localhost:5001/api`) is NOT running in CI, so every spec stubs
`**/api/tutorials**` with `page.route` using the contract shapes returned by
`TutorialService` (`{id, title, description, published, createdAt, updatedAt}`).

| # | Risk | Flow | File | Why |
|---|------|------|------|-----|
| 1 | high | Footer API health (`GET /api/health` → `{status:"ok"}`, footer shows "API: ok") | `e2e/health-footer.spec.ts` | the story under test; data mutation-free but user-visible contract |
| 2 | high | Add a tutorial (happy path POST, empty-input, server error) | `e2e/add-tutorial.spec.ts` | data mutation + validation branch |
| 3 | high | Delete / publish / unpublish from the details drawer | `e2e/tutorial-drawer.spec.ts` | destructive mutation + branching rule |
| 4 | high | Remove All + list states (populated, empty, API error) | `e2e/tutorials-list.spec.ts` | destructive bulk mutation, every data-fetching state |
| 5 | medium | Search by title (match, no match) | `e2e/tutorials-list.spec.ts` | query building / parsing |
| 6 | medium | Edit a tutorial via `/tutorials/:id` (update, not-found) | `e2e/edit-tutorial.spec.ts` | mutation + 404 branch |
| 7 | medium | Accessibility smoke on list / add / edit pages | `e2e/accessibility.spec.ts` | serious+critical axe violations are findings |

Out of scope for the 30-minute budget: responsive layout checks, trace-level
network assertions, real-backend integration.
