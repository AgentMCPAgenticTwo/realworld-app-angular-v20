---
type: Module
title: src/app (shell)
description: Root module, root component and route table that bootstrap the application.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [angular, bootstrap, routing]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

# Files

| File | Symbol | Line | Role |
| --- | --- | --- | --- |
| `src/main.ts` | - | - | Bootstraps `AppModule` |
| `src/app/app.module.ts` | `AppModule` | 33 | Declarations, imports, providers, bootstrap |
| `src/app/app.component.ts` | `AppComponent` | 8 | Navbar shell, `title` field |
| `src/app/app.component.html` | - | - | Navbar + `<router-outlet>` |
| `src/app/app-routing.module.ts` | `routes` | 7 | Route table |
| `src/app/app-routing.module.ts` | `AppRoutingModule` | 18 | `RouterModule.forRoot(routes)` |
| `src/app/app.component.spec.ts` | - | - | Karma spec for `AppComponent` |

# AppModule

* **declarations**: `AppComponent`, `AddTutorialComponent`, `TutorialDetailsComponent`,
  `TutorialsListComponent`, `TutorialDrawerComponent`.
* **imports**: `BrowserModule`, `AppRoutingModule`, `FormsModule`, `HttpClientModule`.
* **providers**: `{ provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }` —
  this is what activates [ApiInterceptor](/modules/interceptors.md).
* **bootstrap**: `AppComponent`.

# Routes

`routes` maps `''` → redirect to `tutorials`, `tutorials` →
[TutorialsListComponent](/modules/components-tutorials-list.md), `tutorials/:id` →
[TutorialDetailsComponent](/modules/components-tutorial-details.md), and `add` →
[AddTutorialComponent](/modules/components-add-tutorial.md).

A new screen needs three edits: a component directory, an entry in `declarations`,
and an entry in `routes`. See [Common Tasks](/playbooks/common-tasks.md).
