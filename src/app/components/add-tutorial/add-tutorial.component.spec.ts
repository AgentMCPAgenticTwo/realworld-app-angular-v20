import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { AddTutorialComponent } from './add-tutorial.component';

describe('AddTutorialComponent', () => {
  let component: AddTutorialComponent;
  let fixture: ComponentFixture<AddTutorialComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddTutorialComponent],
      imports: [HttpClientTestingModule, FormsModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTutorialComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the form inside a card', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('.submit-form.tm-card')).not.toBeNull();
    expect(compiled.querySelector('#title')).not.toBeNull();
    expect(compiled.querySelector('#description')).not.toBeNull();
  });

  it('shows a success alert once submitted', () => {
    component.submitted = true;
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('.alert.alert-success');
    expect(alert).not.toBeNull();
    expect(alert.textContent).toContain('successfully');
  });

  it('posts the typed title and description when the form is submitted', () => {
    component.tutorial.title = 'New tutorial';
    component.tutorial.description = 'About testing';

    fixture.nativeElement.querySelector('.form-actions .tm-btn').click();

    const req = httpMock.expectOne('/tutorials');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'New tutorial',
      description: 'About testing'
    });
    req.flush({ id: 1 });
  });

  it('shows the success alert and hides the form after a successful save', () => {
    component.tutorial.title = 'New';
    component.saveTutorial();
    httpMock.expectOne('/tutorials').flush({ id: 1 });
    fixture.detectChanges();

    expect(component.submitted).toBeTrue();
    expect(fixture.nativeElement.querySelector('#title')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('.alert.alert-success')
    ).not.toBeNull();
  });

  it('keeps the form open when the server rejects the tutorial', () => {
    component.tutorial.title = '';
    component.saveTutorial();
    httpMock
      .expectOne('/tutorials')
      .flush(
        { message: 'Title can not be empty!' },
        { status: 400, statusText: 'Bad Request' }
      );
    fixture.detectChanges();

    expect(component.submitted).toBeFalse();
    expect(fixture.nativeElement.querySelector('#title')).not.toBeNull();
  });

  it('keeps the form open when the save request fails with a server error', () => {
    component.saveTutorial();
    httpMock
      .expectOne('/tutorials')
      .flush('boom', { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(component.submitted).toBeFalse();
  });

  it('clears the form and shows it again when adding another tutorial', () => {
    component.tutorial = { title: 'Old', description: 'Old desc', published: true };
    component.submitted = true;
    fixture.detectChanges();

    fixture.nativeElement.querySelector('.form-actions .tm-btn').click();
    fixture.detectChanges();

    expect(component.submitted).toBeFalse();
    expect(component.tutorial).toEqual({
      title: '',
      description: '',
      published: false
    });
    expect(
      (fixture.nativeElement.querySelector('#title') as HTMLInputElement).value
    ).toBe('');
  });
});
