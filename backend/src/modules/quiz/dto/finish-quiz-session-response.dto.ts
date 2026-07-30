import type { SessionProgressMetaDto } from './next-question-response.dto';
import type { QuizTier } from './quiz-tier.dto';

export interface RewardBreakdownDto {
  basePoints: number;
  accuracyBonusPoints: number;
  grossPoints: number;
  antiGrindMultiplier: number;
  repeatsInLast24h: number;
  isRepeatReward: boolean;
  finalPoints: number;
  grantedPoints: number;
  repeatPointsToday: number;
  repeatPointsCap: number;
}

export interface RewardLedgerSnapshotDto {
  reason: string | null;
  delta: number;
}

export interface FinishQuizSessionResponseDto {
  sessionId: string;
  categoryId: string;
  tier: QuizTier;
  status: 'finished';
  idempotent: boolean;
  score: number;
  accuracy: number;
  finishedAt: string;
  progress: SessionProgressMetaDto;
  tierCompleted: boolean;
  rewards: RewardBreakdownDto;
  rewardLedger: RewardLedgerSnapshotDto;
  wallet: {
    pointsBalance: number;
    lifetimePoints: number;
  };
}
