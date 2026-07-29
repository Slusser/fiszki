import { fakeAsync, flushMicrotasks, TestBed, tick } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { QuizApiService } from './quiz-api.service';
import { QuizSessionStore } from './quiz-session.store';
import {
  AnswerQuestionResponse,
  NextQuestionResponse,
  StartQuizSessionResponse,
} from '../api/models';

describe('QuizSessionStore', () => {
  let store: QuizSessionStore;
  let quizApiMock: jasmine.SpyObj<QuizApiService>;

  const startedSession: StartQuizSessionResponse = {
    sessionId: 'session-1',
    status: 'active',
    categoryId: 'cat-1',
    tier: 'easy',
    resumed: false,
    startedAt: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    quizApiMock = jasmine.createSpyObj<QuizApiService>('QuizApiService', [
      'startSession',
      'getNextQuestion',
      'answerQuestion',
      'finishSession',
    ]);

    TestBed.configureTestingModule({
      providers: [{ provide: QuizApiService, useValue: quizApiMock }],
    });

    localStorage.removeItem('fiszki.activeQuizSession');
    store = TestBed.inject(QuizSessionStore);
  });

  it('auto-submituje timeout po 30s', fakeAsync(() => {
    const firstQuestion: NextQuestionResponse = {
      sessionId: 'session-1',
      categoryId: 'cat-1',
      tier: 'easy',
      completed: false,
      progress: { totalWords: 2, answeredWords: 0, remainingWords: 2, sessionAccuracy: 0 },
      question: {
        wordId: 'w1',
        prompt: 'kot',
        options: ['cat', 'dog', 'bird', 'fish'],
        issuedAt: new Date().toISOString(),
        questionToken: 'token-1',
      },
    };
    const completedResponse: NextQuestionResponse = {
      sessionId: 'session-1',
      categoryId: 'cat-1',
      tier: 'easy',
      completed: true,
      progress: { totalWords: 2, answeredWords: 2, remainingWords: 0, sessionAccuracy: 50 },
      question: null,
    };
    const answerResponse: AnswerQuestionResponse = {
      sessionId: 'session-1',
      wordId: 'w1',
      isCorrect: false,
      wasTimeout: true,
      recordedOption: '__timeout__',
      progress: { totalWords: 2, answeredWords: 1, remainingWords: 1, sessionAccuracy: 0 },
      wordProgress: {
        wordId: 'w1',
        correctCount: 0,
        wrongCount: 1,
        requiredCorrect: 6,
        mastered: false,
      },
    };

    quizApiMock.startSession.and.returnValue(of(startedSession));
    quizApiMock.getNextQuestion.and.returnValues(of(firstQuestion), of(completedResponse));
    quizApiMock.answerQuestion.and.returnValue(of(answerResponse));

    void store.ensureSession('cat-1', 'easy');
    flushMicrotasks();

    tick(30_100);
    flushMicrotasks();
    tick(800);
    flushMicrotasks();

    expect(quizApiMock.answerQuestion).toHaveBeenCalledTimes(1);
    expect(quizApiMock.answerQuestion).toHaveBeenCalledWith('session-1', {
      questionToken: 'token-1',
      selectedOption: '__timeout__',
    });
    expect(store.completed()).toBeTrue();
  }));

  it('blokuje wieloklik podczas wysylki odpowiedzi', fakeAsync(() => {
    const answerSubject = new Subject<AnswerQuestionResponse>();
    const firstQuestion: NextQuestionResponse = {
      sessionId: 'session-1',
      categoryId: 'cat-1',
      tier: 'easy',
      completed: false,
      progress: { totalWords: 2, answeredWords: 0, remainingWords: 2, sessionAccuracy: 0 },
      question: {
        wordId: 'w1',
        prompt: 'kot',
        options: ['cat', 'dog', 'bird', 'fish'],
        issuedAt: new Date().toISOString(),
        questionToken: 'token-1',
      },
    };

    quizApiMock.startSession.and.returnValue(of(startedSession));
    quizApiMock.getNextQuestion.and.returnValue(of(firstQuestion));
    quizApiMock.answerQuestion.and.returnValue(answerSubject.asObservable());

    void store.ensureSession('cat-1', 'easy');
    flushMicrotasks();

    void store.submitAnswer('cat');
    void store.submitAnswer('cat');
    flushMicrotasks();

    expect(quizApiMock.answerQuestion).toHaveBeenCalledTimes(1);
  }));

  it('wznawia aktywna sesje z localStorage', fakeAsync(() => {
    const activeQuestion: NextQuestionResponse = {
      sessionId: 'session-1',
      categoryId: 'cat-1',
      tier: 'easy',
      completed: false,
      progress: { totalWords: 3, answeredWords: 1, remainingWords: 2, sessionAccuracy: 100 },
      question: {
        wordId: 'w2',
        prompt: 'pies',
        options: ['dog', 'cat', 'bird', 'fish'],
        issuedAt: new Date().toISOString(),
        questionToken: 'token-2',
      },
    };

    localStorage.setItem(
      'fiszki.activeQuizSession',
      JSON.stringify({
        sessionId: 'session-1',
        categoryId: 'cat-1',
        tier: 'easy',
        savedAt: new Date().toISOString(),
      }),
    );

    quizApiMock.getNextQuestion.and.returnValue(of(activeQuestion));

    let restoreResult: unknown = null;
    void store.restorePersistedSession().then((result) => {
      restoreResult = result;
    });
    flushMicrotasks();

    expect(quizApiMock.getNextQuestion).toHaveBeenCalledWith('session-1');
    const quizRestore = restoreResult as {
      kind: 'quiz';
      categoryId: string;
      tier: 'easy' | 'hard' | 'expert';
      sessionId: string;
    };
    expect(quizRestore.kind).toBe('quiz');
    expect(quizRestore.categoryId).toBe('cat-1');
    expect(quizRestore.tier).toBe('easy');
    expect(quizRestore.sessionId).toBe('session-1');
    expect(store.question()?.prompt).toBe('pies');
  }));

  it('przekierowuje restore na summary gdy sesja jest juz ukonczona', fakeAsync(() => {
    const completedResponse: NextQuestionResponse = {
      sessionId: 'session-1',
      categoryId: 'cat-1',
      tier: 'easy',
      completed: true,
      progress: { totalWords: 3, answeredWords: 3, remainingWords: 0, sessionAccuracy: 66.67 },
      question: null,
    };

    localStorage.setItem(
      'fiszki.activeQuizSession',
      JSON.stringify({
        sessionId: 'session-1',
        categoryId: 'cat-1',
        tier: 'easy',
        savedAt: new Date().toISOString(),
      }),
    );

    quizApiMock.getNextQuestion.and.returnValue(of(completedResponse));
    quizApiMock.finishSession.and.returnValue(
      of({
        sessionId: 'session-1',
        categoryId: 'cat-1',
        tier: 'easy',
        status: 'finished',
        idempotent: true,
        score: 3,
        accuracy: 66.67,
        finishedAt: new Date().toISOString(),
        progress: completedResponse.progress,
        tierCompleted: false,
        rewards: {
          basePoints: 0,
          accuracyBonusPoints: 0,
          antiGrindMultiplier: 1,
          grantedPoints: 0,
          repeatPointsToday: 0,
          repeatPointsCap: 100,
        },
        wallet: {
          pointsBalance: 120,
          lifetimePoints: 300,
        },
      }),
    );

    let restoreResult: unknown = null;
    void store.restorePersistedSession().then((result) => {
      restoreResult = result;
    });
    flushMicrotasks();

    const summaryRestore = restoreResult as { kind: 'summary'; sessionId: string };
    expect(summaryRestore.kind).toBe('summary');
    expect(summaryRestore.sessionId).toBe('session-1');
    expect(localStorage.getItem('fiszki.activeQuizSession')).toBeNull();
    expect(store.finalSummary()?.sessionId).toBe('session-1');
  }));
});
