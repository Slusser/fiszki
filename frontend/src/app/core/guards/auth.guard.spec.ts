import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { authGuard } from './auth.guard';
import { SessionService } from '../auth/session.service';

describe('authGuard', () => {
  let router: Router;
  let sessionServiceMock: jasmine.SpyObj<SessionService>;

  beforeEach(() => {
    sessionServiceMock = jasmine.createSpyObj<SessionService>('SessionService', [
      'init',
      'isAuthenticated',
    ]);
    sessionServiceMock.init.and.resolveTo();
    sessionServiceMock.isAuthenticated.and.returnValue(false);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: SessionService, useValue: sessionServiceMock }],
    });

    router = TestBed.inject(Router);
  });

  it('przepuszcza zalogowanego uzytkownika', async () => {
    sessionServiceMock.isAuthenticated.and.returnValue(true);

    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/katalog' } as never),
    );

    expect(result).toBeTrue();
    expect(sessionServiceMock.init).toHaveBeenCalled();
  });

  it('przekierowuje niezalogowanego na login z redirect', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/quiz/abc/easy' } as never),
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe(
      '/auth/login?redirect=%2Fquiz%2Fabc%2Feasy',
    );
  });
});
