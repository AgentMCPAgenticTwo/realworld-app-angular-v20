import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialsListComponent } from './tutorials-list.component';
import { TutorialDrawerComponent } from '../tutorial-drawer/tutorial-drawer.component';

describe('TutorialsListComponent behaviour', () => {
  let component: TutorialsListComponent;
  let fixture: ComponentFixture<TutorialsListComponent>;
  let httpMock: HttpTestingController;

  const TUTORIALS = [
    { id: 1, title: 'Angular', description: 'first', published: false },
    { id: 2, title: 'RxJS', description: 'second', published: true }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialsListComponent, TutorialDrawerComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialsListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  const init = (payload: any = TUTORIALS) => {
    fixture.detectChanges();
    httpMock.expectOne('/tutorials').flush(payload);
    fixture.detectChanges();
  };

  it('renders one card per tutorial with its published pill', () => {
    init();

    const cards = fixture.nativeElement.querySelectorAll('.tutorial-card');
    expect(cards.length).toBe(2);
    expect(cards[0].querySelector('.tm-pill').textContent).toContain('Pending');
    expect(cards[1].querySelector('.tm-pill').textContent).toContain(
      'Published'
    );
  });

  it('shows the empty state when the api returns no tutorial', () => {
    init([]);

    expect(fixture.nativeElement.querySelector('.tm-empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.tutorial-card').length).toBe(
      0
    );
  });

  it('shows the empty state when the initial load fails', () => {
    fixture.detectChanges();
    httpMock
      .expectOne('/tutorials')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.tutorials).toBeUndefined();
    expect(fixture.nativeElement.querySelector('.tm-empty')).not.toBeNull();
  });

  it('searches by the typed title and replaces the list with the results', () => {
    init();

    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('.search-input');
    input.value = 'RxJS';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.search-bar button').click();
    fixture.detectChanges();

    httpMock.expectOne('/tutorials?title=RxJS').flush([TUTORIALS[1]]);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('.tutorial-card');
    expect(cards.length).toBe(1);
    expect(cards[0].textContent).toContain('RxJS');
  });

  it('clears the current selection and closes the drawer when searching', () => {
    init();
    component.setActiveTutorial(TUTORIALS[0], 0);
    fixture.detectChanges();
    httpMock.expectOne('/tutorials/1').flush(TUTORIALS[0]);
    fixture.detectChanges();

    component.searchTitle();
    fixture.detectChanges();

    expect(component.currentIndex).toBe(-1);
    expect(component.currentTutorial).toEqual({});
    expect(component.drawerTutorialId).toBeNull();
    expect(fixture.nativeElement.querySelector('.drawer')).toBeNull();

    httpMock.expectOne('/tutorials?title=').flush([]);
  });

  it('shows the empty state when a search matches nothing', () => {
    init();

    component.title = 'nothing';
    component.searchTitle();
    httpMock.expectOne('/tutorials?title=nothing').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.tm-empty')).not.toBeNull();
  });

  it('keeps the previous results when the search request fails', () => {
    init();

    component.title = 'x';
    component.searchTitle();
    httpMock
      .expectOne('/tutorials?title=x')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.tutorials).toEqual(TUTORIALS as any);
    expect(fixture.nativeElement.querySelectorAll('.tutorial-card').length).toBe(
      2
    );
  });

  it('marks the clicked card as active', () => {
    init();

    const cards = fixture.nativeElement.querySelectorAll('.tutorial-card');
    cards[1].click();
    fixture.detectChanges();
    httpMock.expectOne('/tutorials/2').flush(TUTORIALS[1]);
    fixture.detectChanges();

    expect(component.currentIndex).toBe(1);
    expect(component.currentTutorial.id).toBe(2);
    expect(cards[1].classList).toContain('active');
    expect(cards[0].classList).not.toContain('active');
  });

  it('removes every tutorial and reloads an empty list', () => {
    init();

    fixture.nativeElement.querySelector('.list-header button').click();
    fixture.detectChanges();

    const del = httpMock.expectOne('/tutorials');
    expect(del.request.method).toBe('DELETE');
    del.flush({ message: 'All tutorials were deleted' });

    httpMock.expectOne('/tutorials').flush([]);
    fixture.detectChanges();

    expect(component.currentIndex).toBe(-1);
    expect(component.drawerTutorialId).toBeNull();
    expect(fixture.nativeElement.querySelector('.tm-empty')).not.toBeNull();
  });

  it('does not reload the list when remove all fails', () => {
    init();

    component.removeAllTutorials();
    httpMock
      .expectOne((r) => r.url === '/tutorials' && r.method === 'DELETE')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    httpMock.expectNone((r) => r.method === 'GET');
    expect(fixture.nativeElement.querySelectorAll('.tutorial-card').length).toBe(
      2
    );
  });

  it('reloads the list when the drawer reports a change', () => {
    init();
    component.setActiveTutorial(TUTORIALS[0], 0);
    fixture.detectChanges();
    httpMock.expectOne('/tutorials/1').flush(TUTORIALS[0]);

    const drawer: TutorialDrawerComponent = fixture.debugElement.query(
      (de) => de.name === 'app-tutorial-drawer'
    ).componentInstance;
    drawer.changed.emit();
    fixture.detectChanges();

    httpMock.expectOne('/tutorials').flush([TUTORIALS[0]]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.tutorial-card').length).toBe(
      1
    );
  });
});
