import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { ApiInterceptor } from './api.interceptor';
import { TutorialService } from '../services/tutorial.service';
import { environment } from '../../environments/environment';

describe('ApiInterceptor', () => {
  let service: TutorialService;
  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
      ]
    });

    service = TestBed.inject(TutorialService);
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
  });

  afterEach(() => httpMock.verify());

  it('prefixes relative urls with the configured api url', () => {
    service.getAll().subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials`);
    expect(req.request.url).toBe(`${environment.apiUrl}/tutorials`);
    req.flush([]);
  });

  it('keeps the query string when searching by title', () => {
    service.findByTitle('ng').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials?title=ng`);
    expect(req.request.urlWithParams).toBe(
      `${environment.apiUrl}/tutorials?title=ng`
    );
    req.flush([]);
  });

  it('leaves absolute urls untouched', () => {
    TestBed.inject(HttpClient).get('https://example.com/ping').subscribe();

    const req = httpMock.expectOne('https://example.com/ping');
    expect(req.request.url).toBe('https://example.com/ping');
    req.flush({});
  });

  it('leaves plain http absolute urls untouched', () => {
    http.get('http://example.com/ping').subscribe();

    const req = httpMock.expectOne('http://example.com/ping');
    expect(req.request.url).toBe('http://example.com/ping');
    req.flush({});
  });

  it('leaves absolute urls with an upper-case scheme untouched', () => {
    http.get('HTTPS://example.com/ping').subscribe();

    const req = httpMock.expectOne('HTTPS://example.com/ping');
    expect(req.request.url).toBe('HTTPS://example.com/ping');
    req.flush({});
  });

  it('adds the missing leading slash to a relative url', () => {
    http.get('tutorials/1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials/1`);
    expect(req.request.url).toBe(`${environment.apiUrl}/tutorials/1`);
    req.flush({});
  });

  it('does not double the slash when the url already starts with one', () => {
    http.get('/tutorials/1').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials/1`);
    expect(req.request.url).not.toContain('api//');
    req.flush({});
  });

  it('maps the empty url to the api root', () => {
    http.get('').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/`);
    expect(req.request.url).toBe(`${environment.apiUrl}/`);
    req.flush({});
  });

  it('preserves the method, body and headers of the rewritten request', () => {
    http
      .post('/tutorials', { title: 'A' }, { headers: { 'X-Trace': 'abc' } })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'A' });
    expect(req.request.headers.get('X-Trace')).toBe('abc');
    req.flush({});
  });

  it('passes a server error back to the caller unchanged', () => {
    let status: number | undefined;

    service.getAll().subscribe({ error: (e) => (status = e.status) });
    httpMock
      .expectOne(`${environment.apiUrl}/tutorials`)
      .flush('nope', { status: 503, statusText: 'Service Unavailable' });

    expect(status).toBe(503);
  });
});
