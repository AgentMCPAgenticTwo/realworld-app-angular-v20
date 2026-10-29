import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
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
    it('requests the tutorials collection and emits the returned list', () => {
      const tutorials: Tutorial[] = [
        { id: 1, title: 'Angular', description: 'a', published: true },
        { id: 2, title: 'Rx', description: 'b', published: false }
      ];
      let emitted: Tutorial[] | undefined;

      service.getAll().subscribe((data) => (emitted = data));

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.method).toBe('GET');
      req.flush(tutorials);

      expect(emitted).toEqual(tutorials);
    });

    it('emits an empty list when the collection is empty', () => {
      let emitted: Tutorial[] | undefined;

      service.getAll().subscribe((data) => (emitted = data));
      httpMock.expectOne('/tutorials').flush([]);

      expect(emitted).toEqual([]);
    });

    it('propagates a server error instead of swallowing it', () => {
      let error: HttpErrorResponse | undefined;

      service.getAll().subscribe({ error: (e) => (error = e) });
      httpMock
        .expectOne('/tutorials')
        .flush('boom', { status: 500, statusText: 'Server Error' });

      expect(error?.status).toBe(500);
    });

    it('does not send the request until it is subscribed to', () => {
      service.getAll();

      expect(httpMock.match('/tutorials').length).toBe(0);
    });
  });

  describe('get', () => {
    it('requests a single tutorial by id', () => {
      let emitted: Tutorial | undefined;

      service.get(7).subscribe((data) => (emitted = data));

      const req = httpMock.expectOne('/tutorials/7');
      expect(req.request.method).toBe('GET');
      req.flush({ id: 7, title: 'Seven' });

      expect(emitted).toEqual({ id: 7, title: 'Seven' });
    });

    it('propagates a 404 when the tutorial does not exist', () => {
      let error: HttpErrorResponse | undefined;

      service.get(999).subscribe({ error: (e) => (error = e) });
      httpMock
        .expectOne('/tutorials/999')
        .flush('Not Found', { status: 404, statusText: 'Not Found' });

      expect(error?.status).toBe(404);
    });
  });

  describe('create', () => {
    it('posts the tutorial payload to the collection url', () => {
      const payload = { title: 'New', description: 'desc' };

      service.create(payload).subscribe();

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(payload);
      req.flush({ id: 3, ...payload });
    });

    it('propagates a 400 when the payload is rejected', () => {
      let error: HttpErrorResponse | undefined;

      service.create({ title: '' }).subscribe({ error: (e) => (error = e) });
      httpMock
        .expectOne('/tutorials')
        .flush(
          { message: 'Title can not be empty!' },
          { status: 400, statusText: 'Bad Request' }
        );

      expect(error?.status).toBe(400);
      expect(error?.error.message).toBe('Title can not be empty!');
    });
  });

  describe('update', () => {
    it('puts the payload to the url of that single tutorial', () => {
      const payload = { title: 'Edited', description: 'd', published: true };

      service.update(5, payload).subscribe();

      const req = httpMock.expectOne('/tutorials/5');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(payload);
      req.flush({ message: 'Tutorial was updated successfully.' });
    });
  });

  describe('delete', () => {
    it('deletes a single tutorial by id', () => {
      service.delete(5).subscribe();

      const req = httpMock.expectOne('/tutorials/5');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('targets the collection url, not a single tutorial, when deleting all', () => {
      service.deleteAll().subscribe();

      const req = httpMock.expectOne('/tutorials');
      expect(req.request.method).toBe('DELETE');
      req.flush({ message: '8 Tutorials were deleted successfully!' });
    });
  });

  describe('findByTitle', () => {
    it('sends the search term as the title query parameter', () => {
      service.findByTitle('ng').subscribe();

      const req = httpMock.expectOne((r) => r.url.startsWith('/tutorials'));
      expect(req.request.method).toBe('GET');
      expect(req.request.urlWithParams).toContain('title=ng');
      req.flush([]);
    });

    it('sends an empty title when the search box is empty', () => {
      service.findByTitle('').subscribe();

      const req = httpMock.expectOne((r) => r.url.startsWith('/tutorials'));
      expect(req.request.urlWithParams).toBe('/tutorials?title=');
      req.flush([]);
    });

    // KNOWN-DEFECT: finding "TutorialService.findByTitle does not encode the
    // search term". The title is interpolated straight into the query string,
    // so a term containing '&' is split into two parameters and the backend
    // searches for the wrong thing.
    xit('keeps a search term containing an ampersand intact', () => {
      service.findByTitle('cats & dogs').subscribe();

      const req = httpMock.expectOne((r) => r.url.startsWith('/tutorials'));
      expect(req.request.urlWithParams).toBe(
        '/tutorials?title=cats%20%26%20dogs'
      );
      req.flush([]);
    });

    // KNOWN-DEFECT: same finding — a '#' turns the rest of the term into a url
    // fragment, so the server never receives it.
    xit('keeps a search term containing a hash intact', () => {
      service.findByTitle('c#').subscribe();

      const req = httpMock.expectOne((r) => r.url.startsWith('/tutorials'));
      expect(req.request.urlWithParams).toBe('/tutorials?title=c%23');
      req.flush([]);
    });
  });
});
