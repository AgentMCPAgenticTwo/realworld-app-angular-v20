import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Prefixes every relative request url with the configured API base url,
 * so the services only have to know about their own resource path.
 */
@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    if (/^https?:\/\//i.test(req.url)) {
      return next.handle(req);
    }

    const path = req.url.startsWith('/') ? req.url : `/${req.url}`;

    return next.handle(req.clone({ url: `${environment.apiUrl}${path}` }));
  }
}
