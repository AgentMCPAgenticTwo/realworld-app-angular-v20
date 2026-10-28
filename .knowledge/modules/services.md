---
type: Module
title: src/app/services
description: `TutorialService` and `CategoryService`, the REST clients for `/tutorials` and `/categories`.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/services
tags: [service, http, rest]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T11:34:18Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ a86d8471057ca0f210893c4f79a11417f67af92e
    title: Codebase knowledge graph
status: stable
---

The two services in this directory are the only consumers of `HttpClient`. Each
declares a module-level `baseUrl` constant holding a relative path; the host is added
later by [ApiInterceptor](/modules/interceptors.md). Both are
`@Injectable({ providedIn: 'root' })`.

# `TutorialService` (`tutorial.service.ts:12`)

`baseUrl` (line 7) is `'/tutorials'`.

| Method | Line | Request | Returns |
| --- | --- | --- | --- |
| `getAll` | 15 | `GET /tutorials` | `Observable<Tutorial[]>` |
| `get` | 19 | `GET /tutorials/{id}` | `Observable<Tutorial>` |
| `create` | 23 | `POST /tutorials` | `Observable<any>` |
| `update` | 27 | `PUT /tutorials/{id}` | `Observable<any>` |
| `delete` | 31 | `DELETE /tutorials/{id}` | `Observable<any>` |
| `deleteAll` | 35 | `DELETE /tutorials` | `Observable<any>` |
| `findByTitle` | 39 | `GET /tutorials?title={title}` | `Observable<Tutorial[]>` |

`findByTitle` interpolates `title` into the query string without encoding.

# `CategoryService` (`category.service.ts:12`)

`baseUrl` (line 7) is `'/categories'`.

| Method | Line | Request | Returns |
| --- | --- | --- | --- |
| `getAll` | 15 | `GET /categories` | `Observable<Category[]>` |
| `create` | 19 | `POST /categories` | `Observable<any>` |

There is no category read-by-id, update or delete; the app only lists categories and
assigns them. No screen currently calls `create` — it exists for completeness.

# Shared shape

Methods are thin pass-throughs: no error handling, no caching, no state. Mutating
responses are typed `any` because the backend returns a `{ message }` envelope that
`TutorialDetailsComponent.updatePublished` and
`TutorialDrawerComponent.updatePublished` read. Category filtering happens
client-side — `/categories` is never queried with parameters.

Consumed by all four components; see [Modules](/modules/index.md).
Uses the [Tutorial and Category models](/modules/models.md).
