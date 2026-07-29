import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { GlobalErrorService } from '../errors/global-error.service';
import { SessionService } from '../auth/session.service';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const errorService = inject(GlobalErrorService);
  const sessionService = inject(SessionService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      if (error.status === 401 || error.status === 403 || error.status >= 500) {
        errorService.setFromHttpError(error);
      }

      if (error.status === 401) {
        void sessionService.handleUnauthorized();
      }

      return throwError(() => error);
    }),
  );
};
