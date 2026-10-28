---
type: Module
title: src/app/components/tutorial-details
description: Routed edit screen for a single tutorial at `tutorials/:id`, including its category.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/tutorial-details
tags: [component, detail, edit, category]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T11:34:18Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ a86d8471057ca0f210893c4f79a11417f67af92e
    title: Codebase knowledge graph
status: stable
---

`TutorialDetailsComponent` (`tutorial-details.component.ts:13`) is routed at
`tutorials/:id` and is also usable as a child via its inputs.

# Inputs and state

| Field | Meaning |
| --- | --- |
| `@Input() viewMode: boolean` | When `true`, skip the route-driven fetch in `ngOnInit` |
| `@Input() currentTutorial: Tutorial` | The record being edited; defaults to an empty draft |
| `message: string` | Success text shown after an update |
| `categories: Category[]` | Options for the category dropdown |

It injects `TutorialService`, `CategoryService`, `ActivatedRoute` and `Router`.

# Methods

| Method | Line | Behaviour |
| --- | --- | --- |
| `ngOnInit` | 32 | Unless `viewMode`, fetches `route.snapshot.params['id']` and the categories |
| `retrieveCategories` | 40 | `CategoryService.getAll()` → `categories` |
| `categoryName` (getter) | 49 | Resolves `currentTutorial.categoryId` to a name; `''` when unknown |
| `getTutorial` | 56 | `TutorialService.get(id)` → `currentTutorial` |
| `updatePublished` | 66 | PUTs title/description/`categoryId` plus the new `published` flag |
| `updateTutorial` | 90 | PUTs the whole `currentTutorial` |
| `deleteTutorial` | 106 | Deletes, then navigates to `/tutorials` |

Categories are loaded only in edit mode — in `viewMode` `ngOnInit` returns early, so
`categories` stays empty and the `categoryName` getter (currently not referenced by
the template) would return `''`.

`updatePublished` now carries `categoryId` in its payload, so toggling publish no
longer drops the category.

# Template

`tutorial-details.component.html` branches on `viewMode` first, then on
`currentTutorial.id`:

| Branch | Root element | Contents |
| --- | --- | --- |
| `viewMode` + id | `.view-card.tm-card` | Read-only `.detail-row` entries for title, description and a `tm-pill` status, plus an `Edit` link (`tm-btn tm-btn-ghost`) to `/tutorials/{{ id }}` |
| `viewMode`, no id | `p.tm-empty` | "Please click on a Tutorial..." |
| edit + id | `.edit-form.tm-card` | `.form-group` title/description inputs, a Category `select` (line 58) bound to `currentTutorial.categoryId`, a read-only `.status-group` pill, the `message` success alert, and a `.form-actions` row |
| edit, no id | `p.tm-empty` | "Cannot access this Tutorial..." |

The Category select mirrors the add form: an `[ngValue]="null"` "No category" option
followed by a `@for` over `categories`. The read-only view does not show the category.

In `.form-actions` the destructive `Delete` button (`tm-btn-danger`) is separated from
the `.form-actions-right` group holding `Publish`/`UnPublish` (`tm-btn-ghost`) and
`Update` (`tm-btn-primary`). Shared `tm-*` classes come from `src/styles.css`; see the
styling section of [Conventions](/conventions.md).

# Relationship to the drawer

[TutorialDrawerComponent](/modules/components-tutorial-drawer.md) implements the same
read / publish / delete operations inline in the list, but has **not** been given
category support — its `updatePublished` still PUTs only title, description and
published, which clears `categoryId` if the backend treats the payload as a full
replace. Changes to tutorial-detail behaviour usually belong in both — see
[Common Tasks](/playbooks/common-tasks.md).

Depends on [TutorialService and CategoryService](/modules/services.md) and the
[Tutorial and Category models](/modules/models.md).
