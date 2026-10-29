import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialDetailsComponent } from './tutorial-details.component';

describe('TutorialDetailsComponent behaviour', () => {
  let component: TutorialDetailsComponent;
  let fixture: ComponentFixture<TutorialDetailsComponent>;
  let httpMock: HttpTestingController;

  const setup = async (routeId: any = '5') => {
    await TestBed.configureTestingModule({
      declarations: [TutorialDetailsComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { params: { id: routeId } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialDetailsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  };

  afterEach(() => httpMock.verify());

  describe('edit mode (viewMode = false)', () => {
    beforeEach(async () => {
      await setup('5');
    });

    it('loads the tutorial named by the route on init', () => {
      fixture.detectChanges();

      const req = httpMock.expectOne('/tutorials/5');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 5, title: 'Angular', description: 'd', published: false });
      fixture.detectChanges();

      expect(component.currentTutorial.title).toBe('Angular');
      expect(fixture.nativeElement.querySelector('.edit-form')).not.toBeNull();
    });

    it('shows "Cannot access this Tutorial..." while no tutorial is loaded', () => {
      fixture.detectChanges();
      httpMock
        .expectOne('/tutorials/5')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Cannot access this Tutorial'
      );
      expect(fixture.nativeElement.querySelector('.edit-form')).toBeNull();
    });

    it('publishes the tutorial and shows the message returned by the api', () => {
      fixture.detectChanges();
      httpMock
        .expectOne('/tutorials/5')
        .flush({ id: 5, title: 'A', description: 'B', published: false });

      component.updatePublished(true);

      const req = httpMock.expectOne('/tutorials/5');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        title: 'A',
        description: 'B',
        published: true
      });
      req.flush({ message: 'Published from the server' });
      fixture.detectChanges();

      expect(component.currentTutorial.published).toBeTrue();
      expect(component.message).toBe('Published from the server');
      expect(fixture.nativeElement.querySelector('.alert').textContent).toContain(
        'Published from the server'
      );
    });

    it('falls back to a default message when the api returns none', () => {
      fixture.detectChanges();
      httpMock
        .expectOne('/tutorials/5')
        .flush({ id: 5, title: 'A', description: 'B', published: true });

      component.updatePublished(false);
      httpMock.expectOne('/tutorials/5').flush({});

      expect(component.currentTutorial.published).toBeFalse();
      expect(component.message).toBe('The status was updated successfully!');
    });

    it('keeps the previous published state when the update fails', () => {
      fixture.detectChanges();
      httpMock
        .expectOne('/tutorials/5')
        .flush({ id: 5, title: 'A', description: 'B', published: false });

      component.updatePublished(true);
      httpMock
        .expectOne('/tutorials/5')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.currentTutorial.published).toBeFalse();
      expect(component.message).toBe('');
    });

    it('sends the whole tutorial when updating and reports success', () => {
      fixture.detectChanges();
      httpMock
        .expectOne('/tutorials/5')
        .flush({ id: 5, title: 'A', description: 'B', published: false });

      component.currentTutorial.title = 'Renamed';
      component.updateTutorial();

      const req = httpMock.expectOne('/tutorials/5');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.title).toBe('Renamed');
      req.flush({});

      expect(component.message).toBe('This tutorial was updated successfully!');
    });

    it('navigates back to the list after deleting', () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate');

      fixture.detectChanges();
      httpMock.expectOne('/tutorials/5').flush({ id: 5, title: 'A' });

      component.deleteTutorial();
      const req = httpMock.expectOne('/tutorials/5');
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expect(navigate).toHaveBeenCalledWith(['/tutorials']);
    });

    it('does not navigate away when the delete fails', () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate');

      fixture.detectChanges();
      httpMock.expectOne('/tutorials/5').flush({ id: 5, title: 'A' });

      component.deleteTutorial();
      httpMock
        .expectOne('/tutorials/5')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('view mode (viewMode = true)', () => {
    beforeEach(async () => {
      await setup('5');
    });

    it('does not fetch anything on init', () => {
      component.viewMode = true;
      fixture.detectChanges();

      httpMock.expectNone('/tutorials/5');
    });

    it('prompts the user to pick a tutorial when none is selected', () => {
      component.viewMode = true;
      fixture.detectChanges();

      expect(fixture.nativeElement.textContent).toContain(
        'Please click on a Tutorial'
      );
    });

    it('renders the tutorial passed in as an input', () => {
      component.viewMode = true;
      component.currentTutorial = {
        id: 9,
        title: 'Shown',
        description: 'Desc',
        published: true
      };
      fixture.detectChanges();

      const text = fixture.nativeElement.textContent;
      expect(text).toContain('Shown');
      expect(text).toContain('Desc');
      expect(text).toContain('Published');
    });
  });
});
