---
type: Architecture
title: Application architecture
description: Module-based Angular app layered as routed components, HTTP services and a URL-rewriting interceptor.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app
tags: [architecture, angular, layers]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T13:46:25Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 3a87e8e68c23204246655d54df5961c9299323ce
    title: Codebase knowledge graph
status: stable
---

# Layers

| Layer | Location | Responsibility |
| --- | --- | --- |
| Shell | `src/app/app.component.ts`, `src/app/app.module.ts`, `src/app/app-routing.module.ts` | Bootstrap, page layout (header/main/footer), footer health probe, route table, DI providers |
| Presentation | `src/app/components/` | Five components; all state is component-local |
| Styling | `src/styles.css`, `src/index.html`, per-component `.css` | `--tm-*` tokens and shared `tm-*` classes; no component defines its own colours |
| Data access | `src/app/services/tutorial.service.ts`, `src/app/services/health.service.ts` | The only places `HttpClient` is used |
| Cross-cutting | `src/app/interceptors/api.interceptor.ts` | Prefixes relative URLs with `environment.apiUrl` |
| Model | `src/app/models/tutorial.model.ts`, `src/app/models/health.model.ts` | `Tutorial` and `Health` shapes |
| Config | `src/environments/environment.ts` | `production`, `apiUrl` |
| Test | `*.spec.ts`, `src/app/integration/`, `e2e/`, `playwright.config.ts` | Karma/Jasmine unit + integration specs and Playwright browser specs; see [test suites](/modules/testing.md) |

The dependency direction is strictly presentation → service → interceptor → HTTP.
No component imports `HttpClient` directly. `AppComponent` is the one shell-layer
class that reaches into the data-access layer, via `HealthService`.

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
  footer.app-footer                  .app-footer-health shows AppComponent.apiStatus,
                                     with .app-footer-health-spinner while apiLoading
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
| `HealthService.get` | 1 | `AppComponent.ngOnInit` |

Every service method is invoked from component methods only.

# Boundaries

* **Network boundary** — `src/app/services/tutorial.service.ts` and
  `src/app/services/health.service.ts` are the egress points. Changing the backend
  means changing `baseUrl` in those files or `apiUrl` in
  `src/environments/environment.ts`.
* **Health probe** — `AppComponent.ngOnInit` fires one `GET /health` per app load
  and degrades to `apiStatus = 'unavailable'` on error, so a missing `/health`
  endpoint never breaks the shell. `apiLoading` gates the footer spinner and
  `aria-busy`. Any `TestBed` that declares `AppComponent` must therefore provide
  `HttpClientTestingModule`.
* **Absolute-URL escape hatch** — `ApiInterceptor.intercept` leaves any request whose
  URL already matches `^https?://` untouched.
* **Two detail surfaces** — `TutorialDetailsComponent` (route) and
  `TutorialDrawerComponent` (inline panel) duplicate `getTutorial`,
  `updatePublished` and `deleteTutorial` logic. Behaviour changes to tutorial detail
  must usually be applied to both; see [Common Tasks](/playbooks/common-tasks.md).
* **Styling boundary** — shared visual language lives in `src/styles.css` as `--tm-*`
  tokens and `tm-*` classes; component stylesheets add screen-specific layout only.
  `tutorial-drawer.component.html` is the one surface not yet on this system, and
  the `.is-ok` / `.is-error` colours in `src/app/app.component.css` are the one
  place a colour is hard-coded instead of tokenised.
* **Test boundary** — unit and integration specs stub HTTP at
  `HttpTestingController`; e2e specs stub it at the browser with `stubApi`
  (`e2e/support/api-stub.ts`). Neither tier reaches `environment.apiUrl`, so no
  backend is needed to run the suite. See [test suites](/modules/testing.md).

# Conventions

Coding and template conventions are documented in [Conventions](/conventions.md).
