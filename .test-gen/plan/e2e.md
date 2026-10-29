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
