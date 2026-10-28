---
type: Module
title: src/app/components/add-tutorial
description: Template-driven form that creates a new tutorial and assigns it a category.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/add-tutorial
tags: [component, form, create, category]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T11:34:18Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ a86d8471057ca0f210893c4f79a11417f67af92e
    title: Codebase knowledge graph
status: stable
---

`AddTutorialComponent` (`add-tutorial.component.ts:12`) is routed at `add` and
implements `OnInit`. It injects `TutorialService` and `CategoryService`.

# State

| Field | Meaning |
| --- | --- |
| `tutorial: Tutorial` | Draft initialised to `{ title: '', description: '', published: false, categoryId: null }` |
| `categories: Category[]` | Options for the category dropdown |
| `submitted: boolean` | Switches the template to the success panel |

# Methods

| Method | Line | Behaviour |
| --- | --- | --- |
| `ngOnInit` | 27 | Calls `retrieveCategories` |
| `retrieveCategories` | 31 | `CategoryService.getAll()` → `categories` |
| `saveTutorial` | 40 | POSTs `{ title, description, categoryId }` via `TutorialService.create`, then sets `submitted = true` |
| `newTutorial` | 56 | Clears `submitted` and resets the draft, including `categoryId` |

`published` is not sent on create; the backend decides the initial value.
`categoryId` is normalised to `null` when falsy, so "No category" is sent explicitly
rather than omitted.

# Template

`add-tutorial.component.html` is a single `.submit-form.tm-card` panel with a
`tm-section-title` / `tm-subtitle` heading pair. Each field is a `.form-group` with a
`label.tm-label` and a `.form-control` input; the Category field (line 30) is a
`select.form-control` bound with `[(ngModel)]="tutorial.categoryId"`, whose first
option is `[ngValue]="null"` ("No category") followed by a `@for` over `categories`.
Buttons sit in a `.form-actions` row and use `tm-btn tm-btn-primary`. The `@else`
branch of `@if (!submitted)` swaps the fields for an `alert alert-success` panel and
an `Add another` button calling `newTutorial()`.

Uses `FormsModule` two-way bindings. Depends on
[TutorialService and CategoryService](/modules/services.md) and the
[Tutorial and Category models](/modules/models.md).
