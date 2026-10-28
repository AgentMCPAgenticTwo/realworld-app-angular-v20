---
type: Playbook
title: Common tasks
description: Where to go to change routes, API calls, the data model or the detail drawer.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [playbook, howto]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

# Point the app at a different backend

Edit `apiUrl` in `src/environments/environment.ts`. Do not touch `baseUrl` in
`src/app/services/tutorial.service.ts` — it is intentionally relative. See
[environments](/modules/environments.md) and
[interceptors](/modules/interceptors.md).

# Add or change a REST call

1. Add the method to `TutorialService` in `src/app/services/tutorial.service.ts`,
   returning an `Observable` from `HttpClient` with a path relative to `baseUrl`.
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
5. Add the column to `tutorials-list.component.html` if it should appear in the list.

# Add a new screen

1. Create `src/app/components/<kebab-name>/` with `.ts`, `.html`, `.css`, `.spec.ts`.
2. Declare the component in `declarations` in `src/app/app.module.ts` — components
   are not standalone.
3. Add a `{ path, component }` entry to `routes` in `src/app/app-routing.module.ts`.
4. Link to it from the navbar in `src/app/app.component.html`.

See [the shell module](/modules/app-shell.md).

# Change tutorial detail behaviour

There are two detail surfaces that must usually be changed together:

| Surface | File | Context |
| --- | --- | --- |
| Routed page | `src/app/components/tutorial-details/tutorial-details.component.ts` | `tutorials/:id` |
| Inline drawer | `src/app/components/tutorial-drawer/tutorial-drawer.component.ts` | opened from the list |

Both implement `getTutorial`, `updatePublished` and `deleteTutorial`. The drawer
additionally emits `changed` so the list refreshes, and handles HTTP 404 via
`notFound`. See
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
