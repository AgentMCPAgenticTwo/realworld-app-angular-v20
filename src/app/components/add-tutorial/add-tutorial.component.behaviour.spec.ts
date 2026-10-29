import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { AddTutorialComponent } from './add-tutorial.component';

describe('AddTutorialComponent (behaviour)', () => {
  let component: AddTutorialComponent;
  let fixture: ComponentFixture<AddTutorialComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddTutorialComponent],
      imports: [HttpClientTestingModule, FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(AddTutorialComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    spyOn(console, 'error');
    spyOn(console, 'log');
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('starts with an empty, unpublished and unsubmitted form', () => {
    expect(component.tutorial).toEqual({
      title: '',
      description: '',
      published: false
    });
    expect(component.submitted).toBeFalse();
  });

  describe('saveTutorial', () => {
    it('POSTs only the title and the description', () => {
      component.tutorial = {
        title: 'Angular',
        description: 'desc',
        published: true
      };

      component.saveTutorial();

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        title: 'Angular',
        description: 'desc'
      });
      req.flush({ id: 1 });
    });

    it('marks the form as submitted once the api accepts it', () => {
      component.tutorial = { title: 'Angular', description: 'desc' };

      component.saveTutorial();
      httpMock.expectOne('/tutorials').flush({ id: 1 });
      fixture.detectChanges();

      expect(component.submitted).toBeTrue();
      expect(
        fixture.nativeElement.querySelector('.alert.alert-success')
      ).not.toBeNull();
    });

    it('does not mark the form as submitted when the api rejects it', () => {
      component.tutorial = { title: '', description: '' };

      component.saveTutorial();
      httpMock
        .expectOne('/tutorials')
        .flush(
          { message: 'title required' },
          { status: 400, statusText: 'Bad Request' }
        );
      fixture.detectChanges();

      expect(component.submitted).toBeFalse();
      expect(
        fixture.nativeElement.querySelector('.alert.alert-success')
      ).toBeNull();
      expect(console.error).toHaveBeenCalled();
    });

    it('posts an empty form as-is, leaving validation to the api', () => {
      component.saveTutorial();

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.body).toEqual({ title: '', description: '' });
      req.flush({ id: 1 });
    });
  });

  describe('newTutorial', () => {
    it('clears the submitted flag and resets the form to its initial state', () => {
      component.tutorial = {
        id: 1,
        title: 'Angular',
        description: 'desc',
        published: true
      };
      component.submitted = true;

      component.newTutorial();
      fixture.detectChanges();

      expect(component.submitted).toBeFalse();
      expect(component.tutorial).toEqual({
        title: '',
        description: '',
        published: false
      });
      expect(fixture.nativeElement.querySelector('#title').value).toBe('');
    });
  });
});
