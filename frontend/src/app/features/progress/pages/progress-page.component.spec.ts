import { TestBed } from '@angular/core/testing';
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
        ],
      };
    }),
    overview: () => overviewValue,
  };

  beforeEach(async () => {
    overviewValue = null;
    progressServiceMock.refresh.calls.reset();

    await TestBed.configureTestingModule({
      imports: [ProgressPageComponent],
      providers: [{ provide: ProgressService, useValue: progressServiceMock }],
    }).compileComponents();
  });

  it('laduje i wyswietla dane progresu', async () => {
    const fixture = TestBed.createComponent(ProgressPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(progressServiceMock.refresh).toHaveBeenCalled();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Animals');
    expect(compiled.textContent).toContain('Easy: 5/10');
  });
});
