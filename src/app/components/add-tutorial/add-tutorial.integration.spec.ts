import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { AddTutorialComponent } from './add-tutorial.component';
import { ApiInterceptor } from '../../interceptors/api.interceptor';
import { environment } from '../../../environments/environment';

/**
 * Integration: the create screen with the real TutorialService, the real
 * ApiInterceptor and real ngModel bindings. Only the HTTP backend is faked.
 */
describe('Add tutorial screen (integration)', () => {
  const API = `${environment.apiUrl}/tutorials`;

  let fixture: ComponentFixture<AddTutorialComponent>;
  let httpMock: HttpTestingController;

  const el = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  const type = (selector: string, value: string): void => {
    const input = el(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submit = (): void => {
    (el('.form-actions .tm-btn') as HTMLElement).click();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddTutorialComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddTutorialComponent);
    httpMock = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => httpMock.verify());

  it('renders an empty form with no success alert on first load', () => {
    expect((el('#title') as HTMLInputElement).value).toBe('');
    expect((el('#description') as HTMLInputElement).value).toBe('');
    expect(el('.alert-success')).toBeNull();
  });

  it('posts the typed title and description to the configured api url', () => {
    type('#title', 'Angular');
    type('#description', 'Components');

    submit();

    const req = httpMock.expectOne(API);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'Angular',
      description: 'Components'
    });
    req.flush({ id: 1, title: 'Angular', description: 'Components' });
  });

  it('replaces the form with a success alert once the tutorial is created', () => {
    type('#title', 'Angular');
    type('#description', 'Components');
    submit();
    httpMock.expectOne(API).flush({ id: 1 });
    fixture.detectChanges();

    expect(el('.alert-success')!.textContent).toContain(
      'Tutorial was submitted successfully'
    );
    expect(el('#title')).toBeNull();
  });

  it('clears the form when "Add another" is pressed after a success', () => {
    type('#title', 'Angular');
    type('#description', 'Components');
    submit();
    httpMock.expectOne(API).flush({ id: 1 });
    fixture.detectChanges();

    (el('.form-actions .tm-btn') as HTMLElement).click();
    fixture.detectChanges();

    expect(el('.alert-success')).toBeNull();
    expect((el('#title') as HTMLInputElement).value).toBe('');
    expect((el('#description') as HTMLInputElement).value).toBe('');
  });

  it('keeps the form on screen when the server rejects the tutorial', () => {
    spyOn(console, 'error');
    type('#title', 'Angular');
    type('#description', 'Components');
    submit();

    httpMock
      .expectOne(API)
      .flush(
        { message: 'Content can not be empty!' },
        { status: 400, statusText: 'Bad Request' }
      );
    fixture.detectChanges();

    expect(el('.alert-success')).toBeNull();
    expect((el('#title') as HTMLInputElement).value).toBe('Angular');
  });

  it('keeps the form on screen when the create request fails with a server error', () => {
    spyOn(console, 'error');
    type('#title', 'Angular');
    type('#description', 'Components');
    submit();

    httpMock
      .expectOne(API)
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(el('.alert-success')).toBeNull();
    expect(el('#description')).not.toBeNull();
  });

  // The form marks both fields `required` but nothing stops an empty submit:
  // this documents that the request is sent with empty strings.
  it('still posts empty strings when submitted with a blank form', () => {
    submit();

    const req = httpMock.expectOne(API);
    expect(req.request.body).toEqual({ title: '', description: '' });
    req.flush({ id: 1 });
  });
});
