import type { QuizTier } from './dto/quiz-tier.dto';

export const TIER_BASE_POINTS: Record<QuizTier, number> = {
  easy: 20,
  hard: 45,
  expert: 80,
};

export const ANTI_GRIND_MULTIPLIERS = [1, 0.6, 0.35, 0.2, 0.1] as const;
export const REPEAT_POINTS_DAILY_CAP = 120;

export function calculateAccuracyBonus(basePoints: number, accuracy: number): number {
  if (basePoints <= 0) {
    return 0;
  }

  const normalizedAccuracy = Math.max(0, Math.min(100, accuracy));
  return Math.round(basePoints * Math.min(0.3, (normalizedAccuracy / 100) * 0.3));
}

export function resolveAntiGrindMultiplier(rewardCountToday: number): number {
  const index = Math.min(
    Math.max(0, Math.floor(rewardCountToday)),
    ANTI_GRIND_MULTIPLIERS.length - 1,
  );
  return ANTI_GRIND_MULTIPLIERS[index] ?? 0.1;
}

export function applyRepeatCap(params: {
  grossPoints: number;
  antiGrindMultiplier: number;
  rewardCountToday: number;
  repeatPointsToday: number;
}): number {
  const preCapPoints = Math.round(params.grossPoints * params.antiGrindMultiplier);
  if (params.rewardCountToday === 0) {
    return preCapPoints;
  }

  const remainingRepeatCap = Math.max(REPEAT_POINTS_DAILY_CAP - params.repeatPointsToday, 0);
  return Math.min(preCapPoints, remainingRepeatCap);
}
