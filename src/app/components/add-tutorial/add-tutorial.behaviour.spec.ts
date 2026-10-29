import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { AddTutorialComponent } from './add-tutorial.component';

describe('AddTutorialComponent behaviour', () => {
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
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  const submit = () => {
    const button: HTMLButtonElement = fixture.nativeElement.querySelector(
      '.form-actions button'
    );
    button.click();
    fixture.detectChanges();
  };

  it('POSTs only the title and description, never the published flag', () => {
    component.tutorial = {
      title: 'Angular',
      description: 'A guide',
      published: true
    };
    fixture.detectChanges();

    submit();

    const req = httpMock.expectOne('/tutorials');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'Angular',
      description: 'A guide'
    });
    req.flush({ id: 1 });
  });

  it('shows the success state only after the api confirms the create', () => {
    component.tutorial = { title: 'A', description: 'B', published: false };
    fixture.detectChanges();

    submit();
    expect(component.submitted).toBeFalse();
    expect(fixture.nativeElement.textContent).not.toContain(
      'Tutorial was submitted successfully'
    );

    httpMock.expectOne('/tutorials').flush({ id: 1 });
    fixture.detectChanges();

    expect(component.submitted).toBeTrue();
    expect(fixture.nativeElement.textContent).toContain(
      'Tutorial was submitted successfully'
    );
    expect(fixture.nativeElement.querySelector('#title')).toBeNull();
  });

  it('stays on the form when the api rejects the create', () => {
    component.tutorial = { title: '', description: '', published: false };
    fixture.detectChanges();

    submit();
    httpMock
      .expectOne('/tutorials')
      .flush(
        { message: 'Content can not be empty!' },
        { status: 400, statusText: 'Bad Request' }
      );
    fixture.detectChanges();

    expect(component.submitted).toBeFalse();
    expect(fixture.nativeElement.querySelector('#title')).not.toBeNull();
  });

  // KNOWN-DEFECT: finding "Add Tutorial submits empty required fields" — the
  // template marks title and description `required` but the component performs
  // no validation, so an empty tutorial is sent to the api.
  it('sends an empty payload when the required fields are blank', () => {
    submit();

    const req = httpMock.expectOne('/tutorials');
    expect(req.request.body).toEqual({ title: '', description: '' });
    req.flush({ id: 1 });
  });

  it('clears the form back to its initial state when adding another', () => {
    component.tutorial = { title: 'A', description: 'B', published: true };
    fixture.detectChanges();
    submit();
    httpMock.expectOne('/tutorials').flush({ id: 1 });
    fixture.detectChanges();

    fixture.nativeElement
      .querySelector('.form-actions button')
      .click();
    fixture.detectChanges();

    expect(component.submitted).toBeFalse();
    expect(component.tutorial).toEqual({
      title: '',
      description: '',
      published: false
    });
    const title: HTMLInputElement =
      fixture.nativeElement.querySelector('#title');
    expect(title.value).toBe('');
  });

  it('types into the form and submits what the user typed', () => {
    const title: HTMLInputElement =
      fixture.nativeElement.querySelector('#title');
    const description: HTMLInputElement =
      fixture.nativeElement.querySelector('#description');

    title.value = 'Typed title';
    title.dispatchEvent(new Event('input'));
    description.value = 'Typed description';
    description.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    submit();

    const req = httpMock.expectOne('/tutorials');
    expect(req.request.body).toEqual({
      title: 'Typed title',
      description: 'Typed description'
    });
    req.flush({ id: 1 });
  });
});
