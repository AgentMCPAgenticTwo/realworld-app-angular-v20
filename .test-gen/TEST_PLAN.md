# Test plan

One section per phase; each phase planned its own work.

## unit

# Unit test plan — phase 01-unit

Runner: Karma + Jasmine (`npm run test`), Angular 17 TestBed, `HttpClientTestingModule`
as the HTTP boundary — the convention already used by the repo's 9 existing specs.

Pre-existing failure found by the baseline run (`npm run test`, 26 specs, 1 FAILED):
`TutorialService should be created` — the spec configures an empty TestBed, so
`HttpClient` has no provider. Test-side defect, reported with `source: "analysis"`.

## Risk-ranked coverage

| # | Risk | Unit | Test file | Why |
|---|------|------|-----------|-----|
| 1 | Data mutation / wrong endpoint | `TutorialService` (7 methods) | `src/app/services/tutorial.service.spec.ts` | Every create/update/delete goes through here; a wrong verb or URL silently destroys data. Only covered by a `toBeTruthy()` smoke test today (which fails). |
| 2 | URL rewriting | `ApiInterceptor` | `src/app/interceptors/api.interceptor.url.spec.ts` | Decides which host every request hits. Branches: absolute vs relative, leading slash vs not, case-insensitive scheme, method/body/header preservation. |
| 3 | Edit + delete branching | `TutorialDetailsComponent` | `src/app/components/tutorial-details/tutorial-details.behaviour.spec.ts` | `viewMode` branch, publish toggle, server-supplied vs default message, delete → navigate, error paths. |
| 4 | Drawer error/empty branches | `TutorialDrawerComponent` | `src/app/components/tutorial-drawer/tutorial-drawer.behaviour.spec.ts` | `open` boundary (`null`/`undefined`/`0`), 404 vs 500 branch, re-open resets state, unpublish, delete emits. |
| 5 | Create + reset | `AddTutorialComponent` | `src/app/components/add-tutorial/add-tutorial.behaviour.spec.ts` | POST body shape (drops `published`), empty-input behaviour, error path, reset after submit. |
| 6 | Search / list refresh | `TutorialsListComponent` | `src/app/components/tutorials-list/tutorials-list.behaviour.spec.ts` | `searchTitle` clears selection, delete-all refreshes, retrieve error leaves list undefined. |

Out of scope for this phase: routing wiring, header (trivial), e2e flows (other phases).
New files use distinct `*.behaviour.spec.ts` / `*.url.spec.ts` names so they cannot
collide with the integration/e2e phases running in parallel.

## integration

# Integration test plan — phase 02-integration

Stack confirmed: Angular 17, Karma + Jasmine, `ng test`. Runner pattern is
`src/**/*.spec.ts` (tsconfig.spec.json), so integration files are named
`src/app/integration/*.integration.spec.ts` — they match the pattern AND carry
`integration` in path + filename.

Integration boundary: real components + real `TutorialService` + real
`ApiInterceptor` + real `Router`, with the network mocked only at the HTTP layer
(`HttpClientTestingModule`, the Angular equivalent of MSW). No in-repo
collaborator is stubbed.

| # | Risk | What is tested | File | Why |
|---|------|----------------|------|-----|
| 1 | high — data mutation + URL building | List screen end-to-end: populated / empty / error / search / remove-all, and that the interceptor prefixes `environment.apiUrl` on every call | `tutorials-list.integration.spec.ts` | every request the app makes goes through the interceptor; a wrong URL breaks the whole app |
| 2 | high — data mutation | Drawer round-trip inside the list: open → fetch → publish (PUT) → list refetch; delete (DELETE) → refetch + close; 404 → "Not found" | `tutorials-list.integration.spec.ts` | publish/delete mutate server state and are driven by child→parent events |
| 3 | high — parsing/branching | Edit screen reached through the real router (`/tutorials/:id`): populated, update, publish, delete→redirect, and empty-body PUT response | `tutorial-details.integration.spec.ts` | `res.message` is read unguarded; route param parsing feeds the fetch |
| 4 | medium — data mutation | Add screen: success → confirmation, server error → stays on form, "Add another" resets | `add-tutorial.integration.spec.ts` | creates records; error path has no user-visible handling |
| 5 | medium — navigation | App shell with real routes: `''` redirects to `/tutorials`, header links route to list/add, unknown ids | `routing.integration.spec.ts` | the shell wires header + outlet + guards-free routes |
| 6 | medium — query building | `findByTitle` with a title needing URL encoding (`a&b`, spaces) | `tutorials-list.integration.spec.ts` | unencoded interpolation corrupts the query |

Out of scope here (owned by the unit phase): pure service/model/interceptor unit
tests; (e2e phase): browser-level flows.

## e2e

# e2e plan (Playwright)

App: Angular tutorial-manager CRUD. Backend (`http://localhost:5001/api`) is NOT running in
CI, so every spec stubs it with `page.route` (`e2e/support/api-stub.ts`) using the contract
shape `{ id, title, description, published, createdAt, updatedAt }`.

| # | Risk | Flow | File | Why |
|---|------|------|------|-----|
| 1 | high | Browse list: loading / empty / error / populated + search by title | `e2e/tutorials-list.spec.ts` | primary screen, all four data-fetching states required by org standards |
| 2 | high | Create a tutorial (happy path, server error, empty submit) | `e2e/add-tutorial.spec.ts` | data mutation + input validation branch |
| 3 | high | Edit screen `/tutorials/:id`: update, publish/unpublish, delete → redirect | `e2e/edit-tutorial.spec.ts` | data mutation, branching published state, navigation |
| 4 | medium | Detail drawer from the list: open, publish, delete, 404, close | `e2e/tutorial-drawer.spec.ts` | branching 404 path + delete refresh |
| 5 | medium | Remove-all + header navigation between pages | `e2e/navigation.spec.ts` | destructive bulk mutation, routing |
| 6 | medium | Accessibility smoke on list / add / edit (axe, no serious+critical) | `e2e/accessibility.spec.ts` | org standard: serious/critical a11y = finding |
