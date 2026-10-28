---
type: Module
title: src/environments
description: Build-time configuration holding the API base URL.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/src/environments
tags: [configuration, environment]
generated: { by: sage-maintenance/claude-code, at: 2026-10-27T12:01:30Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487
    title: Codebase knowledge graph
status: stable
---

`environment` (`src/environments/environment.ts:1`):

| Key | Value |
| --- | --- |
| `production` | `false` |
| `apiUrl` | `'http://localhost:5001/api'` |

This is the only environment file in the repository — there is no
`environment.prod.ts` and `angular.json` declares no `fileReplacements` for it.

Its single consumer is [ApiInterceptor](/modules/interceptors.md); pointing the app
at a different backend means editing `apiUrl` here.
