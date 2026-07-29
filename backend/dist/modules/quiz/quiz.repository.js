"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../common/database/database.service");
const reward_policy_1 = require("./reward-policy");
let QuizRepository = class QuizRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async startSession(userId, categoryId, tier) {
        await this.ensureCategoryAccess(userId, categoryId);
        const existingSession = await this.databaseService.query(`
        select id, user_id, category_id, tier, status, started_at::text as started_at
        from public.quiz_sessions
        where user_id = $1
          and category_id = $2
          and tier = $3
          and status = 'in_progress'
        order by started_at desc
        limit 1
      `, [userId, categoryId, tier]);
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
        const inserted = await this.databaseService.query(`
        insert into public.quiz_sessions (user_id, category_id, tier, status)
        values ($1, $2, $3, 'in_progress')
        returning id, user_id, category_id, tier, status, started_at::text as started_at
      `, [userId, categoryId, tier]);
        const created = inserted.rows[0];
        if (!created) {
            throw new common_1.BadRequestException('Cannot start quiz session');
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
    async getSessionOrThrow(sessionId, userId) {
        const result = await this.databaseService.query(`
        select id, user_id, category_id, tier, status, started_at::text as started_at
        from public.quiz_sessions
        where id = $1
          and user_id = $2
        limit 1
      `, [sessionId, userId]);
        const session = result.rows[0];
        if (!session) {
            throw new common_1.NotFoundException('Quiz session not found');
        }
        if (session.status !== 'in_progress') {
            throw new common_1.BadRequestException('Quiz session is not active');
        }
        return session;
    }
    async getNextQuestionCandidate(sessionId, categoryId, tier) {
        const result = await this.databaseService.query(`
        select w.id, w.source_word, w.target_word
        from public.words w
        where w.category_id = $1
          and w.tier = $2
          and w.is_active = true
          and not exists (
            select 1
            from public.quiz_answers qa
            where qa.session_id = $3
              and qa.word_id = w.id
          )
        order by random()
        limit 1
      `, [categoryId, tier, sessionId]);
        return result.rows[0] ?? null;
    }
    async getDistractors(categoryId, tier, wordId) {
        const result = await this.databaseService.query(`
        select w.target_word
        from public.words w
        where w.category_id = $1
          and w.tier = $2
          and w.id <> $3
          and w.is_active = true
        order by random()
        limit 3
      `, [categoryId, tier, wordId]);
        const distractors = result.rows.map((row) => row.target_word);
        if (distractors.length < 3) {
            throw new common_1.UnprocessableEntityException('Not enough distractors in this category and tier');
        }
        return distractors;
    }
    async getSessionProgressMeta(sessionId, categoryId, tier) {
        const result = await this.databaseService.query(`
        select
          (
            select count(*)::int
            from public.words w
            where w.category_id = $2
              and w.tier = $3
              and w.is_active = true
          ) as total_words,
          count(qa.id)::int as answered_words,
          coalesce(sum(case when qa.is_correct then 1 else 0 end), 0)::int as correct_answers
        from public.quiz_answers qa
        where qa.session_id = $1
      `, [sessionId, categoryId, tier]);
        const row = result.rows[0];
        const totalWords = Number(row?.total_words ?? 0);
        const answeredWords = Number(row?.answered_words ?? 0);
        const correctAnswers = Number(row?.correct_answers ?? 0);
        const remainingWords = Math.max(totalWords - answeredWords, 0);
        const sessionAccuracy = answeredWords > 0 ? Number(((correctAnswers / answeredWords) * 100).toFixed(2)) : 0;
        return {
            totalWords,
            answeredWords,
            remainingWords,
            sessionAccuracy,
        };
    }
    async validateSessionWord(sessionId, categoryId, tier, wordId) {
        const result = await this.databaseService.query(`
        select id, source_word, target_word
        from public.words
        where id = $1
          and category_id = $2
          and tier = $3
          and is_active = true
        limit 1
      `, [wordId, categoryId, tier]);
        const word = result.rows[0];
        if (!word) {
            throw new common_1.ForbiddenException('Question does not belong to this session');
        }
        const alreadyAnswered = await this.databaseService.query(`
        select id
        from public.quiz_answers
        where session_id = $1
          and word_id = $2
        limit 1
      `, [sessionId, wordId]);
        if (alreadyAnswered.rows[0]) {
            throw new common_1.ConflictException('Question already answered');
        }
        return word;
    }
    async saveAnswerAndUpdateProgress(params) {
        const client = await this.databaseService.getClient();
        try {
            await client.query('begin');
            await this.ensureSessionStillActive(client, params.sessionId, params.userId);
            await this.insertQuizAnswer(client, params.sessionId, params.wordId, params.selectedOption, params.isCorrect);
            const wordProgress = await this.upsertWordProgress(client, params.userId, params.wordId, params.tier, params.isCorrect);
            const sessionProgress = await this.getSessionProgressMetaWithClient(client, params.sessionId, params.categoryId, params.tier);
            await client.query('commit');
            return { wordProgress: { ...wordProgress, wordId: params.wordId }, sessionProgress };
        }
        catch (error) {
            await client.query('rollback');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async finishSession(userId, sessionId) {
        const client = await this.databaseService.getClient();
        try {
            await client.query('begin');
            const session = await this.getSessionForFinishWithLock(client, sessionId, userId);
            if (session.status === 'finished') {
                const replay = await this.buildAlreadyFinishedResponse(client, session, userId);
                await client.query('commit');
                return replay;
            }
            if (session.status !== 'in_progress') {
                throw new common_1.BadRequestException('Quiz session cannot be finished');
            }
            const progress = await this.getSessionProgressMetaWithClient(client, session.id, session.category_id, session.tier);
            if (progress.totalWords === 0) {
                throw new common_1.BadRequestException('Cannot finish empty quiz session');
            }
            if (progress.remainingWords > 0) {
                throw new common_1.BadRequestException('Quiz session still has unanswered questions');
            }
            const score = progress.answeredWords;
            const accuracy = progress.sessionAccuracy;
            const finishedAt = new Date().toISOString();
            await client.query(`
          update public.quiz_sessions
          set
            status = 'finished',
            finished_at = $2::timestamptz,
            score = $3,
            accuracy = $4
          where id = $1
        `, [session.id, finishedAt, score, accuracy]);
            const tierCompleted = await this.isTierCompleted(client, userId, session.category_id, session.tier);
            const rewards = await this.applyFinishRewards(client, userId, session.id, session.tier, accuracy, tierCompleted);
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
                rewards,
                wallet,
            };
        }
        catch (error) {
            await client.query('rollback');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async ensureCategoryAccess(userId, categoryId) {
        const result = await this.databaseService.query(`
        select c.id
        from public.categories c
        left join public.user_category_unlocks u
          on u.category_id = c.id
          and u.user_id = $1
        where c.id = $2
          and c.is_active = true
          and (c.unlock_cost = 0 or u.id is not null)
        limit 1
      `, [userId, categoryId]);
        if (!result.rows[0]) {
            throw new common_1.ForbiddenException('Category is locked or unavailable');
        }
    }
    async ensureSessionStillActive(client, sessionId, userId) {
        const result = await client.query(`
        select id, user_id, category_id, tier, status, started_at::text as started_at
        from public.quiz_sessions
        where id = $1
          and user_id = $2
        for update
      `, [sessionId, userId]);
        const session = result.rows[0];
        if (!session) {
            throw new common_1.NotFoundException('Quiz session not found');
        }
        if (session.status !== 'in_progress') {
            throw new common_1.BadRequestException('Quiz session is not active');
        }
    }
    async insertQuizAnswer(client, sessionId, wordId, selectedOption, isCorrect) {
        await client.query(`
        insert into public.quiz_answers (session_id, word_id, selected_option, is_correct)
        values ($1, $2, $3, $4)
      `, [sessionId, wordId, selectedOption, isCorrect]);
    }
    async upsertWordProgress(client, userId, wordId, tier, isCorrect) {
        const result = await client.query(`
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
      `, [userId, wordId, tier, isCorrect]);
        const row = result.rows[0];
        if (!row) {
            throw new common_1.BadRequestException('Cannot update word progression');
        }
        return {
            correctCount: Number(row.correct_count),
            wrongCount: Number(row.wrong_count),
            requiredCorrect: Number(row.required_correct),
            mastered: row.mastered,
        };
    }
    async getSessionProgressMetaWithClient(client, sessionId, categoryId, tier) {
        const result = await client.query(`
        select
          (
            select count(*)::int
            from public.words w
            where w.category_id = $2
              and w.tier = $3
              and w.is_active = true
          ) as total_words,
          count(qa.id)::int as answered_words,
          coalesce(sum(case when qa.is_correct then 1 else 0 end), 0)::int as correct_answers
        from public.quiz_answers qa
        where qa.session_id = $1
      `, [sessionId, categoryId, tier]);
        const row = result.rows[0];
        const totalWords = Number(row?.total_words ?? 0);
        const answeredWords = Number(row?.answered_words ?? 0);
        const correctAnswers = Number(row?.correct_answers ?? 0);
        return {
            totalWords,
            answeredWords,
            remainingWords: Math.max(totalWords - answeredWords, 0),
            sessionAccuracy: answeredWords > 0 ? Number(((correctAnswers / answeredWords) * 100).toFixed(2)) : 0,
        };
    }
    async getSessionForFinishWithLock(client, sessionId, userId) {
        const result = await client.query(`
        select id, user_id, category_id, tier, status, started_at::text as started_at
        from public.quiz_sessions
        where id = $1
          and user_id = $2
        for update
      `, [sessionId, userId]);
        const session = result.rows[0];
        if (!session) {
            throw new common_1.NotFoundException('Quiz session not found');
        }
        return session;
    }
    async isTierCompleted(client, userId, categoryId, tier) {
        const result = await client.query(`
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
      `, [userId, categoryId, tier]);
        const row = result.rows[0];
        const totalWords = Number(row?.total_words ?? 0);
        const masteredWords = Number(row?.mastered_words ?? 0);
        return totalWords > 0 && totalWords === masteredWords;
    }
    async applyFinishRewards(client, userId, sessionId, tier, accuracy, tierCompleted) {
        const basePoints = tierCompleted ? reward_policy_1.TIER_BASE_POINTS[tier] : 0;
        const accuracyBonusPoints = tierCompleted
            ? (0, reward_policy_1.calculateAccuracyBonus)(basePoints, accuracy)
            : 0;
        const grossPoints = basePoints + accuracyBonusPoints;
        const repeatResult = await client.query(`
        select
          count(*)::int as reward_count_today,
          coalesce(sum(case when reason = 'session_finish_reward_repeat' then delta else 0 end), 0)::int as repeat_points_today
        from public.points_ledger
        where user_id = $1
          and reason in ('session_finish_reward_first', 'session_finish_reward_repeat')
          and created_at >= date_trunc('day', now())
      `, [userId]);
        const rewardCountToday = Number(repeatResult.rows[0]?.reward_count_today ?? 0);
        const repeatPointsToday = Number(repeatResult.rows[0]?.repeat_points_today ?? 0);
        const antiGrindMultiplier = (0, reward_policy_1.resolveAntiGrindMultiplier)(rewardCountToday);
        const isFirstRewardToday = rewardCountToday === 0;
        const grantedPoints = (0, reward_policy_1.applyRepeatCap)({
            grossPoints,
            antiGrindMultiplier,
            rewardCountToday,
            repeatPointsToday,
        });
        const reason = isFirstRewardToday
            ? 'session_finish_reward_first'
            : 'session_finish_reward_repeat';
        await client.query(`
        insert into public.user_wallet (user_id, points_balance, lifetime_points)
        values ($1, 0, 0)
        on conflict (user_id) do nothing
      `, [userId]);
        if (grantedPoints > 0) {
            await client.query(`
          update public.user_wallet
          set
            points_balance = points_balance + $2,
            lifetime_points = lifetime_points + $2,
            updated_at = now()
          where user_id = $1
        `, [userId, grantedPoints]);
        }
        await client.query(`
        insert into public.points_ledger (user_id, reason, delta, reference_type, reference_id)
        values ($1, $2, $3, 'quiz_session', $4::uuid)
      `, [userId, reason, grantedPoints, sessionId]);
        return {
            basePoints,
            accuracyBonusPoints,
            antiGrindMultiplier,
            grantedPoints,
            repeatPointsToday,
            repeatPointsCap: reward_policy_1.REPEAT_POINTS_DAILY_CAP,
        };
    }
    async getWalletSnapshot(client, userId) {
        const result = await client.query(`
        select points_balance, lifetime_points
        from public.user_wallet
        where user_id = $1
        limit 1
      `, [userId]);
        return {
            pointsBalance: Number(result.rows[0]?.points_balance ?? 0),
            lifetimePoints: Number(result.rows[0]?.lifetime_points ?? 0),
        };
    }
    async buildAlreadyFinishedResponse(client, session, userId) {
        const sessionState = await client.query(`
        select
          score,
          accuracy,
          finished_at::text as finished_at
        from public.quiz_sessions
        where id = $1
        limit 1
      `, [session.id]);
        const progress = await this.getSessionProgressMetaWithClient(client, session.id, session.category_id, session.tier);
        const tierCompleted = await this.isTierCompleted(client, userId, session.category_id, session.tier);
        const existingReward = await this.getExistingSessionReward(client, userId, session.id);
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
            wallet,
        };
    }
    async getExistingSessionReward(client, userId, sessionId) {
        const result = await client.query(`
        select delta, reason
        from public.points_ledger
        where user_id = $1
          and reference_type = 'quiz_session'
          and reference_id = $2::uuid
        order by created_at asc
        limit 1
      `, [userId, sessionId]);
        const grantedPoints = Number(result.rows[0]?.delta ?? 0);
        return {
            basePoints: 0,
            accuracyBonusPoints: 0,
            antiGrindMultiplier: 0,
            grantedPoints,
            repeatPointsToday: 0,
            repeatPointsCap: reward_policy_1.REPEAT_POINTS_DAILY_CAP,
        };
    }
};
exports.QuizRepository = QuizRepository;
exports.QuizRepository = QuizRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], QuizRepository);
//# sourceMappingURL=quiz.repository.js.map