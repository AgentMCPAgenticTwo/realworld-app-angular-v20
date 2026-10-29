import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';

import { AppComponent } from '../app.component';
import { AppRoutingModule } from '../app-routing.module';
import { HeaderComponent } from '../components/header/header.component';
import { TutorialsListComponent } from '../components/tutorials-list/tutorials-list.component';
import { TutorialDetailsComponent } from '../components/tutorial-details/tutorial-details.component';
import { TutorialDrawerComponent } from '../components/tutorial-drawer/tutorial-drawer.component';
import { AddTutorialComponent } from '../components/add-tutorial/add-tutorial.component';
import { ApiInterceptor } from '../interceptors/api.interceptor';
import { environment } from '../../environments/environment';

const LIST_URL = `${environment.apiUrl}/tutorials`;

/**
 * Integration: the whole app shell — header, real router configuration and the
 * routed screens, with only the HTTP transport faked.
 */
describe('App shell routing', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let location: Location;
  let httpMock: HttpTestingController;

  const text = (): string => fixture.nativeElement.textContent ?? '';
  const el = (s: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(s);

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
        RouterTestingModule,
        AppRoutingModule
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

  it('redirects the root url to the tutorials list and loads it', fakeAsync(() => {
    router.navigate(['/']);
    tick();
    fixture.detectChanges();

    httpMock.expectOne(LIST_URL).flush([{ id: 1, title: 'Angular' }]);
    fixture.detectChanges();

    expect(location.path()).toBe('/tutorials');
    expect(el('.tutorial-card')?.textContent).toContain('Angular');
  }));

  it('renders the add-tutorial form when the Add Tutorial link is used', fakeAsync(() => {
    router.navigate(['/add']);
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/add');
    expect(text()).toContain('Add Tutorial');
    expect(el('#title')).not.toBeNull();
  }));

  it('navigates from the header back to the tutorials list', fakeAsync(() => {
    router.navigate(['/add']);
    tick();
    fixture.detectChanges();

    const tutorialsLink = Array.from(
      fixture.nativeElement.querySelectorAll('a.tm-nav-link')
    ).find((a: any) => a.textContent.trim() === 'Tutorials') as HTMLElement;
    tutorialsLink.click();
    tick();
    fixture.detectChanges();

    httpMock.expectOne(LIST_URL).flush([]);
    fixture.detectChanges();

    expect(location.path()).toBe('/tutorials');
    expect(text()).toContain('No tutorials yet');
  }));

  it('loads the tutorial named in the url on the details route', fakeAsync(() => {
    router.navigate(['/tutorials', 42]);
    tick();
    fixture.detectChanges();

    httpMock
      .expectOne(`${LIST_URL}/42`)
      .flush({ id: 42, title: 'Signals', description: 'reactive', published: true });
    fixture.detectChanges();
    tick();
    fixture.detectChanges();

    expect(text()).toContain('Edit Tutorial');
    expect((el('#title') as HTMLInputElement).value).toBe('Signals');
    expect(text()).toContain('Published');
  }));

  it('always shows the header brand and the footer', fakeAsync(() => {
    router.navigate(['/add']);
    tick();
    fixture.detectChanges();

    expect(el('.tm-brand')?.textContent).toContain('Tutorial Manager');
    expect(el('.app-footer')?.textContent).toContain('Tutorial Manager');
  }));

  // KNOWN-DEFECT: see finding "Health endpoint and footer API status are not
  // implemented" — the app never calls GET /api/health and the footer shows no
  // API status, so the requested story is unimplemented.
  xit('shows the API health status reported by GET /api/health in the footer', fakeAsync(() => {
    router.navigate(['/tutorials']);
    tick();
    fixture.detectChanges();

    httpMock.expectOne(LIST_URL).flush([]);
    httpMock.expectOne(`${environment.apiUrl}/health`).flush({ status: 'ok' });
    fixture.detectChanges();

    expect(el('.app-footer')?.textContent).toContain('API: ok');
  }));
});
