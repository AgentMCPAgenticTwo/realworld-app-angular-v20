import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';

import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { TutorialsListComponent } from './components/tutorials-list/tutorials-list.component';
import { TutorialDetailsComponent } from './components/tutorial-details/tutorial-details.component';
import { TutorialDrawerComponent } from './components/tutorial-drawer/tutorial-drawer.component';
import { AddTutorialComponent } from './components/add-tutorial/add-tutorial.component';
import { ApiInterceptor } from './interceptors/api.interceptor';
import { environment } from '../environments/environment';

const routes = [
  { path: '', redirectTo: 'tutorials', pathMatch: 'full' as const },
  { path: 'tutorials', component: TutorialsListComponent },
  { path: 'tutorials/:id', component: TutorialDetailsComponent },
  { path: 'add', component: AddTutorialComponent }
];

/**
 * Integration: the shell, the header and the real application routes wired to
 * the real components, service and interceptor. Only the HTTP backend is faked.
 */
describe('Application routing (integration)', () => {
  const API = `${environment.apiUrl}/tutorials`;

  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let location: Location;
  let httpMock: HttpTestingController;

  const text = (): string => fixture.nativeElement.textContent as string;
  const el = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        HeaderComponent,
        TutorialsListComponent,
        TutorialDetailsComponent,
        TutorialDrawerComponent,
        AddTutorialComponent
      ],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        RouterTestingModule.withRoutes(routes)
      ],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('redirects the root path to the tutorials list and loads it', fakeAsync(() => {
    fixture.detectChanges();
    router.navigate(['/']);
    tick();
    fixture.detectChanges();

    httpMock.expectOne(API).flush([
      { id: 1, title: 'Angular', description: 'Components', published: true }
    ]);
    fixture.detectChanges();

    expect(location.path()).toBe('/tutorials');
    expect(el('.tutorial-title')!.textContent).toContain('Angular');
  }));

  it('renders the add form on /add without touching the api', fakeAsync(() => {
    router.navigate(['/add']);
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/add');
    expect(text()).toContain('Add Tutorial');
    expect(el('#title')).not.toBeNull();
    httpMock.verify();
  }));

  it('loads the tutorial named in the url on /tutorials/:id', fakeAsync(() => {
    router.navigate(['/tutorials', 42]);
    tick();
    fixture.detectChanges();

    httpMock.expectOne(`${API}/42`).flush({
      id: 42,
      title: 'RxJS',
      description: 'Streams',
      published: false
    });
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/tutorials/42');
    expect(text()).toContain('Edit Tutorial');
    expect((el('#title') as HTMLInputElement).value).toBe('RxJS');
  }));

  it('shows the placeholder on /tutorials/:id when the tutorial is missing', fakeAsync(() => {
    spyOn(console, 'error');
    router.navigate(['/tutorials', 999]);
    tick();
    fixture.detectChanges();

    httpMock
      .expectOne(`${API}/999`)
      .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(text()).toContain('Cannot access this Tutorial');
  }));

  it('navigates from the list to the add form through the header link', fakeAsync(() => {
    router.navigate(['/tutorials']);
    tick();
    fixture.detectChanges();
    httpMock.expectOne(API).flush([]);
    fixture.detectChanges();

    const addLink = Array.from(
      fixture.nativeElement.querySelectorAll('a.tm-nav-link')
    ).find(
      (a) => (a as HTMLElement).textContent!.trim() === 'Add Tutorial'
    ) as HTMLElement;
    addLink.click();
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/add');
    expect(el('#title')).not.toBeNull();
  }));

  it('always renders the header brand linking back to the tutorials list', fakeAsync(() => {
    router.navigate(['/add']);
    tick();
    fixture.detectChanges();

    const brand = el('.tm-brand')!;
    expect(brand.textContent).toContain('Tutorial Manager');
    expect(brand.getAttribute('href')).toBe('/tutorials');
  }));
});
