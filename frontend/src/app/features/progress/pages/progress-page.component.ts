import { Component, inject, signal } from '@angular/core';
import { ProgressService } from '../../../core/progress/progress.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { RetryStateComponent } from '../../../shared/ui/retry-state.component';

@Component({
  selector: 'app-progress-page',
  imports: [RetryStateComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <section class="progress-page">
      <h2>Postep</h2>

      @if (errorMessage(); as error) {
        <app-retry-state [message]="error" (retry)="reload()" />
      }

      @if (loading()) {
        <app-loading-state message="Ladowanie progresu..." />
      } @else if (!progress.overview()?.categories?.length) {
        <app-empty-state
          title="Brak danych progresu"
          description="Rozwiaz pierwsze quizy, aby zobaczyc postep."
        />
      } @else {
        <div class="progress-page__list">
          @for (category of progress.overview()!.categories; track category.categoryId) {
            <article class="progress-page__card">
              <h3>{{ category.categoryName }}</h3>
              <p>{{ category.categorySlug }}</p>
              <div>
                @for (tier of category.tiers; track tier.tier) {
                  <p>
                    Tier <strong>{{ tier.tier }}</strong> · {{ tier.masteredWords }}/{{
                      tier.totalWords
                    }}
                    · {{ tier.completed ? 'ukonczony' : 'w trakcie' }}
                  </p>
                }
              </div>
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .progress-page {
      display: grid;
      gap: 1rem;
    }

    .progress-page__list {
      display: grid;
      gap: 0.75rem;
    }

    .progress-page__card {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.9rem;
      display: grid;
      gap: 0.5rem;
    }

    .progress-page__card h3,
    .progress-page__card p {
      margin: 0;
    }
  `,
})
export class ProgressPageComponent {
  readonly progress = inject(ProgressService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  constructor() {
    void this.reload();
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
