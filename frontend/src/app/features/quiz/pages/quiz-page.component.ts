import { Component, OnDestroy, computed, effect, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { TierName } from '../../../core/api/models';
import { QuizSessionStore } from '../../../core/quiz/quiz-session.store';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { RetryStateComponent } from '../../../shared/ui/retry-state.component';

@Component({
  selector: 'app-quiz-page',
  imports: [RouterLink, LoadingStateComponent, RetryStateComponent],
  template: `
    <section class="quiz-page">
      @if (hasSelection()) {
        @if (store.initializing()) {
          <app-loading-state message="Uruchamianie sesji quizu..." />
        } @else {
          <div class="quiz-page__top">
            <a routerLink="/katalog" class="quiz-page__back">Powrot do katalogu</a>
            <p class="quiz-page__meta">
              Kategoria <strong>{{ categoryId() }}</strong>
              <span aria-hidden="true">·</span>
              <strong>{{ tierLabel() }}</strong>
            </p>
          </div>

          @if (store.error(); as error) {
            <app-retry-state [message]="error" (retry)="retry()" />
          }

          @if (store.resumed() && store.hasSession()) {
            <p class="quiz-page__info">
              Wznowiono aktywna sesje: <code>{{ store.sessionId() }}</code>
            </p>
          }

          @if (store.completed()) {
            <article class="quiz-summary surface-card">
              <h2>Sesja zakonczona</h2>
              @if (store.progress(); as progress) {
                <p class="quiz-summary__stats">
                  Odpowiedziano {{ progress.answeredWords }}/{{ progress.totalWords }} pytan ·
                  skutecznosc {{ progress.sessionAccuracy }}%
                </p>
              }
              <div class="quiz-summary__actions">
                <button type="button" (click)="finishSession()" [disabled]="store.finishing()">
                  {{ store.finishing() ? 'Finalizowanie...' : 'Pokaz podsumowanie sesji' }}
                </button>
                <a routerLink="/katalog">Wroc do katalogu</a>
              </div>
            </article>
          } @else if (store.loadingQuestion()) {
            <app-loading-state message="Ladowanie pytania..." />
          } @else if (store.question(); as question) {
            <article class="quiz-card surface-card">
              @if (store.progress(); as progress) {
                <div class="quiz-card__progress-head">
                  <p>
                    Postep: {{ progress.answeredWords }}/{{ progress.totalWords }} · pozostalo
                    {{ progress.remainingWords }}
                  </p>
                  <p>Skutecznosc {{ progress.sessionAccuracy }}%</p>
                </div>
              }

              <div
                class="quiz-card__track"
                role="progressbar"
                [attr.aria-valuenow]="progressPercent()"
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Postep quizu"
              >
                <div class="quiz-card__track-fill gradient-ember" [style.width.%]="progressPercent()"></div>
              </div>

              <div class="quiz-card__timer-row">
                <span class="quiz-card__index">
                  Pytanie {{ answeredWords() + 1 }}/{{ totalWords() }}
                </span>
                <span class="quiz-card__time" [class.is-low]="isTimeLow()">
                  <span class="quiz-card__time-icon" aria-hidden="true">⏱</span>
                  {{ store.timeLeftSeconds() }}s
                </span>
              </div>

              <h2>{{ question.prompt }}</h2>
              <p class="quiz-card__attempts">
                @if (store.currentWordRemainingCorrect() > 0) {
                  Do opanowania tego slowka: jeszcze
                  <strong>{{ store.currentWordRemainingCorrect() }}</strong>
                  z
                  <strong>{{ store.currentWordRequiredCorrect() }}</strong>
                  poprawnych odpowiedzi.
                } @else {
                  To slowko jest juz opanowane.
                }
              </p>

              <div class="quiz-card__options">
                @for (option of question.options; track option) {
                  <button
                    type="button"
                    (click)="submitAnswer(option)"
                    [disabled]="store.answering() || store.loadingQuestion()"
                    [class.is-pending]="store.answering()"
                  >
                    {{ option }}
                  </button>
                }
              </div>

              @if (store.feedback(); as feedback) {
                <p
                  class="quiz-card__feedback"
                  [class.is-correct]="feedback.type === 'correct'"
                  [class.is-incorrect]="feedback.type === 'incorrect' || feedback.type === 'timeout'"
                >
                  {{ feedback.message }}
                </p>
              }
            </article>
          }
        }
      } @else {
        <p class="quiz-page__empty-text">
          @if (store.initializing()) {
            Trwa sprawdzanie, czy mozna wznowic aktywna sesje...
          } @else {
            Wybierz kategorie i tier w katalogu, aby rozpoczac quiz.
          }
        </p>
        <a routerLink="/katalog" class="quiz-page__back">Przejdz do katalogu</a>
      }
    </section>
  `,
  styles: `
    .quiz-page {
      display: grid;
      gap: 0.95rem;
    }

    .quiz-page__top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .quiz-page__back {
      display: inline-flex;
      align-items: center;
      min-height: 2.35rem;
      border-radius: var(--radius-xl);
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--secondary);
      text-decoration: none;
      font-size: 0.86rem;
      font-weight: 700;
      padding: 0.45rem 0.75rem;
    }

    .quiz-page__back:hover {
      background: var(--accent);
      color: var(--accent-foreground);
      border-color: transparent;
    }

    .quiz-page__meta {
      margin: 0;
      color: var(--muted-foreground);
      font-size: 0.9rem;
      display: inline-flex;
      gap: 0.35rem;
      align-items: center;
    }

    .quiz-page__info {
      margin: 0;
      border-radius: var(--radius-xl);
      border: 1px solid color-mix(in srgb, var(--secondary) 20%, var(--border));
      background: color-mix(in srgb, var(--accent) 35%, var(--card));
      color: var(--secondary);
      padding: 0.6rem 0.75rem;
      font-size: 0.89rem;
    }

    .quiz-card {
      display: grid;
      gap: 0.9rem;
      padding: 1rem;
    }

    .quiz-card__progress-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .quiz-card__progress-head p {
      margin: 0;
      font-size: 0.83rem;
      color: var(--muted-foreground);
    }

    .quiz-card__track {
      height: 0.5rem;
      border-radius: 999px;
      overflow: hidden;
      background: var(--muted);
    }

    .quiz-card__track-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.3s ease;
    }

    .quiz-card__timer-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.6rem;
    }

    .quiz-card__index {
      font-size: 0.85rem;
      color: var(--muted-foreground);
    }

    .quiz-card__time {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      min-width: 5.1rem;
      border-radius: 999px;
      background: color-mix(in srgb, var(--accent) 75%, var(--card));
      color: var(--accent-foreground);
      font-family: var(--font-display);
      font-size: 0.88rem;
      font-weight: 900;
      padding: 0.28rem 0.62rem;
    }

    .quiz-card__time.is-low {
      background: color-mix(in srgb, var(--destructive) 15%, var(--card));
      color: var(--destructive);
    }

    .quiz-card__time-icon {
      font-size: 0.84rem;
      line-height: 1;
    }

    .quiz-card h2 {
      margin: 0.15rem 0 0;
      font-size: clamp(1.45rem, 3.8vw, 2rem);
      line-height: 1.15;
    }

    .quiz-card__attempts {
      margin: 0;
      color: var(--muted-foreground);
      font-size: 0.88rem;
      line-height: 1.45;
    }

    .quiz-card__attempts strong {
      color: var(--secondary);
      font-family: var(--font-display);
      font-size: 0.92rem;
    }

    .quiz-card__options {
      display: grid;
      gap: 0.55rem;
    }

    .quiz-card__options button {
      text-align: left;
      min-height: 2.9rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      padding: 0.62rem 0.75rem;
      background: var(--card);
      color: var(--foreground);
      font-family: var(--font-display);
      font-size: 0.98rem;
      font-weight: 800;
      cursor: pointer;
      transition: transform 0.13s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .quiz-card__options button:hover:not(:disabled) {
      transform: translateY(-1px);
      border-color: var(--primary);
      box-shadow: var(--shadow-soft);
    }

    .quiz-card__options button.is-pending {
      cursor: not-allowed;
      opacity: 0.85;
    }

    .quiz-card__options button:disabled {
      opacity: 0.72;
      cursor: not-allowed;
    }

    .quiz-card__feedback {
      margin: 0;
      border-radius: var(--radius-xl);
      padding: 0.62rem 0.72rem;
      border: 1px solid transparent;
      font-size: 0.9rem;
      font-weight: 700;
    }

    .quiz-card__feedback.is-correct {
      color: var(--success);
      background: color-mix(in srgb, var(--success) 12%, var(--card));
      border-color: color-mix(in srgb, var(--success) 34%, var(--border));
    }

    .quiz-card__feedback.is-incorrect {
      color: var(--destructive);
      background: color-mix(in srgb, var(--destructive) 10%, var(--card));
      border-color: color-mix(in srgb, var(--destructive) 34%, var(--border));
    }

    .quiz-summary {
      display: grid;
      gap: 0.75rem;
      padding: 1rem;
    }

    .quiz-summary h2 {
      margin: 0;
      font-size: clamp(1.35rem, 3.5vw, 1.8rem);
    }

    .quiz-summary__stats {
      margin: 0;
      color: var(--muted-foreground);
    }

    .quiz-summary__actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .quiz-summary__actions button,
    .quiz-summary__actions a {
      min-height: 2.65rem;
      border-radius: var(--radius-xl);
      padding: 0.45rem 0.85rem;
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
    }

    .quiz-summary__actions button {
      border: 1px solid transparent;
      background: var(--secondary);
      color: var(--secondary-foreground);
      cursor: pointer;
    }

    .quiz-summary__actions button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .quiz-summary__actions a {
      border: 1px solid var(--border);
      background: var(--card);
      color: var(--secondary);
      display: inline-flex;
      align-items: center;
    }

    .quiz-page__empty-text {
      margin: 0;
      color: var(--muted-foreground);
    }

    @media (max-width: 620px) {
      .quiz-card,
      .quiz-summary {
        padding: 0.88rem;
      }

      .quiz-card__progress-head {
        gap: 0.35rem;
      }
    }
  `,
})
export class QuizPageComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(QuizSessionStore);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly categoryId = computed(() => this.params().get('categoryId'));
  readonly tier = computed(() => this.params().get('tier') as TierName | null);
  readonly hasSelection = computed(
    () => Boolean(this.categoryId()) && this.isTierName(this.tier()),
  );
  readonly answeredWords = computed(() => this.store.progress()?.answeredWords ?? 0);
  readonly totalWords = computed(() => Math.max(this.store.progress()?.totalWords ?? 0, 1));
  readonly progressPercent = computed(() =>
    Math.round((this.answeredWords() / this.totalWords()) * 100),
  );
  readonly isTimeLow = computed(() => this.store.timeLeftSeconds() <= 10);
  readonly tierLabel = computed(() => {
    const tier = this.tier();
    if (tier === 'easy') {
      return 'Easy';
    }
    if (tier === 'hard') {
      return 'Hard';
    }
    if (tier === 'expert') {
      return 'Expert';
    }
    return '-';
  });
  private attemptedRestore = false;

  constructor() {
    effect(() => {
      const categoryId = this.categoryId();
      const tier = this.tier();

      if (!categoryId || !this.isTierName(tier)) {
        if (this.attemptedRestore) {
          return;
        }
        this.attemptedRestore = true;
        void this.restoreSessionFromStorage();
        return;
      }

      this.attemptedRestore = true;
      void this.store.ensureSession(categoryId, tier);
    });
  }

  submitAnswer(option: string): void {
    void this.store.submitAnswer(option);
  }

  retry(): void {
    void this.store.retryCurrentSelection();
  }

  async finishSession(): Promise<void> {
    const summary = await this.store.finishSession();
    if (!summary) {
      return;
    }

    await this.router.navigate(['/quiz/sessions', summary.sessionId, 'summary']);
  }

  private async restoreSessionFromStorage(): Promise<void> {
    const restored = await this.store.restorePersistedSession();
    if (restored.kind === 'quiz') {
      await this.router.navigate(['/quiz', restored.categoryId, restored.tier], {
        replaceUrl: true,
      });
      return;
    }

    if (restored.kind === 'summary') {
      await this.router.navigate(['/quiz/sessions', restored.sessionId, 'summary'], {
        replaceUrl: true,
      });
    }
  }

  private isTierName(value: string | null): value is TierName {
    return value === 'easy' || value === 'hard' || value === 'expert';
  }

  ngOnDestroy(): void {
    this.store.reset();
  }
}
