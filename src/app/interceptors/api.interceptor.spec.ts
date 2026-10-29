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
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
      ]
    });

    service = TestBed.inject(TutorialService);
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
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
    expect(req.request.url).toBe(`${environment.apiUrl}/tutorials?title=ng`);
    req.flush([]);
  });

  it('leaves absolute http urls untouched', () => {
    http.get('https://example.com/ping').subscribe();

    const req = httpMock.expectOne('https://example.com/ping');
    expect(req.request.url).toBe('https://example.com/ping');
    req.flush({});
  });

  it('leaves plain http (non-tls) absolute urls untouched', () => {
    http.get('http://example.com/ping').subscribe();

    const req = httpMock.expectOne('http://example.com/ping');
    expect(req.request.url).toBe('http://example.com/ping');
    req.flush({});
  });

  it('adds the missing leading slash to a url that has none', () => {
    http.get('tutorials').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials`);
    expect(req.request.url).toBe(`${environment.apiUrl}/tutorials`);
    req.flush([]);
  });

  it('does not double the slash for a url that already has one', () => {
    http.get('/tutorials').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials`);
    expect(req.request.url).not.toContain('//tutorials');
    req.flush([]);
  });

  it('rewrites the url of the empty path to the api root', () => {
    http.get('').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/`);
    expect(req.request.url).toBe(`${environment.apiUrl}/`);
    req.flush({});
  });

  it('preserves the method, body and headers of the rewritten request', () => {
    http
      .post('/tutorials', { title: 'Angular' }, { headers: { 'X-Test': '1' } })
      .subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'Angular' });
    expect(req.request.headers.get('X-Test')).toBe('1');
    req.flush({});
  });

  it('propagates an api error response unchanged to the caller', () => {
    let status: number | undefined;

    service.getAll().subscribe({ error: (e) => (status = e.status) });
    httpMock
      .expectOne(`${environment.apiUrl}/tutorials`)
      .flush('boom', { status: 503, statusText: 'Unavailable' });

    expect(status).toBe(503);
  });
});
