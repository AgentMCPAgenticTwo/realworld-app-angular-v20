import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { AddTutorialComponent } from '../components/add-tutorial/add-tutorial.component';
import { ApiInterceptor } from '../interceptors/api.interceptor';
import { environment } from '../../environments/environment';

const LIST_URL = `${environment.apiUrl}/tutorials`;

/**
 * Integration: the add-tutorial screen with the real TutorialService,
 * the real ApiInterceptor and real two-way form binding.
 */
describe('Add tutorial screen', () => {
  let fixture: ComponentFixture<AddTutorialComponent>;
  let httpMock: HttpTestingController;

  const el = (s: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(s);
  const text = (): string => fixture.nativeElement.textContent ?? '';

  const type = (selector: string, value: string) => {
    const input = el(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submit = () => (el('.tm-btn-primary') as HTMLElement).click();

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

  it('shows an empty form and makes no request before the user submits', () => {
    expect((el('#title') as HTMLInputElement).value).toBe('');
    expect((el('#description') as HTMLInputElement).value).toBe('');
    expect(text()).not.toContain('submitted successfully');
    httpMock.verify();
  });

  it('posts what the user typed and confirms the tutorial was submitted', () => {
    spyOn(console, 'log');
    type('#title', 'Angular forms');
    type('#description', 'ngModel end to end');

    submit();

    const req = httpMock.expectOne(LIST_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      title: 'Angular forms',
      description: 'ngModel end to end'
    });
    req.flush({ id: 9, title: 'Angular forms' });
    fixture.detectChanges();

    expect(text()).toContain('Tutorial was submitted successfully!');
    expect(el('#title')).toBeNull();
  });

  it('posts empty strings when the user submits an untouched form', () => {
    submit();

    const req = httpMock.expectOne(LIST_URL);
    expect(req.request.body).toEqual({ title: '', description: '' });
    req.flush({}, { status: 400, statusText: 'Bad Request' });
  });

  it('keeps the form on screen and shows no confirmation when the api rejects the tutorial', () => {
    spyOn(console, 'error');
    type('#title', 'Bad');
    submit();

    httpMock
      .expectOne(LIST_URL)
      .flush(
        { message: 'Content can not be empty!' },
        { status: 400, statusText: 'Bad Request' }
      );
    fixture.detectChanges();

    expect(text()).not.toContain('submitted successfully');
    expect((el('#title') as HTMLInputElement).value).toBe('Bad');
    expect(console.error).toHaveBeenCalled();
  });

  it('keeps the form on screen when the api fails with a server error', () => {
    spyOn(console, 'error');
    type('#title', 'Angular');
    submit();

    httpMock
      .expectOne(LIST_URL)
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(text()).not.toContain('submitted successfully');
    expect(el('#title')).not.toBeNull();
  });

  it('clears the form for a new tutorial after a successful submission', () => {
    spyOn(console, 'log');
    type('#title', 'First');
    type('#description', 'desc');
    submit();
    httpMock.expectOne(LIST_URL).flush({ id: 1 });
    fixture.detectChanges();

    (el('.tm-btn-primary') as HTMLElement).click();
    fixture.detectChanges();

    expect((el('#title') as HTMLInputElement).value).toBe('');
    expect((el('#description') as HTMLInputElement).value).toBe('');
    expect(text()).not.toContain('submitted successfully');
  });
});
