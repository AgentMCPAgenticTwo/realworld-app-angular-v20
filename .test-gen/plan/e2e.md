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
