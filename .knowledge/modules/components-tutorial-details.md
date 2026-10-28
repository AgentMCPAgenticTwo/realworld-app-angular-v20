---
type: Module
title: src/app/components/tutorial-details
description: Routed edit screen for a single tutorial at `tutorials/:id`.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/tutorial-details
tags: [component, detail, edit]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T04:04:01Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 6878a25eb09b858a48f0956018c2d975cf0182bb
    title: Codebase knowledge graph
status: stable
---

`TutorialDetailsComponent` (`tutorial-details.component.ts:11`) is routed at
`tutorials/:id` and is also usable as a child via its inputs.

# Inputs and state

| Field | Meaning |
| --- | --- |
| `@Input() viewMode: boolean` | When `true`, skip the route-driven fetch in `ngOnInit` |
| `@Input() currentTutorial: Tutorial` | The record being edited; defaults to an empty draft |
| `message: string` | Success text shown after an update |

It injects `TutorialService`, `ActivatedRoute` and `Router`.

# Methods

| Method | Line | Behaviour |
| --- | --- | --- |
| `ngOnInit` | 28 | Unless `viewMode`, fetches `route.snapshot.params['id']` |
| `getTutorial` | 35 | `TutorialService.get(id)` → `currentTutorial` |
| `updatePublished` | 45 | PUTs title/description plus the new `published` flag |
| `updateTutorial` | 66 | PUTs the whole `currentTutorial` |
| `deleteTutorial` | 82 | Deletes, then navigates to `/tutorials` |

# Template

`tutorial-details.component.html` branches on `viewMode` first, then on
`currentTutorial.id`:

| Branch | Root element | Contents |
| --- | --- | --- |
| `viewMode` + id | `.view-card.tm-card` | Read-only `.detail-row` entries for title, description and a `tm-pill` status, plus an `Edit` link (`tm-btn tm-btn-ghost`) to `/tutorials/{{ id }}` |
| `viewMode`, no id | `p.tm-empty` | "Please click on a Tutorial..." |
| edit + id | `.edit-form.tm-card` | `.form-group` title/description inputs, a read-only `.status-group` pill, the `message` success alert, and a `.form-actions` row |
| edit, no id | `p.tm-empty` | "Cannot access this Tutorial..." |

In `.form-actions` the destructive `Delete` button (`tm-btn-danger`) is separated from
the `.form-actions-right` group holding `Publish`/`UnPublish` (`tm-btn-ghost`) and
`Update` (`tm-btn-primary`). Shared `tm-*` classes come from `src/styles.css`; see the
styling section of [Conventions](/conventions.md).

# Relationship to the drawer

[TutorialDrawerComponent](/modules/components-tutorial-drawer.md) implements the same
read / publish / delete operations inline in the list. Changes to tutorial-detail
behaviour usually belong in both — see [Common Tasks](/playbooks/common-tasks.md).

Depends on [TutorialService](/modules/services.md) and the
[Tutorial model](/modules/models.md).
