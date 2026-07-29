import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from '../auth/session.service';

const API_PREFIX = `${environment.apiBaseUrl.replace(/\/$/, '')}/v1`;

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  if (!request.url.startsWith(API_PREFIX)) {
    return next(request);
  }

  const sessionService = inject(SessionService);

  return from(sessionService.getAccessToken()).pipe(
    switchMap((token) => {
      if (!token) {
        return next(request);
      }

      return next(
        request.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`,
          },
        }),
      );
    }),
  );
};
