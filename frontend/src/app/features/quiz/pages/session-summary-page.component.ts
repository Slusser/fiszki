import { Component, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { QuizSessionStore } from '../../../core/quiz/quiz-session.store';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { RetryStateComponent } from '../../../shared/ui/retry-state.component';

@Component({
  selector: 'app-session-summary-page',
  imports: [RouterLink, RetryStateComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <section class="summary-page">
      <h2>Podsumowanie sesji</h2>

      @if (store.finishing()) {
        <app-loading-state message="Ladowanie podsumowania..." />
      } @else if (store.error(); as error) {
        <app-retry-state [message]="error" (retry)="reloadSummary()" />
      } @else if (store.finalSummary(); as summary) {
        <article class="summary-page__card">
          <p>
            <strong>Session ID:</strong> <code>{{ summary.sessionId }}</code>
          </p>
          <p>
            <strong>Status:</strong> {{ summary.status }}
            {{ summary.idempotent ? '(idempotent)' : '' }}
          </p>
          <p><strong>Wynik:</strong> {{ summary.score }}</p>
          <p><strong>Accuracy:</strong> {{ summary.accuracy }}%</p>
          <p><strong>Tier ukonczony:</strong> {{ summary.tierCompleted ? 'tak' : 'nie' }}</p>
          <p>
            <strong>Punkty przyznane:</strong> {{ summary.rewards.grantedPoints }} (base:
            {{ summary.rewards.basePoints }}, bonus: {{ summary.rewards.accuracyBonusPoints }})
          </p>
          <p>
            <strong>Wallet po sesji:</strong> {{ summary.wallet.pointsBalance }} pkt (lifetime:
            {{ summary.wallet.lifetimePoints }})
          </p>
          <p>
            <strong>Postep sesji:</strong> {{ summary.progress.answeredWords }}/{{
              summary.progress.totalWords
            }}
          </p>
        </article>
      } @else {
        <app-empty-state
          title="Brak danych podsumowania"
          description="Sprawdz, czy sesja quizu zostala poprawnie zakonczona."
        />
      }

      <div class="summary-page__actions">
        <a routerLink="/katalog">Wroc do katalogu</a>
        <a routerLink="/postep">Zobacz postep</a>
        <a routerLink="/wallet">Zobacz wallet</a>
      </div>
    </section>
  `,
  styles: `
    .summary-page {
      display: grid;
      gap: 1rem;
    }

    .summary-page__card {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      display: grid;
      gap: 0.5rem;
    }

    .summary-page__card p {
      margin: 0;
    }

    .summary-page__actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
  `,
})
export class SessionSummaryPageComponent {
  private readonly route = inject(ActivatedRoute);
  readonly store = inject(QuizSessionStore);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly sessionId = computed(() => this.params().get('sessionId'));

  constructor() {
    effect(() => {
      const sessionId = this.sessionId();
      if (!sessionId) {
        return;
      }

      void this.store.loadSummaryForSession(sessionId);
    });
  }

  reloadSummary(): void {
    const sessionId = this.sessionId();
    if (!sessionId) {
      return;
    }

    void this.store.loadSummaryForSession(sessionId);
  }
}
