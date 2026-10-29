---
type: Module
title: src/app/services
description: `TutorialService` and `HealthService`, the app's REST clients for `/tutorials` and `/health`.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/services
tags: [service, http, rest]
generated: { by: sage-maintenance/claude-code, at: 2026-10-29T09:53:52Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 9b034fe57d550b8f66d54b93e29362baf23c00ae
    title: Codebase knowledge graph
status: stable
---

Two `providedIn: 'root'` services live here; both are consumers of `HttpClient` and
both declare a module-level `baseUrl` constant holding a relative path, so the host
is added later by [ApiInterceptor](/modules/interceptors.md).

| Service | File | Line | `baseUrl` |
| --- | --- | --- | --- |
| `TutorialService` | `tutorial.service.ts` | 12 | `'/tutorials'` (line 7) |
| `HealthService` | `health.service.ts` | 12 | `'/health'` (line 7) |

# TutorialService API

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

# HealthService API

| Method | Line | Request | Returns |
| --- | --- | --- | --- |
| `get` | 15 | `GET /health` | `Observable<Health>` |

Single read-only probe, no error handling of its own. Its only consumer is
`AppComponent.ngOnInit` in the [app shell](/modules/app-shell.md), which maps the
response to the footer's `apiStatus` and falls back to `'unavailable'` in the error
callback. Uses the [Health model](/modules/models.md).
`health.service.spec.ts` asserts the service is created and that `get()` issues
`GET /health`, using `HttpClientTestingModule` / `HttpTestingController`.
