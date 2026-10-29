import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialDetailsComponent } from './tutorial-details.component';
import { ApiInterceptor } from '../../interceptors/api.interceptor';
import { environment } from '../../../environments/environment';

/**
 * Integration: the edit screen driven by the route parameter, with the real
 * TutorialService, the real ApiInterceptor and the real Router. Only the HTTP
 * backend is faked.
 */
describe('Tutorial details screen (integration)', () => {
  const API = `${environment.apiUrl}/tutorials`;

  let fixture: ComponentFixture<TutorialDetailsComponent>;
  let component: TutorialDetailsComponent;
  let httpMock: HttpTestingController;
  let router: Router;

  /** Fresh object per call — the component mutates what it is given. */
  const tutorial = () => ({
    id: 7,
    title: 'Angular',
    description: 'Components',
    published: false
  });

  const el = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  const button = (label: string): HTMLElement =>
    Array.from(
      fixture.nativeElement.querySelectorAll('button')
    ).find((b) => (b as HTMLElement).textContent!.trim() === label) as HTMLElement;

  async function setUp(routeId: string | undefined = '7'): Promise<void> {
    await TestBed.configureTestingModule({
      declarations: [TutorialDetailsComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: routeId } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialDetailsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  }

  afterEach(() => httpMock.verify());

  describe('loading the tutorial named by the route', () => {
    it('fetches the id from the route and renders the edit form', async () => {
      await setUp('7');
      fixture.detectChanges();

      const req = httpMock.expectOne(`${API}/7`);
      expect(req.request.method).toBe('GET');
      req.flush(tutorial());
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(el('.edit-form')).not.toBeNull();
      expect((el('#title') as HTMLInputElement).value).toBe('Angular');
      expect((el('#description') as HTMLInputElement).value).toBe('Components');
      expect(el('.tm-pill-pending')!.textContent).toContain('Pending');
    });

    it('shows the placeholder while the request is still in flight', async () => {
      await setUp('7');
      fixture.detectChanges();

      expect(el('.tm-empty')!.textContent).toContain(
        'Cannot access this Tutorial'
      );

      httpMock.expectOne(`${API}/7`).flush(tutorial());
    });

    it('shows "Cannot access this Tutorial" when the tutorial does not exist', async () => {
      spyOn(console, 'error');
      await setUp('404');
      fixture.detectChanges();

      httpMock
        .expectOne(`${API}/404`)
        .flush({ message: 'not found' }, { status: 404, statusText: 'Not Found' });
      fixture.detectChanges();

      expect(el('.edit-form')).toBeNull();
      expect(el('.tm-empty')!.textContent).toContain(
        'Cannot access this Tutorial'
      );
    });

    it('shows "Cannot access this Tutorial" when the server errors', async () => {
      spyOn(console, 'error');
      await setUp('7');
      fixture.detectChanges();

      httpMock
        .expectOne(`${API}/7`)
        .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(el('.edit-form')).toBeNull();
      expect(el('.tm-empty')).not.toBeNull();
    });

    it('does not fetch anything in view mode', async () => {
      await setUp('7');
      component.viewMode = true;
      component.currentTutorial = tutorial();
      fixture.detectChanges();

      httpMock.verify();
      expect(el('.view-card')!.textContent).toContain('Angular');
      expect(el('.view-card a')!.getAttribute('href')).toBe('/tutorials/7');
    });

    it('prompts the user to pick a tutorial in view mode with nothing selected', async () => {
      await setUp('7');
      component.viewMode = true;
      fixture.detectChanges();

      expect(el('.tm-empty')!.textContent).toContain(
        'Please click on a Tutorial'
      );
    });
  });

  describe('updating the tutorial', () => {
    async function loaded(data = tutorial()): Promise<void> {
      await setUp('7');
      fixture.detectChanges();
      httpMock.expectOne(`${API}/7`).flush(data);
      fixture.detectChanges();
    }

    it('sends the edited fields and confirms with the server message', async () => {
      await loaded();

      const title = el('#title') as HTMLInputElement;
      title.value = 'Angular 17';
      title.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      button('Update').click();

      const req = httpMock.expectOne(`${API}/7`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.title).toBe('Angular 17');
      req.flush({ message: 'Tutorial was updated.' });
      fixture.detectChanges();

      expect(el('.alert-success')!.textContent).toContain(
        'Tutorial was updated.'
      );
    });

    it('falls back to a default confirmation when the response carries no message', async () => {
      await loaded();

      button('Update').click();
      httpMock.expectOne(`${API}/7`).flush({});
      fixture.detectChanges();

      expect(el('.alert-success')!.textContent).toContain(
        'This tutorial was updated successfully!'
      );
    });

    it('shows no confirmation when the update fails', async () => {
      spyOn(console, 'error');
      await loaded();

      button('Update').click();
      httpMock
        .expectOne(`${API}/7`)
        .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(el('.alert-success')).toBeNull();
      expect(el('.edit-form')).not.toBeNull();
    });

    it('publishes a pending tutorial and swaps the action to UnPublish', async () => {
      await loaded();

      expect(button('Publish')).toBeTruthy();
      button('Publish').click();

      const req = httpMock.expectOne(`${API}/7`);
      expect(req.request.body).toEqual({
        title: 'Angular',
        description: 'Components',
        published: true
      });
      req.flush({});
      fixture.detectChanges();

      expect(el('.tm-pill-published')!.textContent).toContain('Published');
      expect(button('UnPublish')).toBeTruthy();
      expect(button('Publish')).toBeUndefined();
    });

    it('unpublishes a published tutorial', async () => {
      await loaded({ ...tutorial(), published: true });

      button('UnPublish').click();

      const req = httpMock.expectOne(`${API}/7`);
      expect(req.request.body.published).toBe(false);
      req.flush({});
      fixture.detectChanges();

      expect(el('.tm-pill-pending')!.textContent).toContain('Pending');
    });

    it('leaves the status unchanged when publishing fails', async () => {
      spyOn(console, 'error');
      await loaded();

      button('Publish').click();
      httpMock
        .expectOne(`${API}/7`)
        .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(el('.tm-pill-pending')).not.toBeNull();
      expect(el('.alert-success')).toBeNull();
    });
  });

  describe('deleting the tutorial', () => {
    async function loaded(): Promise<void> {
      await setUp('7');
      fixture.detectChanges();
      httpMock.expectOne(`${API}/7`).flush(tutorial());
      fixture.detectChanges();
    }

    it('navigates back to the list after a successful delete', fakeAsync(async () => {
      await loaded();
      const navigate = spyOn(router, 'navigate');

      button('Delete').click();

      const req = httpMock.expectOne(`${API}/7`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'Tutorial was deleted!' });
      tick();

      expect(navigate).toHaveBeenCalledWith(['/tutorials']);
    }));

    it('stays on the screen when the delete fails', fakeAsync(async () => {
      spyOn(console, 'error');
      await loaded();
      const navigate = spyOn(router, 'navigate');

      button('Delete').click();
      httpMock
        .expectOne(`${API}/7`)
        .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
      tick();
      fixture.detectChanges();

      expect(navigate).not.toHaveBeenCalled();
      expect(el('.edit-form')).not.toBeNull();
    }));
  });
});
