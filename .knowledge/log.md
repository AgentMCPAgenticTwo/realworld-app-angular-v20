# Knowledge Update Log

## 2026-10-28

* **Update**: Category support landed across the app (trace `4ebb30166d80`, commit
  `a86d8471057ca0f210893c4f79a11417f67af92e`). `modules/models.md` — added the
  `Category` concept and the `Tutorial.categoryId` foreign key;
  `modules/services.md` — added `CategoryService` (`/categories`, `getAll`/`create`)
  alongside `TutorialService`.
* **Update**: `modules/components-tutorials-list.md` — new `filteredTutorials` /
  `categories` / `categoryId` state, the `retrieveCategories`, `applyCategoryFilter`
  and `categoryName` methods, the `select.search-category` filter and the
  `tm-pill-category` badge; the card grid now iterates `filteredTutorials`.
* **Update**: `modules/components-add-tutorial.md` (now `OnInit`, category `select`,
  `categoryId` in the create payload) and
  `modules/components-tutorial-details.md` (category `select`, `categoryName` getter,
  `categoryId` carried through `updatePublished`; noted the drawer has not been
  updated to match).
* **Update**: `overview.md` (two REST base paths, category purpose),
  `architecture.md` (data-access and model layers now list both services/models,
  client-side-filtering boundary, refreshed hotspots), `conventions.md` (one service
  per resource, reference-data loading, `[ngValue]` select rule, `tm-pill-category`),
  `playbooks/common-tasks.md` (new "Work with categories" task),
  `modules/index.md` and `index.md`.

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
