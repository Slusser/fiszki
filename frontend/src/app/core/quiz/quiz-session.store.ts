import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AnswerQuestionResponse,
  FinishQuizSessionResponse,
  NextQuestionPayload,
  SessionProgressMeta,
  StartQuizSessionResponse,
  TierName,
  WordProgressSnapshot,
} from '../api/models';
import { QuizApiService } from './quiz-api.service';

interface QuizFeedback {
  type: 'correct' | 'incorrect' | 'timeout';
  message: string;
}

interface QuizSessionState {
  initializing: boolean;
  loadingQuestion: boolean;
  answering: boolean;
  finishing: boolean;
  completed: boolean;
  categoryId: string | null;
  tier: TierName | null;
  sessionId: string | null;
  resumed: boolean;
  question: NextQuestionPayload | null;
  progress: SessionProgressMeta | null;
  finalSummary: FinishQuizSessionResponse | null;
  feedback: QuizFeedback | null;
  error: string | null;
  wordProgressById: Record<string, WordProgressSnapshot>;
}

const QUESTION_TIMEOUT_SECONDS = 30;
const TIMEOUT_SUBMIT_OPTION = '__timeout__';
const FEEDBACK_VISIBLE_MS = 700;
const ACTIVE_SESSION_STORAGE_KEY = 'fiszki.activeQuizSession';
const BASE_REQUIRED_CORRECT = 3;

interface PersistedActiveQuizSession {
  sessionId: string;
  categoryId: string;
  tier: TierName;
  savedAt: string;
}

export type RestoredSessionResult =
  | {
      kind: 'quiz';
      categoryId: string;
      tier: TierName;
      sessionId: string;
    }
  | { kind: 'summary'; sessionId: string }
  | { kind: 'none' };

@Injectable({ providedIn: 'root' })
export class QuizSessionStore {
  private readonly quizApi = inject(QuizApiService);

  private readonly state = signal<QuizSessionState>({
    initializing: false,
    loadingQuestion: false,
    answering: false,
    finishing: false,
    completed: false,
    categoryId: null,
    tier: null,
    sessionId: null,
    resumed: false,
    question: null,
    progress: null,
    finalSummary: null,
    feedback: null,
    error: null,
    wordProgressById: {},
  });

  private readonly timeLeft = signal(QUESTION_TIMEOUT_SECONDS);
  private activeSelectionKey: string | null = null;
  private deadlineAtMs: number | null = null;
  private timerIntervalId: ReturnType<typeof setInterval> | null = null;

  readonly initializing = computed(() => this.state().initializing);
  readonly loadingQuestion = computed(() => this.state().loadingQuestion);
  readonly answering = computed(() => this.state().answering);
  readonly completed = computed(() => this.state().completed);
  readonly finishing = computed(() => this.state().finishing);
  readonly question = computed(() => this.state().question);
  readonly progress = computed(() => this.state().progress);
  readonly finalSummary = computed(() => this.state().finalSummary);
  readonly feedback = computed(() => this.state().feedback);
  readonly error = computed(() => this.state().error);
  readonly sessionId = computed(() => this.state().sessionId);
  readonly resumed = computed(() => this.state().resumed);
  readonly hasSession = computed(() => Boolean(this.state().sessionId));
  readonly isBusy = computed(
    () =>
      this.state().initializing ||
      this.state().loadingQuestion ||
      this.state().answering ||
      this.state().finishing,
  );

  readonly timeLeftSeconds = computed(() => this.timeLeft());
  readonly timerProgressPercent = computed(
    () => (this.timeLeft() / QUESTION_TIMEOUT_SECONDS) * 100,
  );
  readonly currentWordProgress = computed<WordProgressSnapshot | null>(() => {
    const question = this.state().question;
    if (!question) {
      return null;
    }
    return this.state().wordProgressById[question.wordId] ?? null;
  });
  readonly currentWordRequiredCorrect = computed(() => {
    const snapshot = this.currentWordProgress();
    if (!snapshot) {
      return BASE_REQUIRED_CORRECT;
    }
    return snapshot.requiredCorrect;
  });
  readonly currentWordCorrectCount = computed(() => {
    const snapshot = this.currentWordProgress();
    return snapshot?.correctCount ?? 0;
  });
  readonly currentWordRemainingCorrect = computed(() =>
    Math.max(this.currentWordRequiredCorrect() - this.currentWordCorrectCount(), 0),
  );

  async ensureSession(categoryId: string, tier: TierName): Promise<void> {
    const selectionKey = `${categoryId}:${tier}`;
    if (this.activeSelectionKey === selectionKey && this.hasSession()) {
      return;
    }

    this.stopTimer();
    this.activeSelectionKey = selectionKey;
    this.state.set({
      initializing: true,
      loadingQuestion: false,
      answering: false,
      finishing: false,
      completed: false,
      categoryId,
      tier,
      sessionId: null,
      resumed: false,
      question: null,
      progress: null,
      finalSummary: null,
      feedback: null,
      error: null,
      wordProgressById: {},
    });

    try {
      const session = await firstValueFrom(this.quizApi.startSession({ categoryId, tier }));
      this.consumeStartedSession(session);
      await this.loadNextQuestion();
    } catch (error) {
      this.state.update((value) => ({
        ...value,
        initializing: false,
        error: this.toQuizErrorMessage(error, 'Nie udalo sie uruchomic sesji quizu.'),
      }));
    }
  }

  reset(): void {
    this.stopTimer();
    this.activeSelectionKey = null;
    this.state.set({
      initializing: false,
      loadingQuestion: false,
      answering: false,
      finishing: false,
      completed: false,
      categoryId: null,
      tier: null,
      sessionId: null,
      resumed: false,
      question: null,
      progress: null,
      finalSummary: null,
      feedback: null,
      error: null,
      wordProgressById: {},
    });
  }

  clearPersistedSession(): void {
    this.removePersistedSession();
  }

  async retryCurrentSelection(): Promise<void> {
    const categoryId = this.state().categoryId;
    const tier = this.state().tier;
    if (!categoryId || !tier) {
      return;
    }

    await this.ensureSession(categoryId, tier);
  }

  async restorePersistedSession(): Promise<RestoredSessionResult> {
    const persisted = this.readPersistedSession();
    if (!persisted) {
      return { kind: 'none' };
    }

    this.stopTimer();
    this.activeSelectionKey = `${persisted.categoryId}:${persisted.tier}`;
    this.state.update((value) => ({
      ...value,
      initializing: true,
      loadingQuestion: false,
      answering: false,
      finishing: false,
      completed: false,
      categoryId: persisted.categoryId,
      tier: persisted.tier,
      sessionId: persisted.sessionId,
      resumed: true,
      question: null,
      progress: null,
      finalSummary: null,
      feedback: null,
      error: null,
      wordProgressById: {},
    }));

    try {
      const response = await firstValueFrom(this.quizApi.getNextQuestion(persisted.sessionId));
      if (response.completed || !response.question) {
        const summary = await firstValueFrom(this.quizApi.finishSession(persisted.sessionId));
        this.state.update((value) => ({
          ...value,
          initializing: false,
          completed: true,
          question: null,
          progress: response.progress,
          finalSummary: summary,
        }));
        this.removePersistedSession();
        return { kind: 'summary', sessionId: persisted.sessionId };
      }

      this.state.update((value) => ({
        ...value,
        initializing: false,
        loadingQuestion: false,
        completed: false,
        question: response.question,
        progress: response.progress,
      }));
      this.startTimer(response.question.issuedAt);

      return {
        kind: 'quiz',
        categoryId: persisted.categoryId,
        tier: persisted.tier,
        sessionId: persisted.sessionId,
      };
    } catch (error) {
      const errorMessage = this.toQuizErrorMessage(
        error,
        'Nie udalo sie wznowic poprzedniej sesji quizu.',
      );

      this.state.update((value) => ({
        ...value,
        initializing: false,
        error: errorMessage,
      }));
      this.removePersistedSession();
      return { kind: 'none' };
    }
  }

  async submitAnswer(selectedOption: string): Promise<void> {
    const currentState = this.state();
    if (currentState.answering || currentState.loadingQuestion || !currentState.question) {
      return;
    }

    await this.sendAnswer(selectedOption.trim());
  }

  async finishSession(): Promise<FinishQuizSessionResponse | null> {
    const currentState = this.state();
    if (
      !currentState.sessionId ||
      currentState.finishing ||
      currentState.answering ||
      currentState.loadingQuestion
    ) {
      return null;
    }

    this.state.update((value) => ({
      ...value,
      finishing: true,
      error: null,
    }));

    try {
      const summary = await firstValueFrom(this.quizApi.finishSession(currentState.sessionId));
      this.state.update((value) => ({
        ...value,
        finishing: false,
        finalSummary: summary,
      }));
      this.removePersistedSession();
      return summary;
    } catch {
      this.state.update((value) => ({
        ...value,
        finishing: false,
        error: 'Backend odrzucil finalizacje sesji. Upewnij sie, ze nie ma juz pytan w puli.',
      }));
      return null;
    }
  }

  async loadSummaryForSession(sessionId: string): Promise<void> {
    const cachedSummary = this.state().finalSummary;
    if (cachedSummary?.sessionId === sessionId) {
      return;
    }

    this.state.update((value) => ({
      ...value,
      finishing: true,
      error: null,
    }));

    try {
      const summary = await firstValueFrom(this.quizApi.finishSession(sessionId));
      this.state.update((value) => ({
        ...value,
        finishing: false,
        sessionId,
        finalSummary: summary,
      }));
      if (summary.status === 'finished') {
        this.removePersistedSession();
      }
    } catch {
      this.state.update((value) => ({
        ...value,
        finishing: false,
        error: 'Nie udalo sie pobrac podsumowania sesji.',
      }));
    }
  }

  private consumeStartedSession(session: StartQuizSessionResponse): void {
    this.persistSession({
      sessionId: session.sessionId,
      categoryId: session.categoryId,
      tier: session.tier,
      savedAt: new Date().toISOString(),
    });

    this.state.update((value) => ({
      ...value,
      initializing: false,
      resumed: session.resumed,
      sessionId: session.sessionId,
      categoryId: session.categoryId,
      tier: session.tier,
      finalSummary: null,
      error: null,
    }));
  }

  private async loadNextQuestion(): Promise<void> {
    const sessionId = this.state().sessionId;
    if (!sessionId) {
      return;
    }

    this.stopTimer();
    this.state.update((value) => ({
      ...value,
      loadingQuestion: true,
      feedback: null,
      error: null,
      question: null,
    }));

    try {
      const response = await firstValueFrom(this.quizApi.getNextQuestion(sessionId));
      if (response.completed || !response.question) {
        this.state.update((value) => ({
          ...value,
          loadingQuestion: false,
          completed: true,
          question: null,
          progress: response.progress,
          error:
            response.progress.totalWords === 0
              ? 'Brak pytan w aktywnej puli dla tego tieru. Sesji nie da sie ukonczyc.'
              : null,
        }));
        return;
      }

      this.state.update((value) => ({
        ...value,
        loadingQuestion: false,
        completed: false,
        question: response.question,
        progress: response.progress,
      }));
      this.startTimer(response.question.issuedAt);
    } catch (error) {
      this.state.update((value) => ({
        ...value,
        loadingQuestion: false,
        error: this.toQuizErrorMessage(error, 'Nie udalo sie pobrac kolejnego pytania.'),
      }));
    }
  }

  private async sendAnswer(selectedOption: string): Promise<void> {
    const sessionId = this.state().sessionId;
    const question = this.state().question;
    if (!sessionId || !question) {
      return;
    }

    this.stopTimer();
    this.state.update((value) => ({
      ...value,
      answering: true,
      error: null,
    }));

    try {
      const response = await firstValueFrom(
        this.quizApi.answerQuestion(sessionId, {
          questionToken: question.questionToken,
          selectedOption: selectedOption || TIMEOUT_SUBMIT_OPTION,
        }),
      );

      this.consumeAnswerResponse(response);
      await this.delay(FEEDBACK_VISIBLE_MS);
      await this.loadNextQuestion();
    } catch (error) {
      this.state.update((value) => ({
        ...value,
        answering: false,
        error: this.toQuizErrorMessage(error, 'Nie udalo sie zapisac odpowiedzi.'),
      }));
      this.startTimer(question.issuedAt);
    }
  }

  private consumeAnswerResponse(response: AnswerQuestionResponse): void {
    this.state.update((value) => ({
      ...value,
      answering: false,
      progress: response.progress,
      feedback: response.wasTimeout
        ? { type: 'timeout', message: 'Czas minal. Odpowiedz zostala oznaczona jako bledna.' }
        : response.isCorrect
          ? { type: 'correct', message: 'Poprawna odpowiedz.' }
          : { type: 'incorrect', message: 'Bledna odpowiedz.' },
      wordProgressById: {
        ...value.wordProgressById,
        [response.wordId]: response.wordProgress,
      },
    }));
  }

  private startTimer(issuedAtIso: string): void {
    this.stopTimer();

    const issuedAtMs = Date.parse(issuedAtIso);
    if (Number.isNaN(issuedAtMs)) {
      this.timeLeft.set(QUESTION_TIMEOUT_SECONDS);
      return;
    }

    this.deadlineAtMs = issuedAtMs + QUESTION_TIMEOUT_SECONDS * 1_000;
    this.tickTimer();
    this.timerIntervalId = setInterval(() => {
      this.tickTimer();
    }, 200);
  }

  private tickTimer(): void {
    if (!this.deadlineAtMs) {
      this.timeLeft.set(QUESTION_TIMEOUT_SECONDS);
      return;
    }

    const msLeft = Math.max(this.deadlineAtMs - Date.now(), 0);
    const secondsLeft = Math.ceil(msLeft / 1_000);
    this.timeLeft.set(Math.min(Math.max(secondsLeft, 0), QUESTION_TIMEOUT_SECONDS));

    if (msLeft <= 0) {
      this.stopTimer();
      void this.sendAnswer(TIMEOUT_SUBMIT_OPTION);
    }
  }

  private stopTimer(): void {
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    this.deadlineAtMs = null;
    this.timeLeft.set(QUESTION_TIMEOUT_SECONDS);
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => {
      setTimeout(() => resolve(), ms);
    });
  }

  private persistSession(session: PersistedActiveQuizSession): void {
    if (!this.hasLocalStorage()) {
      return;
    }

    try {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // ignore storage errors in private mode/quota exceeded
    }
  }

  private readPersistedSession(): PersistedActiveQuizSession | null {
    if (!this.hasLocalStorage()) {
      return null;
    }

    try {
      const raw = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw) as Partial<PersistedActiveQuizSession>;
      if (
        typeof parsed.sessionId !== 'string' ||
        typeof parsed.categoryId !== 'string' ||
        !this.isTierName(parsed.tier)
      ) {
        return null;
      }

      return {
        sessionId: parsed.sessionId,
        categoryId: parsed.categoryId,
        tier: parsed.tier,
        savedAt: typeof parsed.savedAt === 'string' ? parsed.savedAt : new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  private removePersistedSession(): void {
    if (!this.hasLocalStorage()) {
      return;
    }

    try {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } catch {
      // ignore storage errors
    }
  }

  private hasLocalStorage(): boolean {
    return typeof localStorage !== 'undefined';
  }

  private isTierName(value: unknown): value is TierName {
    return value === 'easy' || value === 'hard' || value === 'expert';
  }

  private toQuizErrorMessage(error: unknown, fallbackPrefix: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return `${fallbackPrefix} Sprobuj ponownie.`;
    }

    if (error.status === 401 || error.status === 403) {
      return 'Sesja logowania wygasla lub brak dostepu. Zaloguj sie ponownie.';
    }

    const payload = error.error as { error?: { message?: string } } | null;
    const backendMessage =
      payload?.error && typeof payload.error.message === 'string' ? payload.error.message : null;

    if (backendMessage) {
      return backendMessage;
    }

    return `${fallbackPrefix} Sprobuj ponownie.`;
  }
}
