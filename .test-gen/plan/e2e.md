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
