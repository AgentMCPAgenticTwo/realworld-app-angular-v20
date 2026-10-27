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
});
