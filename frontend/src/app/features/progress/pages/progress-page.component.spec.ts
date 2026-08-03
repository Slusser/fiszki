import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CatalogApiService } from '../../../core/catalog/catalog-api.service';
import { ProgressService } from '../../../core/progress/progress.service';
import { ProgressPageComponent } from './progress-page.component';

describe('ProgressPageComponent', () => {
  let overviewValue: {
    categories: {
      categoryId: string;
      categorySlug: string;
      categoryName: string;
      tiers: {
        tier: 'easy' | 'hard' | 'expert';
        totalWords: number;
        masteredWords: number;
        completed: boolean;
      }[];
    }[];
  } | null;

  const progressServiceMock = {
    refresh: jasmine.createSpy('refresh').and.callFake(async () => {
      overviewValue = {
        categories: [
          {
            categoryId: 'cat-1',
            categorySlug: 'animals',
            categoryName: 'Animals',
            tiers: [{ tier: 'easy', totalWords: 10, masteredWords: 5, completed: false }],
          },
          {
            categoryId: 'cat-2',
            categorySlug: 'banking',
            categoryName: 'Banking',
            tiers: [{ tier: 'easy', totalWords: 10, masteredWords: 3, completed: false }],
          },
        ],
      };
    }),
    overview: () => overviewValue,
  };
  const catalogApiMock = {
    getCategories: jasmine.createSpy('getCategories').and.returnValue(
      of({
        categories: [
          {
            id: 'cat-1',
            slug: 'animals',
            name: 'Animals',
            unlockCost: 0,
            difficultyWeight: 1,
            isUnlocked: true,
            unlockedAt: null,
          },
          {
            id: 'cat-2',
            slug: 'banking',
            name: 'Banking',
            unlockCost: 10,
            difficultyWeight: 1,
            isUnlocked: false,
            unlockedAt: null,
          },
        ],
      }),
    ),
  };

  beforeEach(async () => {
    overviewValue = null;
    progressServiceMock.refresh.calls.reset();
    catalogApiMock.getCategories.calls.reset();

    await TestBed.configureTestingModule({
      imports: [ProgressPageComponent],
      providers: [
        { provide: ProgressService, useValue: progressServiceMock },
        { provide: CatalogApiService, useValue: catalogApiMock },
      ],
    }).compileComponents();
  });

  it('laduje i wyswietla dane progresu', async () => {
    const fixture = TestBed.createComponent(ProgressPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(progressServiceMock.refresh).toHaveBeenCalled();
    expect(catalogApiMock.getCategories).toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Animals');
    expect(compiled.textContent).not.toContain('Banking');
    expect(compiled.textContent).toContain('Easy: 5/10');
  });
});
