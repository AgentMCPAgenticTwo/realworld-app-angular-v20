import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { FormsModule } from '@angular/forms';

import { AddTutorialComponent } from '../components/add-tutorial/add-tutorial.component';
import { apiUrl, realInterceptorProviders } from './integration-test-setup';

/**
 * Integration: the add screen with the real TutorialService and the real
 * ApiInterceptor; only the HTTP boundary is mocked.
 */
describe('Add tutorial screen (integration)', () => {
  let fixture: ComponentFixture<AddTutorialComponent>;
  let component: AddTutorialComponent;
  let http: HttpTestingController;

  const el = (selector: string): HTMLElement | null =>
    fixture.nativeElement.querySelector(selector);

  const setInput = (selector: string, value: string) => {
    const input = fixture.nativeElement.querySelector(selector) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const submit = () => {
    el('.tm-btn-primary')!.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddTutorialComponent],
      imports: [HttpClientTestingModule, FormsModule],
      providers: [...realInterceptorProviders]
    }).compileComponents();

    fixture = TestBed.createComponent(AddTutorialComponent);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  it('shows the empty form and makes no request on first render', () => {
    expect(el('.submit-form')!.textContent).toContain('Add Tutorial');
    expect((fixture.nativeElement.querySelector('#title') as HTMLInputElement).value).toBe('');
    http.verify();
  });

  it('posts the typed title and description to the api base url', () => {
    setInput('#title', 'Angular testing');
    setInput('#description', 'How to test components');

    submit();

    const req = http.expectOne(apiUrl('/tutorials'));
    expect(req.request.method).toBe('POST');
    expect(req.request.url).toBe('http://localhost:5001/api/tutorials');
    expect(req.request.body).toEqual({
      title: 'Angular testing',
      description: 'How to test components'
    });
    req.flush({ id: 10, title: 'Angular testing' });
  });

  it('confirms the submission once the server accepted it', () => {
    setInput('#title', 'Angular testing');
    setInput('#description', 'How to test components');
    submit();
    http.expectOne(apiUrl('/tutorials')).flush({ id: 10 });
    fixture.detectChanges();

    expect(el('.alert-success')!.textContent).toContain(
      'Tutorial was submitted successfully!'
    );
    expect(fixture.nativeElement.querySelector('#title')).toBeNull();
  });

  it('submits empty fields when nothing was typed', () => {
    submit();

    const req = http.expectOne(apiUrl('/tutorials'));
    expect(req.request.body).toEqual({ title: '', description: '' });
    req.flush({ id: 11 });
  });

  it('does not send the published flag on create', () => {
    setInput('#title', 'Angular');
    component.tutorial.published = true;
    submit();

    const req = http.expectOne(apiUrl('/tutorials'));
    expect(req.request.body.published).toBeUndefined();
    req.flush({ id: 12 });
  });

  it('keeps the form on screen when the server rejects the tutorial', () => {
    setInput('#title', 'Angular');
    setInput('#description', 'desc');
    submit();

    http
      .expectOne(apiUrl('/tutorials'))
      .flush({ message: 'title is required' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(el('.alert-success')).toBeNull();
    expect(fixture.nativeElement.querySelector('#title')).not.toBeNull();
    expect((fixture.nativeElement.querySelector('#title') as HTMLInputElement).value).toBe(
      'Angular'
    );
  });

  it('clears the form when the user starts another tutorial', () => {
    setInput('#title', 'Angular');
    setInput('#description', 'desc');
    submit();
    http.expectOne(apiUrl('/tutorials')).flush({ id: 10 });
    fixture.detectChanges();

    el('.tm-btn-primary')!.click();
    fixture.detectChanges();

    expect(el('.alert-success')).toBeNull();
    expect((fixture.nativeElement.querySelector('#title') as HTMLInputElement).value).toBe('');
    expect(
      (fixture.nativeElement.querySelector('#description') as HTMLInputElement).value
    ).toBe('');
  });
});
