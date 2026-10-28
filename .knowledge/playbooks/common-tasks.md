---
type: Playbook
title: Common tasks
description: Where to go to change routes, API calls, the data model, categories, the styling or the detail drawer.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [playbook, howto]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T11:34:18Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ a86d8471057ca0f210893c4f79a11417f67af92e
    title: Codebase knowledge graph
status: stable
---

# Point the app at a different backend

Edit `apiUrl` in `src/environments/environment.ts`. Do not touch `baseUrl` in
`src/app/services/tutorial.service.ts` — it is intentionally relative. See
[environments](/modules/environments.md) and
[interceptors](/modules/interceptors.md).

# Add or change a REST call

1. Add the method to the service for that resource —
   `src/app/services/tutorial.service.ts` or `src/app/services/category.service.ts` —
   returning an `Observable` from `HttpClient` with a path relative to that file's
   `baseUrl`. A new REST resource gets its own `<Name>Service`.
2. Subscribe from the component with the `{ next, error }` object form.

See [services](/modules/services.md) and [Conventions](/conventions.md).

# Add a field to a tutorial

1. Add the optional property to `Tutorial` in `src/app/models/tutorial.model.ts`.
2. Add the input to `add-tutorial.component.html` and include it in the payload
   built by `AddTutorialComponent.saveTutorial`.
3. Add the input/display to `tutorial-details.component.html` (the whole
   `currentTutorial` is sent by `updateTutorial`, so no payload change is needed).
4. Add the display to `tutorial-drawer.component.html`, and if the field must
   survive a publish toggle, include it in the `data` object inside both
   `TutorialDetailsComponent.updatePublished` and
   `TutorialDrawerComponent.updatePublished` — those PUT only title, description and
   published.
5. Add the field to the `article.tutorial-card` markup in
   `tutorials-list.component.html` if it should appear in the list — the list is a
   card grid, not a table.

`categoryId` is the worked example of all five steps; copy it.

# Work with categories

| Need | Where |
| --- | --- |
| Fetch the list of categories | `CategoryService.getAll` in `src/app/services/category.service.ts` |
| Add the dropdown to a screen | a `retrieveCategories()` call in `ngOnInit` plus a `select` with an `[ngValue]="null"` placeholder — see `add-tutorial.component.html:30` |
| Show a category name | resolve `categoryId` against the local `categories` array (`TutorialsListComponent.categoryName`, line 63) and render a `tm-pill tm-pill-category` |
| Change how the list filters | `TutorialsListComponent.applyCategoryFilter` (line 52); it is client-side, so the template iterates `filteredTutorials`, not `tutorials` |

Anything that refetches tutorials must call `applyCategoryFilter()` afterwards, or the
filter silently resets. `TutorialDrawerComponent` has no category support yet.

# Add a new screen

1. Create `src/app/components/<kebab-name>/` with `.ts`, `.html`, `.css`, `.spec.ts`.
2. Declare the component in `declarations` in `src/app/app.module.ts` — components
   are not standalone.
3. Add a `{ path, component }` entry to `routes` in `src/app/app-routing.module.ts`.
4. Add a `<li class="nav-item">` link to
   `src/app/components/header/header.component.html` — the navigation is no longer in
   `app.component.html`.
5. Build the markup out of the shared `tm-*` classes (`tm-card`, `tm-section-title`,
   `tm-btn …`) rather than new bespoke styles.

See [the shell module](/modules/app-shell.md) and
[header](/modules/components-header.md).

# Change the look of the app

| Change | File |
| --- | --- |
| Palette, radius, shadow, transition | the `:root` custom properties in `src/styles.css` |
| A shared surface, button, pill, label or empty state | the matching `.tm-*` rule in `src/styles.css` |
| Layout of one screen only | that component's `.css` (`.card-grid`, `.search-bar`, `.form-actions`, `.detail-row`) |
| Page frame, sticky footer | `src/app/app.component.css` |
| Navigation bar skin | `src/app/components/header/header.component.css` |
| Web font | the `<link>` tags in `src/index.html` and the `body` rule in `src/styles.css` |

Add a class to `src/styles.css` as soon as a second screen needs it; keep one-off
layout local. See the styling section of [Conventions](/conventions.md).

# Change tutorial detail behaviour

There are two detail surfaces that must usually be changed together:

| Surface | File | Context |
| --- | --- | --- |
| Routed page | `src/app/components/tutorial-details/tutorial-details.component.ts` | `tutorials/:id` |
| Inline drawer | `src/app/components/tutorial-drawer/tutorial-drawer.component.ts` | opened from the list |

Both implement `getTutorial`, `updatePublished` and `deleteTutorial`. The drawer
additionally emits `changed` so the list refreshes, and handles HTTP 404 via
`notFound`. They are not identical: the routed component's `updatePublished` sends
`categoryId`, the drawer's does not. See
[tutorial-details](/modules/components-tutorial-details.md) and
[tutorial-drawer](/modules/components-tutorial-drawer.md).

# Change what opens the drawer

`TutorialsListComponent.setActiveTutorial` sets `drawerTutorialId`;
`closeDrawer` and `refreshList` clear it. The drawer's `open` getter derives purely
from that input, so there is no separate visibility flag. See
[tutorials-list](/modules/components-tutorials-list.md).

# Run and test

* `npm start` — dev server on `ng serve`.
* `npm test` — Karma + Jasmine over every `*.spec.ts`.
* `npm run build` — production bundle.
