import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController
} from '@angular/common/http/testing';

import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });
    service = TestBed.inject(CategoryService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('gets all categories', () => {
    let result: any;
    service.getAll().subscribe((data) => (result = data));

    const req = httpMock.expectOne('/categories');
    expect(req.request.method).toBe('GET');
    req.flush([{ id: 7, name: 'Frontend' }]);

    expect(result.length).toBe(1);
  });

  it('creates a category', () => {
    service.create({ name: 'Backend' }).subscribe();

    const req = httpMock.expectOne('/categories');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'Backend' });
    req.flush({ id: 8, name: 'Backend' });
  });
});
