import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialsListComponent } from './tutorials-list.component';
import { TutorialDrawerComponent } from '../tutorial-drawer/tutorial-drawer.component';
import { ApiInterceptor } from '../../interceptors/api.interceptor';
import { environment } from '../../../environments/environment';

/**
 * Integration: the tutorials list screen together with its real child drawer
 * component, the real TutorialService and the real ApiInterceptor. Only the
 * HTTP backend is faked, so the asserted urls are the fully prefixed ones.
 */
describe('Tutorials list screen (integration)', () => {
  const API = `${environment.apiUrl}/tutorials`;

  let fixture: ComponentFixture<TutorialsListComponent>;
  let component: TutorialsListComponent;
  let httpMock: HttpTestingController;

  /** Fresh objects per call — the components mutate what they are given. */
  const tutorials = () => [
    { id: 1, title: 'Angular', description: 'Components', published: false },
    { id: 2, title: 'RxJS', description: 'Streams', published: true }
  ];
  const angular = () => tutorials()[0];
  const rxjs = () => tutorials()[1];

  const el = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  const all = (selector: string): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialsListComponent, TutorialDrawerComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialsListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  /** Boots the screen and answers the initial GET with `data`. */
  function load(data: Object = tutorials()): void {
    fixture.detectChanges();
    httpMock.expectOne(API).flush(data);
    fixture.detectChanges();
  }

  describe('loading the list', () => {
    it('requests the tutorials from the configured api url on init', () => {
      fixture.detectChanges();

      const req = httpMock.expectOne(API);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('shows the empty state while the initial request is still in flight', () => {
      fixture.detectChanges();

      // No loading indicator exists: the screen renders the empty state instead.
      expect(el('.tm-empty')).not.toBeNull();
      expect(all('.tutorial-card').length).toBe(0);

      httpMock.expectOne(API).flush(tutorials());
    });

    it('renders one card per tutorial with its status pill once loaded', () => {
      load();

      const cards = all('.tutorial-card');
      expect(cards.length).toBe(2);
      expect(cards[0].querySelector('.tutorial-title')!.textContent).toContain(
        'Angular'
      );
      expect(
        cards[0].querySelector('.tutorial-description')!.textContent
      ).toContain('Components');
      expect(cards[0].querySelector('.tm-pill-pending')!.textContent).toContain(
        'Pending'
      );
      expect(
        cards[1].querySelector('.tm-pill-published')!.textContent
      ).toContain('Published');
    });

    it('shows the empty state when the server returns no tutorials', () => {
      load([]);

      expect(el('.tm-empty')!.textContent).toContain('No tutorials yet');
      expect(all('.tutorial-card').length).toBe(0);
    });

    it('shows the empty state and keeps the screen usable when the list request fails', () => {
      spyOn(console, 'error');
      fixture.detectChanges();

      httpMock
        .expectOne(API)
        .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(component.tutorials).toBeUndefined();
      expect(el('.tm-empty')).not.toBeNull();
      expect(el('.search-input')).not.toBeNull();
    });
  });

  describe('searching by title', () => {
    it('sends the typed title as a query parameter and renders the matches', () => {
      load();

      const input: HTMLInputElement = el('.search-input') as HTMLInputElement;
      input.value = 'Angular';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      (el('.search-bar .tm-btn') as HTMLElement).click();

      const req = httpMock.expectOne(`${API}?title=Angular`);
      expect(req.request.method).toBe('GET');
      req.flush([angular()]);
      fixture.detectChanges();

      expect(all('.tutorial-card').length).toBe(1);
      expect(el('.tutorial-title')!.textContent).toContain('Angular');
    });

    it('shows the empty state when a search matches nothing', () => {
      load();

      component.title = 'nothing';
      component.searchTitle();
      httpMock.expectOne(`${API}?title=nothing`).flush([]);
      fixture.detectChanges();

      expect(all('.tutorial-card').length).toBe(0);
      expect(el('.tm-empty')!.textContent).toContain('No tutorials yet');
    });

    it('searches with an empty title when the box is blank', () => {
      load();

      component.searchTitle();

      const req = httpMock.expectOne(`${API}?title=`);
      expect(req.request.method).toBe('GET');
      req.flush(tutorials());
    });

    it('closes the drawer and clears the selection when a new search runs', () => {
      load();

      (all('.tutorial-card')[0] as HTMLElement).click();
      fixture.detectChanges();
      httpMock.expectOne(`${API}/1`).flush(angular());
      fixture.detectChanges();
      expect(el('.drawer')).not.toBeNull();

      component.title = 'RxJS';
      component.searchTitle();
      fixture.detectChanges();

      expect(component.currentIndex).toBe(-1);
      expect(el('.drawer')).toBeNull();
      httpMock.expectOne(`${API}?title=RxJS`).flush([rxjs()]);
    });

    // KNOWN-DEFECT: finding "search title is not url-encoded".
    // TutorialService.findByTitle interpolates the raw title into the query
    // string, so `A&B=C` is sent as `?title=A&B=C` and the server sees an
    // extra `B` parameter and a truncated title.
    xit('url-encodes a title containing reserved characters', () => {
      load();

      component.title = 'A&B=C';
      component.searchTitle();

      httpMock.expectOne(`${API}?title=A%26B%3DC`).flush([]);
    });

    it('sends a title containing reserved characters unencoded (current behaviour)', () => {
      load();

      component.title = 'A&B=C';
      component.searchTitle();

      // Documents the defect above: the raw string lands in the query.
      httpMock.expectOne(`${API}?title=A&B=C`).flush([]);
    });
  });

  describe('removing every tutorial', () => {
    it('issues a DELETE on the collection and reloads the list', () => {
      load();

      (el('.list-header .tm-btn-danger') as HTMLElement).click();

      const del = httpMock.expectOne(API);
      expect(del.request.method).toBe('DELETE');
      del.flush({ message: 'All tutorials were deleted!' });

      httpMock.expectOne(API).flush([]);
      fixture.detectChanges();

      expect(all('.tutorial-card').length).toBe(0);
      expect(el('.tm-empty')!.textContent).toContain('No tutorials yet');
    });

    it('keeps the list intact when the delete-all request fails', () => {
      spyOn(console, 'error');
      load();

      component.removeAllTutorials();
      httpMock
        .expectOne(API)
        .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(all('.tutorial-card').length).toBe(2);
    });
  });

  describe('the details drawer', () => {
    function openFirstCard(data: Object = angular()): void {
      (all('.tutorial-card')[0] as HTMLElement).click();
      fixture.detectChanges();
      httpMock.expectOne(`${API}/1`).flush(data);
      fixture.detectChanges();
    }

    it('fetches the clicked tutorial and shows its details', () => {
      load();
      openFirstCard();

      const drawer = el('.drawer')!;
      expect(drawer.textContent).toContain('Angular');
      expect(drawer.textContent).toContain('Components');
      expect(drawer.textContent).toContain('Pending');
      expect(all('.tutorial-card')[0].classList).toContain('active');
    });

    it('shows "Not found" when the tutorial no longer exists', () => {
      load();
      (all('.tutorial-card')[0] as HTMLElement).click();
      fixture.detectChanges();
      httpMock
        .expectOne(`${API}/1`)
        .flush({ message: 'gone' }, { status: 404, statusText: 'Not Found' });
      fixture.detectChanges();

      expect(el('.drawer')!.textContent).toContain('Not found');
      expect(el('.drawer')!.textContent).not.toContain('Components');
    });

    it('leaves the drawer body blank when the lookup fails with a server error', () => {
      spyOn(console, 'error');
      load();
      (all('.tutorial-card')[0] as HTMLElement).click();
      fixture.detectChanges();
      httpMock
        .expectOne(`${API}/1`)
        .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      const drawer = el('.drawer')!;
      expect(drawer).not.toBeNull();
      expect(drawer.textContent).not.toContain('Not found');
      expect(drawer.textContent).not.toContain('Components');
    });

    it('publishes the tutorial and reloads the list so the card pill updates', () => {
      load();
      openFirstCard();

      const publish = Array.from(
        el('.drawer')!.querySelectorAll('button')
      ).find((b) => b.textContent!.trim() === 'Publish')!;
      publish.click();

      const put = httpMock.expectOne(`${API}/1`);
      expect(put.request.method).toBe('PUT');
      expect(put.request.body).toEqual({
        title: 'Angular',
        description: 'Components',
        published: true
      });
      put.flush({ message: 'The tutorial was updated successfully!' });

      // the drawer emits (changed) -> the list refetches
      httpMock
        .expectOne(API)
        .flush([{ ...angular(), published: true }, rxjs()]);
      fixture.detectChanges();

      expect(el('.drawer')!.textContent).toContain(
        'The tutorial was updated successfully!'
      );
      expect(
        all('.tutorial-card')[0].querySelector('.tm-pill-published')
      ).not.toBeNull();
    });

    it('falls back to a default confirmation when the update response has no message', () => {
      load();
      openFirstCard();

      component.currentTutorial = angular();
      const publish = Array.from(
        el('.drawer')!.querySelectorAll('button')
      ).find((b) => b.textContent!.trim() === 'Publish')!;
      publish.click();

      httpMock.expectOne(`${API}/1`).flush({});
      httpMock.expectOne(API).flush(tutorials());
      fixture.detectChanges();

      expect(el('.drawer')!.textContent).toContain(
        'The status was updated successfully!'
      );
    });

    it('deletes the tutorial, closes the drawer and reloads the list', () => {
      load();
      openFirstCard();

      const remove = Array.from(
        el('.drawer')!.querySelectorAll('button')
      ).find((b) => b.textContent!.trim() === 'Delete')!;
      remove.click();

      const del = httpMock.expectOne(`${API}/1`);
      expect(del.request.method).toBe('DELETE');
      del.flush({ message: 'Tutorial was deleted!' });

      httpMock.expectOne(API).flush([rxjs()]);
      fixture.detectChanges();

      expect(el('.drawer')).toBeNull();
      expect(all('.tutorial-card').length).toBe(1);
      expect(el('.tutorial-title')!.textContent).toContain('RxJS');
    });

    it('keeps the drawer open and shows no confirmation when the update fails', () => {
      spyOn(console, 'error');
      load();
      openFirstCard();

      component.currentTutorial = angular();
      (
        Array.from(el('.drawer')!.querySelectorAll('button')).find(
          (b) => b.textContent!.trim() === 'Publish'
        ) as HTMLElement
      ).click();

      httpMock
        .expectOne(`${API}/1`)
        .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(el('.drawer')).not.toBeNull();
      expect(el('.drawer')!.textContent).not.toContain('successfully');
      expect(el('.drawer')!.textContent).toContain('Pending');
    });

    it('closes without any request when the backdrop is clicked', () => {
      load();
      openFirstCard();

      (el('.drawer-backdrop') as HTMLElement).click();
      fixture.detectChanges();

      expect(el('.drawer')).toBeNull();
      expect(component.currentIndex).toBe(-1);
      httpMock.verify();
    });

    it('fetches the newly selected tutorial when a different card is clicked', () => {
      load();
      openFirstCard();

      (all('.tutorial-card')[1] as HTMLElement).click();
      fixture.detectChanges();
      httpMock.expectOne(`${API}/2`).flush(rxjs());
      fixture.detectChanges();

      expect(el('.drawer')!.textContent).toContain('Streams');
      expect(el('.drawer')!.textContent).toContain('Published');
    });

    it('links the drawer edit action to the tutorial route', fakeAsync(() => {
      load();
      openFirstCard();
      tick();

      const edit = el('.drawer')!.querySelector('a.badge-warning')!;
      expect(edit.getAttribute('href')).toBe('/tutorials/1');
    }));
  });
});
