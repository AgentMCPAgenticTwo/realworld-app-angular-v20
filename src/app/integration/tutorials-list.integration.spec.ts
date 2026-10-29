import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialsListComponent } from '../components/tutorials-list/tutorials-list.component';
import { TutorialDrawerComponent } from '../components/tutorial-drawer/tutorial-drawer.component';
import { aTutorial, apiUrl, realInterceptorProviders } from './integration-test-setup';

/**
 * Integration: the tutorials list screen together with its real child drawer,
 * the real TutorialService and the real ApiInterceptor. Only the HTTP boundary
 * is mocked.
 */
describe('Tutorials list screen (integration)', () => {
  let fixture: ComponentFixture<TutorialsListComponent>;
  let component: TutorialsListComponent;
  let http: HttpTestingController;

  const el = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  const all = (selector: string): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialsListComponent, TutorialDrawerComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule],
      providers: [...realInterceptorProviders]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialsListComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  /** Boots the screen and answers the initial GET /tutorials with `body`. */
  const load = (body: any) => {
    fixture.detectChanges();
    const req = http.expectOne(apiUrl('/tutorials'));
    req.flush(body);
    fixture.detectChanges();
    return req;
  };

  it('requests the tutorials through the api base url on first render', () => {
    const req = load([aTutorial()]);

    expect(req.request.method).toBe('GET');
    expect(req.request.url).toBe('http://localhost:5001/api/tutorials');
  });

  // KNOWN-DEFECT: list-loading-looks-empty — while the first GET /tutorials is
  // still in flight the screen already renders the "No tutorials yet" empty
  // state, because the template only tests `tutorials && tutorials.length` and
  // never distinguishes "not loaded yet" from "loaded and empty".
  xit('shows neither cards nor the empty state while the tutorials are loading', () => {
    fixture.detectChanges();
    http.expectOne(apiUrl('/tutorials'));

    expect(all('.tutorial-card').length).toBe(0);
    expect(el('.tm-empty')).toBeNull();
  });

  it('renders no tutorial cards while the first request is still in flight', () => {
    fixture.detectChanges();
    const pending = http.expectOne(apiUrl('/tutorials'));

    expect(all('.tutorial-card').length).toBe(0);
    expect(el('.search-input')).not.toBeNull();

    pending.flush([]);
  });

  it('renders one card per tutorial with its title, description and status pill', () => {
    load([
      aTutorial({ id: 1, title: 'Angular', description: 'first', published: false }),
      aTutorial({ id: 2, title: 'RxJS', description: 'second', published: true })
    ]);

    const cards = all('.tutorial-card');
    expect(cards.length).toBe(2);
    expect(cards[0].querySelector('.tutorial-title')!.textContent).toContain('Angular');
    expect(cards[0].querySelector('.tutorial-description')!.textContent).toContain('first');
    expect(cards[0].querySelector('.tm-pill-pending')!.textContent).toContain('Pending');
    expect(cards[1].querySelector('.tm-pill-published')!.textContent).toContain('Published');
  });

  it('shows the empty state when the server returns no tutorials', () => {
    load([]);

    expect(el('.tm-empty')).not.toBeNull();
    expect(el('.tm-empty')!.textContent).toContain('No tutorials yet');
    expect(all('.tutorial-card').length).toBe(0);
  });

  it('falls back to the empty state when the tutorials request fails', () => {
    fixture.detectChanges();
    http
      .expectOne(apiUrl('/tutorials'))
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el('.tm-empty')).not.toBeNull();
    expect(all('.tutorial-card').length).toBe(0);
  });

  it('replaces the list with the search results when a title is searched', () => {
    load([aTutorial({ id: 1, title: 'Angular' }), aTutorial({ id: 2, title: 'RxJS' })]);

    component.title = 'RxJS';
    el('.search-bar .tm-btn-primary')!.click();

    const req = http.expectOne(apiUrl('/tutorials?title=RxJS'));
    expect(req.request.method).toBe('GET');
    req.flush([aTutorial({ id: 2, title: 'RxJS' })]);
    fixture.detectChanges();

    const cards = all('.tutorial-card');
    expect(cards.length).toBe(1);
    expect(cards[0].querySelector('.tutorial-title')!.textContent).toContain('RxJS');
  });

  it('shows the empty state when a search matches nothing', () => {
    load([aTutorial()]);

    component.title = 'nothing-matches';
    el('.search-bar .tm-btn-primary')!.click();
    http.expectOne(apiUrl('/tutorials?title=nothing-matches')).flush([]);
    fixture.detectChanges();

    expect(el('.tm-empty')).not.toBeNull();
    expect(all('.tutorial-card').length).toBe(0);
  });

  it('searches with an empty title when the search box was never filled in', () => {
    load([aTutorial()]);

    el('.search-bar .tm-btn-primary')!.click();
    const req = http.expectOne(apiUrl('/tutorials?title='));
    req.flush([]);
    fixture.detectChanges();

    expect(req.request.urlWithParams).toBe('http://localhost:5001/api/tutorials?title=');
  });

  // KNOWN-DEFECT: search-title-not-encoded — TutorialService.findByTitle
  // interpolates the title straight into the query string, so a title holding
  // `&`, `#`, `+` or a space reaches the server as a different (or extra)
  // parameter. A title of `a&b c` must be sent as `title=a%26b%20c`.
  xit('url-encodes a search title containing reserved characters', () => {
    load([aTutorial()]);

    component.title = 'a&b c';
    el('.search-bar .tm-btn-primary')!.click();

    const req = http.expectOne((r) => r.url.startsWith('http://localhost:5001/api/tutorials'));
    expect(req.request.urlWithParams).toBe(
      'http://localhost:5001/api/tutorials?title=a%26b%20c'
    );
    req.flush([]);
  });

  it('sends a search title verbatim in the query string', () => {
    load([aTutorial()]);

    component.title = 'RxJS operators';
    el('.search-bar .tm-btn-primary')!.click();

    const req = http.expectOne((r) => r.url.startsWith('http://localhost:5001/api/tutorials'));
    expect(req.request.method).toBe('GET');
    expect(req.request.url).toContain('title=RxJS operators');
    req.flush([]);
  });

  it('reloads the list after every tutorial has been removed', () => {
    load([aTutorial()]);

    el('.tm-btn-danger')!.click();
    const del = http.expectOne(apiUrl('/tutorials'));
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'All tutorials were deleted' });

    http.expectOne(apiUrl('/tutorials')).flush([]);
    fixture.detectChanges();

    expect(el('.tm-empty')).not.toBeNull();
  });

  it('keeps the current list when removing all tutorials fails', () => {
    load([aTutorial({ title: 'Angular' })]);

    el('.tm-btn-danger')!.click();
    http
      .expectOne(apiUrl('/tutorials'))
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(all('.tutorial-card').length).toBe(1);
    expect(el('.tutorial-title')!.textContent).toContain('Angular');
  });

  describe('the details drawer', () => {
    beforeEach(() => {
      load([aTutorial({ id: 7, title: 'Angular', description: 'desc', published: false })]);
    });

    const openDrawer = (body: any, status?: { status: number; statusText: string }) => {
      el('.tutorial-card')!.click();
      fixture.detectChanges();
      const req = http.expectOne(apiUrl('/tutorials/7'));
      if (status) {
        req.flush(body, status);
      } else {
        req.flush(body);
      }
      fixture.detectChanges();
      return req;
    };

    it('fetches and shows the clicked tutorial', () => {
      openDrawer(aTutorial({ id: 7, title: 'Angular', description: 'desc' }));

      const drawer = el('.drawer')!;
      expect(drawer).not.toBeNull();
      expect(drawer.textContent).toContain('Angular');
      expect(drawer.textContent).toContain('desc');
      expect(drawer.textContent).toContain('Pending');
    });

    it('tells the user the tutorial was not found when the server answers 404', () => {
      openDrawer({ message: 'Not found' }, { status: 404, statusText: 'Not Found' });

      expect(el('.drawer')!.textContent).toContain('Not found');
      expect(el('.drawer')!.textContent).not.toContain('Title:');
    });

    it('publishes the tutorial and reloads the list', () => {
      openDrawer(aTutorial({ id: 7, title: 'Angular', description: 'desc', published: false }));

      const publish = Array.from(
        fixture.nativeElement.querySelectorAll('.drawer button')
      ).find((b) => (b as HTMLElement).textContent!.includes('Publish')) as HTMLElement;
      publish.click();

      const put = http.expectOne(apiUrl('/tutorials/7'));
      expect(put.request.method).toBe('PUT');
      expect(put.request.body).toEqual({
        title: 'Angular',
        description: 'desc',
        published: true
      });
      put.flush({ message: 'The tutorial was updated successfully!' });

      // the (changed) output makes the parent refetch the list
      http.expectOne(apiUrl('/tutorials')).flush([aTutorial({ id: 7, published: true })]);
      fixture.detectChanges();

      expect(el('.drawer')!.textContent).toContain('The tutorial was updated successfully!');
      expect(el('.drawer')!.textContent).toContain('Published');
      expect(el('.tm-pill-published')).not.toBeNull();
    });

    it('falls back to a default confirmation when the update response carries no message', () => {
      openDrawer(aTutorial({ id: 7, title: 'Angular', description: 'desc' }));

      (Array.from(fixture.nativeElement.querySelectorAll('.drawer button')).find((b) =>
        (b as HTMLElement).textContent!.includes('Publish')
      ) as HTMLElement).click();

      http.expectOne(apiUrl('/tutorials/7')).flush(null);
      http.expectOne(apiUrl('/tutorials')).flush([]);
      fixture.detectChanges();

      expect(el('.drawer')!.textContent).toContain('The status was updated successfully!');
    });

    it('deletes the tutorial, reloads the list and closes the drawer', () => {
      openDrawer(aTutorial({ id: 7, title: 'Angular' }));

      (Array.from(fixture.nativeElement.querySelectorAll('.drawer button')).find((b) =>
        (b as HTMLElement).textContent!.includes('Delete')
      ) as HTMLElement).click();

      const del = http.expectOne(apiUrl('/tutorials/7'));
      expect(del.request.method).toBe('DELETE');
      del.flush({ message: 'deleted' });

      http.expectOne(apiUrl('/tutorials')).flush([]);
      fixture.detectChanges();

      expect(el('.drawer')).toBeNull();
      expect(component.drawerTutorialId).toBeNull();
      expect(el('.tm-empty')).not.toBeNull();
    });

    it('closes the drawer without touching the server when the backdrop is clicked', () => {
      openDrawer(aTutorial({ id: 7 }));

      el('.drawer-backdrop')!.click();
      fixture.detectChanges();

      expect(el('.drawer')).toBeNull();
      http.verify();
    });
  });
});
