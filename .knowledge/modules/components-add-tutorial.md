---
type: Module
title: src/app/components/add-tutorial
description: Template-driven form that creates a new tutorial.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/add-tutorial
tags: [component, form, create]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

`AddTutorialComponent` (`add-tutorial.component.ts:10`) is routed at `add`.

# State

| Field | Meaning |
| --- | --- |
| `tutorial: Tutorial` | Draft initialised to `{ title: '', description: '', published: false }` |
| `submitted: boolean` | Switches the template to the success panel |

# Methods

| Method | Line | Behaviour |
| --- | --- | --- |
| `saveTutorial` | 20 | POSTs `{ title, description }` via `TutorialService.create`, then sets `submitted = true` |
| `newTutorial` | 35 | Clears `submitted` and resets the draft |

Note that `published` is not sent on create; the backend decides the initial value.

Uses `FormsModule` two-way bindings in `add-tutorial.component.html`. Depends on
[TutorialService](/modules/services.md) and the
[Tutorial model](/modules/models.md).
