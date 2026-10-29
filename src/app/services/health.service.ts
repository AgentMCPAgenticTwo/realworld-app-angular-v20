import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Health } from '../models/health.model';

// The ApiInterceptor prefixes this relative path with environment.apiUrl.
const baseUrl = '/health';

@Injectable({
  providedIn: 'root',
})
export class HealthService {
  constructor(private http: HttpClient) {}

  get(): Observable<Health> {
    return this.http.get<Health>(baseUrl);
  }
}
