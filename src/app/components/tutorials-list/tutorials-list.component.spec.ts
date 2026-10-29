import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialsListComponent } from './tutorials-list.component';
import { TutorialDrawerComponent } from '../tutorial-drawer/tutorial-drawer.component';

describe('TutorialsListComponent', () => {
  let component: TutorialsListComponent;
  let fixture: ComponentFixture<TutorialsListComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialsListComponent, TutorialDrawerComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorialsListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    httpMock.expectOne('/tutorials').flush([
      { id: 1, title: 'Angular', description: 'desc', published: false }
    ]);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a card with a status pill for each tutorial', () => {
    const card: HTMLElement =
      fixture.nativeElement.querySelector('.tutorial-card');

    expect(card.querySelector('.tutorial-title')?.textContent).toContain(
      'Angular'
    );
    expect(card.querySelector('.tutorial-description')?.textContent).toContain(
      'desc'
    );
    expect(card.querySelector('.tm-pill-pending')?.textContent).toContain(
      'Pending'
    );
  });

  it('shows the empty state when there is no tutorial', () => {
    component.tutorials = [];
    fixture.detectChanges();

    const empty: HTMLElement = fixture.nativeElement.querySelector('.tm-empty');
    expect(empty).not.toBeNull();
    expect(empty.querySelector('.tm-empty-icon')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.tutorial-card')).toBeNull();
  });

  it('opens the drawer when a tutorial is clicked', () => {
    const item: HTMLElement =
      fixture.nativeElement.querySelector('.tutorial-card');
    item.click();
    fixture.detectChanges();

    expect(component.drawerTutorialId).toBe(1);
    httpMock.expectOne('/tutorials/1').flush({
      id: 1,
      title: 'Angular',
      description: 'desc',
      published: false
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.drawer')).not.toBeNull();
  });

  it('closes the drawer', () => {
    component.setActiveTutorial({ id: 1 }, 0);
    fixture.detectChanges();
    httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'Angular' });

    component.closeDrawer();
    fixture.detectChanges();

    expect(component.drawerTutorialId).toBeNull();
    expect(fixture.nativeElement.querySelector('.drawer')).toBeNull();
  });

  it('shows the empty state while the first request is still in flight', () => {
    const pending = TestBed.createComponent(TutorialsListComponent);
    pending.detectChanges();

    expect(pending.componentInstance.tutorials).toBeUndefined();
    expect(pending.nativeElement.querySelector('.tm-empty')).not.toBeNull();

    httpMock.expectOne('/tutorials').flush([]);
  });

  it('keeps the previously loaded list when reloading fails', () => {
    component.retrieveTutorials();
    httpMock
      .expectOne('/tutorials')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.tutorials).toEqual([
      { id: 1, title: 'Angular', description: 'desc', published: false }
    ]);
    expect(fixture.nativeElement.querySelector('.tutorial-card')).not.toBeNull();
  });

  it('marks the clicked tutorial as the active card', () => {
    const card: HTMLElement =
      fixture.nativeElement.querySelector('.tutorial-card');
    card.click();
    fixture.detectChanges();
    httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'Angular' });
    fixture.detectChanges();

    expect(component.currentIndex).toBe(0);
    expect(component.currentTutorial.id).toBe(1);
    expect(
      fixture.nativeElement.querySelector('.tutorial-card').classList
    ).toContain('active');
  });

  describe('search', () => {
    it('searches by the typed title and replaces the list with the results', () => {
      component.title = 'Rx';

      fixture.nativeElement.querySelector('.search-bar .tm-btn').click();

      const req = httpMock.expectOne((r) => r.url.startsWith('/tutorials'));
      expect(req.request.urlWithParams).toContain('title=Rx');
      req.flush([{ id: 9, title: 'Rx', description: 'streams', published: true }]);
      fixture.detectChanges();

      expect(component.tutorials?.length).toBe(1);
      expect(
        fixture.nativeElement.querySelector('.tutorial-title').textContent
      ).toContain('Rx');
    });

    it('shows the empty state when the search matches nothing', () => {
      component.title = 'nothing';
      component.searchTitle();
      httpMock.expectOne((r) => r.url.startsWith('/tutorials')).flush([]);
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('.tm-empty')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('.tutorial-card')).toBeNull();
    });

    it('clears the selection and closes the drawer before searching', () => {
      component.setActiveTutorial({ id: 1 }, 0);
      fixture.detectChanges();
      httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'Angular' });

      component.searchTitle();
      fixture.detectChanges();

      expect(component.drawerTutorialId).toBeNull();
      expect(component.currentIndex).toBe(-1);
      expect(component.currentTutorial).toEqual({});
      expect(fixture.nativeElement.querySelector('.drawer')).toBeNull();

      httpMock.expectOne((r) => r.url.startsWith('/tutorials')).flush([]);
    });

    it('keeps the current list when the search request fails', () => {
      component.searchTitle();
      httpMock
        .expectOne((r) => r.url.startsWith('/tutorials'))
        .flush('boom', { status: 500, statusText: 'Server Error' });
      fixture.detectChanges();

      expect(component.tutorials?.length).toBe(1);
    });
  });

  describe('removeAllTutorials', () => {
    it('deletes the whole collection and reloads an empty list', () => {
      fixture.nativeElement.querySelector('.list-header .tm-btn').click();

      const del = httpMock.expectOne('/tutorials');
      expect(del.request.method).toBe('DELETE');
      del.flush({ message: 'All tutorials were deleted.' });

      const reload = httpMock.expectOne('/tutorials');
      expect(reload.request.method).toBe('GET');
      reload.flush([]);
      fixture.detectChanges();

      expect(component.tutorials).toEqual([]);
      expect(fixture.nativeElement.querySelector('.tm-empty')).not.toBeNull();
    });

    it('resets the selection and closes the drawer after deleting everything', () => {
      component.setActiveTutorial({ id: 1 }, 0);
      fixture.detectChanges();
      httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'Angular' });

      component.removeAllTutorials();
      httpMock.expectOne((r) => r.method === 'DELETE').flush({});
      httpMock.expectOne((r) => r.method === 'GET').flush([]);
      fixture.detectChanges();

      expect(component.drawerTutorialId).toBeNull();
      expect(component.currentIndex).toBe(-1);
      expect(component.currentTutorial).toEqual({});
    });

    it('does not reload the list when the delete request fails', () => {
      component.removeAllTutorials();
      httpMock
        .expectOne((r) => r.method === 'DELETE')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      httpMock.expectNone((r) => r.method === 'GET');
      expect(component.tutorials?.length).toBe(1);
    });
  });
});
