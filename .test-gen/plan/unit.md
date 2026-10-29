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
