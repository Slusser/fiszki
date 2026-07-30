import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../common/database/database.service';
import {
  REPEAT_POINTS_DAILY_CAP,
  RewardsService,
} from '../rewards/rewards.service';
import type { SessionProgressMetaDto } from './dto/next-question-response.dto';
import type {
  FinishQuizSessionResponseDto,
  RewardBreakdownDto,
} from './dto/finish-quiz-session-response.dto';
import type { QuizTier } from './dto/quiz-tier.dto';
import type { StartQuizSessionResponseDto } from './dto/start-quiz-session-response.dto';
import type { WordProgressSnapshotDto } from './dto/answer-question-response.dto';

interface SessionRow {
  id: string;
  user_id: string;
  category_id: string;
  tier: QuizTier;
  status: 'in_progress' | 'finished' | 'abandoned';
  started_at: string;
}

interface CategoryAccessRow {
  id: string;
}

interface WordRow {
  id: string;
  source_word: string;
  target_word: string;
}

interface ProgressRow {
  correct_count: number | string;
  wrong_count: number | string;
  required_correct: number | string;
  mastered: boolean;
}

interface SessionStatsRow {
  total_words: number | string;
  mastered_words: number | string;
  answered_attempts: number | string;
  correct_answers: number | string;
}

interface WalletSnapshotRow {
  points_balance: number | string;
  lifetime_points: number | string;
}

interface SessionRewardLedgerRow {
  delta: number | string;
  reason: string;
}

@Injectable()
export class QuizRepository {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly rewardsService: RewardsService,
  ) {}

  async startSession(
    userId: string,
    categoryId: string,
    tier: QuizTier,
  ): Promise<StartQuizSessionResponseDto> {
    await this.ensureCategoryAccess(userId, categoryId);

    const existingSession = await this.databaseService.query<SessionRow>(
      `
        select id, user_id, category_id, tier, status, started_at::text as started_at
        from public.quiz_sessions
        where user_id = $1
          and category_id = $2
          and tier = $3
          and status = 'in_progress'
        order by started_at desc
        limit 1
      `,
      [userId, categoryId, tier],
    );

    const session = existingSession.rows[0];
    if (session) {
      return {
        sessionId: session.id,
        status: 'active',
        categoryId: session.category_id,
        tier: session.tier,
        resumed: true,
        startedAt: session.started_at,
      };
    }

    const inserted = await this.databaseService.query<SessionRow>(
      `
        insert into public.quiz_sessions (user_id, category_id, tier, status)
        values ($1, $2, $3, 'in_progress')
        returning id, user_id, category_id, tier, status, started_at::text as started_at
      `,
      [userId, categoryId, tier],
    );

    const created = inserted.rows[0];
    if (!created) {
      throw new BadRequestException('Cannot start quiz session');
    }

    return {
      sessionId: created.id,
      status: 'active',
      categoryId: created.category_id,
      tier: created.tier,
      resumed: false,
      startedAt: created.started_at,
    };
  }

  async getSessionOrThrow(
    sessionId: string,
    userId: string,
  ): Promise<SessionRow> {
    const result = await this.databaseService.query<SessionRow>(
      `
        select id, user_id, category_id, tier, status, started_at::text as started_at
        from public.quiz_sessions
        where id = $1
          and user_id = $2
        limit 1
      `,
      [sessionId, userId],
    );

    const session = result.rows[0];
    if (!session) {
      throw new NotFoundException('Quiz session not found');
    }

    if (session.status !== 'in_progress') {
      throw new BadRequestException('Quiz session is not active');
    }

    return session;
  }

  async getNextQuestionCandidate(
    userId: string,
    categoryId: string,
    tier: QuizTier,
  ): Promise<WordRow | null> {
    const result = await this.databaseService.query<WordRow>(
      `
        select w.id, w.source_word, w.target_word
        from public.words w
        left join public.user_word_progress uwp
          on uwp.word_id = w.id
          and uwp.user_id = $1
          and uwp.tier = $2
        where w.category_id = $3
          and w.tier = $2
          and w.is_active = true
          and coalesce(uwp.mastered, false) = false
        order by random()
        limit 1
      `,
      [userId, tier, categoryId],
    );

    return result.rows[0] ?? null;
  }

  async getDistractors(
    categoryId: string,
    tier: QuizTier,
    wordId: string,
  ): Promise<string[]> {
    const result = await this.databaseService.query<{ target_word: string }>(
      `
        select w.target_word
        from public.words w
        where w.category_id = $1
          and w.tier = $2
          and w.id <> $3
          and w.is_active = true
        order by random()
        limit 3
      `,
      [categoryId, tier, wordId],
    );

    const distractors = result.rows.map((row) => row.target_word);
    if (distractors.length < 3) {
      throw new UnprocessableEntityException(
        'Not enough distractors in this category and tier',
      );
    }

    return distractors;
  }

  async getSessionProgressMeta(
    sessionId: string,
    userId: string,
    categoryId: string,
    tier: QuizTier,
  ): Promise<SessionProgressMetaDto> {
    const result = await this.databaseService.query<SessionStatsRow>(
      `
        select
          (
            select count(*)::int
            from public.words w
            where w.category_id = $3
              and w.tier = $4
              and w.is_active = true
          ) as total_words,
          (
            select coalesce(sum(case when uwp.mastered then 1 else 0 end), 0)::int
            from public.words w
            left join public.user_word_progress uwp
              on uwp.word_id = w.id
              and uwp.user_id = $2
              and uwp.tier = $4
            where w.category_id = $3
              and w.tier = $4
              and w.is_active = true
          ) as mastered_words,
          count(qa.id)::int as answered_attempts,
          coalesce(sum(case when qa.is_correct then 1 else 0 end), 0)::int as correct_answers
        from public.quiz_answers qa
        where qa.session_id = $1
      `,
      [sessionId, userId, categoryId, tier],
    );

    const row = result.rows[0];
    const totalWords = Number(row?.total_words ?? 0);
    const masteredWords = Number(row?.mastered_words ?? 0);
    const answeredAttempts = Number(row?.answered_attempts ?? 0);
    const correctAnswers = Number(row?.correct_answers ?? 0);
    const remainingWords = Math.max(totalWords - masteredWords, 0);
    const sessionAccuracy =
      answeredAttempts > 0
        ? Number(((correctAnswers / answeredAttempts) * 100).toFixed(2))
        : 0;

    return {
      totalWords,
      answeredWords: masteredWords,
      remainingWords,
      sessionAccuracy,
    };
  }

  async validateSessionWord(
    sessionId: string,
    categoryId: string,
    tier: QuizTier,
    wordId: string,
  ): Promise<WordRow> {
    const result = await this.databaseService.query<WordRow>(
      `
        select id, source_word, target_word
        from public.words
        where id = $1
          and category_id = $2
          and tier = $3
          and is_active = true
        limit 1
      `,
      [wordId, categoryId, tier],
    );

    const word = result.rows[0];
    if (!word) {
      throw new ForbiddenException('Question does not belong to this session');
    }

    return word;
  }

  async saveAnswerAndUpdateProgress(params: {
    userId: string;
    sessionId: string;
    categoryId: string;
    tier: QuizTier;
    wordId: string;
    selectedOption: string;
    isCorrect: boolean;
  }): Promise<{
    wordProgress: WordProgressSnapshotDto;
    sessionProgress: SessionProgressMetaDto;
  }> {
    const client = await this.databaseService.getClient();

    try {
      await client.query('begin');

      await this.ensureSessionStillActive(
        client,
        params.sessionId,
        params.userId,
      );
      await this.insertQuizAnswer(
        client,
        params.sessionId,
        params.wordId,
        params.selectedOption,
        params.isCorrect,
      );
      const wordProgress = await this.upsertWordProgress(
        client,
        params.userId,
        params.wordId,
        params.tier,
        params.isCorrect,
      );
      const sessionProgress = await this.getSessionProgressMetaWithClient(
        client,
        params.sessionId,
        params.userId,
        params.categoryId,
        params.tier,
      );

      await client.query('commit');

      return {
        wordProgress: { ...wordProgress, wordId: params.wordId },
        sessionProgress,
      };
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  async finishSession(
    userId: string,
    sessionId: string,
  ): Promise<FinishQuizSessionResponseDto> {
    const client = await this.databaseService.getClient();

    try {
      await client.query('begin');

      const session = await this.getSessionForFinishWithLock(
        client,
        sessionId,
        userId,
      );
      if (session.status === 'finished') {
        const replay = await this.buildAlreadyFinishedResponse(
          client,
          session,
          userId,
        );
        await client.query('commit');
        return replay;
      }

      if (session.status !== 'in_progress') {
        throw new BadRequestException('Quiz session cannot be finished');
      }

      const progress = await this.getSessionProgressMetaWithClient(
        client,
        session.id,
        userId,
        session.category_id,
        session.tier,
      );

      if (progress.totalWords === 0) {
        throw new BadRequestException('Cannot finish empty quiz session');
      }

      if (progress.remainingWords > 0) {
        throw new BadRequestException(
          'Quiz session still has unanswered questions',
        );
      }

      const score = progress.answeredWords;
      const accuracy = progress.sessionAccuracy;
      const finishedAt = new Date().toISOString();

      await client.query(
        `
          update public.quiz_sessions
          set
            status = 'finished',
            finished_at = $2::timestamptz,
            score = $3,
            accuracy = $4
          where id = $1
        `,
        [session.id, finishedAt, score, accuracy],
      );

      const tierCompleted = await this.isTierCompleted(
        client,
        userId,
        session.category_id,
        session.tier,
      );
      const { rewardBreakdown, ledgerSnapshot } =
        await this.rewardsService.applyReward({
          client,
          userId,
          sessionId: session.id,
          categoryId: session.category_id,
          tier: session.tier,
          accuracy,
          tierCompleted,
        });
      const wallet = await this.getWalletSnapshot(client, userId);

      await client.query('commit');

      return {
        sessionId: session.id,
        categoryId: session.category_id,
        tier: session.tier,
        status: 'finished',
        idempotent: false,
        score,
        accuracy,
        finishedAt,
        progress,
        tierCompleted,
        rewards: rewardBreakdown,
        rewardLedger: ledgerSnapshot,
        wallet,
      };
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  private async ensureCategoryAccess(
    userId: string,
    categoryId: string,
  ): Promise<void> {
    const result = await this.databaseService.query<CategoryAccessRow>(
      `
        select c.id
        from public.categories c
        left join public.user_category_unlocks u
          on u.category_id = c.id
          and u.user_id = $1
        where c.id = $2
          and c.is_active = true
          and (c.unlock_cost = 0 or u.id is not null)
        limit 1
      `,
      [userId, categoryId],
    );

    if (!result.rows[0]) {
      throw new ForbiddenException('Category is locked or unavailable');
    }
  }

  private async ensureSessionStillActive(
    client: PoolClient,
    sessionId: string,
    userId: string,
  ): Promise<void> {
    const result = await client.query<SessionRow>(
      `
        select id, user_id, category_id, tier, status, started_at::text as started_at
        from public.quiz_sessions
        where id = $1
          and user_id = $2
        for update
      `,
      [sessionId, userId],
    );

    const session = result.rows[0];
    if (!session) {
      throw new NotFoundException('Quiz session not found');
    }

    if (session.status !== 'in_progress') {
      throw new BadRequestException('Quiz session is not active');
    }
  }

  private async insertQuizAnswer(
    client: PoolClient,
    sessionId: string,
    wordId: string,
    selectedOption: string,
    isCorrect: boolean,
  ): Promise<void> {
    await client.query(
      `
        insert into public.quiz_answers (session_id, word_id, selected_option, is_correct)
        values ($1, $2, $3, $4)
      `,
      [sessionId, wordId, selectedOption, isCorrect],
    );
  }

  private async upsertWordProgress(
    client: PoolClient,
    userId: string,
    wordId: string,
    tier: QuizTier,
    isCorrect: boolean,
  ): Promise<Omit<WordProgressSnapshotDto, 'wordId'>> {
    const result = await client.query<ProgressRow>(
      `
        insert into public.user_word_progress (
          user_id,
          word_id,
          tier,
          correct_count,
          required_correct,
          wrong_count,
          mastered,
          updated_at
        )
        values (
          $1,
          $2,
          $3,
          case when $4 then 1 else 0 end,
          case when $4 then 3 else 6 end,
          case when $4 then 0 else 1 end,
          false,
          now()
        )
        on conflict (user_id, word_id, tier)
        do update set
          correct_count = user_word_progress.correct_count + case when $4 then 1 else 0 end,
          wrong_count = user_word_progress.wrong_count + case when $4 then 0 else 1 end,
          required_correct = case
            when $4 then user_word_progress.required_correct
            else least(13, user_word_progress.required_correct + 3)
          end,
          mastered = case
            when $4
              then (user_word_progress.correct_count + 1) >= user_word_progress.required_correct
            else user_word_progress.correct_count >= least(13, user_word_progress.required_correct + 3)
          end,
          updated_at = now()
        returning correct_count, wrong_count, required_correct, mastered
      `,
      [userId, wordId, tier, isCorrect],
    );

    const row = result.rows[0];
    if (!row) {
      throw new BadRequestException('Cannot update word progression');
    }

    return {
      correctCount: Number(row.correct_count),
      wrongCount: Number(row.wrong_count),
      requiredCorrect: Number(row.required_correct),
      mastered: row.mastered,
    };
  }

  private async getSessionProgressMetaWithClient(
    client: PoolClient,
    sessionId: string,
    userId: string,
    categoryId: string,
    tier: QuizTier,
  ): Promise<SessionProgressMetaDto> {
    const result = await client.query<SessionStatsRow>(
      `
        select
          (
            select count(*)::int
            from public.words w
            where w.category_id = $3
              and w.tier = $4
              and w.is_active = true
          ) as total_words,
          (
            select coalesce(sum(case when uwp.mastered then 1 else 0 end), 0)::int
            from public.words w
            left join public.user_word_progress uwp
              on uwp.word_id = w.id
              and uwp.user_id = $2
              and uwp.tier = $4
            where w.category_id = $3
              and w.tier = $4
              and w.is_active = true
          ) as mastered_words,
          count(qa.id)::int as answered_attempts,
          coalesce(sum(case when qa.is_correct then 1 else 0 end), 0)::int as correct_answers
        from public.quiz_answers qa
        where qa.session_id = $1
      `,
      [sessionId, userId, categoryId, tier],
    );

    const row = result.rows[0];
    const totalWords = Number(row?.total_words ?? 0);
    const masteredWords = Number(row?.mastered_words ?? 0);
    const answeredAttempts = Number(row?.answered_attempts ?? 0);
    const correctAnswers = Number(row?.correct_answers ?? 0);

    return {
      totalWords,
      answeredWords: masteredWords,
      remainingWords: Math.max(totalWords - masteredWords, 0),
      sessionAccuracy:
        answeredAttempts > 0
          ? Number(((correctAnswers / answeredAttempts) * 100).toFixed(2))
          : 0,
    };
  }

  private async getSessionForFinishWithLock(
    client: PoolClient,
    sessionId: string,
    userId: string,
  ): Promise<SessionRow> {
    const result = await client.query<SessionRow>(
      `
        select id, user_id, category_id, tier, status, started_at::text as started_at
        from public.quiz_sessions
        where id = $1
          and user_id = $2
        for update
      `,
      [sessionId, userId],
    );

    const session = result.rows[0];
    if (!session) {
      throw new NotFoundException('Quiz session not found');
    }

    return session;
  }

  private async isTierCompleted(
    client: PoolClient,
    userId: string,
    categoryId: string,
    tier: QuizTier,
  ): Promise<boolean> {
    const result = await client.query<{
      total_words: number | string;
      mastered_words: number | string;
    }>(
      `
        select
          count(w.id)::int as total_words,
          coalesce(sum(case when uwp.mastered then 1 else 0 end), 0)::int as mastered_words
        from public.words w
        left join public.user_word_progress uwp
          on uwp.word_id = w.id
          and uwp.user_id = $1
        where w.category_id = $2
          and w.tier = $3
          and w.is_active = true
      `,
      [userId, categoryId, tier],
    );

    const row = result.rows[0];
    const totalWords = Number(row?.total_words ?? 0);
    const masteredWords = Number(row?.mastered_words ?? 0);
    return totalWords > 0 && totalWords === masteredWords;
  }

  private async getWalletSnapshot(
    client: PoolClient,
    userId: string,
  ): Promise<{ pointsBalance: number; lifetimePoints: number }> {
    const result = await client.query<WalletSnapshotRow>(
      `
        select points_balance, lifetime_points
        from public.user_wallet
        where user_id = $1
        limit 1
      `,
      [userId],
    );

    return {
      pointsBalance: Number(result.rows[0]?.points_balance ?? 0),
      lifetimePoints: Number(result.rows[0]?.lifetime_points ?? 0),
    };
  }

  private async buildAlreadyFinishedResponse(
    client: PoolClient,
    session: SessionRow,
    userId: string,
  ): Promise<FinishQuizSessionResponseDto> {
    const sessionState = await client.query<{
      score: number | string | null;
      accuracy: number | string | null;
      finished_at: string | null;
    }>(
      `
        select
          score,
          accuracy,
          finished_at::text as finished_at
        from public.quiz_sessions
        where id = $1
        limit 1
      `,
      [session.id],
    );

    const progress = await this.getSessionProgressMetaWithClient(
      client,
      session.id,
      userId,
      session.category_id,
      session.tier,
    );
    const tierCompleted = await this.isTierCompleted(
      client,
      userId,
      session.category_id,
      session.tier,
    );
    const existingReward = await this.getExistingSessionReward(
      client,
      userId,
      session.id,
    );
    const wallet = await this.getWalletSnapshot(client, userId);
    const row = sessionState.rows[0];

    return {
      sessionId: session.id,
      categoryId: session.category_id,
      tier: session.tier,
      status: 'finished',
      idempotent: true,
      score: Number(row?.score ?? progress.answeredWords),
      accuracy: Number(row?.accuracy ?? progress.sessionAccuracy),
      finishedAt: row?.finished_at ?? new Date().toISOString(),
      progress,
      tierCompleted,
      rewards: existingReward,
      rewardLedger: {
        reason: existingReward.reason,
        delta: existingReward.grantedPoints,
      },
      wallet,
    };
  }

  private async getExistingSessionReward(
    client: PoolClient,
    userId: string,
    sessionId: string,
  ): Promise<RewardBreakdownDto & { reason: string | null }> {
    const result = await client.query<SessionRewardLedgerRow>(
      `
        select delta, reason
        from public.points_ledger
        where user_id = $1
          and reference_type = 'quiz_session'
          and reference_id = $2::uuid
        order by created_at asc
        limit 1
      `,
      [userId, sessionId],
    );

    const grantedPoints = Number(result.rows[0]?.delta ?? 0);
    const reason = result.rows[0]?.reason ?? null;

    return {
      basePoints: 0,
      accuracyBonusPoints: 0,
      grossPoints: grantedPoints,
      antiGrindMultiplier: 1,
      repeatsInLast24h: 0,
      isRepeatReward: reason === 'tier_completed_repeat',
      finalPoints: grantedPoints,
      grantedPoints,
      repeatPointsToday: 0,
      repeatPointsCap: REPEAT_POINTS_DAILY_CAP,
      reason,
    };
  }
}
