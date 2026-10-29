import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TutorialDrawerComponent } from './tutorial-drawer.component';

describe('TutorialDrawerComponent behaviour', () => {
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

  const setId = (id: any) => {
    fixture.componentRef.setInput('tutorialId', id);
    fixture.detectChanges();
  };

  describe('open boundary', () => {
    it('is closed for a null id', () => {
      setId(null);
      expect(component.open).toBeFalse();
      httpMock.expectNone(() => true);
    });

    it('is closed for an undefined id', () => {
      setId(undefined);
      expect(component.open).toBeFalse();
      httpMock.expectNone(() => true);
    });

    it('is open for the id 0, which is falsy but valid', () => {
      setId(0);
      expect(component.open).toBeTrue();
      httpMock.expectOne('/tutorials/0').flush({ id: 0, title: 'Zero' });
    });
  });

  it('resets the previous tutorial before loading the next one', () => {
    setId(1);
    httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'First' });
    fixture.detectChanges();

    setId(2);
    expect(component.currentTutorial).toEqual({});
    expect(fixture.nativeElement.textContent).not.toContain('First');

    httpMock.expectOne('/tutorials/2').flush({ id: 2, title: 'Second' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Second');
  });

  it('clears a previous "not found" state when a later id loads', () => {
    setId(42);
    httpMock
      .expectOne('/tutorials/42')
      .flush('Not Found', { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    expect(component.notFound).toBeTrue();

    setId(1);
    httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'First' });
    fixture.detectChanges();

    expect(component.notFound).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain('Not found');
  });

  it('does not claim "not found" when the api fails with a 500', () => {
    setId(1);
    httpMock
      .expectOne('/tutorials/1')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.notFound).toBeFalse();
    expect(component.currentTutorial).toEqual({});
  });

  it('closes when the input goes back to null and emits nothing by itself', () => {
    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    setId(1);
    httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'First' });
    setId(null);

    expect(component.open).toBeFalse();
    expect(fixture.nativeElement.querySelector('.drawer')).toBeNull();
    expect(closed).not.toHaveBeenCalled();
  });

  it('unpublishes a published tutorial and notifies the parent', () => {
    setId(1);
    httpMock
      .expectOne('/tutorials/1')
      .flush({ id: 1, title: 'A', description: 'B', published: true });
    fixture.detectChanges();

    const changed = jasmine.createSpy('changed');
    component.changed.subscribe(changed);

    component.updatePublished(false);
    const req = httpMock.expectOne('/tutorials/1');
    expect(req.request.body).toEqual({
      title: 'A',
      description: 'B',
      published: false
    });
    req.flush({ message: 'Unpublished' });
    fixture.detectChanges();

    expect(component.currentTutorial.published).toBeFalse();
    expect(component.message).toBe('Unpublished');
    expect(changed).toHaveBeenCalledTimes(1);
  });

  it('uses the default message when the api returns an empty body', () => {
    setId(1);
    httpMock
      .expectOne('/tutorials/1')
      .flush({ id: 1, title: 'A', description: 'B', published: false });

    component.updatePublished(true);
    httpMock.expectOne('/tutorials/1').flush(null);

    expect(component.message).toBe('The status was updated successfully!');
  });

  it('does not notify the parent when publishing fails', () => {
    setId(1);
    httpMock
      .expectOne('/tutorials/1')
      .flush({ id: 1, title: 'A', description: 'B', published: false });

    const changed = jasmine.createSpy('changed');
    component.changed.subscribe(changed);

    component.updatePublished(true);
    httpMock
      .expectOne('/tutorials/1')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(changed).not.toHaveBeenCalled();
    expect(component.currentTutorial.published).toBeFalse();
  });

  it('keeps the drawer open when the delete fails', () => {
    setId(1);
    httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'A' });

    const closed = jasmine.createSpy('closed');
    const changed = jasmine.createSpy('changed');
    component.closed.subscribe(closed);
    component.changed.subscribe(changed);

    component.deleteTutorial();
    httpMock
      .expectOne('/tutorials/1')
      .flush('boom', { status: 500, statusText: 'Server Error' });

    expect(closed).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });

  it('emits closed when the close control is used', () => {
    setId(1);
    httpMock.expectOne('/tutorials/1').flush({ id: 1, title: 'A' });
    fixture.detectChanges();

    const closed = jasmine.createSpy('closed');
    component.closed.subscribe(closed);

    component.close();

    expect(closed).toHaveBeenCalledTimes(1);
  });
});
