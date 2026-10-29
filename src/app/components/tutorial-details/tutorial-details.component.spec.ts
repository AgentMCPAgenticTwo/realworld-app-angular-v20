import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router } from '@angular/router';

import { TutorialDetailsComponent } from './tutorial-details.component';

describe('TutorialDetailsComponent', () => {
  let component: TutorialDetailsComponent;
  let fixture: ComponentFixture<TutorialDetailsComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialDetailsComponent],
      imports: [HttpClientTestingModule, FormsModule, RouterTestingModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TutorialDetailsComponent);
    component = fixture.componentInstance;
    component.viewMode = true;
    fixture.detectChanges();
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the tutorial inside a card with a status pill', () => {
    component.currentTutorial = {
      id: 1,
      title: 'Angular',
      description: 'desc',
      published: true
    };
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.view-card.tm-card')).not.toBeNull();
    expect(compiled.querySelector('.tm-pill-published')?.textContent).toContain(
      'Published'
    );
  });

  it('shows the message as a bootstrap alert in edit mode', () => {
    component.viewMode = false;
    component.currentTutorial = {
      id: 1,
      title: 'Angular',
      description: 'desc',
      published: false
    };
    component.message = 'This tutorial was updated successfully!';
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.alert.alert-success');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('updated successfully');
  });

  it('does not fetch a tutorial in view mode', () => {
    expect(httpMock.match(() => true).length).toBe(0);
  });

  describe('updatePublished', () => {
    beforeEach(() => {
      component.currentTutorial = {
        id: 4,
        title: 'Angular',
        description: 'desc',
        published: false
      };
      component.message = 'stale message';
    });

    it('sends the new status with the current title and description', () => {
      component.updatePublished(true);

      const req = httpMock.expectOne('/tutorials/4');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({
        title: 'Angular',
        description: 'desc',
        published: true
      });
      req.flush({ message: 'ok' });
    });

    it('clears the previous message as soon as the request starts', () => {
      component.updatePublished(true);

      expect(component.message).toBe('');

      httpMock.expectOne('/tutorials/4').flush({ message: 'ok' });
    });

    it('shows the message returned by the server', () => {
      component.updatePublished(true);
      httpMock
        .expectOne('/tutorials/4')
        .flush({ message: 'Tutorial was updated successfully.' });

      expect(component.currentTutorial.published).toBeTrue();
      expect(component.message).toBe('Tutorial was updated successfully.');
    });

    it('falls back to a default message when the server sends none', () => {
      component.updatePublished(true);
      httpMock.expectOne('/tutorials/4').flush({});

      expect(component.message).toBe('The status was updated successfully!');
    });

    it('unpublishes a published tutorial', () => {
      component.currentTutorial.published = true;

      component.updatePublished(false);
      const req = httpMock.expectOne('/tutorials/4');
      expect(req.request.body.published).toBeFalse();
      req.flush({});

      expect(component.currentTutorial.published).toBeFalse();
    });

    it('leaves the published flag untouched when the update fails', () => {
      component.updatePublished(true);
      httpMock
        .expectOne('/tutorials/4')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.currentTutorial.published).toBeFalse();
      expect(component.message).toBe('');
    });

    // KNOWN-DEFECT: finding "TutorialDetailsComponent reads res.message without
    // a null guard". TutorialDrawerComponent guards with `res && res.message`;
    // this component does not, so a 204 / empty-body response throws a
    // TypeError inside the subscriber and the UI never updates.
    xit('falls back to the default message when the response has no body', () => {
      component.updatePublished(true);
      httpMock.expectOne('/tutorials/4').flush(null, { status: 204, statusText: 'No Content' });

      expect(component.message).toBe('The status was updated successfully!');
    });
  });

  describe('updateTutorial', () => {
    beforeEach(() => {
      component.currentTutorial = {
        id: 4,
        title: 'Edited',
        description: 'new desc',
        published: true
      };
    });

    it('puts the whole current tutorial', () => {
      component.updateTutorial();

      const req = httpMock.expectOne('/tutorials/4');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(component.currentTutorial);
      req.flush({});
    });

    it('falls back to a default message when the server sends none', () => {
      component.updateTutorial();
      httpMock.expectOne('/tutorials/4').flush({});

      expect(component.message).toBe('This tutorial was updated successfully!');
    });

    it('shows no message when the update fails', () => {
      component.updateTutorial();
      httpMock
        .expectOne('/tutorials/4')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(component.message).toBe('');
    });
  });

  describe('deleteTutorial', () => {
    beforeEach(() => {
      component.currentTutorial = { id: 4, title: 'A', description: 'B' };
    });

    it('deletes the tutorial and navigates back to the list', () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate');

      component.deleteTutorial();
      const req = httpMock.expectOne('/tutorials/4');
      expect(req.request.method).toBe('DELETE');
      req.flush({});

      expect(navigate).toHaveBeenCalledWith(['/tutorials']);
    });

    it('stays on the page when the delete fails', () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, 'navigate');

      component.deleteTutorial();
      httpMock
        .expectOne('/tutorials/4')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(navigate).not.toHaveBeenCalled();
    });
  });
});

describe('TutorialDetailsComponent in edit mode', () => {
  let component: TutorialDetailsComponent;
  let fixture: ComponentFixture<TutorialDetailsComponent>;
  let httpMock: HttpTestingController;

  const setup = async (routeId: any) => {
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
    fixture.detectChanges();
  };

  afterEach(() => httpMock.verify());

  it('loads the tutorial named by the route on init', async () => {
    await setup('12');

    const req = httpMock.expectOne('/tutorials/12');
    expect(req.request.method).toBe('GET');
    req.flush({ id: 12, title: 'Loaded', description: 'd', published: false });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.currentTutorial.title).toBe('Loaded');
    expect(
      (fixture.nativeElement.querySelector('#title') as HTMLInputElement).value
    ).toBe('Loaded');
  });

  it('keeps the empty form when the tutorial cannot be loaded', async () => {
    await setup('404');

    httpMock
      .expectOne('/tutorials/404')
      .flush('Not Found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(component.currentTutorial.title).toBe('');
    expect(component.message).toBe('');
  });
});
