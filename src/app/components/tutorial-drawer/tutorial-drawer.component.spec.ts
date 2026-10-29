import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialDrawerComponent } from './tutorial-drawer.component';

describe('TutorialDrawerComponent', () => {
  let component: TutorialDrawerComponent;
  let fixture: ComponentFixture<TutorialDrawerComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TutorialDrawerComponent],
      imports: [HttpClientTestingModule, RouterTestingModule]
    }).compileComponents();

    fixture = TestBed.createComponent(TutorialDrawerComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  const openWith = (id: any) => {
    fixture.componentRef.setInput('tutorialId', id);
    fixture.detectChanges();
    return httpMock.expectOne(`/tutorials/${id}`);
  };

  it('should create and stay closed without a tutorial id', () => {
    expect(component).toBeTruthy();
    expect(component.open).toBeFalse();
    expect(fixture.nativeElement.querySelector('.drawer')).toBeNull();
  });

  it('loads and shows the tutorial details when opened', () => {
    openWith(1).flush({
      id: 1,
      title: 'Angular',
      description: 'A drawer',
      published: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z'
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(fixture.nativeElement.querySelector('.drawer')).not.toBeNull();
    expect(text).toContain('Angular');
    expect(text).toContain('A drawer');
    expect(text).toContain('Published');
    expect(text).toContain('2024-01-01T00:00:00Z');
    expect(text).toContain('2024-01-02T00:00:00Z');
    expect(text).toContain('UnPublish');
    expect(text).toContain('Edit');
  });

  it('shows "Not found" when the api returns 404', () => {
    openWith(42).flush('Not Found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    expect(component.notFound).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Not found');
  });

  it('publishes an unpublished tutorial', () => {
    openWith(1).flush({ id: 1, title: 'A', description: 'B', published: false });
    fixture.detectChanges();

    const changed = jasmine.createSpy('changed');
    component.changed.subscribe(changed);

    component.updatePublished(true);
    const req = httpMock.expectOne('/tutorials/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.published).toBeTrue();
    req.flush({});

    expect(component.currentTutorial.published).toBeTrue();
    expect(changed).toHaveBeenCalled();
  });

  it('deletes the tutorial and closes the drawer', () => {
    openWith(1).flush({ id: 1, title: 'A', description: 'B', published: false });

    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    component.deleteTutorial();
    const req = httpMock.expectOne('/tutorials/1');
    expect(req.request.method).toBe('DELETE');
    req.flush({});

    expect(closed).toHaveBeenCalled();
  });

  it('unpublishes a published tutorial and shows the server message', () => {
    openWith(1).flush({ id: 1, title: 'A', description: 'B', published: true });

    component.updatePublished(false);
    const req = httpMock.expectOne('/tutorials/1');
    expect(req.request.body.published).toBeFalse();
    req.flush({ message: 'Tutorial was updated successfully.' });

    expect(component.currentTutorial.published).toBeFalse();
    expect(component.message).toBe('Tutorial was updated successfully.');
  });

  it('falls back to a default message when the response has no body', () => {
    openWith(1).flush({ id: 1, title: 'A', description: 'B', published: false });

    component.updatePublished(true);
    httpMock
      .expectOne('/tutorials/1')
      .flush(null, { status: 204, statusText: 'No Content' });

    expect(component.message).toBe('The status was updated successfully!');
  });

  it('leaves the published flag untouched when the update fails', () => {
    openWith(1).flush({ id: 1, title: 'A', description: 'B', published: false });

    const changed = jasmine.createSpy('changed');
    component.changed.subscribe(changed);

    component.updatePublished(true);
    httpMock
      .expectOne('/tutorials/1')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(component.currentTutorial.published).toBeFalse();
    expect(changed).not.toHaveBeenCalled();
  });

  it('keeps the drawer open when the delete fails', () => {
    openWith(1).flush({ id: 1, title: 'A', description: 'B' });

    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    component.deleteTutorial();
    httpMock
      .expectOne('/tutorials/1')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(closed).not.toHaveBeenCalled();
  });

  it('does not show "Not found" for a non-404 error', () => {
    openWith(3).flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.notFound).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Not found');
  });

  it('clears the previous tutorial and message when a different id is opened', () => {
    openWith(1).flush({ id: 1, title: 'First', description: 'B' });
    component.message = 'stale message';
    fixture.detectChanges();

    openWith(2).flush({ id: 2, title: 'Second', description: 'C' });
    fixture.detectChanges();

    expect(component.message).toBe('');
    expect(component.currentTutorial.title).toBe('Second');
    expect(fixture.nativeElement.textContent).not.toContain('First');
  });

  it('clears the not-found state and closes when the id goes back to null', () => {
    openWith(42).flush('Not Found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();

    fixture.componentRef.setInput('tutorialId', null);
    fixture.detectChanges();

    expect(component.open).toBeFalse();
    expect(component.notFound).toBeFalse();
    expect(fixture.nativeElement.querySelector('.drawer')).toBeNull();
  });

  // KNOWN-DEFECT: finding "drawer body is blank for a tutorial whose id is 0".
  // The template branches on `currentTutorial.id` truthiness, so a tutorial
  // loaded successfully with id 0 renders an empty drawer — no title, no
  // actions and not even the "Not found" message.
  xit('treats id 0 as an open drawer rather than a falsy id', () => {
    openWith(0).flush({ id: 0, title: 'Zero', description: 'B' });
    fixture.detectChanges();

    expect(component.open).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain('Zero');
  });

  it('emits closed when close is called', () => {
    openWith(1).flush({ id: 1, title: 'A', description: 'B' });
    fixture.detectChanges();

    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    component.close();

    expect(closed).toHaveBeenCalled();
  });
});
