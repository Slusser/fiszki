import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { AnswerQuestionDto } from './dto/answer-question.dto';
import type { AnswerQuestionResponseDto } from './dto/answer-question-response.dto';
import type { FinishQuizSessionResponseDto } from './dto/finish-quiz-session-response.dto';
import type { NextQuestionResponseDto } from './dto/next-question-response.dto';
import type { QuizTier } from './dto/quiz-tier.dto';
import type { StartQuizSessionResponseDto } from './dto/start-quiz-session-response.dto';
import type { StartQuizSessionDto } from './dto/start-quiz-session.dto';
import { QuizQuestionTokenService } from './quiz-question-token.service';
import { QuizRepository } from './quiz.repository';

const QUESTION_TIMEOUT_MS = 30_000;

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly quizRepository: QuizRepository,
    private readonly quizQuestionTokenService: QuizQuestionTokenService,
  ) {}

  startSession(
    user: AuthUserDto,
    payload: StartQuizSessionDto,
  ): Promise<StartQuizSessionResponseDto> {
    const startedAt = Date.now();
    return this.quizRepository
      .startSession(user.userId, payload.categoryId, payload.tier)
      .finally(() => {
        this.logger.debug(
          `startSession user=${user.userId} tier=${payload.tier} took=${Date.now() - startedAt}ms`,
        );
      });
  }

  async getNextQuestion(user: AuthUserDto, sessionId: string): Promise<NextQuestionResponseDto> {
    const startedAt = Date.now();
    const session = await this.quizRepository.getSessionOrThrow(sessionId, user.userId);
    const progress = await this.quizRepository.getSessionProgressMeta(
      session.id,
      session.category_id,
      session.tier,
    );

    const candidate = await this.quizRepository.getNextQuestionCandidate(
      session.id,
      session.category_id,
      session.tier,
    );

    if (!candidate) {
      const response = {
        sessionId: session.id,
        categoryId: session.category_id,
        tier: session.tier,
        completed: true,
        progress,
        question: null,
      };
      this.logger.debug(
        `nextQuestion user=${user.userId} session=${sessionId} completed=true took=${Date.now() - startedAt}ms`,
      );
      return response;
    }

    const distractors = await this.quizRepository.getDistractors(
      session.category_id,
      session.tier,
      candidate.id,
    );
    const options = this.shuffle([candidate.target_word, ...distractors]);
    const issuedAtMs = Date.now();
    const questionToken = this.quizQuestionTokenService.create({
      sessionId: session.id,
      userId: user.userId,
      wordId: candidate.id,
      issuedAtMs,
    });

    const response = {
      sessionId: session.id,
      categoryId: session.category_id,
      tier: session.tier,
      completed: false,
      progress,
      question: {
        wordId: candidate.id,
        prompt: candidate.source_word,
        options,
        issuedAt: new Date(issuedAtMs).toISOString(),
        questionToken,
      },
    };
    this.logger.debug(
      `nextQuestion user=${user.userId} session=${sessionId} took=${Date.now() - startedAt}ms`,
    );
    return response;
  }

  async answerQuestion(
    user: AuthUserDto,
    sessionId: string,
    payload: AnswerQuestionDto,
  ): Promise<AnswerQuestionResponseDto> {
    const startedAt = Date.now();
    const session = await this.quizRepository.getSessionOrThrow(sessionId, user.userId);
    const tokenPayload = this.quizQuestionTokenService.verify(payload.questionToken);

    if (tokenPayload.sessionId !== session.id || tokenPayload.userId !== user.userId) {
      throw new UnauthorizedException('Question token does not match current session');
    }

    const elapsedMs = Date.now() - tokenPayload.issuedAtMs;
    if (elapsedMs < 0) {
      throw new BadRequestException('Question token timestamp is invalid');
    }

    const word = await this.quizRepository.validateSessionWord(
      session.id,
      session.category_id,
      session.tier as QuizTier,
      tokenPayload.wordId,
    );

    const wasTimeout = elapsedMs > QUESTION_TIMEOUT_MS;
    const normalizedSelectedOption = payload.selectedOption.trim();
    const isCorrect = !wasTimeout && normalizedSelectedOption === word.target_word;
    const recordedOption = wasTimeout ? '__timeout__' : normalizedSelectedOption;

    const result = await this.quizRepository.saveAnswerAndUpdateProgress({
      userId: user.userId,
      sessionId: session.id,
      categoryId: session.category_id,
      tier: session.tier as QuizTier,
      wordId: word.id,
      selectedOption: recordedOption,
      isCorrect,
    });

    const response = {
      sessionId: session.id,
      wordId: word.id,
      isCorrect,
      wasTimeout,
      recordedOption,
      progress: result.sessionProgress,
      wordProgress: result.wordProgress,
    };
    this.logger.debug(
      `answerQuestion user=${user.userId} session=${sessionId} timeout=${wasTimeout} took=${Date.now() - startedAt}ms`,
    );
    return response;
  }

  finishSession(user: AuthUserDto, sessionId: string): Promise<FinishQuizSessionResponseDto> {
    const startedAt = Date.now();
    return this.quizRepository.finishSession(user.userId, sessionId).finally(() => {
      this.logger.debug(
        `finishSession user=${user.userId} session=${sessionId} took=${Date.now() - startedAt}ms`,
      );
    });
  }

  private shuffle<T>(items: T[]): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
    }
    return arr;
  }
}
