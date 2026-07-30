import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { CatalogApiService } from '../catalog/catalog-api.service';
import { unlockGuard } from './unlock.guard';

describe('unlockGuard', () => {
  let router: Router;
  let catalogApiMock: jasmine.SpyObj<CatalogApiService>;

  beforeEach(() => {
    catalogApiMock = jasmine.createSpyObj<CatalogApiService>('CatalogApiService', [
      'getCategories',
      'getCategoryTiers',
    ]);

    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: CatalogApiService, useValue: catalogApiMock }],
    });

    router = TestBed.inject(Router);
  });

  it('przekierowuje przy niepoprawnym URL quizu', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      unlockGuard(
        {
          paramMap: { get: () => null },
        } as never,
        {} as never,
      ),
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/katalog?reason=invalid_quiz_route');
  });

  it('przepuszcza odblokowana kategorie i dostepny tier', async () => {
    catalogApiMock.getCategories.and.returnValue(
      of({
        categories: [
          {
            id: 'cat-1',
            slug: 'cat-1',
            name: 'Category 1',
            unlockCost: 100,
            difficultyWeight: 1,
            isUnlocked: true,
            unlockedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    );
    catalogApiMock.getCategoryTiers.and.returnValue(
      of({
        categoryId: 'cat-1',
        tiers: [
          { tier: 'easy', totalWords: 10, masteredWords: 10 },
          { tier: 'hard', totalWords: 25, masteredWords: 3 },
        ],
      }),
    );

    const result = await TestBed.runInInjectionContext(() =>
      unlockGuard(
        {
          paramMap: {
            get: (key: string) => (key === 'categoryId' ? 'cat-1' : 'hard'),
          },
        } as never,
        {} as never,
      ),
    );

    expect(result).toBeTrue();
  });

  it('blokuje wejscie na zablokowany tier', async () => {
    catalogApiMock.getCategories.and.returnValue(
      of({
        categories: [
          {
            id: 'cat-1',
            slug: 'cat-1',
            name: 'Category 1',
            unlockCost: 100,
            difficultyWeight: 1,
            isUnlocked: true,
            unlockedAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      }),
    );
    catalogApiMock.getCategoryTiers.and.returnValue(
      of({
        categoryId: 'cat-1',
        tiers: [
          { tier: 'easy', totalWords: 10, masteredWords: 3 },
          { tier: 'hard', totalWords: 25, masteredWords: 0 },
        ],
      }),
    );

    const result = await TestBed.runInInjectionContext(() =>
      unlockGuard(
        {
          paramMap: {
            get: (key: string) => (key === 'categoryId' ? 'cat-1' : 'hard'),
          },
        } as never,
        {} as never,
      ),
    );

    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toContain('reason=tier_locked');
  });
});
