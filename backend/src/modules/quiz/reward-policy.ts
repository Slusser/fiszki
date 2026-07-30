import type { QuizTier } from './dto/quiz-tier.dto';

export const TIER_BASE_POINTS: Record<QuizTier, number> = {
  easy: 100,
  hard: 220,
  expert: 420,
};

export const REPEAT_POINTS_DAILY_CAP = 300;

export function calculateAccuracyBonus(
  basePoints: number,
  accuracy: number,
): number {
  if (basePoints <= 0) {
    return 0;
  }

  if (accuracy >= 95) {
    return Math.round(basePoints * 0.25);
  }
  if (accuracy >= 85) {
    return Math.round(basePoints * 0.1);
  }
  return 0;
}

export function resolveAntiGrindMultiplier(repeatsInLast24h: number): number {
  if (repeatsInLast24h <= 0) {
    return 1;
  }
  if (repeatsInLast24h === 1) {
    return 0.4;
  }
  if (repeatsInLast24h === 2) {
    return 0.2;
  }
  return 0.1;
}

export function applyRepeatCap(params: {
  grossPoints: number;
  antiGrindMultiplier: number;
  repeatsInLast24h: number;
  repeatPointsToday: number;
}): number {
  const preCapPoints = Math.round(
    params.grossPoints * params.antiGrindMultiplier,
  );
  if (params.repeatsInLast24h <= 0) {
    return preCapPoints;
  }

  const remainingRepeatCap = Math.max(
    REPEAT_POINTS_DAILY_CAP - params.repeatPointsToday,
    0,
  );
  return Math.min(preCapPoints, remainingRepeatCap);
}
