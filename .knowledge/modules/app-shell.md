---
type: Module
title: src/app (shell)
description: Root module, root component and route table that bootstrap the application.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [angular, bootstrap, routing]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T04:04:01Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 6878a25eb09b858a48f0956018c2d975cf0182bb
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
| `src/app/app.component.ts` | `AppComponent` | 8 | Layout shell, `title` field |
| `src/app/app.component.html` | - | - | `.app-shell` wrapper: `<app-header>`, `<main class="container tm-page">` with `<router-outlet>`, and `.app-footer` |
| `src/app/app.component.css` | - | - | Sticky-footer flex layout (`.app-shell`, `.app-footer`) |
| `src/app/app-routing.module.ts` | `routes` | 7 | Route table |
| `src/app/app-routing.module.ts` | `AppRoutingModule` | 18 | `RouterModule.forRoot(routes)` |
| `src/app/app.component.spec.ts` | - | - | Karma spec; asserts `title` and that the header and footer render |

`AppComponent` no longer carries navigation markup — that moved to
[HeaderComponent](/modules/components-header.md). The `title` field is still present
and asserted by the spec, but is not rendered anywhere.

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
