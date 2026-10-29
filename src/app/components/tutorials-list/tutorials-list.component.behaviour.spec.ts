import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialsListComponent } from './tutorials-list.component';
import { TutorialDrawerComponent } from '../tutorial-drawer/tutorial-drawer.component';

describe('TutorialsListComponent (behaviour)', () => {
  let component: TutorialsListComponent;
  let fixture: ComponentFixture<TutorialsListComponent>;
  let httpMock: HttpTestingController;

  const ANGULAR = {
    id: 1,
    title: 'Angular',
    description: 'desc',
    published: false
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialsListComponent, TutorialDrawerComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialsListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'error');
    spyOn(console, 'log');
  });

  afterEach(() => httpMock.verify());

  /** Runs ngOnInit and answers the initial GET /tutorials. */
  const init = (tutorials: any[] = [ANGULAR]) => {
    fixture.detectChanges();
    httpMock.expectOne('/tutorials').flush(tutorials);
    fixture.detectChanges();
  };

  describe('retrieveTutorials', () => {
    it('loads the tutorials on init', () => {
      init();

      expect(component.tutorials).toEqual([ANGULAR]);
    });

    it('leaves the list undefined when the api fails', () => {
      fixture.detectChanges();
      httpMock
        .expectOne('/tutorials')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.tutorials).toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('setActiveTutorial / closeDrawer', () => {
    it('selects the tutorial and opens the drawer on it', () => {
      init();

      component.setActiveTutorial(ANGULAR, 0);
      fixture.detectChanges();
      httpMock.expectOne('/tutorials/1').flush(ANGULAR);

      expect(component.currentTutorial).toBe(ANGULAR);
      expect(component.currentIndex).toBe(0);
      expect(component.drawerTutorialId).toBe(1);
    });

    it('clears the selection when the drawer is closed', () => {
      init();
      component.setActiveTutorial(ANGULAR, 0);
      fixture.detectChanges();
      httpMock.expectOne('/tutorials/1').flush(ANGULAR);

      component.closeDrawer();
      fixture.detectChanges();

      expect(component.drawerTutorialId).toBeNull();
      expect(component.currentTutorial).toEqual({});
      expect(component.currentIndex).toBe(-1);
    });
  });

  describe('refreshList', () => {
    it('reloads the tutorials and resets the selection', () => {
      init();
      component.setActiveTutorial(ANGULAR, 0);
      fixture.detectChanges();
      httpMock.expectOne('/tutorials/1').flush(ANGULAR);

      component.refreshList();
      httpMock.expectOne('/tutorials').flush([]);
      fixture.detectChanges();

      expect(component.tutorials).toEqual([]);
      expect(component.currentIndex).toBe(-1);
      expect(component.currentTutorial).toEqual({});
      expect(component.drawerTutorialId).toBeNull();
    });
  });

  describe('removeAllTutorials', () => {
    it('deletes the collection and then reloads the empty list', () => {
      init();

      component.removeAllTutorials();
      const del = httpMock.expectOne('/tutorials');
      expect(del.request.method).toBe('DELETE');
      del.flush({ message: 'all removed' });

      httpMock.expectOne('/tutorials').flush([]);
      fixture.detectChanges();

      expect(component.tutorials).toEqual([]);
    });

    it('keeps the current list when the delete fails', () => {
      init();

      component.removeAllTutorials();
      httpMock
        .expectOne('/tutorials')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.tutorials).toEqual([ANGULAR]);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('searchTitle', () => {
    it('queries by title and replaces the list with the results', () => {
      init();
      component.title = 'ng';

      component.searchTitle();
      const req = httpMock.expectOne('/tutorials?title=ng');
      expect(req.request.method).toBe('GET');
      req.flush([{ id: 2, title: 'ngrx' }]);
      fixture.detectChanges();

      expect(component.tutorials).toEqual([{ id: 2, title: 'ngrx' } as any]);
    });

    it('resets the selection and closes the drawer before searching', () => {
      init();
      component.setActiveTutorial(ANGULAR, 0);
      fixture.detectChanges();
      httpMock.expectOne('/tutorials/1').flush(ANGULAR);

      component.searchTitle();
      fixture.detectChanges();
      httpMock.expectOne('/tutorials?title=').flush([]);

      expect(component.drawerTutorialId).toBeNull();
      expect(component.currentIndex).toBe(-1);
      expect(component.currentTutorial).toEqual({});
    });

    it('yields an empty list when nothing matches', () => {
      init();
      component.title = 'nope';

      component.searchTitle();
      httpMock.expectOne('/tutorials?title=nope').flush([]);
      fixture.detectChanges();

      expect(component.tutorials).toEqual([]);
      expect(fixture.nativeElement.querySelector('.tutorial-card')).toBeNull();
    });

    it('keeps the previous list when the search request fails', () => {
      init();
      component.title = 'ng';

      component.searchTitle();
      httpMock
        .expectOne('/tutorials?title=ng')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.tutorials).toEqual([ANGULAR]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});
