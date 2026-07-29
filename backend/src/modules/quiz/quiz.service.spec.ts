import { UnauthorizedException } from '@nestjs/common';
import { QuizService } from './quiz.service';

describe('QuizService', () => {
  const user = { userId: 'user-1', email: 'u@example.com' };

  it('treats answer after 30s as timeout and incorrect', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(100_000);
    const repo = {
      getSessionOrThrow: jest.fn().mockResolvedValue({
        id: 's1',
        category_id: 'c1',
        tier: 'easy',
      }),
      validateSessionWord: jest.fn().mockResolvedValue({
        id: 'w1',
        target_word: 'hola',
      }),
      saveAnswerAndUpdateProgress: jest.fn().mockResolvedValue({
        sessionProgress: {
          totalWords: 10,
          answeredWords: 1,
          remainingWords: 9,
          sessionAccuracy: 0,
        },
        wordProgress: {
          wordId: 'w1',
          correctCount: 0,
          wrongCount: 1,
          requiredCorrect: 6,
          mastered: false,
        },
      }),
    };
    const tokenService = {
      verify: jest.fn().mockReturnValue({
        sessionId: 's1',
        userId: 'user-1',
        wordId: 'w1',
        issuedAtMs: 69_000,
      }),
      create: jest.fn(),
    };

    const service = new QuizService(repo as never, tokenService as never);
    const response = await service.answerQuestion(user, 's1', {
      questionToken: 'token',
      selectedOption: 'hola',
    });

    expect(response.wasTimeout).toBe(true);
    expect(response.isCorrect).toBe(false);
    expect(repo.saveAnswerAndUpdateProgress).toHaveBeenCalledWith(
      expect.objectContaining({
        isCorrect: false,
        selectedOption: '__timeout__',
      }),
    );

    nowSpy.mockRestore();
  });

  it('rejects answer for token bound to another session', async () => {
    const repo = {
      getSessionOrThrow: jest.fn().mockResolvedValue({
        id: 's1',
        category_id: 'c1',
        tier: 'easy',
      }),
      validateSessionWord: jest.fn(),
      saveAnswerAndUpdateProgress: jest.fn(),
    };
    const tokenService = {
      verify: jest.fn().mockReturnValue({
        sessionId: 's2',
        userId: 'user-1',
        wordId: 'w1',
        issuedAtMs: Date.now(),
      }),
      create: jest.fn(),
    };

    const service = new QuizService(repo as never, tokenService as never);
    await expect(
      service.answerQuestion(user, 's1', {
        questionToken: 'token',
        selectedOption: 'hola',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('supports core flow start -> next -> answer -> finish', async () => {
    const repo = {
      startSession: jest.fn().mockResolvedValue({
        sessionId: 's1',
        status: 'active',
        categoryId: 'c1',
        tier: 'easy',
        resumed: false,
        startedAt: new Date().toISOString(),
      }),
      getSessionOrThrow: jest.fn().mockResolvedValue({
        id: 's1',
        category_id: 'c1',
        tier: 'easy',
      }),
      getSessionProgressMeta: jest.fn().mockResolvedValue({
        totalWords: 10,
        answeredWords: 0,
        remainingWords: 10,
        sessionAccuracy: 0,
      }),
      getNextQuestionCandidate: jest.fn().mockResolvedValue({
        id: 'w1',
        source_word: 'dom',
        target_word: 'casa',
      }),
      getDistractors: jest.fn().mockResolvedValue(['perro', 'gato', 'mesa']),
      validateSessionWord: jest.fn().mockResolvedValue({
        id: 'w1',
        target_word: 'casa',
      }),
      saveAnswerAndUpdateProgress: jest.fn().mockResolvedValue({
        sessionProgress: {
          totalWords: 10,
          answeredWords: 1,
          remainingWords: 9,
          sessionAccuracy: 100,
        },
        wordProgress: {
          wordId: 'w1',
          correctCount: 1,
          wrongCount: 0,
          requiredCorrect: 3,
          mastered: false,
        },
      }),
      finishSession: jest.fn().mockResolvedValue({
        sessionId: 's1',
        categoryId: 'c1',
        tier: 'easy',
        status: 'finished',
        idempotent: false,
        score: 10,
        accuracy: 100,
        finishedAt: new Date().toISOString(),
        progress: {
          totalWords: 10,
          answeredWords: 10,
          remainingWords: 0,
          sessionAccuracy: 100,
        },
        tierCompleted: true,
        rewards: {
          basePoints: 20,
          accuracyBonusPoints: 6,
          antiGrindMultiplier: 1,
          grantedPoints: 26,
          repeatPointsToday: 0,
          repeatPointsCap: 120,
        },
        wallet: {
          pointsBalance: 26,
          lifetimePoints: 26,
        },
      }),
    };
    const tokenService = {
      create: jest.fn().mockReturnValue('token-1'),
      verify: jest.fn().mockReturnValue({
        sessionId: 's1',
        userId: 'user-1',
        wordId: 'w1',
        issuedAtMs: Date.now(),
      }),
    };

    const service = new QuizService(repo as never, tokenService as never);
    const started = await service.startSession(user, {
      categoryId: 'c1',
      tier: 'easy',
    });
    const next = await service.getNextQuestion(user, started.sessionId);
    const answered = await service.answerQuestion(user, started.sessionId, {
      questionToken: 'token-1',
      selectedOption: 'casa',
    });
    const finished = await service.finishSession(user, started.sessionId);

    expect(started.status).toBe('active');
    expect(next.completed).toBe(false);
    expect(next.question?.questionToken).toBe('token-1');
    expect(answered.isCorrect).toBe(true);
    expect(finished.status).toBe('finished');
  });
});
