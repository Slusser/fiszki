import { Component, computed, inject, signal } from '@angular/core';
import { ProgressService } from '../../../core/progress/progress.service';
import { ProgressCategoryOverview, TierName } from '../../../core/api/models';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { RetryStateComponent } from '../../../shared/ui/retry-state.component';

@Component({
  selector: 'app-progress-page',
  imports: [RetryStateComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <section class="progress-page">
      @if (errorMessage(); as error) {
        <app-retry-state [message]="error" (retry)="reload()" />
      }

      @if (loading()) {
        <app-loading-state message="Ladowanie progresu..." />
      } @else if (!visibleCategories().length) {
        <app-empty-state
          title="Brak danych progresu"
          description="Odblokuj pierwsza kategorie i rozwiaz quiz, aby zobaczyc postep."
        />
      } @else {
        <section class="progress-hero surface-card gradient-warm">
          <div>
            <p class="progress-hero__badge">Twoj postep</p>
            <h2>Statystyki nauki</h2>
            <p>
              Sprawdz, ile slowek masz opanowanych, jakie tiery sa zakonczone i gdzie warto
              przyspieszyc nauke.
            </p>
          </div>
          <dl class="progress-hero__stats">
            <div>
              <dt>Opanowane slowka</dt>
              <dd>{{ masteredWords() }}/{{ totalWords() }}</dd>
            </div>
            <div>
              <dt>Ukonczone tiery</dt>
              <dd>{{ completedTiers() }}/{{ totalTierCount() }}</dd>
            </div>
            <div>
              <dt>Sredni progres</dt>
              <dd>{{ overallProgressPercent() }}%</dd>
            </div>
          </dl>
        </section>

        <section class="progress-kpis">
          @for (item of tierProgressCards(); track item.tier) {
            <article class="progress-kpi surface-card">
              <h3>{{ item.label }}</h3>
              <p>{{ item.mastered }}/{{ item.total }}</p>
              <div
                class="progress-kpi__bar"
                role="progressbar"
                [attr.aria-valuenow]="item.percent"
                aria-valuemin="0"
                aria-valuemax="100"
                [attr.aria-label]="'Postep tieru ' + item.label"
              >
                <div class="progress-kpi__bar-fill" [style.width.%]="max2(item.percent)"></div>
              </div>
              <span>{{ item.percent }}%</span>
            </article>
          }
        </section>

        <section class="progress-list">
          <h3>Postep kategorii</h3>
          <ul>
            @for (category of visibleCategories(); track category.categoryId) {
              <li class="progress-item surface-card">
                <div class="progress-item__head">
                  <div>
                    <h4>{{ category.categoryName }}</h4>
                    <p>{{ category.categorySlug }}</p>
                  </div>
                  <strong>{{ categoryPercent(category) }}%</strong>
                </div>
                <div
                  class="progress-item__bar"
                  role="progressbar"
                  [attr.aria-valuenow]="categoryPercent(category)"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <div
                    class="progress-item__bar-fill gradient-ember"
                    [style.width.%]="max2(categoryPercent(category))"
                  ></div>
                </div>
                <ul class="progress-item__tiers">
                  @for (tier of category.tiers; track tier.tier) {
                    <li [class.is-done]="tier.completed" [class.is-active]="!tier.completed">
                      {{ tierLabel(tier.tier) }}: {{ tier.masteredWords }}/{{ tier.totalWords }}
                    </li>
                  }
                </ul>
              </li>
            }
          </ul>
        </section>
      }
    </section>
  `,
  styles: `
    .progress-page {
      display: grid;
      gap: 0.95rem;
    }

    .progress-hero {
      display: grid;
      gap: 0.9rem;
      padding: 1rem;
    }

    .progress-hero__badge {
      margin: 0;
      display: inline-flex;
      width: fit-content;
      border-radius: 999px;
      background: color-mix(in srgb, var(--primary) 12%, var(--card));
      color: var(--primary);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.32rem 0.66rem;
    }

    .progress-hero h2 {
      margin: 0.55rem 0 0;
      font-size: clamp(1.35rem, 3.8vw, 2rem);
    }

    .progress-hero p {
      margin: 0.45rem 0 0;
      color: var(--muted-foreground);
      line-height: 1.5;
      max-width: 60ch;
    }

    .progress-hero__stats {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.5rem;
    }

    .progress-hero__stats div {
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      background: var(--card);
      text-align: center;
      padding: 0.62rem;
    }

    .progress-hero__stats dt {
      margin: 0;
      color: var(--muted-foreground);
      font-size: 0.72rem;
    }

    .progress-hero__stats dd {
      margin: 0.32rem 0 0;
      font-family: var(--font-display);
      font-size: 1.08rem;
      font-weight: 900;
    }

    .progress-kpis {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 0.6rem;
    }

    .progress-kpi {
      padding: 0.85rem;
      display: grid;
      gap: 0.45rem;
    }

    .progress-kpi h3,
    .progress-kpi p,
    .progress-kpi span {
      margin: 0;
    }

    .progress-kpi h3 {
      font-size: 0.95rem;
    }

    .progress-kpi p {
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 900;
    }

    .progress-kpi span {
      color: var(--muted-foreground);
      font-size: 0.78rem;
      font-weight: 700;
    }

    .progress-kpi__bar {
      height: 0.45rem;
      border-radius: 999px;
      overflow: hidden;
      background: var(--muted);
    }

    .progress-kpi__bar-fill {
      height: 100%;
      border-radius: 999px;
      background: var(--copper);
    }

    .progress-list h3 {
      margin: 0;
      font-size: 1.2rem;
    }

    .progress-list ul {
      list-style: none;
      margin: 0.65rem 0 0;
      padding: 0;
      display: grid;
      gap: 0.6rem;
    }

    .progress-item {
      padding: 0.85rem;
      display: grid;
      gap: 0.55rem;
    }

    .progress-item__head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.6rem;
    }

    .progress-item__head h4 {
      margin: 0;
      font-size: 1rem;
    }

    .progress-item__head p {
      margin: 0.18rem 0 0;
      color: var(--muted-foreground);
      font-size: 0.82rem;
    }

    .progress-item__head strong {
      font-family: var(--font-display);
      font-size: 1rem;
      color: var(--secondary);
    }

    .progress-item__bar {
      height: 0.5rem;
      border-radius: 999px;
      overflow: hidden;
      background: var(--muted);
    }

    .progress-item__bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.35s ease;
    }

    .progress-item__tiers {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .progress-item__tiers li {
      border-radius: var(--radius-md);
      background: var(--muted);
      color: var(--muted-foreground);
      padding: 0.3rem 0.5rem;
      font-size: 0.76rem;
      font-weight: 700;
    }

    .progress-item__tiers li.is-done {
      background: color-mix(in srgb, var(--success) 16%, var(--card));
      color: var(--success);
    }

    .progress-item__tiers li.is-active {
      background: color-mix(in srgb, var(--copper) 24%, var(--card));
      color: var(--secondary);
    }

    @media (min-width: 760px) {
      .progress-kpis {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }

    @media (min-width: 800px) {
      .progress-hero {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
      }

      .progress-hero__stats {
        width: 20rem;
      }
    }

    @media (max-width: 620px) {
      .progress-item__head {
        align-items: center;
      }
    }
  `,
})
export class ProgressPageComponent {
  readonly progress = inject(ProgressService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly categories = computed<ProgressCategoryOverview[]>(
    () => this.progress.overview()?.categories ?? [],
  );
  readonly visibleCategories = computed(() =>
    this.categories()
      .filter((category) => this.isCategoryUnlocked(category))
      .sort((left, right) => {
        const rankDiff = this.categoryDisplayRank(left) - this.categoryDisplayRank(right);
        if (rankDiff !== 0) {
          return rankDiff;
        }
        return left.categoryName.localeCompare(right.categoryName, 'pl');
      }),
  );
  readonly masteredWords = computed(() =>
    this.visibleCategories().reduce((sum, category) => sum + this.categoryMasteredWords(category), 0),
  );
  readonly totalWords = computed(() =>
    this.visibleCategories().reduce((sum, category) => sum + this.categoryTotalWords(category), 0),
  );
  readonly totalTierCount = computed(() =>
    this.visibleCategories().reduce((sum, category) => sum + category.tiers.length, 0),
  );
  readonly completedTiers = computed(() =>
    this.visibleCategories().reduce(
      (sum, category) => sum + category.tiers.filter((tier) => tier.completed).length,
      0,
    ),
  );
  readonly overallProgressPercent = computed(() => {
    const total = this.totalWords();
    if (total <= 0) {
      return 0;
    }
    return Math.round((this.masteredWords() / total) * 100);
  });

  constructor() {
    void this.reload();
  }

  tierProgressCards(): {
    tier: TierName;
    label: string;
    mastered: number;
    total: number;
    percent: number;
  }[] {
    return (['easy', 'hard', 'expert'] as TierName[]).map((tier) => {
      let mastered = 0;
      let total = 0;
      for (const category of this.visibleCategories()) {
        const found = category.tiers.find((entry) => entry.tier === tier);
        if (!found) {
          continue;
        }
        mastered += found.masteredWords;
        total += found.totalWords;
      }
      const percent = total > 0 ? Math.round((mastered / total) * 100) : 0;
      return {
        tier,
        label: this.tierLabel(tier),
        mastered,
        total,
        percent,
      };
    });
  }

  categoryPercent(category: ProgressCategoryOverview): number {
    const mastered = this.categoryMasteredWords(category);
    const total = this.categoryTotalWords(category);
    if (total <= 0) {
      return 0;
    }
    return Math.round((mastered / total) * 100);
  }

  tierLabel(tier: TierName): string {
    if (tier === 'easy') {
      return 'Easy';
    }
    if (tier === 'hard') {
      return 'Hard';
    }
    return 'Expert';
  }

  max2(value: number): number {
    return Math.max(value, 2);
  }

  private isCategoryUnlocked(category: ProgressCategoryOverview): boolean {
    return category.tiers.some((tier) => tier.totalWords > 0);
  }

  private categoryTotalWords(category: ProgressCategoryOverview): number {
    return category.tiers.reduce((max, tier) => Math.max(max, tier.totalWords), 0);
  }

  private categoryMasteredWords(category: ProgressCategoryOverview): number {
    return category.tiers.reduce((max, tier) => Math.max(max, tier.masteredWords), 0);
  }

  private categoryDisplayRank(category: ProgressCategoryOverview): number {
    const completedTiers = category.tiers.filter((tier) => tier.completed).length;
    const allCompleted = category.tiers.length > 0 && completedTiers >= category.tiers.length;
    return allCompleted ? 1 : 0;
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      await this.progress.refresh();
    } catch {
      this.errorMessage.set('Nie udalo sie pobrac danych progresu.');
    } finally {
      this.loading.set(false);
    }
  }
}
