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
