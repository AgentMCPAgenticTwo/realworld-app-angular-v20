# Modules

* [src/app (shell)](/modules/app-shell.md) - Root module, root component and route table that bootstrap the application.
* [src/app/components/header](/modules/components-header.md) - Presentational top navigation bar with the brand mark and the two primary router links.
* [src/app/components/tutorials-list](/modules/components-tutorials-list.md) - List screen with title search, client-side category filter, bulk delete and an inline detail drawer.
* [src/app/components/tutorial-details](/modules/components-tutorial-details.md) - Routed edit screen for a single tutorial at `tutorials/:id`, including its category.
* [src/app/components/tutorial-drawer](/modules/components-tutorial-drawer.md) - Slide-in panel that shows and mutates the tutorial selected in the list.
* [src/app/components/add-tutorial](/modules/components-add-tutorial.md) - Template-driven form that creates a new tutorial and assigns it a category.
* [src/app/services](/modules/services.md) - `TutorialService` and `CategoryService`, the REST clients for `/tutorials` and `/categories`.
* [src/app/interceptors](/modules/interceptors.md) - `ApiInterceptor`, which prefixes relative request URLs with the configured API base.
* [src/app/models](/modules/models.md) - The `Tutorial` and `Category` records shared by every component and service.
* [src/environments](/modules/environments.md) - Build-time configuration holding the API base URL.
