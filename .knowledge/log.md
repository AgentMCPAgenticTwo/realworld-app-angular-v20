# Knowledge Update Log

## 2026-10-29

* **Creation**: Added `modules/testing.md` for the new three-tier test layer —
  `*.component.behaviour.spec.ts` unit specs, `src/app/integration/*.integration.spec.ts`,
  and the Playwright suite in `e2e/` with `playwright.config.ts` and the `stubApi`
  backend stub in `e2e/support/api-stub.ts` (trace `c303dd2e7edc`, commit
  `3a87e8e68c23204246655d54df5961c9299323ce`).
* **Update**: `modules/app-shell.md` — `AppComponent.apiLoading`, the
  `.is-loading` / `.is-ok` / `.is-error` class bindings, `aria-busy`, the
  `.app-footer-health-spinner` and its `prefers-reduced-motion` rule, and the note
  that a 200 response without a `status` field paints `.is-error`.
* **Update**: `conventions.md` — new **Testing** section; the Templates section now
  records `app.component.html`'s `*ngIf` as the one exception to the `@if` rule.
* **Update**: `overview.md` (Playwright/axe in the stack row, `test:e2e` script,
  `playwright.config.ts` and `e2e/support/api-stub.ts` entry points),
  `architecture.md` (new Test layer, test boundary, spinner in the render tree,
  hard-coded health colours), `playbooks/common-tasks.md` (new "Add a test" task,
  reworked "Run and test" and footer-health tasks),
  `reference/graph-queries.md` (re-counted graph shape; the `.test-gen` harness now
  dominates it), `modules/index.md` and `index.md`.
* **Note**: `e2e/health-footer.spec.ts` was authored before the footer indicator
  landed — its `test.fixme` markers and its "renders no API status" assertion no
  longer match `src/app/app.component.html`. Recorded in `modules/testing.md`.
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
