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
