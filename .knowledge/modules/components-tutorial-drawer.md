---
type: Module
title: src/app/components/tutorial-drawer
description: Slide-in panel that shows and mutates the tutorial selected in the list.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/tutorial-drawer
tags: [component, drawer, detail]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

`TutorialDrawerComponent` (`tutorial-drawer.component.ts:11`) implements `OnChanges`
and is rendered by
[TutorialsListComponent](/modules/components-tutorials-list.md).

# Contract

| Member | Kind | Meaning |
| --- | --- | --- |
| `tutorialId` | `@Input()` | Id to display; `null`/`undefined` means closed |
| `closed` | `@Output() EventEmitter<void>` | User dismissed the drawer |
| `changed` | `@Output() EventEmitter<void>` | The record was updated or deleted |
| `open` | getter, line 23 | `true` when `tutorialId` is neither `null` nor `undefined` |
| `currentTutorial` | field | Loaded record, `{}` while empty |
| `notFound` | field | Set when the fetch returns HTTP 404 |
| `message` | field | Feedback text after a publish toggle |

# Methods

| Method | Line | Behaviour |
| --- | --- | --- |
| `ngOnChanges` | 27 | On a `tutorialId` change resets state and fetches when `open` |
| `getTutorial` | 39 | `TutorialService.get(id)`; HTTP 404 sets `notFound` instead of logging |
| `updatePublished` | 56 | PUTs the publish flag, sets `message`, emits `changed` |
| `deleteTutorial` | 77 | Deletes, emits `changed`, then calls `close` |
| `close` | 87 | Emits `closed` |

The 404 branch is the only user-visible error handling in the app; everywhere else
errors go to `console.error` (see [Conventions](/conventions.md)).

`tutorial-drawer.component.spec.ts` defines the `openWith` helper (line 29) used to
drive the component in tests.

Depends on [TutorialService](/modules/services.md) and the
[Tutorial model](/modules/models.md).
