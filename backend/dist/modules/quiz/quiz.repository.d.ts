import { DatabaseService } from '../../common/database/database.service';
import type { SessionProgressMetaDto } from './dto/next-question-response.dto';
import type { FinishQuizSessionResponseDto } from './dto/finish-quiz-session-response.dto';
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
interface WordRow {
    id: string;
    source_word: string;
    target_word: string;
}
export declare class QuizRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    startSession(userId: string, categoryId: string, tier: QuizTier): Promise<StartQuizSessionResponseDto>;
    getSessionOrThrow(sessionId: string, userId: string): Promise<SessionRow>;
    getNextQuestionCandidate(sessionId: string, categoryId: string, tier: QuizTier): Promise<WordRow | null>;
    getDistractors(categoryId: string, tier: QuizTier, wordId: string): Promise<string[]>;
    getSessionProgressMeta(sessionId: string, categoryId: string, tier: QuizTier): Promise<SessionProgressMetaDto>;
    validateSessionWord(sessionId: string, categoryId: string, tier: QuizTier, wordId: string): Promise<WordRow>;
    saveAnswerAndUpdateProgress(params: {
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
    }>;
    finishSession(userId: string, sessionId: string): Promise<FinishQuizSessionResponseDto>;
    private ensureCategoryAccess;
    private ensureSessionStillActive;
    private insertQuizAnswer;
    private upsertWordProgress;
    private getSessionProgressMetaWithClient;
    private getSessionForFinishWithLock;
    private isTierCompleted;
    private applyFinishRewards;
    private getWalletSnapshot;
    private buildAlreadyFinishedResponse;
    private getExistingSessionReward;
}
export {};
