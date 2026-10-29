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
