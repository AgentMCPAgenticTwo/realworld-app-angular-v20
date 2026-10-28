---
type: Module
title: src/app/components/tutorials-list
description: List screen with title search, client-side category filter, bulk delete and an inline detail drawer.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/components/tutorials-list
tags: [component, list, search, category]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T11:34:18Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ a86d8471057ca0f210893c4f79a11417f67af92e
    title: Codebase knowledge graph
status: stable
---

`TutorialsListComponent` (`tutorials-list.component.ts:12`) is the landing screen,
routed at `tutorials`. It injects `TutorialService` and `CategoryService`.

# State

| Field | Meaning |
| --- | --- |
| `tutorials?: Tutorial[]` | Unfiltered rows as fetched from the backend |
| `filteredTutorials?: Tutorial[]` | What the template renders, after the category filter |
| `categories: Category[]` | Options for the filter dropdown and the name lookup |
| `currentTutorial: Tutorial` | The selected row |
| `currentIndex: number` | Index of the selected row, `-1` when none |
| `title: string` | Search box binding |
| `categoryId: any` | Category filter binding; `null` means "All categories" |
| `drawerTutorialId: any` | Id passed to the drawer; `null` keeps it closed |

# Methods

| Method | Line | Behaviour |
| --- | --- | --- |
| `ngOnInit` | 27 | Calls `retrieveTutorials` and `retrieveCategories` |
| `retrieveTutorials` | 32 | `TutorialService.getAll()` → `tutorials`, then `applyCategoryFilter` |
| `retrieveCategories` | 43 | `CategoryService.getAll()` → `categories` |
| `applyCategoryFilter` | 52 | Copies `tutorials` into `filteredTutorials`, or filters on `tutorial.categoryId === categoryId` |
| `categoryName` | 63 | Looks the tutorial's `categoryId` up in `categories`; `''` when unknown |
| `refreshList` | 68 | Re-fetches and clears selection + drawer |
| `setActiveTutorial` | 75 | Selects a row and opens the drawer on its `id` |
| `closeDrawer` | 81 | Clears `drawerTutorialId` and selection |
| `removeAllTutorials` | 87 | `TutorialService.deleteAll()` then `refreshList` |
| `searchTitle` | 97 | `TutorialService.findByTitle(title)` → `tutorials`, then `applyCategoryFilter` |

Filtering is **client-side only**: the category never reaches the backend, and
`applyCategoryFilter` is re-run after every fetch so the title search and the category
filter compose.

# Template

`tutorials-list.component.html` is a card layout, not a table:

| Region | Markup | Notes |
| --- | --- | --- |
| Header | `.list-header` | `tm-section-title` + `tm-subtitle`, and the `Remove All` danger button |
| Search | `.search-bar.tm-card` | `.search-icon`, `input.search-input` bound to `title`, `select.search-category` bound to `categoryId` with `(ngModelChange)="applyCategoryFilter()"`, Search button calling `searchTitle()` |
| Results | `.card-grid` → `article.tutorial-card.tm-card` | `@for` over `filteredTutorials` with `track tutorial.id`; `[class.active]` marks `currentIndex`; whole card calls `setActiveTutorial(tutorial, i)` |
| Status | `.tm-pill-published` / `.tm-pill-pending` | Derived from `tutorial.published` |
| Category | `.tm-pill.tm-pill-category` | Rendered only when `categoryName(tutorial)` is non-empty |
| Empty | `.tm-empty` + `.tm-empty-icon` | Rendered by the `@else` branch when `filteredTutorials` is empty |

The filter `<option [ngValue]="null">All categories</option>` is followed by a `@for`
over `categories`; `ngValue` (not `value`) is required so the bound id keeps its type.

The `tm-*` classes come from `src/styles.css`; card, grid, pill and
`.search-category` layout live in `tutorials-list.component.css`. See the styling
section of [Conventions](/conventions.md).

# Drawer wiring

`tutorials-list.component.html` renders `<app-tutorial-drawer>` with
`[tutorialId]="drawerTutorialId"`, `(changed)="retrieveTutorials()"` and
`(closed)="closeDrawer()"` — see
[TutorialDrawerComponent](/modules/components-tutorial-drawer.md).

Depends on [TutorialService and CategoryService](/modules/services.md) and the
[Tutorial and Category models](/modules/models.md).
