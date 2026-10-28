---
type: Convention
title: Project conventions
description: Naming, file-layout, template and HTTP-subscription conventions used throughout the app.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [conventions, angular, typescript]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

# File layout

* One directory per component under `src/app/components/<kebab-name>/`, holding
  `<kebab-name>.component.ts`, `.html`, `.css` and `.spec.ts`.
* Services in `src/app/services/`, models in `src/app/models/`, HTTP interceptors in
  `src/app/interceptors/`. Each has a sibling `.spec.ts`.
* `@Component` always uses `templateUrl` + `styleUrl` (singular, Angular 17 form) —
  never inline templates. See `src/app/app.component.ts`.

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

# Types

`Tutorial` fields are all optional (`title?`, `published?`, …) so components can
initialise with `{}`. `id` is typed `any`, as are the `id`/`data` parameters on
`TutorialService` methods.
