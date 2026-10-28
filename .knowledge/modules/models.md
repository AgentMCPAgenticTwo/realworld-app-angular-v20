---
type: Module
title: src/app/models
description: The `Tutorial` record shared by every component and service.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/models
tags: [model, types]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

`Tutorial` (`tutorial.model.ts:1`) is a class used purely as a shape.

| Field | Type |
| --- | --- |
| `id?` | `any` |
| `title?` | `string` |
| `description?` | `string` |
| `published?` | `boolean` |
| `createdAt?` | `string` |
| `updatedAt?` | `string` |

Every field is optional so components can start from `{}` or a blank draft.
`createdAt` / `updatedAt` are ISO strings supplied by the backend and are never set
by the client.

Used by [TutorialService](/modules/services.md) and all four components listed in
[Modules](/modules/index.md). `tutorial.model.spec.ts` only asserts that an instance
can be constructed.
