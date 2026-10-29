---
type: Convention
title: Project conventions
description: Naming, file-layout, styling, template and HTTP-subscription conventions used throughout the app.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [conventions, angular, typescript, styling]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T13:16:13Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ e44c79b17c2cab7387ac4928b2086bb0ef8c39c7
    title: Codebase knowledge graph
status: stable
---

# File layout

* One directory per component under `src/app/components/<kebab-name>/`, holding
  `<kebab-name>.component.ts`, `.html`, `.css` and `.spec.ts`.
* Services in `src/app/services/`, models in `src/app/models/`, HTTP interceptors in
  `src/app/interceptors/`. Each has a sibling `.spec.ts`.
* `@Component` always uses `templateUrl` plus an external stylesheet — never inline
  templates. Most components use the singular Angular 17 `styleUrl`
  (`src/app/app.component.ts`); `HeaderComponent` uses the array form `styleUrls`.
  Either is accepted.

# Naming

| Thing | Pattern | Example |
| --- | --- | --- |
| Component class | `<Name>Component` | `TutorialDrawerComponent` |
| Component selector | `app-<kebab-name>` | `app-tutorial-drawer` |
| Service class | `<Name>Service` | `TutorialService` |
| Module class | `<Name>Module` | `AppRoutingModule` |

# Declaration, not standalone

Components are **not** standalone: every new component must be added to
`declarations` in `src/app/app.module.ts`. Providers (including the
`HTTP_INTERCEPTORS` multi-provider for `ApiInterceptor`) are registered there too.

# HTTP access

* Only `TutorialService` touches `HttpClient`.
* Service methods return a cold `Observable` and do nothing else — no `tap`,
  no error handling, no state.
* Components subscribe with the object form and always supply both handlers:

  ```ts
  this.tutorialService.getAll().subscribe({
    next: (data) => { /* assign to a field */ },
    error: (e) => console.error(e)
  });
  ```

* Errors are logged to the console rather than surfaced, with one exception:
  `TutorialDrawerComponent.getTutorial` branches on `HttpErrorResponse.status === 404`
  and sets a `notFound` flag.
* Request URLs stay relative (`/tutorials`); `ApiInterceptor` adds the host and
  `/api` prefix. Never hard-code the origin in a service.

# Component state

* State is plain public fields on the component; there is no store and no
  `BehaviorSubject`.
* Feedback strings go into a `message` field, rendered conditionally in the template.
* Parent/child communication uses `@Input()` + `@Output() EventEmitter`
  (`TutorialDrawerComponent` exposes `closed` and `changed`).
* Forms are template-driven: `FormsModule`, `[(ngModel)]`, `name=` and `required`
  attributes — no reactive form builders.

# Styling

The UI is a small design system named with a `tm-` prefix ("Tutorial Manager"),
defined once in `src/styles.css` and reused by every template. Bootstrap 4.6 is still
loaded and its grid/`form-control`/`alert` classes are used, but visual styling comes
from the `tm-*` layer.

* **Tokens** — CSS custom properties on `:root` in `src/styles.css`:
  `--tm-indigo`, `--tm-purple`, `--tm-ink`, `--tm-muted`, `--tm-bg`, `--tm-border`,
  `--tm-radius`, `--tm-shadow`, `--tm-shadow-lg`, `--tm-transition`. Never hard-code a
  colour or radius in a component stylesheet — reference the token.
* **Shared classes** — also in `src/styles.css`:

  | Class | Role |
  | --- | --- |
  | `tm-card` | White rounded surface used by list cards, forms and the drawer |
  | `tm-section-title`, `tm-subtitle` | Heading/subheading pair at the top of a screen |
  | `tm-label`, `tm-input` | Form field label and pill-shaped input |
  | `tm-btn` + `tm-btn-primary` / `tm-btn-danger` / `tm-btn-ghost` | Pill buttons; primary is the indigo→purple gradient, danger is destructive, ghost is secondary |
  | `tm-pill` + `tm-pill-published` / `tm-pill-pending` | Publish-status badge |
  | `tm-empty`, `tm-empty-icon` | Empty-state block |
  | `tm-page` | Vertical padding on the routed `<main>` |

* **Per-component CSS** holds only layout that is specific to that screen
  (`.card-grid`, `.search-bar`, `.form-actions`, `.detail-row`, `.app-shell`). Anything
  reused by two screens belongs in `src/styles.css`.
* **Typography** — the Inter web font is preloaded in `src/index.html` and applied to
  `body` in `src/styles.css`.
* **Status display** — published state is rendered as a `tm-pill`, not raw text, in
  [tutorials-list](/modules/components-tutorials-list.md) and
  [tutorial-details](/modules/components-tutorial-details.md).
* **Not yet migrated** — `tutorial-drawer.component.html` still uses plain Bootstrap
  markup and no `tm-*` class; see
  [tutorial-drawer](/modules/components-tutorial-drawer.md).

# Tests

* Unit specs sit beside the code as `<name>.spec.ts`; the richer per-screen suites use
  the `<name>.component.behaviour.spec.ts` suffix. Integration specs live in
  `src/app/integration/` as `*.integration.spec.ts`. Browser specs live in `e2e/` as
  `*.spec.ts` and are run by Playwright, never by Karma.
* HTTP is mocked at the boundary only: `HttpClientTestingModule` /
  `HttpTestingController` in Karma, `page.route` via `stubApi` in Playwright. No test
  calls the real backend.
* Test names are sentences describing behaviour. See [Testing](/modules/testing.md).

# Templates

Control flow uses the Angular 17 built-in blocks `@if` / `@else` / `@for` with a
`track` expression — not `*ngIf` / `*ngFor`.

# Types

`Tutorial` fields are all optional (`title?`, `published?`, …) so components can
initialise with `{}`. `id` is typed `any`, as are the `id`/`data` parameters on
`TutorialService` methods.
