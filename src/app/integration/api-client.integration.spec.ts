import { TestBed } from '@angular/core/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { ApiInterceptor } from '../interceptors/api.interceptor';
import { TutorialService } from '../services/tutorial.service';
import { environment } from '../../environments/environment';

/**
 * Integration: the real TutorialService talking through the real ApiInterceptor.
 * Only the network transport is faked.
 */
describe('TutorialService through the ApiInterceptor', () => {
  let service: TutorialService;
  let httpMock: HttpTestingController;
  const api = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useClass: ApiInterceptor, multi: true }
      ]
    });

    service = TestBed.inject(TutorialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('sends the list request to the configured api base url', () => {
    let received: unknown;
    service.getAll().subscribe((data) => (received = data));

    const req = httpMock.expectOne(`${api}/tutorials`);
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 1, title: 'Angular' }]);

    expect(received).toEqual([{ id: 1, title: 'Angular' } as any]);
  });

  it('sends a single-tutorial request to the id-scoped api url', () => {
    service.get(7).subscribe();

    const req = httpMock.expectOne(`${api}/tutorials/7`);
    expect(req.request.method).toBe('GET');
    req.flush({ id: 7 });
  });

  it('posts the new tutorial body to the api base url', () => {
    service.create({ title: 'T', description: 'D' }).subscribe();

    const req = httpMock.expectOne(`${api}/tutorials`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ title: 'T', description: 'D' });
    req.flush({ id: 1 });
  });

  it('puts the updated tutorial to the id-scoped api url', () => {
    service.update(3, { title: 'T' }).subscribe();

    const req = httpMock.expectOne(`${api}/tutorials/3`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ title: 'T' });
    req.flush({ message: 'ok' });
  });

  it('deletes a single tutorial by id and all tutorials at the collection url', () => {
    service.delete(3).subscribe();
    const one = httpMock.expectOne(`${api}/tutorials/3`);
    expect(one.request.method).toBe('DELETE');
    one.flush({});

    service.deleteAll().subscribe();
    const all = httpMock.expectOne(`${api}/tutorials`);
    expect(all.request.method).toBe('DELETE');
    all.flush({});
  });

  it('passes the search term through as a title query parameter', () => {
    service.findByTitle('ang').subscribe();

    const req = httpMock.expectOne(`${api}/tutorials?title=ang`);
    expect(req.request.urlWithParams).toBe(`${api}/tutorials?title=ang`);
    req.flush([]);
  });

  // KNOWN-DEFECT: see finding "Search term is interpolated into the query string
  // without encoding" — a title containing & or # is split into extra parameters.
  xit('escapes a search term that contains query-string characters', () => {
    service.findByTitle('a&b').subscribe();

    const req = httpMock.expectOne(
      (r) => r.url.startsWith(`${api}/tutorials`) && r.method === 'GET'
    );
    expect(req.request.urlWithParams).toBe(`${api}/tutorials?title=a%26b`);
    req.flush([]);
  });

  it('surfaces a server error to the caller instead of swallowing it', () => {
    let status = 0;
    service.getAll().subscribe({ error: (e) => (status = e.status) });

    httpMock
      .expectOne(`${api}/tutorials`)
      .flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
  });

  it('leaves an absolute url untouched', () => {
    TestBed.inject(HttpClient).get('https://example.test/thing').subscribe();

    const req = httpMock.expectOne('https://example.test/thing');
    expect(req.request.url).toBe('https://example.test/thing');
    req.flush({});
  });
});
