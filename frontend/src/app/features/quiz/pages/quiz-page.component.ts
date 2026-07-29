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
      <h2>Quiz</h2>
      @if (hasSelection()) {
        <p class="quiz-page__meta">
          Kategoria <strong>{{ categoryId() }}</strong> · tier <strong>{{ tier() }}</strong>
        </p>

        @if (store.initializing()) {
          <app-loading-state message="Uruchamianie sesji quizu..." />
        } @else {
          @if (store.error(); as error) {
            <app-retry-state [message]="error" (retry)="retry()" />
          }

          @if (store.resumed() && store.hasSession()) {
            <p class="quiz-page__info">
              Wznowiono aktywna sesje: <code>{{ store.sessionId() }}</code>
            </p>
          }

          @if (store.completed()) {
            <article class="quiz-page__card">
              <h3>Sesja zakonczona</h3>
              @if (store.progress(); as progress) {
                <p>
                  Odpowiedziano {{ progress.answeredWords }}/{{ progress.totalWords }} pytan,
                  accuracy: {{ progress.sessionAccuracy }}%.
                </p>
              }
              <button type="button" (click)="finishSession()" [disabled]="store.finishing()">
                {{
                  store.finishing() ? 'Finalizowanie...' : 'Finalizuj sesje i zobacz podsumowanie'
                }}
              </button>
              <a routerLink="/katalog">Wroc do katalogu</a>
            </article>
          } @else if (store.loadingQuestion()) {
            <app-loading-state message="Ladowanie pytania..." />
          } @else if (store.question(); as question) {
            <article class="quiz-page__card">
              @if (store.progress(); as progress) {
                <p class="quiz-page__progress">
                  Postep: {{ progress.answeredWords }}/{{ progress.totalWords }} · pozostalo:
                  {{ progress.remainingWords }} · accuracy: {{ progress.sessionAccuracy }}%
                </p>
              }

              <div class="quiz-page__timer" aria-label="Pozostaly czas pytania">
                <div
                  class="quiz-page__timer-bar"
                  [style.width.%]="store.timerProgressPercent()"
                ></div>
              </div>
              <p class="quiz-page__time-left">Pozostaly czas: {{ store.timeLeftSeconds() }} s</p>

              <h3>{{ question.prompt }}</h3>
              <div class="quiz-page__options">
                @for (option of question.options; track option) {
                  <button
                    type="button"
                    (click)="submitAnswer(option)"
                    [disabled]="store.answering() || store.loadingQuestion()"
                  >
                    {{ option }}
                  </button>
                }
              </div>

              @if (store.feedback(); as feedback) {
                <p
                  class="quiz-page__feedback"
                  [class.is-correct]="feedback.type === 'correct'"
                  [class.is-incorrect]="
                    feedback.type === 'incorrect' || feedback.type === 'timeout'
                  "
                >
                  {{ feedback.message }}
                </p>
              }
            </article>
          }
        }
      } @else {
        <p>
          @if (store.initializing()) {
            Trwa sprawdzanie, czy mozna wznowic aktywna sesje...
          } @else {
            Wybierz kategorie i tier w katalogu, aby rozpoczac quiz.
          }
        </p>
        <a routerLink="/katalog">Przejdz do katalogu</a>
      }
    </section>
  `,
  styles: `
    .quiz-page {
      display: grid;
      gap: 1rem;
    }

    .quiz-page__meta,
    .quiz-page__progress,
    .quiz-page__time-left {
      margin: 0;
    }

    .quiz-page__card {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 1rem;
      display: grid;
      gap: 0.85rem;
    }

    .quiz-page__timer {
      background: #e2e8f0;
      border-radius: 999px;
      height: 0.5rem;
      overflow: hidden;
    }

    .quiz-page__timer-bar {
      height: 100%;
      background: #2563eb;
      transition: width 0.15s linear;
    }

    .quiz-page__options {
      display: grid;
      gap: 0.5rem;
    }

    .quiz-page__options button {
      text-align: left;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.6rem 0.7rem;
      font: inherit;
      background: #fff;
      cursor: pointer;
    }

    .quiz-page__options button:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .quiz-page__feedback {
      margin: 0;
      border-radius: 0.5rem;
      padding: 0.6rem;
      border: 1px solid transparent;
    }

    .quiz-page__feedback.is-correct {
      color: #166534;
      background: #f0fdf4;
      border-color: #bbf7d0;
    }

    .quiz-page__feedback.is-incorrect {
      color: #991b1b;
      background: #fef2f2;
      border-color: #fecaca;
    }

    .quiz-page__error {
      margin: 0;
      border-radius: 0.5rem;
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #991b1b;
      padding: 0.6rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .quiz-page__info {
      margin: 0;
      border-radius: 0.5rem;
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1e3a8a;
      padding: 0.6rem;
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
