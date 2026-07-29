import type { QuizTier } from './dto/quiz-tier.dto';
export declare const TIER_BASE_POINTS: Record<QuizTier, number>;
export declare const ANTI_GRIND_MULTIPLIERS: readonly [1, 0.6, 0.35, 0.2, 0.1];
export declare const REPEAT_POINTS_DAILY_CAP = 120;
export declare function calculateAccuracyBonus(basePoints: number, accuracy: number): number;
export declare function resolveAntiGrindMultiplier(rewardCountToday: number): number;
export declare function applyRepeatCap(params: {
    grossPoints: number;
    antiGrindMultiplier: number;
    rewardCountToday: number;
    repeatPointsToday: number;
}): number;
