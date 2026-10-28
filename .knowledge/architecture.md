---
type: Architecture
title: Application architecture
description: Module-based Angular app layered as routed components, a single HTTP service and a URL-rewriting interceptor.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [architecture, angular, layers]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T04:04:01Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 6878a25eb09b858a48f0956018c2d975cf0182bb
    title: Codebase knowledge graph
status: stable
---

# Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Shell | `src/app/app.component.ts`, `src/app/app.module.ts`, `src/app/app-routing.module.ts` | Bootstrap, page layout (header/main/footer), route table, DI providers |
| Presentation | `src/app/components/` | Five components; all state is component-local |
| Styling | `src/styles.css`, `src/index.html`, per-component `.css` | `--tm-*` tokens and shared `tm-*` classes; no component defines its own colours |
| Data access | `src/app/services/tutorial.service.ts` | The only place `HttpClient` is used |
| Cross-cutting | `src/app/interceptors/api.interceptor.ts` | Prefixes relative URLs with `environment.apiUrl` |
| Model | `src/app/models/tutorial.model.ts` | `Tutorial` shape shared by every component |
| Config | `src/environments/environment.ts` | `production`, `apiUrl` |

The dependency direction is strictly presentation → service → interceptor → HTTP.
No component imports `HttpClient` directly.

# Routes

Defined in `routes` in `src/app/app-routing.module.ts`:

| Path | Component |
| --- | --- |
| `''` | redirect to `tutorials` |
| `tutorials` | [TutorialsListComponent](/modules/components-tutorials-list.md) |
| `tutorials/:id` | [TutorialDetailsComponent](/modules/components-tutorial-details.md) |
| `add` | [AddTutorialComponent](/modules/components-add-tutorial.md) |

# Render tree

```
AppComponent (app-root)              .app-shell
  HeaderComponent (app-header)       navbar, routerLink /tutorials and /add
  main.container.tm-page
    router-outlet
      TutorialsListComponent        route 'tutorials'
        TutorialDrawerComponent     child, driven by @Input tutorialId
      TutorialDetailsComponent      route 'tutorials/:id'
      AddTutorialComponent          route 'add'
  footer.app-footer
```

[HeaderComponent](/modules/components-header.md) is purely presentational and holds
the only navigation markup in the app; `AppComponent` contributes the sticky-footer
flex layout only.

`TutorialsListComponent` is the only composite screen: it renders
[TutorialDrawerComponent](/modules/components-tutorial-drawer.md) and wires its
`closed` / `changed` outputs back to `closeDrawer()` and `retrieveTutorials()`.

# Call graph (hotspots)

| Symbol | Fan-in | Callers |
| --- | --- | --- |
| `TutorialsListComponent.retrieveTutorials` | 2 | `ngOnInit`, `refreshList` |
| `TutorialsListComponent.refreshList` | 1 | `removeAllTutorials` |
| `TutorialDetailsComponent.getTutorial` | 1 | `ngOnInit` |
| `TutorialDrawerComponent.getTutorial` | 1 | `ngOnChanges` |
| `TutorialDrawerComponent.close` | 1 | `deleteTutorial` |

Every service method is invoked from component methods only; the graph records a
single outbound `HTTP_CALLS` edge for the app's REST surface.

# Boundaries

* **Network boundary** — `src/app/services/tutorial.service.ts` is the single egress
  point. Changing the backend means changing `baseUrl` there or `apiUrl` in
  `src/environments/environment.ts`.
* **Absolute-URL escape hatch** — `ApiInterceptor.intercept` leaves any request whose
  URL already matches `^https?://` untouched.
* **Two detail surfaces** — `TutorialDetailsComponent` (route) and
  `TutorialDrawerComponent` (inline panel) duplicate `getTutorial`,
  `updatePublished` and `deleteTutorial` logic. Behaviour changes to tutorial detail
  must usually be applied to both; see [Common Tasks](/playbooks/common-tasks.md).
* **Styling boundary** — shared visual language lives in `src/styles.css` as `--tm-*`
  tokens and `tm-*` classes; component stylesheets add screen-specific layout only.
  `tutorial-drawer.component.html` is the one surface not yet on this system.

# Conventions

Coding and template conventions are documented in [Conventions](/conventions.md).
