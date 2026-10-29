import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { AppModule } from '../app.module';
import { AppComponent } from '../app.component';
import { aTutorial, apiUrl } from './integration-test-setup';

/**
 * Integration: the whole app shell — real AppModule (header, router outlet,
 * real routes and the real ApiInterceptor) with only the HTTP boundary mocked.
 */
describe('App shell routing (integration)', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let location: Location;
  let http: HttpTestingController;

  const el = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  const linkLabelled = (label: string): HTMLElement =>
    Array.from(fixture.nativeElement.querySelectorAll('a')).find((a) =>
      (a as HTMLElement).textContent!.trim().startsWith(label)
    ) as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      // AppModule brings the real routes, declarations and interceptor;
      // the two testing modules only swap the HTTP backend and the Location.
      imports: [AppModule, HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('renders the shell with the header and the footer', () => {
    expect(el('.tm-navbar')).not.toBeNull();
    expect(el('.app-footer')!.textContent).toContain('Tutorial Manager');
  });

  it('redirects the root url to the tutorials list', fakeAsync(() => {
    router.navigateByUrl('/');
    tick();
    fixture.detectChanges();
    http.expectOne(apiUrl('/tutorials')).flush([aTutorial()]);
    fixture.detectChanges();

    expect(location.path()).toBe('/tutorials');
    expect(el('app-tutorials-list')).not.toBeNull();
    expect(el('.tutorial-card')).not.toBeNull();
  }));

  it('shows the add form when the header "Add Tutorial" link is followed', fakeAsync(() => {
    router.navigateByUrl('/tutorials');
    tick();
    fixture.detectChanges();
    http.expectOne(apiUrl('/tutorials')).flush([]);
    fixture.detectChanges();

    linkLabelled('Add Tutorial').click();
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/add');
    expect(el('app-add-tutorial')).not.toBeNull();
    expect(el('.submit-form')!.textContent).toContain('Add Tutorial');
  }));

  it('shows the edit screen for /tutorials/:id and loads that tutorial', fakeAsync(() => {
    router.navigateByUrl('/tutorials/5');
    tick();
    fixture.detectChanges();

    const req = http.expectOne(apiUrl('/tutorials/5'));
    expect(req.request.method).toBe('GET');
    req.flush(aTutorial({ id: 5, title: 'Routing' }));
    fixture.detectChanges();

    expect(el('app-tutorial-details')).not.toBeNull();
    expect(el('.edit-form')!.textContent).toContain('Edit Tutorial');
  }));

  it('marks the active header link for the current route', fakeAsync(() => {
    router.navigateByUrl('/add');
    tick();
    fixture.detectChanges();

    expect(linkLabelled('Add Tutorial').classList).toContain('active');
    expect(linkLabelled('Tutorials').classList).not.toContain('active');
  }));

  it('leaves an unknown url unrouted instead of crashing the shell', fakeAsync(() => {
    router.navigateByUrl('/does-not-exist').catch(() => undefined);
    tick();
    fixture.detectChanges();

    expect(el('app-tutorials-list')).toBeNull();
    expect(el('app-add-tutorial')).toBeNull();
    expect(el('.tm-navbar')).not.toBeNull();
  }));
});
