---
type: Module
title: src/app/components/header
description: Presentational top navigation bar with the brand mark and the two primary router links.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/header
tags: [component, navigation, layout]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T04:04:01Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 6878a25eb09b858a48f0956018c2d975cf0182bb
    title: Codebase knowledge graph
status: stable
---

`HeaderComponent` (`src/app/components/header/header.component.ts:8`, selector
`app-header`) is the site navigation bar. It was extracted out of the inline navbar
that previously lived in `src/app/app.component.html`.

# Contract

| Member | Kind | Meaning |
| --- | --- | --- |
| `brand` | field, line 9 | Brand text rendered next to the `TM` mark; `'Tutorial Manager'` |

There are no inputs, outputs, injected dependencies or methods — the component is
purely presentational and the graph records no callers or callees for it.

# Template

`header.component.html` renders a Bootstrap `navbar` with the `tm-navbar` skin and:

| Link | `routerLink` | Target |
| --- | --- | --- |
| Brand (`tm-brand`, `tm-brand-mark`) | `/tutorials` | [TutorialsListComponent](/modules/components-tutorials-list.md) |
| `Tutorials` | `/tutorials` | [TutorialsListComponent](/modules/components-tutorials-list.md) |
| `Add Tutorial` | `/add` | [AddTutorialComponent](/modules/components-add-tutorial.md) |

Both nav links use `routerLinkActive="active"`; the active underline/pill treatment
lives in `header.component.css` under `.tm-nav-link`.

# Wiring

Declared in `AppModule` and rendered by `AppComponent` — see
[the shell module](/modules/app-shell.md). Adding a screen to the navigation means
editing `header.component.html`, not `app.component.html`; see
[Common Tasks](/playbooks/common-tasks.md).

`header.component.spec.ts` mounts the component with `RouterTestingModule` and
asserts the brand text and the two nav links.
