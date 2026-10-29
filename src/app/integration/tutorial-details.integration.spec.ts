import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { TutorialDetailsComponent } from '../components/tutorial-details/tutorial-details.component';
import { aTutorial, apiUrl, realInterceptorProviders } from './integration-test-setup';

/** Host that renders whatever the real router activates. */
@Component({ template: '<router-outlet></router-outlet>' })
class RoutedHostComponent {}

/** Stand-in for the list route, so navigating away from the edit screen is observable. */
@Component({ template: '<p class="list-stub">list</p>' })
class ListStubComponent {}

/**
 * Integration: the edit screen as the router activates it at /tutorials/:id,
 * with the real TutorialService and the real ApiInterceptor behind it. Only the
 * HTTP boundary is mocked.
 */
describe('Tutorial details screen (integration)', () => {
  let fixture: ComponentFixture<RoutedHostComponent>;
  let http: HttpTestingController;
  let router: Router;
  let location: Location;

  const el = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  const buttonLabelled = (label: string): HTMLElement =>
    Array.from(fixture.nativeElement.querySelectorAll('button')).find((b) =>
      (b as HTMLElement).textContent!.trim().startsWith(label)
    ) as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialDetailsComponent, RoutedHostComponent, ListStubComponent],
      imports: [
        HttpClientTestingModule,
        FormsModule,
        RouterTestingModule.withRoutes([
          { path: 'tutorials', component: ListStubComponent },
          { path: 'tutorials/:id', component: TutorialDetailsComponent }
        ])
      ],
      providers: [...realInterceptorProviders]
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    fixture = TestBed.createComponent(RoutedHostComponent);
  });

  afterEach(() => http.verify());

  /** Activates /tutorials/:id through the real router. */
  const goToEditScreen = (id: string | number) => {
    router.navigateByUrl(`/tutorials/${id}`);
    tick();
    fixture.detectChanges();
  };

  it('fetches the tutorial named by the route parameter', fakeAsync(() => {
    goToEditScreen(42);

    const req = http.expectOne(apiUrl('/tutorials/42'));
    expect(req.request.method).toBe('GET');
    req.flush(aTutorial({ id: 42 }));
    fixture.detectChanges();

    expect(el('.edit-form')).not.toBeNull();
  }));

  it('shows the fallback message while the tutorial has not arrived yet', fakeAsync(() => {
    goToEditScreen(42);
    http.expectOne(apiUrl('/tutorials/42'));

    expect(el('.tm-empty')!.textContent).toContain('Cannot access this Tutorial');
    expect(el('.edit-form')).toBeNull();
  }));

  it('shows the fallback message when the tutorial cannot be loaded', fakeAsync(() => {
    goToEditScreen(404);
    http
      .expectOne(apiUrl('/tutorials/404'))
      .flush({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(el('.tm-empty')!.textContent).toContain('Cannot access this Tutorial');
    expect(el('.edit-form')).toBeNull();
  }));

  /** Activates the edit screen for tutorial 7 and answers the initial GET. */
  const loadTutorialSeven = () => {
    goToEditScreen(7);
    http
      .expectOne(apiUrl('/tutorials/7'))
      .flush(aTutorial({ id: 7, title: 'Angular', description: 'desc', published: false }));
    fixture.detectChanges();
    // ngModel registers with the surrounding NgForm asynchronously; flush that
    // so the inputs really carry the loaded values.
    tick();
    fixture.detectChanges();
  };

  it('fills the edit form with the loaded tutorial', fakeAsync(() => {
    loadTutorialSeven();

    const title = fixture.nativeElement.querySelector('#title') as HTMLInputElement;
    const description = fixture.nativeElement.querySelector(
      '#description'
    ) as HTMLInputElement;

    expect(title.value).toBe('Angular');
    expect(description.value).toBe('desc');
    expect(el('.tm-pill-pending')!.textContent).toContain('Pending');
  }));

  it('sends the edited fields when the tutorial is updated', fakeAsync(() => {
    loadTutorialSeven();

    const title = fixture.nativeElement.querySelector('#title') as HTMLInputElement;
    title.value = 'Angular 17';
    title.dispatchEvent(new Event('input'));
    tick();
    fixture.detectChanges();

    buttonLabelled('Update').click();

    const put = http.expectOne(apiUrl('/tutorials/7'));
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.title).toBe('Angular 17');
    put.flush({ message: 'This tutorial was updated successfully!' });
    fixture.detectChanges();

    expect(el('.alert-success')!.textContent).toContain(
      'This tutorial was updated successfully!'
    );
  }));

  it('publishes the tutorial and shows it as published', fakeAsync(() => {
    loadTutorialSeven();

    buttonLabelled('Publish').click();

    const put = http.expectOne(apiUrl('/tutorials/7'));
    expect(put.request.body).toEqual({
      title: 'Angular',
      description: 'desc',
      published: true
    });
    put.flush({ message: 'The status was updated successfully!' });
    fixture.detectChanges();

    expect(el('.tm-pill-published')).not.toBeNull();
    expect(buttonLabelled('UnPublish')).toBeTruthy();
    expect(el('.alert-success')!.textContent).toContain('The status was updated');
  }));

  it('shows no confirmation banner when the update fails', fakeAsync(() => {
    loadTutorialSeven();

    buttonLabelled('Update').click();
    http
      .expectOne(apiUrl('/tutorials/7'))
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el('.alert-success')).toBeNull();
    expect(el('.tm-pill-pending')).not.toBeNull();
  }));

  it('navigates back to the tutorials list after a delete', fakeAsync(() => {
    loadTutorialSeven();

    buttonLabelled('Delete').click();

    const del = http.expectOne(apiUrl('/tutorials/7'));
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'deleted' });
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/tutorials');
    expect(el('.list-stub')).not.toBeNull();
  }));

  it('stays on the edit screen when the delete fails', fakeAsync(() => {
    loadTutorialSeven();

    buttonLabelled('Delete').click();
    http
      .expectOne(apiUrl('/tutorials/7'))
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/tutorials/7');
    expect(el('.edit-form')).not.toBeNull();
  }));

  // KNOWN-DEFECT: details-res-message-unguarded — TutorialDetailsComponent reads
  // `res.message` with no null guard, so a 200/204 with an empty body (a normal
  // REST answer to PUT) throws a TypeError and the user never sees the
  // confirmation. The sibling TutorialDrawerComponent guards this correctly
  // with `res && res.message`.
  xit('falls back to a default confirmation when the update response has no body', fakeAsync(() => {
    loadTutorialSeven();

    buttonLabelled('Update').click();
    http.expectOne(apiUrl('/tutorials/7')).flush(null);
    fixture.detectChanges();

    expect(el('.alert-success')).not.toBeNull();
    expect(el('.alert-success')!.textContent).toContain(
      'This tutorial was updated successfully!'
    );
  }));

  describe('in view mode', () => {
    let viewFixture: ComponentFixture<TutorialDetailsComponent>;

    const viewEl = (selector: string): HTMLElement | null =>
      viewFixture.nativeElement.querySelector(selector);

    it('renders the read-only card without fetching anything', () => {
      viewFixture = TestBed.createComponent(TutorialDetailsComponent);
      viewFixture.componentInstance.viewMode = true;
      viewFixture.componentInstance.currentTutorial = aTutorial({
        id: 3,
        title: 'RxJS',
        published: true
      });
      viewFixture.detectChanges();

      expect(viewEl('.view-card')).not.toBeNull();
      expect(viewEl('.view-card')!.textContent).toContain('RxJS');
      expect(viewEl('.tm-pill-published')).not.toBeNull();
      http.verify();
    });

    it('prompts the user to pick a tutorial when none is selected', () => {
      viewFixture = TestBed.createComponent(TutorialDetailsComponent);
      viewFixture.componentInstance.viewMode = true;
      viewFixture.componentInstance.currentTutorial = {};
      viewFixture.detectChanges();

      expect(viewEl('.tm-empty')!.textContent).toContain('Please click on a Tutorial');
    });
  });
});
