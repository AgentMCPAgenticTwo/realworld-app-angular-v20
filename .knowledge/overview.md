---
type: Codebase Overview
title: realworld-app-angular-v20
description: Angular 17 CRUD single-page app for managing tutorials against a REST backend.
resource: https://github.com/AgentMCPAgenticTwo/realworld-app-angular-v20/tree/main/
tags: [angular, typescript, crud, frontend]
generated: { by: sage-maintenance/claude-code, at: 2026-10-28T04:04:01Z }
sources:
  - id: cbm-graph
    resource: codebase-memory-mcp project realworld-app-angular-v20 @ 6878a25eb09b858a48f0956018c2d975cf0182bb
    title: Codebase knowledge graph
status: stable
---

# Purpose

A tutorial-management CRUD demo: list, search, create, inspect, publish/unpublish and
delete `Tutorial` records held by a REST backend. All UI lives in one Angular
`NgModule` application bootstrapped from `src/main.ts`.

# Stack

| Concern | Choice |
| --- | --- |
| Framework | Angular 17 (`@angular/core`, NgModule-based, not standalone) |
| Language | TypeScript 5.2 |
| HTTP | `@angular/common/http` `HttpClient` + `HttpInterceptor` |
| Forms | `FormsModule` (template-driven, `ngModel`) |
| Styling | Bootstrap 4.6 under a `tm-*` design system: tokens and shared classes in `src/styles.css`, screen-specific layout in per-component CSS, Inter web font from `src/index.html` |
| Reactive | RxJS 7.8 `Observable` / `subscribe` |
| Tests | Karma + Jasmine (`*.spec.ts`) |

Package name in `package.json` is `angular-17-crud`.

# Scripts

| Script | Command |
| --- | --- |
| `start` | `ng serve` |
| `build` | `ng build` |
| `watch` | `ng build --watch --configuration development` |
| `test` | `ng test` |

# Entry points

| Path | Role |
| --- | --- |
| `src/main.ts` | Bootstraps `AppModule` |
| `src/index.html` | Host page, mounts `<app-root>`, preloads the Inter font |
| `src/styles.css` | Global theme tokens (`--tm-*`) and shared `tm-*` classes |
| `src/app/app.module.ts` | Declares all six components, imports `HttpClientModule`/`FormsModule`, registers `ApiInterceptor` |
| `src/app/app-routing.module.ts` | Defines the four routes |
| `src/app/app.component.ts` | Layout shell (header / `<main>` / footer); `title = 'Angular 17 Crud example'`, unused by the template |
| `src/app/components/header/header.component.ts` | Top navigation bar |

# Backend contract

`src/app/services/tutorial.service.ts` calls the relative base path `/tutorials`.
`src/app/interceptors/api.interceptor.ts` rewrites every relative request to
`environment.apiUrl`, which is `http://localhost:5001/api` in
`src/environments/environment.ts`.

See [Architecture](/architecture.md) for layering and [Modules](/modules/index.md)
for per-directory detail.
