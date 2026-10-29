import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { ApiInterceptor } from './api.interceptor';
import { environment } from '../../environments/environment';

describe('ApiInterceptor url rewriting', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
      ]
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('adds a missing leading slash before prefixing the api url', () => {
    http.get('tutorials').subscribe();

    httpMock.expectOne(`${environment.apiUrl}/tutorials`).flush([]);
  });

  it('does not double the slash for a url that already starts with one', () => {
    http.get('/tutorials').subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials`);
    expect(req.request.url).not.toContain('//tutorials');
    req.flush([]);
  });

  it('leaves an http url untouched', () => {
    http.get('http://other.test/ping').subscribe();

    httpMock.expectOne('http://other.test/ping').flush({});
  });

  it('leaves an uppercase HTTPS url untouched', () => {
    http.get('HTTPS://Other.test/ping').subscribe();

    httpMock.expectOne('HTTPS://Other.test/ping').flush({});
  });

  it('rewrites an empty url to the bare api root', () => {
    http.get('').subscribe();

    httpMock.expectOne(`${environment.apiUrl}/`).flush({});
  });

  it('preserves the method and body of a rewritten request', () => {
    const body = { title: 'T', description: 'D' };

    http.post('/tutorials', body).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    req.flush({});
  });

  it('preserves custom headers of a rewritten request', () => {
    http.get('/tutorials', { headers: { 'X-Test': 'yes' } }).subscribe();

    const req = httpMock.expectOne(`${environment.apiUrl}/tutorials`);
    expect(req.request.headers.get('X-Test')).toBe('yes');
    req.flush([]);
  });

  it('prefixes a protocol-relative url, because it has no scheme', () => {
    // Documents the current behaviour: only urls with an explicit http(s)
    // scheme are treated as absolute.
    http.get('//cdn.test/thing').subscribe();

    httpMock.expectOne(`${environment.apiUrl}//cdn.test/thing`).flush({});
  });
});
