import type { QuizTier } from './quiz-tier.dto';
export interface StartQuizSessionResponseDto {
    sessionId: string;
    status: 'active';
    categoryId: string;
    tier: QuizTier;
    resumed: boolean;
    startedAt: string;
}
