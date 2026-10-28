---
type: Module
title: src/app/interceptors
description: `ApiInterceptor`, which prefixes relative request URLs with the configured API base.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/app/interceptors
tags: [http, interceptor, configuration]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

`ApiInterceptor` (`api.interceptor.ts:16`) implements `HttpInterceptor`.

# `intercept` (line 17)

1. If `req.url` matches `/^https?:\/\//i`, forward it unchanged — absolute URLs
   bypass the rewrite.
2. Otherwise normalise the path to start with `/`.
3. Clone the request with `` `${environment.apiUrl}${path}` `` as the URL.

With `environment.apiUrl = 'http://localhost:5001/api'`, the service's `/tutorials`
becomes `http://localhost:5001/api/tutorials`.

Registered as a multi-provider for `HTTP_INTERCEPTORS` in `src/app/app.module.ts`
(see [the shell module](/modules/app-shell.md)). It reads
[environment configuration](/modules/environments.md) and is the reason
[TutorialService](/modules/services.md) can use relative paths.

`api.interceptor.spec.ts` covers the relative-URL rewrite, query-string preservation
for title search, and the absolute-URL passthrough.
