---
type: Module
title: src/app/components/tutorial-details
description: Routed edit screen for a single tutorial at `tutorials/:id`.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/tutorial-details
tags: [component, detail, edit]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
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

# Relationship to the drawer

[TutorialDrawerComponent](/modules/components-tutorial-drawer.md) implements the same
read / publish / delete operations inline in the list. Changes to tutorial-detail
behaviour usually belong in both — see [Common Tasks](/playbooks/common-tasks.md).

Depends on [TutorialService](/modules/services.md) and the
[Tutorial model](/modules/models.md).
