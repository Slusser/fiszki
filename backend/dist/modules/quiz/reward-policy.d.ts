import type { QuizTier } from './dto/quiz-tier.dto';
export declare const TIER_BASE_POINTS: Record<QuizTier, number>;
export declare const REPEAT_POINTS_DAILY_CAP = 300;
export declare function calculateAccuracyBonus(basePoints: number, accuracy: number): number;
export declare function resolveAntiGrindMultiplier(repeatsInLast24h: number): number;
export declare function applyRepeatCap(params: {
    grossPoints: number;
    antiGrindMultiplier: number;
    repeatsInLast24h: number;
    repeatPointsToday: number;
}): number;
