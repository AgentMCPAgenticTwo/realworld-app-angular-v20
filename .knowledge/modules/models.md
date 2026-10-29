---
type: Module
title: src/app/models
description: The `Tutorial` record shared by every component and service, plus the `Health` probe response.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/models
tags: [model, types]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T09:53:52Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 9b034fe57d550b8f66d54b93e29362baf23c00ae
    title: Codebase knowledge graph
status: stable
---

# Tutorial

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

# Health

`Health` (`health.model.ts:1`) is the same style of shape-only class, with a single
optional field.

| Field | Type |
| --- | --- |
| `status?` | `string` |

Returned by `HealthService.get` (see [Services](/modules/services.md)) and read by
`AppComponent.ngOnInit` in the [app shell](/modules/app-shell.md) to populate the
footer status text.
