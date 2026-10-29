# Knowledge Update Log

## 2026-10-29

* **Creation**: `modules/testing.md` — new concept covering the three test layers added
  in this trace: Karma/Jasmine unit specs (`*.component.behaviour.spec.ts`), integration
  specs in `src/app/integration/`, and Playwright e2e specs in `e2e/` with the shared
  `e2e/support/api-stub.ts` stubs and `playwright.config.ts` (trace `f7febe8bae7e`,
  commit `19da638a38938f3e8b1b478977983659baa67ea2`).
* **Update**: `modules/app-shell.md` — `AppComponent` now also exposes `apiLoading`; the
  footer renders `API: checking…` while the probe is in flight and binds
  `is-loading` / `is-ok` / `is-error` on `.app-footer-health`.
* **Update**: `conventions.md` — added a **Testing** section and the test file-layout
  rule; noted the `*ngIf` spinner as the one exception to the `@if` block rule.
* **Update**: `overview.md` — added the `test:e2e` script, `playwright.config.ts` as an
  entry point, and the Playwright/axe test stack.
* **Update**: `modules/index.md` — listed the new test-suite concept.

* **Update**: `modules/services.md` — documented the new `HealthService`
  (`src/app/services/health.service.ts`, `GET /health`) alongside `TutorialService`;
  the services directory now holds two HTTP clients (trace `078f168c6d46`, commit
  `9b034fe57d550b8f66d54b93e29362baf23c00ae`).
* **Update**: `modules/models.md` — added the `Health` shape
  (`src/app/models/health.model.ts`).
* **Update**: `modules/app-shell.md` — new **API health indicator** section:
  `AppComponent.apiStatus`, the `ngOnInit` probe and its `unknown` / `unavailable`
  outcomes, the `.app-footer-health` markup and style, and the
  `HttpClientTestingModule` requirement for specs.
* **Update**: `architecture.md` (data-access and model layers now list two files,
  health-probe boundary, `HealthService.get` hotspot, render tree footer note),
  `overview.md` (entry-point and backend-contract rows),
  `playbooks/common-tasks.md` (new "Change the footer API health indicator" task),
  `modules/index.md` and `index.md`.

## 2026-10-28

* **Creation**: Added `modules/components-header.md` for the new `HeaderComponent`
  (`src/app/components/header/`), which took over the navigation markup that used to
  live inline in `app.component.html` (trace `ceee721d6654`, commit
  `6878a25eb09b858a48f0956018c2d975cf0182bb`).
* **Update**: `modules/app-shell.md` — `AppComponent` is now the `.app-shell`
  header/main/footer frame, `AppModule` declares `HeaderComponent`, and
  `src/index.html` and `src/styles.css` were added to the file table.
* **Update**: `conventions.md` — new **Styling** section documenting the `--tm-*`
  tokens and shared `tm-*` classes in `src/styles.css`, a **Templates** note on the
  `@if`/`@for` built-in blocks, and the `styleUrl`/`styleUrls` nuance.
* **Update**: `modules/components-tutorials-list.md`,
  `modules/components-tutorial-details.md` and `modules/components-add-tutorial.md` —
  added Template sections for the reworked card-grid, detail/edit and submit-form
  markup.
* **Update**: `overview.md` (styling row, entry points), `architecture.md` (styling
  layer, render tree with `HeaderComponent`, styling boundary),
  `playbooks/common-tasks.md` (new "Change the look of the app" task; nav links now
  live in `header.component.html`), `modules/index.md` and `index.md`.

## 2026-10-27

* **Creation**: Full bundle generated from the codebase knowledge graph (project `realworld-app-angular-v20` @ `0e3b5208a2e4f08afb8000ab0a8fa4e0d0ff5487`, trace `776701a5236f`). Created `overview.md`, `architecture.md`, `conventions.md`, eight module concepts under `modules/`, `playbooks/common-tasks.md` and `reference/graph-queries.md`.
