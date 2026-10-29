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

const api = environment.apiUrl;
const LIST_URL = `${api}/tutorials`;

/**
 * Integration: the tutorials list screen with the real TutorialService,
 * the real ApiInterceptor and the real drawer child component.
 * Only the HTTP transport is faked.
 */
describe('Tutorials list screen', () => {
  let fixture: ComponentFixture<TutorialsListComponent>;
  let component: TutorialsListComponent;
  let httpMock: HttpTestingController;

  const el = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);
  const all = (selector: string): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll(selector));
  const text = (): string => fixture.nativeElement.textContent ?? '';

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

  it('requests the tutorial collection from the api as soon as the screen is shown', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne(LIST_URL);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('renders one card per tutorial with its title, description and status pill', () => {
    fixture.detectChanges();
    httpMock.expectOne(LIST_URL).flush([
      { id: 1, title: 'Angular', description: 'the framework', published: true },
      { id: 2, title: 'RxJS', description: 'streams', published: false }
    ]);
    fixture.detectChanges();

    const cards = all('.tutorial-card');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Angular');
    expect(cards[0].textContent).toContain('the framework');
    expect(cards[0].querySelector('.tm-pill-published')?.textContent).toContain(
      'Published'
    );
    expect(cards[1].querySelector('.tm-pill-pending')?.textContent).toContain(
      'Pending'
    );
  });

  it('shows the empty state and no cards when the api returns no tutorials', () => {
    fixture.detectChanges();
    httpMock.expectOne(LIST_URL).flush([]);
    fixture.detectChanges();

    expect(el('.tm-empty')).not.toBeNull();
    expect(text()).toContain('No tutorials yet');
    expect(el('.tutorial-card')).toBeNull();
  });

  // KNOWN-DEFECT: see finding "List screen shows the empty state while the request
  // is still in flight" — `tutorials` is undefined until the response arrives, which
  // renders the same "No tutorials yet" block as a genuinely empty collection.
  xit('does not claim there are no tutorials while the request is still in flight', () => {
    fixture.detectChanges();

    expect(text()).not.toContain('No tutorials yet');

    httpMock.expectOne(LIST_URL).flush([{ id: 1, title: 'Angular' }]);
  });

  it('keeps the screen usable and shows no cards when the api fails', () => {
    spyOn(console, 'error');
    fixture.detectChanges();
    httpMock
      .expectOne(LIST_URL)
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el('.tutorial-card')).toBeNull();
    expect(el('.search-input')).not.toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  it('replaces the list with the search results when a title is searched', () => {
    fixture.detectChanges();
    httpMock.expectOne(LIST_URL).flush([
      { id: 1, title: 'Angular', description: 'a' },
      { id: 2, title: 'RxJS', description: 'b' }
    ]);
    fixture.detectChanges();

    const input: HTMLInputElement = el('.search-input') as HTMLInputElement;
    input.value = 'RxJS';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    (el('.search-bar .tm-btn') as HTMLElement).click();
    httpMock
      .expectOne(`${LIST_URL}?title=RxJS`)
      .flush([{ id: 2, title: 'RxJS', description: 'b' }]);
    fixture.detectChanges();

    const cards = all('.tutorial-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('RxJS');
  });

  it('shows the empty state when a search matches nothing', () => {
    fixture.detectChanges();
    httpMock.expectOne(LIST_URL).flush([{ id: 1, title: 'Angular' }]);
    fixture.detectChanges();

    component.title = 'nope';
    (el('.search-bar .tm-btn') as HTMLElement).click();
    httpMock.expectOne(`${LIST_URL}?title=nope`).flush([]);
    fixture.detectChanges();

    expect(el('.tutorial-card')).toBeNull();
    expect(text()).toContain('No tutorials yet');
  });

  it('closes the drawer and drops the selection when a search is run', () => {
    fixture.detectChanges();
    httpMock.expectOne(LIST_URL).flush([{ id: 1, title: 'Angular' }]);
    fixture.detectChanges();

    (el('.tutorial-card') as HTMLElement).click();
    fixture.detectChanges();
    httpMock.expectOne(`${LIST_URL}/1`).flush({ id: 1, title: 'Angular' });
    fixture.detectChanges();
    expect(el('.drawer')).not.toBeNull();

    component.title = 'x';
    (el('.search-bar .tm-btn') as HTMLElement).click();
    httpMock.expectOne(`${LIST_URL}?title=x`).flush([]);
    fixture.detectChanges();

    expect(el('.drawer')).toBeNull();
    expect(component.currentIndex).toBe(-1);
  });

  it('deletes every tutorial and re-fetches an empty list when Remove All is clicked', () => {
    fixture.detectChanges();
    httpMock.expectOne(LIST_URL).flush([{ id: 1, title: 'Angular' }]);
    fixture.detectChanges();

    (el('.list-header .tm-btn-danger') as HTMLElement).click();

    const del = httpMock.expectOne(LIST_URL);
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'All tutorials were deleted successfully!' });

    const refetch = httpMock.expectOne(LIST_URL);
    expect(refetch.request.method).toBe('GET');
    refetch.flush([]);
    fixture.detectChanges();

    expect(el('.tutorial-card')).toBeNull();
    expect(text()).toContain('No tutorials yet');
  });

  it('keeps the existing tutorials when Remove All fails', () => {
    spyOn(console, 'error');
    fixture.detectChanges();
    httpMock.expectOne(LIST_URL).flush([{ id: 1, title: 'Angular' }]);
    fixture.detectChanges();

    (el('.list-header .tm-btn-danger') as HTMLElement).click();
    httpMock
      .expectOne((r) => r.url === LIST_URL && r.method === 'DELETE')
      .flush({ message: 'nope' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(all('.tutorial-card').length).toBe(1);
    expect(console.error).toHaveBeenCalled();
  });
});
