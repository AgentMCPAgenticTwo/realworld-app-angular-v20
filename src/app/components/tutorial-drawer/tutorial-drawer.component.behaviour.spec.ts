import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { SimpleChange } from '@angular/core';

import { TutorialDrawerComponent } from './tutorial-drawer.component';

describe('TutorialDrawerComponent (behaviour)', () => {
  let component: TutorialDrawerComponent;
  let fixture: ComponentFixture<TutorialDrawerComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialDrawerComponent],
      imports: [HttpClientTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialDrawerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'error');
  });

  afterEach(() => httpMock.verify());

  /** Drives ngOnChanges the way the parent template does. */
  const openWith = (id: any) => {
    const previous = component.tutorialId;
    component.tutorialId = id;
    component.ngOnChanges({
      tutorialId: new SimpleChange(previous, id, previous === undefined)
    });
    return httpMock.expectOne(`/tutorials/${id}`);
  };

  describe('open', () => {
    it('is closed when no tutorial id is set', () => {
      expect(component.open).toBeFalse();
    });

    it('is closed when the tutorial id is explicitly undefined', () => {
      component.tutorialId = undefined;

      expect(component.open).toBeFalse();
    });

    it('is open for the falsy but valid id 0', () => {
      component.tutorialId = 0;

      expect(component.open).toBeTrue();
    });

    it('is open for the falsy but valid id ""', () => {
      component.tutorialId = '';

      expect(component.open).toBeTrue();
    });
  });

  describe('ngOnChanges', () => {
    it('loads the tutorial when a tutorial id arrives', () => {
      const req = openWith(5);

      expect(req.request.method).toBe('GET');
      req.flush({ id: 5, title: 'Angular' });

      expect(component.currentTutorial.title).toBe('Angular');
    });

    it('does not request anything when the drawer is closed again', () => {
      openWith(5).flush({ id: 5, title: 'Angular' });

      component.tutorialId = null;
      component.ngOnChanges({
        tutorialId: new SimpleChange(5, null, false)
      });

      expect(httpMock.match(() => true).length).toBe(0);
    });

    it('clears the previous tutorial, message and notFound flag on reopen', () => {
      openWith(1).flush('Not Found', { status: 404, statusText: 'Not Found' });
      expect(component.notFound).toBeTrue();
      component.message = 'stale message';

      openWith(2).flush({ id: 2, title: 'Second' });

      expect(component.notFound).toBeFalse();
      expect(component.message).toBe('');
      expect(component.currentTutorial.title).toBe('Second');
    });

    it('ignores changes that do not concern the tutorial id', () => {
      component.tutorialId = 9;
      component.ngOnChanges({});

      expect(httpMock.match(() => true).length).toBe(0);
    });
  });

  describe('getTutorial', () => {
    it('marks the tutorial as not found and empties it on a 404', () => {
      component.currentTutorial = { id: 1, title: 'Stale' };

      component.getTutorial(1);
      httpMock
        .expectOne('/tutorials/1')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(component.notFound).toBeTrue();
      expect(component.currentTutorial).toEqual({});
    });

    it('keeps the current tutorial and does not claim "not found" on a 500', () => {
      component.currentTutorial = { id: 1, title: 'Stale' };

      component.getTutorial(1);
      httpMock
        .expectOne('/tutorials/1')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.notFound).toBeFalse();
      expect(component.currentTutorial.title).toBe('Stale');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updatePublished', () => {
    beforeEach(() => {
      component.currentTutorial = {
        id: 1,
        title: 'A',
        description: 'B',
        published: false
      };
    });

    it('sends only title, description and the new published status', () => {
      component.updatePublished(true);

      const req = httpMock.expectOne('/tutorials/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        title: 'A',
        description: 'B',
        published: true
      });
      req.flush({});
    });

    it('uses the message returned by the api when there is one', () => {
      component.updatePublished(true);
      httpMock.expectOne('/tutorials/1').flush({ message: 'Server said so' });

      expect(component.message).toBe('Server said so');
    });

    it('falls back to a default message when the api returns an empty body', () => {
      component.updatePublished(true);
      httpMock.expectOne('/tutorials/1').flush(null);

      expect(component.message).toBe('The status was updated successfully!');
    });

    it('unpublishes a published tutorial and emits changed', () => {
      component.currentTutorial.published = true;
      const changed = jasmine.createSpy('changed');
      component.changed.subscribe(changed);

      component.updatePublished(false);
      const req = httpMock.expectOne('/tutorials/1');
      expect(req.request.body.published).toBeFalse();
      req.flush({});

      expect(component.currentTutorial.published).toBeFalse();
      expect(changed).toHaveBeenCalledTimes(1);
    });

    it('does not change the published status or emit changed when the api fails', () => {
      const changed = jasmine.createSpy('changed');
      component.changed.subscribe(changed);

      component.updatePublished(true);
      httpMock
        .expectOne('/tutorials/1')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.currentTutorial.published).toBeFalse();
      expect(component.message).toBe('');
      expect(changed).not.toHaveBeenCalled();
    });
  });

  describe('deleteTutorial', () => {
    beforeEach(() => {
      component.currentTutorial = { id: 4, title: 'A' };
    });

    it('emits changed and closed after a successful delete', () => {
      const changed = jasmine.createSpy('changed');
      const closed = jasmine.createSpy('closed');
      component.changed.subscribe(changed);
      component.closed.subscribe(closed);

      component.deleteTutorial();
      httpMock.expectOne('/tutorials/4').flush({});

      expect(changed).toHaveBeenCalledTimes(1);
      expect(closed).toHaveBeenCalledTimes(1);
    });

    it('keeps the drawer open when the delete fails', () => {
      const closed = jasmine.createSpy('closed');
      component.closed.subscribe(closed);

      component.deleteTutorial();
      httpMock
        .expectOne('/tutorials/4')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(closed).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  it('emits closed when close is called', () => {
    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    component.close();

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
