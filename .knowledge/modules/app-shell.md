---
type: Module
title: src/app (shell)
description: Root module, root component and route table that bootstrap the application and surface API health in the footer.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [angular, bootstrap, routing, health]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T13:46:25Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 3a87e8e68c23204246655d54df5961c9299323ce
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
| `src/app/app.component.ts` | `AppComponent` | 9 | Layout shell, `title` / `apiStatus` / `apiLoading` fields, `ngOnInit` health probe |
| `src/app/app.component.html` | - | - | `.app-shell` wrapper: `<app-header>`, `<main class="container tm-page">` with `<router-outlet>`, and `.app-footer` with the `.app-footer-health` status |
| `src/app/app.component.css` | - | - | Sticky-footer flex layout plus the health-indicator states (`.app-shell`, `.app-footer`, `.app-footer-health`, `.is-ok`, `.is-error`, `.app-footer-health-spinner`) |
| `src/app/app-routing.module.ts` | `routes` | 7 | Route table |
| `src/app/app-routing.module.ts` | `AppRoutingModule` | 18 | `RouterModule.forRoot(routes)` |
| `src/app/app.component.spec.ts` | - | - | Karma spec; asserts `title`, that the header and footer render, and all four health-indicator states |
| `src/app/integration/app-shell.integration.spec.ts` | - | - | Integration spec: shell + real router + every routed screen ([test suites](/modules/testing.md)) |

`AppComponent` no longer carries navigation markup — that moved to
[HeaderComponent](/modules/components-header.md). The `title` field is still present
and asserted by the spec, but is not rendered anywhere.

# API health indicator

`ngOnInit` (line 16) subscribes once to `HealthService.get()` from
[Services](/modules/services.md) and writes the result into `apiStatus`, clearing
`apiLoading` in both handlers:

| Outcome | `apiStatus` | `apiLoading` |
| --- | --- | --- |
| initial value | `'unknown'` | `true` |
| response with a `status` | that `status` ([Health model](/modules/models.md)) | `false` |
| response without `status` | `'unknown'` | `false` |
| HTTP error | `'unavailable'` | `false` |

The template renders `API: {{ apiStatus }}` inside `.app-footer-health` and drives
three state classes plus an ARIA flag off the two fields:

| Binding | Condition |
| --- | --- |
| `.is-loading` | `apiLoading` |
| `.is-ok` | `!apiLoading && apiStatus === 'ok'` |
| `.is-error` | `!apiLoading && apiStatus !== 'ok'` |
| `[attr.aria-busy]` | `apiLoading` |

While `apiLoading` is true an `*ngIf` adds `span.app-footer-health-spinner`
(`aria-hidden="true"`), animated by the `app-footer-health-spin` keyframes in
`src/app/app.component.css`; a `prefers-reduced-motion: reduce` media query slows
that animation to 2s rather than removing it. `.is-ok` renders green and
`.is-error` red — these are the only two hard-coded colours in the shell
stylesheet, outside the `--tm-*` token system described in
[Conventions](/conventions.md).

Note that `apiStatus === 'unknown'` after a 200 response without a `status` field
still paints `.is-error`, because the class is derived from "not `ok`" rather
than from the error handler.

There is no retry or polling — the probe runs once per app load. Because the shell
issues an HTTP request on init, specs that create `AppComponent` must import
`HttpClientTestingModule` and flush the `/health` request; see
[test suites](/modules/testing.md).

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
