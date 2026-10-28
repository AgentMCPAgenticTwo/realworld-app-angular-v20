---
type: Module
title: src/app/components/tutorials-list
description: List screen with title search, bulk delete and an inline detail drawer.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/tutorials-list
tags: [component, list, search]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

`TutorialsListComponent` (`tutorials-list.component.ts:10`) is the landing screen,
routed at `tutorials`.

# State

| Field | Meaning |
| --- | --- |
| `tutorials?: Tutorial[]` | Rows currently displayed |
| `currentTutorial: Tutorial` | The selected row |
| `currentIndex: number` | Index of the selected row, `-1` when none |
| `title: string` | Search box binding |
| `drawerTutorialId: any` | Id passed to the drawer; `null` keeps it closed |

# Methods

| Method | Line | Behaviour |
| --- | --- | --- |
| `ngOnInit` | 19 | Calls `retrieveTutorials` |
| `retrieveTutorials` | 23 | `TutorialService.getAll()` → `tutorials` |
| `refreshList` | 33 | Re-fetches and clears selection + drawer |
| `setActiveTutorial` | 40 | Selects a row and opens the drawer on its `id` |
| `closeDrawer` | 46 | Clears `drawerTutorialId` and selection |
| `removeAllTutorials` | 52 | `TutorialService.deleteAll()` then `refreshList` |
| `searchTitle` | 62 | `TutorialService.findByTitle(title)` → `tutorials` |

# Template wiring

`tutorials-list.component.html` renders `<app-tutorial-drawer>` with
`[tutorialId]="drawerTutorialId"`, `(changed)="retrieveTutorials()"` and
`(closed)="closeDrawer()"` — see
[TutorialDrawerComponent](/modules/components-tutorial-drawer.md).

Depends on [TutorialService](/modules/services.md) and the
[Tutorial model](/modules/models.md).
