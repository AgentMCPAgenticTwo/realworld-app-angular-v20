# Test plan

One section per phase; each phase planned its own work.

## unit

# Unit test plan — phase 01-unit

Runner: Karma + Jasmine (Angular builder), as already configured. No new runner added.
Convention followed from existing specs: `TestBed` + `HttpClientTestingModule` +
`HttpTestingController`, specs co-located as `*.spec.ts`.

Pre-existing failure found by `npm run test` before any change:
`TutorialService should be created` — the spec configures an empty TestBed so `HttpClient`
has no provider. Test defect (not an app defect); fixed per CLAUDE.md §5 and reported with
`source: analysis`.

## Risk-ranked targets

| # | Risk | Unit | Test file | Why |
|---|------|------|-----------|-----|
| 1 | Data mutation + URL building | `TutorialService` | `src/app/services/tutorial.service.spec.ts` | Every create/update/delete goes through it; a wrong verb or url silently destroys data. Includes query-string encoding of `findByTitle`. |
| 2 | Request rewriting | `ApiInterceptor` | `src/app/interceptors/api.interceptor.spec.ts` | Every request passes through it; branching on absolute vs relative, leading slash normalisation, body/header/method preservation. |
| 3 | Destructive action + branching state | `TutorialsListComponent` | `src/app/components/tutorials-list/tutorials-list.component.spec.ts` | `removeAllTutorials` deletes everything; selection/drawer/search state has several reset branches; loading/empty/error/populated states. |
| 4 | Mutation + response parsing | `TutorialDetailsComponent` | `src/app/components/tutorial-details/tutorial-details.component.spec.ts` | `viewMode` branch decides whether it fetches by route param; `res.message` fallback is unguarded; delete navigates away. |
| 5 | Mutation + optimistic state | `TutorialDrawerComponent` | `src/app/components/tutorial-drawer/tutorial-drawer.component.spec.ts` | `ngOnChanges` reset branch, 404 vs other errors, publish/unpublish, delete. |
| 6 | Form reset | `AddTutorialComponent` | `src/app/components/add-tutorial/add-tutorial.component.spec.ts` | Submitted/reset branches, payload shape, error path. |

Not covered (low value): `HeaderComponent`, `AppComponent`, `Tutorial` model —
already have smoke specs and contain no logic.

## Expected defects probed
- `TutorialService.findByTitle` interpolates the title into the query string without
  encoding, so `&`/`#`/`+` corrupt the request.
- `TutorialDetailsComponent.updatePublished` / `updateTutorial` read `res.message`
  without a null guard (the drawer guards with `res &&`), so a `204`/empty body throws.

## integration

# Integration test plan — phase 02

Stack confirmed: Angular 17 + Karma/Jasmine. No MSW — the idiomatic HTTP-boundary mock
for Angular is `HttpClientTestingModule` + `HttpTestingController`, which intercepts at
the `HttpBackend` layer (below the real interceptor chain). Every integration spec wires
the **real** `ApiInterceptor`, the **real** `TutorialService` and the **real** router, so
the asserted URLs are the fully prefixed ones (`http://localhost:5001/api/...`).

File naming: `*.integration.spec.ts` — contains `integration` AND matches
`tsconfig.spec.json`'s `src/**/*.spec.ts` include, so the karma builder collects it.

## Risk-ranked coverage

| # | Risk | What is tested | File |
|---|------|----------------|------|
| 1 | Data mutation (delete all / delete one) wired through real service + interceptor | `removeAllTutorials` issues DELETE and refreshes; drawer delete emits `changed` + closes and list refetches | `tutorials-list.integration.spec.ts` |
| 2 | Search parsing — title is interpolated into the query string unencoded | search sends `title` param verbatim; special chars (`&`, `#`, `+`) | `tutorials-list.integration.spec.ts` |
| 3 | List ↔ drawer composition: real child component, real HTTP | click card → GET by id → drawer populated; 404 → "Not found"; publish toggle → PUT → list refetch | `tutorials-list.integration.spec.ts` |
| 4 | Data-fetching screen states (loading / empty / error / populated) | all four for the list screen and the drawer | `tutorials-list.integration.spec.ts` |
| 5 | Route-param driven fetch + mutation + navigation | details screen loads by `:id`, update, publish toggle, delete → navigate `/tutorials`; error → "Cannot access" | `tutorial-details.integration.spec.ts` |
| 6 | Create flow | POST body, success panel, "Add another" resets, server error keeps the form | `add-tutorial.integration.spec.ts` |
| 7 | Real router + real AppModule routes | `/` redirects to `/tutorials`, `/add` renders the form, `/tutorials/:id` fetches, header links navigate | `app-routing.integration.spec.ts` |
| 8 | Interceptor applied end-to-end, not in isolation | every spec asserts the prefixed absolute URL | all |

## Out of scope for this phase
Unit-level specs for the service/model/interceptor (phase 01) and browser e2e (phase 03).

## e2e

# e2e plan (Playwright)

App: Angular 17 tutorial-manager CRUD SPA. Routes: `/tutorials`, `/tutorials/:id`, `/add`.
Backend (`http://localhost:5001/api`) is NOT running in CI → every spec stubs it with
`page.route` using the shapes from `Tutorial` (`src/app/models/tutorial.model.ts`) and the
REST calls in `src/app/services/tutorial.service.ts`.

| # | Risk | Flow | File | Why |
|---|------|------|------|-----|
| 1 | high | Browse list: populated / empty / server-error / slow(loading) | `e2e/tutorials-list.spec.ts` | Primary screen; data-fetching screen states required by org standard |
| 2 | high | Search by title: matches, no matches, resets selection | `e2e/tutorials-list.spec.ts` | Branching query logic (`findByTitle`) |
| 3 | high | Create a tutorial: success banner, payload sent, "Add another" resets, server error | `e2e/add-tutorial.spec.ts` | Data mutation (POST) |
| 4 | high | Drawer: open details, publish/unpublish, delete, 404 "Not found" | `e2e/tutorial-drawer.spec.ts` | Data mutation + error branch |
| 5 | high | Edit page: update, publish toggle, delete → redirect to list, unknown id | `e2e/tutorial-edit.spec.ts` | Data mutation (PUT/DELETE) + routing |
| 6 | med  | Remove All from list | `e2e/tutorials-list.spec.ts` | Destructive bulk mutation |
| 7 | med  | Accessibility smoke (axe, no serious/critical) on list, add, edit | `e2e/accessibility.spec.ts` | Org standard |

Shared stub helper: `e2e/support/api.ts` (CORS-aware fulfil, since the API origin differs
from the app origin and Angular sends JSON → preflight).
