import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { TutorialService } from './tutorial.service';
import { Tutorial } from '../models/tutorial.model';

describe('TutorialService', () => {
  let service: TutorialService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(TutorialService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('GETs the tutorials collection and emits the returned list', () => {
      const payload: Tutorial[] = [
        { id: 1, title: 'Angular', description: 'desc', published: false }
      ];
      let received: Tutorial[] | undefined;

      service.getAll().subscribe((data) => (received = data));

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.method).toBe('GET');
      req.flush(payload);

      expect(received).toEqual(payload);
    });

    it('emits an empty list when the collection is empty', () => {
      let received: Tutorial[] | undefined;

      service.getAll().subscribe((data) => (received = data));
      httpMock.expectOne('/tutorials').flush([]);

      expect(received).toEqual([]);
    });

    it('emits an error when the api fails', () => {
      let status: number | undefined;

      service.getAll().subscribe({ error: (e) => (status = e.status) });
      httpMock
        .expectOne('/tutorials')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(status).toBe(500);
    });

    it('does not send the request until it is subscribed to', () => {
      service.getAll();

      expect(httpMock.match('/tutorials').length).toBe(0);
    });
  });

  describe('get', () => {
    it('GETs a single tutorial by id', () => {
      const payload: Tutorial = { id: 7, title: 'RxJS' };
      let received: Tutorial | undefined;

      service.get(7).subscribe((data) => (received = data));

      const req = httpMock.expectOne('/tutorials/7');
      expect(req.request.method).toBe('GET');
      req.flush(payload);

      expect(received).toEqual(payload);
    });

    it('builds the url from the id 0 rather than dropping it', () => {
      service.get(0).subscribe();

      const req = httpMock.expectOne('/tutorials/0');
      expect(req.request.url).toBe('/tutorials/0');
      req.flush({ id: 0 });
    });

    it('emits a 404 error when the tutorial does not exist', () => {
      let status: number | undefined;

      service.get(42).subscribe({ error: (e) => (status = e.status) });
      httpMock
        .expectOne('/tutorials/42')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(status).toBe(404);
    });
  });

  describe('create', () => {
    it('POSTs the tutorial payload to the collection', () => {
      const body = { title: 'Angular', description: 'desc' };
      let received: any;

      service.create(body).subscribe((res) => (received = res));

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 9, ...body });

      expect(received.id).toBe(9);
    });

    it('emits an error when the api rejects the payload', () => {
      let status: number | undefined;

      service
        .create({ title: '' })
        .subscribe({ error: (e) => (status = e.status) });
      httpMock.expectOne('/tutorials').flush(
        { message: 'title required' },
        { status: 400, statusText: 'Bad Request' }
      );

      expect(status).toBe(400);
    });
  });

  describe('update', () => {
    it('PUTs the payload to the tutorial url', () => {
      const body = { title: 'A', description: 'B', published: true };

      service.update(3, body).subscribe();

      const req = httpMock.expectOne('/tutorials/3');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ message: 'ok' });
    });

    it('emits an error when the tutorial to update is gone', () => {
      let status: number | undefined;

      service
        .update(3, {})
        .subscribe({ error: (e) => (status = e.status) });
      httpMock
        .expectOne('/tutorials/3')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(status).toBe(404);
    });
  });

  describe('delete', () => {
    it('DELETEs a single tutorial url', () => {
      service.delete(3).subscribe();

      const req = httpMock.expectOne('/tutorials/3');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('DELETEs the whole collection for deleteAll', () => {
      service.deleteAll().subscribe();

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'all removed' });
    });
  });

  describe('findByTitle', () => {
    it('GETs the collection with the title query parameter', () => {
      service.findByTitle('ng').subscribe();

      const req = httpMock.expectOne('/tutorials?title=ng');
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toBe('/tutorials?title=ng');
      req.flush([]);
    });

    it('sends an empty title parameter when the search box is empty', () => {
      service.findByTitle('').subscribe();

      const req = httpMock.expectOne('/tutorials?title=');
      expect(req.request.urlWithParams).toBe('/tutorials?title=');
      req.flush([]);
    });

    // KNOWN-DEFECT: findByTitle interpolates the raw search term into the url
    // instead of using HttpParams, so a term containing a space or "&" produces
    // an invalid / mis-parsed query string. See finding
    // "findByTitle does not url-encode the search term".
    xit('url-encodes a search term containing a space and an ampersand', () => {
      service.findByTitle('ng & forms').subscribe();

      const req = httpMock.expectOne(
        (r) => r.url.indexOf('/tutorials') === 0
      );
      expect(req.request.url).toBe('/tutorials?title=ng%20%26%20forms');
      req.flush([]);
    });
  });
});
