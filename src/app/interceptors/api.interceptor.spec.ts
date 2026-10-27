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

  it('prefixes relative urls with the configured api url', () => {
    service.getAll().subscribe();

    httpMock.expectOne(`${environment.apiUrl}/tutorials`).flush([]);
  });

  it('keeps the query string when searching by title', () => {
    service.findByTitle('ng').subscribe();

    httpMock.expectOne(`${environment.apiUrl}/tutorials?title=ng`).flush([]);
  });

  it('leaves absolute urls untouched', () => {
    TestBed.inject(HttpClient).get('https://example.com/ping').subscribe();

    httpMock.expectOne('https://example.com/ping').flush({});
  });
});
