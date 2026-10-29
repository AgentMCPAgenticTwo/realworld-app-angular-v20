# Modules

* [src/app (shell)](/modules/app-shell.md) - Root module, root component and route table that bootstrap the application and surface API health in the footer.
* [src/app/components/header](/modules/components-header.md) - Presentational top navigation bar with the brand mark and the two primary router links.
* [src/app/components/tutorials-list](/modules/components-tutorials-list.md) - List screen with title search, bulk delete and an inline detail drawer.
* [src/app/components/tutorial-details](/modules/components-tutorial-details.md) - Routed edit screen for a single tutorial at `tutorials/:id`.
* [src/app/components/tutorial-drawer](/modules/components-tutorial-drawer.md) - Slide-in panel that shows and mutates the tutorial selected in the list.
* [src/app/components/add-tutorial](/modules/components-add-tutorial.md) - Template-driven form that creates a new tutorial.
* [src/app/services](/modules/services.md) - `TutorialService` and `HealthService`, the app's REST clients for `/tutorials` and `/health`.
* [src/app/interceptors](/modules/interceptors.md) - `ApiInterceptor`, which prefixes relative request URLs with the configured API base.
* [src/app/models](/modules/models.md) - The `Tutorial` record shared by every component and service, plus the `Health` probe response.
* [src/environments](/modules/environments.md) - Build-time configuration holding the API base URL.
* [Test suite (unit, integration, e2e)](/modules/testing.md) - Karma/Jasmine unit and integration specs under src/app plus Playwright end-to-end specs under e2e.
