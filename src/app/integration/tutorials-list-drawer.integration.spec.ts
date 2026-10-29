import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialsListComponent } from '../components/tutorials-list/tutorials-list.component';
import { TutorialDrawerComponent } from '../components/tutorial-drawer/tutorial-drawer.component';
import { ApiInterceptor } from '../interceptors/api.interceptor';
import { environment } from '../../environments/environment';

const LIST_URL = `${environment.apiUrl}/tutorials`;

/**
 * Integration: the list and the drawer working together over the real
 * TutorialService — selection, detail fetch, publish toggle and delete.
 */
describe('Tutorials list and detail drawer', () => {
  let fixture: ComponentFixture<TutorialsListComponent>;
  let httpMock: HttpTestingController;

  const el = (s: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(s);
  const all = (s: string): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(s));
  const drawerText = (): string => el('.drawer')?.textContent ?? '';

  const openFirstTutorial = (
    detail: any = {
      id: 1,
      title: 'Angular',
      description: 'the framework',
      published: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-02'
    },
    opts?: { status: number; statusText: string }
  ) => {
    (el('.tutorial-card') as HTMLElement).click();
    fixture.detectChanges();
    const req = httpMock.expectOne(`${LIST_URL}/1`);
    opts ? req.flush(detail, opts) : req.flush(detail);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialsListComponent, TutorialDrawerComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialsListComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock
      .expectOne(LIST_URL)
      .flush([{ id: 1, title: 'Angular', description: 'the framework' }]);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('keeps the drawer closed until a tutorial is selected', () => {
    expect(el('.drawer')).toBeNull();
  });

  it('fetches and shows the selected tutorial in the drawer', () => {
    openFirstTutorial();

    expect(el('.drawer')).not.toBeNull();
    expect(drawerText()).toContain('Angular');
    expect(drawerText()).toContain('the framework');
    expect(drawerText()).toContain('Pending');
    expect(drawerText()).toContain('2024-01-01');
  });

  it('shows "Not found" in the drawer when the tutorial no longer exists', () => {
    openFirstTutorial(
      { message: 'Not found' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(drawerText()).toContain('Not found');
    expect(el('.drawer .badge-danger')).toBeNull();
  });

  it('shows neither details nor a not-found message when the detail request fails with a server error', () => {
    spyOn(console, 'error');
    openFirstTutorial(
      { message: 'boom' },
      { status: 500, statusText: 'Server Error' }
    );

    expect(el('.drawer')).not.toBeNull();
    expect(drawerText()).not.toContain('Not found');
    expect(drawerText()).not.toContain('the framework');
    expect(console.error).toHaveBeenCalled();
  });

  it('publishes the tutorial, confirms it and refreshes the list behind the drawer', () => {
    openFirstTutorial();

    const publish = all('.drawer .badge-primary').find((b) =>
      b.textContent?.includes('Publish')
    ) as HTMLElement;
    publish.click();

    const put = httpMock.expectOne(`${LIST_URL}/1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body).toEqual({
      title: 'Angular',
      description: 'the framework',
      published: true
    });
    put.flush({ message: 'The tutorial was updated successfully!' });

    httpMock
      .expectOne(LIST_URL)
      .flush([
        { id: 1, title: 'Angular', description: 'the framework', published: true }
      ]);
    fixture.detectChanges();

    expect(drawerText()).toContain('Published');
    expect(drawerText()).toContain('The tutorial was updated successfully!');
    expect(el('.tutorial-card .tm-pill-published')).not.toBeNull();
  });

  it('falls back to a default confirmation when the api sends no message', () => {
    openFirstTutorial();

    (
      all('.drawer .badge-primary').find((b) =>
        b.textContent?.includes('Publish')
      ) as HTMLElement
    ).click();
    httpMock.expectOne(`${LIST_URL}/1`).flush({});
    httpMock.expectOne(LIST_URL).flush([]);
    fixture.detectChanges();

    expect(drawerText()).toContain('The status was updated successfully!');
  });

  it('leaves the status unchanged and shows no confirmation when publishing fails', () => {
    spyOn(console, 'error');
    openFirstTutorial();

    (
      all('.drawer .badge-primary').find((b) =>
        b.textContent?.includes('Publish')
      ) as HTMLElement
    ).click();
    httpMock
      .expectOne(`${LIST_URL}/1`)
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(drawerText()).toContain('Pending');
    expect(drawerText()).not.toContain('successfully');
    expect(console.error).toHaveBeenCalled();
  });

  it('deletes the tutorial, closes the drawer and reloads the list', () => {
    openFirstTutorial();

    (el('.drawer .badge-danger') as HTMLElement).click();

    const del = httpMock.expectOne(`${LIST_URL}/1`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'deleted' });

    httpMock.expectOne(LIST_URL).flush([]);
    fixture.detectChanges();

    expect(el('.drawer')).toBeNull();
    expect(el('.tutorial-card')).toBeNull();
  });

  it('keeps the drawer open when deleting fails', () => {
    spyOn(console, 'error');
    openFirstTutorial();

    (el('.drawer .badge-danger') as HTMLElement).click();
    httpMock
      .expectOne(`${LIST_URL}/1`)
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el('.drawer')).not.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it('closes the drawer when the backdrop is clicked', () => {
    openFirstTutorial();

    (el('.drawer-backdrop') as HTMLElement).click();
    fixture.detectChanges();

    expect(el('.drawer')).toBeNull();
  });

  it('fetches the newly selected tutorial when the selection changes', () => {
    httpMock.verify();
    fixture.componentInstance.tutorials = [
      { id: 1, title: 'Angular' },
      { id: 2, title: 'RxJS' }
    ];
    fixture.detectChanges();

    openFirstTutorial();
    expect(drawerText()).toContain('Angular');

    (all('.tutorial-card')[1] as HTMLElement).click();
    fixture.detectChanges();
    httpMock
      .expectOne(`${LIST_URL}/2`)
      .flush({ id: 2, title: 'RxJS', description: 'streams' });
    fixture.detectChanges();

    expect(drawerText()).toContain('RxJS');
    expect(drawerText()).not.toContain('the framework');
  });
});
