---
type: Module
title: src/app/components/add-tutorial
description: Template-driven form that creates a new tutorial.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/add-tutorial
tags: [component, form, create]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T04:04:01Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 6878a25eb09b858a48f0956018c2d975cf0182bb
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

# Template

`add-tutorial.component.html` is a single `.submit-form.tm-card` panel with a
`tm-section-title` / `tm-subtitle` heading pair. Each field is a `.form-group` with a
`label.tm-label` and a `.form-control` input; buttons sit in a `.form-actions` row and
use `tm-btn tm-btn-primary`. The `@else` branch of `@if (!submitted)` swaps the fields
for an `alert alert-success` panel and an `Add another` button calling `newTutorial()`.

Uses `FormsModule` two-way bindings in `add-tutorial.component.html`. Depends on
[TutorialService](/modules/services.md) and the
[Tutorial model](/modules/models.md).
