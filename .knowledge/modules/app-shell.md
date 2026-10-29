---
type: Module
title: src/app (shell)
description: Root module, root component and route table that bootstrap the application and surface API health in the footer.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [angular, bootstrap, routing, health]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T09:53:52Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 9b034fe57d550b8f66d54b93e29362baf23c00ae
    title: Codebase knowledge graph
status: stable
---

# Files

| File | Symbol | Line | Role |
| --- | --- | --- | --- |
| `src/main.ts` | - | - | Bootstraps `AppModule` |
| `src/index.html` | - | - | Host page; mounts `<app-root>` and preloads the Inter web font |
| `src/styles.css` | - | - | Global theme tokens and the shared `tm-*` utility classes |
| `src/app/app.module.ts` | `AppModule` | 35 | Declarations, imports, providers, bootstrap |
| `src/app/app.component.ts` | `AppComponent` | 9 | Layout shell, `title` / `apiStatus` fields, `ngOnInit` health probe |
| `src/app/app.component.html` | - | - | `.app-shell` wrapper: `<app-header>`, `<main class="container tm-page">` with `<router-outlet>`, and `.app-footer` with the `.app-footer-health` status |
| `src/app/app.component.css` | - | - | Sticky-footer flex layout (`.app-shell`, `.app-footer`, `.app-footer-health`) |
| `src/app/app-routing.module.ts` | `routes` | 7 | Route table |
| `src/app/app-routing.module.ts` | `AppRoutingModule` | 18 | `RouterModule.forRoot(routes)` |
| `src/app/app.component.spec.ts` | - | - | Karma spec; asserts `title`, that the header and footer render, and the footer health text |

`AppComponent` no longer carries navigation markup — that moved to
[HeaderComponent](/modules/components-header.md). The `title` field is still present
and asserted by the spec, but is not rendered anywhere.

# API health indicator

`ngOnInit` (line 15) subscribes once to `HealthService.get()` from
[Services](/modules/services.md) and writes the result into `apiStatus`:

| Outcome | `apiStatus` |
| --- | --- |
| initial value | `'unknown'` |
| response with a `status` | that `status` ([Health model](/modules/models.md)) |
| response without `status` | `'unknown'` |
| HTTP error | `'unavailable'` |

The template renders it as `API: {{ apiStatus }}` inside
`.app-footer-health`. There is no retry or polling — the probe runs once per app
load. Because the shell now issues an HTTP request on init, specs that create
`AppComponent` must import `HttpClientTestingModule` and flush the `/health`
request.

# AppModule

* **declarations**: `AppComponent`, `AddTutorialComponent`, `TutorialDetailsComponent`,
  `TutorialsListComponent`, `TutorialDrawerComponent`, `HeaderComponent`.
* **imports**: `BrowserModule`, `AppRoutingModule`, `FormsModule`, `HttpClientModule`.
* **providers**: `{ provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }` —
  this is what activates [ApiInterceptor](/modules/interceptors.md).
* **bootstrap**: `AppComponent`.

# Routes

`routes` maps `''` → redirect to `tutorials`, `tutorials` →
[TutorialsListComponent](/modules/components-tutorials-list.md), `tutorials/:id` →
[TutorialDetailsComponent](/modules/components-tutorial-details.md), and `add` →
[AddTutorialComponent](/modules/components-add-tutorial.md).

A new screen needs four edits: a component directory, an entry in `declarations`,
an entry in `routes`, and a nav link in `header.component.html`. See
[Common Tasks](/playbooks/common-tasks.md).
