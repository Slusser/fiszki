import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService } from '../../../core/catalog/catalog-api.service';
import { QuizSessionStore } from '../../../core/quiz/quiz-session.store';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { RetryStateComponent } from '../../../shared/ui/retry-state.component';

@Component({
  selector: 'app-session-summary-page',
  imports: [RouterLink, RetryStateComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <section class="summary-page">
      @if (store.finishing()) {
        <app-loading-state message="Ladowanie podsumowania..." />
      } @else if (store.error(); as error) {
        <app-retry-state [message]="error" (retry)="reloadSummary()" />
      } @else if (store.finalSummary(); as summary) {
        <section class="summary-hero surface-card gradient-warm">
          <div>
            <p class="summary-hero__badge">Podsumowanie sesji</p>
            <h2>{{ categoryLabel(summary.categoryId) }} · {{ tierLabel(summary.tier) }}</h2>
            <p>Session ID: <code>{{ summary.sessionId }}</code></p>
          </div>
          <dl class="summary-hero__stats">
            <div>
              <dt>Wynik</dt>
              <dd>{{ summary.score }}</dd>
            </div>
            <div>
              <dt>Skutecznosc</dt>
              <dd>{{ summary.accuracy }}%</dd>
            </div>
            <div>
              <dt>Punkty</dt>
              <dd>+{{ summary.rewards.grantedPoints }}</dd>
            </div>
          </dl>
        </section>

        <article class="summary-card surface-card">
          <h3>Szczegoly sesji</h3>
          <ul>
            <li>
              <span>Status</span>
              <strong>
                {{ statusLabel(summary.status, summary.idempotent) }}
              </strong>
            </li>
            <li>
              <span>Tier ukonczony</span>
              <strong>{{ summary.tierCompleted ? 'tak' : 'nie' }}</strong>
            </li>
            <li>
              <span>Postep sesji</span>
              <strong>{{ summary.progress.answeredWords }}/{{ summary.progress.totalWords }}</strong>
            </li>
            <li>
              <span>Punkty bazowe</span>
              <strong>{{ summary.rewards.basePoints }}</strong>
            </li>
            <li>
              <span>Bonus accuracy</span>
              <strong>{{ summary.rewards.accuracyBonusPoints }}</strong>
            </li>
            <li>
              <span>Saldo po sesji</span>
              <strong>{{ summary.wallet.pointsBalance }} pkt</strong>
            </li>
            <li>
              <span>Punkty lifetime</span>
              <strong>{{ summary.wallet.lifetimePoints }} pkt</strong>
            </li>
          </ul>
        </article>
      } @else {
        <app-empty-state
          title="Brak danych podsumowania"
          description="Sprawdz, czy sesja quizu zostala poprawnie zakonczona."
        />
      }

      <div class="summary-page__actions">
        <a routerLink="/katalog">Wroc do katalogu</a>
        <a routerLink="/quiz">Nowa sesja quizu</a>
        <a routerLink="/postep">Zobacz postep</a>
        <a routerLink="/wallet">Zobacz portfel</a>
      </div>
    </section>
  `,
  styles: `
    .summary-page {
      display: grid;
      gap: 0.9rem;
    }

    .summary-hero {
      display: grid;
      gap: 0.85rem;
      padding: 1rem;
    }

    .summary-hero__badge {
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

    .summary-hero h2 {
      margin: 0.55rem 0 0;
      font-size: clamp(1.35rem, 3.8vw, 2rem);
    }

    .summary-hero p {
      margin: 0.45rem 0 0;
      color: var(--muted-foreground);
      font-size: 0.88rem;
    }

    .summary-hero__stats {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.5rem;
    }

    .summary-hero__stats div {
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      background: var(--card);
      text-align: center;
      padding: 0.6rem;
    }

    .summary-hero__stats dt {
      margin: 0;
      color: var(--muted-foreground);
      font-size: 0.72rem;
    }

    .summary-hero__stats dd {
      margin: 0;
      margin-top: 0.3rem;
      font-family: var(--font-display);
      font-size: 1.1rem;
      font-weight: 900;
    }

    .summary-card {
      padding: 1rem;
    }

    .summary-card h3 {
      margin: 0;
      font-size: 1.1rem;
    }

    .summary-card ul {
      margin: 0.85rem 0 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.5rem;
    }

    .summary-card li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--muted) 45%, var(--card));
      padding: 0.52rem 0.62rem;
    }

    .summary-card li span {
      color: var(--muted-foreground);
      font-size: 0.85rem;
    }

    .summary-card li strong {
      text-align: right;
      font-size: 0.9rem;
    }

    .summary-page__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .summary-page__actions a {
      min-height: 2.6rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      background: var(--card);
      color: var(--secondary);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 700;
      padding: 0.45rem 0.8rem;
      display: inline-flex;
      align-items: center;
    }

    .summary-page__actions a:hover {
      background: var(--accent);
      color: var(--accent-foreground);
      border-color: transparent;
    }

    @media (min-width: 780px) {
      .summary-hero {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
      }

      .summary-hero__stats {
        width: 17.5rem;
      }
    }

    @media (max-width: 620px) {
      .summary-card li {
        flex-wrap: wrap;
      }
    }
  `,
})
export class SessionSummaryPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly catalogApi = inject(CatalogApiService);
  readonly store = inject(QuizSessionStore);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly categoryNamesById = signal<Record<string, string>>({});

  readonly sessionId = computed(() => this.params().get('sessionId'));

  constructor() {
    effect(() => {
      const sessionId = this.sessionId();
      if (!sessionId) {
        return;
      }

      void this.ensureCategoryNamesLoaded();

      // Prevent effect from tracking store signals read inside loadSummaryForSession().
      untracked(() => {
        void this.store.loadSummaryForSession(sessionId);
      });
    });
  }

  reloadSummary(): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    void this.store.loadSummaryForSession(sessionId);
  }

  tierLabel(tier: string): string {
    if (tier === 'easy') {
      return 'Easy';
    }
    if (tier === 'hard') {
      return 'Hard';
    }
    if (tier === 'expert') {
      return 'Expert';
    }
    return tier;
  }

  categoryLabel(categoryId: string): string {
    return this.categoryNamesById()[categoryId] ?? categoryId;
  }

  statusLabel(status: string, idempotent: boolean): string {
    const knownStatusLabels: Record<string, string> = {
      finished: 'Zakonczona',
      in_progress: 'W trakcie',
      abandoned: 'Porzucona',
    };
    const baseLabel = knownStatusLabels[status] ?? this.humanizeTag(status);
    return idempotent ? `${baseLabel} (ponowne wywolanie)` : baseLabel;
  }

  private async ensureCategoryNamesLoaded(): Promise<void> {
    if (Object.keys(this.categoryNamesById()).length > 0) {
      return;
    }

    try {
      const { categories } = await firstValueFrom(this.catalogApi.getCategories());
      const namesById = Object.fromEntries(categories.map((category) => [category.id, category.name]));
      this.categoryNamesById.set(namesById);
    } catch {
      // Keep category ID fallback when catalog is unavailable.
    }
  }

  private humanizeTag(value: string): string {
    const normalized = value
      .trim()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();
    if (!normalized) {
      return 'Nieznany status';
    }

    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  }
}
