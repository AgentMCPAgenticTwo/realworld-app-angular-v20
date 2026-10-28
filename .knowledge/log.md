# Knowledge Update Log

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
