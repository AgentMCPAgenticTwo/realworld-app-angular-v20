---
type: Module
title: src/app/models
description: The `Tutorial` and `Category` records shared by every component and service.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/models
tags: [model, types]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T11:34:18Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ a86d8471057ca0f210893c4f79a11417f67af92e
    title: Codebase knowledge graph
status: stable
---

Both models are classes used purely as shapes.

# `Tutorial` (`tutorial.model.ts:1`)

| Field | Type |
| --- | --- |
| `id?` | `any` |
| `title?` | `string` |
| `description?` | `string` |
| `published?` | `boolean` |
| `categoryId?` | `any` |
| `createdAt?` | `string` |
| `updatedAt?` | `string` |

Every field is optional so components can start from `{}` or a blank draft.
`createdAt` / `updatedAt` are ISO strings supplied by the backend and are never set
by the client. `categoryId` is a foreign key into `Category`; `null` means
"no category" and is what the forms send when nothing is picked.

# `Category` (`category.model.ts:1`)

| Field | Type |
| --- | --- |
| `id?` | `any` |
| `name?` | `string` |

There is no embedded `category` object on `Tutorial` — components resolve the name
themselves from a locally held `categories` array (`TutorialsListComponent.categoryName`,
`TutorialDetailsComponent.categoryName`).

Used by [TutorialService and CategoryService](/modules/services.md) and all four
components listed in [Modules](/modules/index.md). `tutorial.model.spec.ts` only
asserts that an instance can be constructed.
