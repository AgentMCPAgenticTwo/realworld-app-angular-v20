# Unit test plan — phase 01-unit

Runner: Karma + Jasmine (Angular builder), as already configured. No new runner added.
Convention followed from existing specs: `TestBed` + `HttpClientTestingModule` +
`HttpTestingController`, specs co-located as `*.spec.ts`.

Pre-existing failure found by `npm run test` before any change:
`TutorialService should be created` — the spec configures an empty TestBed so `HttpClient`
has no provider. Test defect (not an app defect); fixed per CLAUDE.md §5 and reported with
`source: analysis`.

## Risk-ranked targets

| # | Risk | Unit | Test file | Why |
|---|------|------|-----------|-----|
| 1 | Data mutation + URL building | `TutorialService` | `src/app/services/tutorial.service.spec.ts` | Every create/update/delete goes through it; a wrong verb or url silently destroys data. Includes query-string encoding of `findByTitle`. |
| 2 | Request rewriting | `ApiInterceptor` | `src/app/interceptors/api.interceptor.spec.ts` | Every request passes through it; branching on absolute vs relative, leading slash normalisation, body/header/method preservation. |
| 3 | Destructive action + branching state | `TutorialsListComponent` | `src/app/components/tutorials-list/tutorials-list.component.spec.ts` | `removeAllTutorials` deletes everything; selection/drawer/search state has several reset branches; loading/empty/error/populated states. |
| 4 | Mutation + response parsing | `TutorialDetailsComponent` | `src/app/components/tutorial-details/tutorial-details.component.spec.ts` | `viewMode` branch decides whether it fetches by route param; `res.message` fallback is unguarded; delete navigates away. |
| 5 | Mutation + optimistic state | `TutorialDrawerComponent` | `src/app/components/tutorial-drawer/tutorial-drawer.component.spec.ts` | `ngOnChanges` reset branch, 404 vs other errors, publish/unpublish, delete. |
| 6 | Form reset | `AddTutorialComponent` | `src/app/components/add-tutorial/add-tutorial.component.spec.ts` | Submitted/reset branches, payload shape, error path. |

Not covered (low value): `HeaderComponent`, `AppComponent`, `Tutorial` model —
already have smoke specs and contain no logic.

## Expected defects probed
- `TutorialService.findByTitle` interpolates the title into the query string without
  encoding, so `&`/`#`/`+` corrupt the request.
- `TutorialDetailsComponent.updatePublished` / `updateTutorial` read `res.message`
  without a null guard (the drawer guards with `res &&`), so a `204`/empty body throws.
