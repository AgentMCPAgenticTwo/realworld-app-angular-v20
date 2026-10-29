import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialDetailsComponent } from './tutorial-details.component';

describe('TutorialDetailsComponent (behaviour)', () => {
  let component: TutorialDetailsComponent;
  let fixture: ComponentFixture<TutorialDetailsComponent>;
  let httpMock: HttpTestingController;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialDetailsComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: '11' } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialDetailsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(console, 'error');
    spyOn(console, 'log');
  });

  afterEach(() => httpMock.verify());

  describe('ngOnInit', () => {
    it('loads the tutorial named by the route when not in view mode', () => {
      component.viewMode = false;
      fixture.detectChanges();

      const req = httpMock.expectOne('/tutorials/11');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 11, title: 'Routed', description: 'd', published: true });

      expect(component.currentTutorial.title).toBe('Routed');
    });

    it('does not load anything in view mode, where the parent supplies the tutorial', () => {
      component.viewMode = true;
      component.currentTutorial = { id: 2, title: 'Given' };

      fixture.detectChanges();

      expect(httpMock.match(() => true).length).toBe(0);
      expect(component.currentTutorial.title).toBe('Given');
    });

    it('leaves the tutorial untouched when the route id does not exist', () => {
      component.viewMode = false;
      fixture.detectChanges();
      httpMock
        .expectOne('/tutorials/11')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(component.currentTutorial.title).toBe('');
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updatePublished', () => {
    beforeEach(() => {
      component.viewMode = true;
      fixture.detectChanges();
      component.currentTutorial = {
        id: 1,
        title: 'A',
        description: 'B',
        published: false
      };
    });

    it('sends only title, description and the new status', () => {
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

    it('shows the message returned by the api', () => {
      component.updatePublished(true);
      httpMock.expectOne('/tutorials/1').flush({ message: 'Server said so' });

      expect(component.currentTutorial.published).toBeTrue();
      expect(component.message).toBe('Server said so');
    });

    it('falls back to a default message when the api returns no message', () => {
      component.updatePublished(true);
      httpMock.expectOne('/tutorials/1').flush({});

      expect(component.message).toBe('The status was updated successfully!');
    });

    it('does not change the status or show a message when the api fails', () => {
      component.updatePublished(true);
      httpMock
        .expectOne('/tutorials/1')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.currentTutorial.published).toBeFalse();
      expect(component.message).toBe('');
    });

    // KNOWN-DEFECT: the success handler reads `res.message` without a null
    // guard (the drawer component guards with `res && res.message`), so an
    // empty 200/204 response throws a TypeError and the published flag and
    // message are never updated. See finding "updatePublished / updateTutorial
    // throw on an empty api response".
    xit('falls back to a default message when the api returns an empty body', () => {
      component.updatePublished(true);
      httpMock.expectOne('/tutorials/1').flush(null);

      expect(component.currentTutorial.published).toBeTrue();
      expect(component.message).toBe('The status was updated successfully!');
    });
  });

  describe('updateTutorial', () => {
    beforeEach(() => {
      component.viewMode = true;
      fixture.detectChanges();
      component.currentTutorial = {
        id: 1,
        title: 'A',
        description: 'B',
        published: false
      };
    });

    it('PUTs the whole tutorial being edited', () => {
      component.updateTutorial();

      const req = httpMock.expectOne('/tutorials/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(component.currentTutorial);
      req.flush({});
    });

    it('falls back to a default message when the api returns no message', () => {
      component.updateTutorial();
      httpMock.expectOne('/tutorials/1').flush({});

      expect(component.message).toBe('This tutorial was updated successfully!');
    });

    it('shows the message returned by the api', () => {
      component.updateTutorial();
      httpMock.expectOne('/tutorials/1').flush({ message: 'Saved' });

      expect(component.message).toBe('Saved');
    });

    it('clears a stale message and shows none when the update fails', () => {
      component.message = 'stale';

      component.updateTutorial();
      httpMock
        .expectOne('/tutorials/1')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.message).toBe('');
    });
  });

  describe('deleteTutorial', () => {
    beforeEach(() => {
      component.viewMode = true;
      fixture.detectChanges();
      component.currentTutorial = { id: 1, title: 'A' };
    });

    it('navigates back to the tutorials list after deleting', () => {
      const navigate = spyOn(router, 'navigate');

      component.deleteTutorial();
      const req = httpMock.expectOne('/tutorials/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expect(navigate).toHaveBeenCalledWith(['/tutorials']);
    });

    it('stays on the page when the delete fails', () => {
      const navigate = spyOn(router, 'navigate');

      component.deleteTutorial();
      httpMock
        .expectOne('/tutorials/1')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(navigate).not.toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });
});
