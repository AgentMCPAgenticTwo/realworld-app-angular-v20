import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';
import { HttpErrorResponse } from '@angular/common/http';

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

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAll', () => {
    it('GETs the tutorials collection and emits the returned list', () => {
      const payload: Tutorial[] = [
        { id: 1, title: 'Angular', description: 'a', published: true },
        { id: 2, title: 'RxJS', description: 'b', published: false }
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

    it('propagates a server error to the subscriber', () => {
      let error: HttpErrorResponse | undefined;

      service.getAll().subscribe({ error: (e) => (error = e) });
      httpMock
        .expectOne('/tutorials')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(error?.status).toBe(500);
    });

    it('sends no request until the observable is subscribed to', () => {
      service.getAll();

      httpMock.expectNone('/tutorials');
    });
  });

  describe('get', () => {
    it('GETs a single tutorial by id', () => {
      let received: Tutorial | undefined;

      service.get(7).subscribe((data) => (received = data));

      const req = httpMock.expectOne('/tutorials/7');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 7, title: 'Seven' });

      expect(received).toEqual({ id: 7, title: 'Seven' });
    });

    it('propagates a 404 for an unknown id', () => {
      let error: HttpErrorResponse | undefined;

      service.get(999).subscribe({ error: (e) => (error = e) });
      httpMock
        .expectOne('/tutorials/999')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(error?.status).toBe(404);
    });
  });

  describe('create', () => {
    it('POSTs the payload to the collection url', () => {
      const body = { title: 'New', description: 'desc' };
      let received: any;

      service.create(body).subscribe((res) => (received = res));

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(body);
      req.flush({ id: 10, ...body });

      expect(received.id).toBe(10);
    });

    it('propagates a 400 validation error from the api', () => {
      let error: HttpErrorResponse | undefined;

      service.create({ title: '' }).subscribe({ error: (e) => (error = e) });
      httpMock
        .expectOne('/tutorials')
        .flush(
          { message: 'Content can not be empty!' },
          { status: 400, statusText: 'Bad Request' }
        );

      expect(error?.status).toBe(400);
      expect(error?.error.message).toBe('Content can not be empty!');
    });
  });

  describe('update', () => {
    it('PUTs the payload to the tutorial url', () => {
      const body = { title: 'Edited', description: 'd', published: true };

      service.update(3, body).subscribe();

      const req = httpMock.expectOne('/tutorials/3');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(body);
      req.flush({ message: 'ok' });
    });
  });

  describe('delete', () => {
    it('DELETEs a single tutorial url', () => {
      service.delete(4).subscribe();

      const req = httpMock.expectOne('/tutorials/4');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });
  });

  describe('deleteAll', () => {
    it('DELETEs the collection url, not a single tutorial', () => {
      service.deleteAll().subscribe();

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: 'All tutorials were deleted' });
    });
  });

  describe('findByTitle', () => {
    it('GETs the collection with the title query parameter', () => {
      service.findByTitle('angular').subscribe();

      const req = httpMock.expectOne('/tutorials?title=angular');
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toBe('/tutorials?title=angular');
      req.flush([]);
    });

    it('searches with an empty title when nothing is typed', () => {
      service.findByTitle('').subscribe();

      httpMock.expectOne('/tutorials?title=').flush([]);
    });

    // KNOWN-DEFECT: finding "findByTitle does not url-encode the search term".
    // The term is interpolated raw, so a '&' in the search text reaches the api
    // as a second query parameter instead of as part of the title.
    it('does not encode a search term containing an ampersand', () => {
      service.findByTitle('a&published=true').subscribe();

      const req = httpMock.expectOne('/tutorials?title=a&published=true');
      expect(req.request.url).toBe('/tutorials?title=a&published=true');
      req.flush([]);
    });

    it('does not encode a search term containing a space', () => {
      service.findByTitle('angular forms').subscribe();

      httpMock.expectOne('/tutorials?title=angular forms').flush([]);
    });
  });
});
