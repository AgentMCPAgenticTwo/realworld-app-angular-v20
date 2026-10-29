import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick
} from '@angular/core/testing';
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
const DETAIL_URL = `${LIST_URL}/5`;

/**
 * Integration: the tutorial details screen reached through the real router,
 * with the real TutorialService and ApiInterceptor. Only HTTP is faked.
 */
describe('Tutorial details screen', () => {
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;
  let location: Location;
  let httpMock: HttpTestingController;

  const el = (s: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(s);
  const text = (): string => fixture.nativeElement.textContent ?? '';
  const buttonNamed = (name: string): HTMLElement =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).find((b: any) => b.textContent.trim() === name) as HTMLElement;

  const openDetails = (
    body: any = {
      id: 5,
      title: 'Signals',
      description: 'reactive primitives',
      published: false
    },
    opts?: { status: number; statusText: string }
  ) => {
    router.navigate(['/tutorials', 5]);
    tick();
    fixture.detectChanges();
    const req = httpMock.expectOne(DETAIL_URL);
    opts ? req.flush(body, opts) : req.flush(body);
    fixture.detectChanges();
    tick();
    fixture.detectChanges();
  };

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

  it('fills the edit form with the tutorial loaded from the api', fakeAsync(() => {
    openDetails();

    expect((el('#title') as HTMLInputElement).value).toBe('Signals');
    expect((el('#description') as HTMLInputElement).value).toBe(
      'reactive primitives'
    );
    expect(el('.tm-pill-pending')?.textContent).toContain('Pending');
  }));

  it('tells the user the tutorial cannot be accessed when the api returns 404', fakeAsync(() => {
    spyOn(console, 'error');
    openDetails({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

    expect(text()).toContain('Cannot access this Tutorial...');
    expect(el('#title')).toBeNull();
  }));

  it('tells the user the tutorial cannot be accessed when the api fails', fakeAsync(() => {
    spyOn(console, 'error');
    openDetails({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(text()).toContain('Cannot access this Tutorial...');
    expect(console.error).toHaveBeenCalled();
  }));

  it('sends the edited fields and confirms the update', fakeAsync(() => {
    spyOn(console, 'log');
    openDetails();

    const title = el('#title') as HTMLInputElement;
    title.value = 'Signals v2';
    title.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    buttonNamed('Update').click();

    const put = httpMock.expectOne(DETAIL_URL);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.title).toBe('Signals v2');
    put.flush({ message: 'This tutorial was updated successfully!' });
    fixture.detectChanges();

    expect(el('.alert-success')?.textContent).toContain(
      'This tutorial was updated successfully!'
    );
  }));

  it('shows no confirmation when the update fails', fakeAsync(() => {
    spyOn(console, 'error');
    openDetails();

    buttonNamed('Update').click();
    httpMock
      .expectOne(DETAIL_URL)
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el('.alert-success')).toBeNull();
  }));

  it('publishes a pending tutorial and swaps the action to UnPublish', fakeAsync(() => {
    spyOn(console, 'log');
    openDetails();

    buttonNamed('Publish').click();

    const put = httpMock.expectOne(DETAIL_URL);
    expect(put.request.body).toEqual({
      title: 'Signals',
      description: 'reactive primitives',
      published: true
    });
    put.flush({});
    fixture.detectChanges();

    expect(el('.tm-pill-published')?.textContent).toContain('Published');
    expect(buttonNamed('UnPublish')).toBeTruthy();
    expect(text()).toContain('The status was updated successfully!');
  }));

  it('unpublishes a published tutorial', fakeAsync(() => {
    spyOn(console, 'log');
    openDetails({
      id: 5,
      title: 'Signals',
      description: 'reactive primitives',
      published: true
    });

    buttonNamed('UnPublish').click();
    const put = httpMock.expectOne(DETAIL_URL);
    expect(put.request.body.published).toBe(false);
    put.flush({ message: 'unpublished' });
    fixture.detectChanges();

    expect(el('.tm-pill-pending')?.textContent).toContain('Pending');
  }));

  it('deletes the tutorial and returns to the list', fakeAsync(() => {
    spyOn(console, 'log');
    openDetails();

    buttonNamed('Delete').click();
    const del = httpMock.expectOne(DETAIL_URL);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'deleted' });
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/tutorials');
    httpMock.expectOne(LIST_URL).flush([]);
    fixture.detectChanges();
    expect(text()).toContain('No tutorials yet');
  }));

  it('stays on the details screen when deleting fails', fakeAsync(() => {
    spyOn(console, 'error');
    openDetails();

    buttonNamed('Delete').click();
    httpMock
      .expectOne(DETAIL_URL)
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    tick();
    fixture.detectChanges();

    expect(location.path()).toBe('/tutorials/5');
    expect(el('#title')).not.toBeNull();
  }));
});
