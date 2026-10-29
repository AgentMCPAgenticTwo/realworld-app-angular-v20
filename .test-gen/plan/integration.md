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
