---
type: Module
title: src/app/services
description: `TutorialService`, the single REST client for `/tutorials`.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/services
tags: [service, http, rest]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

`TutorialService` (`tutorial.service.ts:12`) is the only consumer of `HttpClient`.
The module-level constant `baseUrl` (line 7) is the relative path `'/tutorials'`;
the host is added later by [ApiInterceptor](/modules/interceptors.md).

# API

| Method | Line | Request | Returns |
| --- | --- | --- | --- |
| `getAll` | 15 | `GET /tutorials` | `Observable<Tutorial[]>` |
| `get` | 19 | `GET /tutorials/{id}` | `Observable<Tutorial>` |
| `create` | 23 | `POST /tutorials` | `Observable<any>` |
| `update` | 27 | `PUT /tutorials/{id}` | `Observable<any>` |
| `delete` | 31 | `DELETE /tutorials/{id}` | `Observable<any>` |
| `deleteAll` | 35 | `DELETE /tutorials` | `Observable<any>` |
| `findByTitle` | 39 | `GET /tutorials?title={title}` | `Observable<Tutorial[]>` |

Methods are thin pass-throughs: no error handling, no caching, no state. Mutating
responses are typed `any` because the backend returns a `{ message }` envelope that
`TutorialDetailsComponent.updatePublished` and
`TutorialDrawerComponent.updatePublished` read.

`findByTitle` interpolates `title` into the query string without encoding.

Consumed by all four components; see [Modules](/modules/index.md).
Uses the [Tutorial model](/modules/models.md).
