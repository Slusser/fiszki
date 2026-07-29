import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SessionService } from '../auth/session.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const sessionService = inject(SessionService);
  const router = inject(Router);

  await sessionService.init();

  if (sessionService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/auth/login'], {
    queryParams: { redirect: state.url },
  });
};
