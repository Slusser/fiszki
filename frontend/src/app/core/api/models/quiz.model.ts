import { TierName } from './catalog.model';

export interface StartQuizSessionRequest {
  categoryId: string;
  tier: TierName;
}

export interface StartQuizSessionResponse {
  sessionId: string;
  status: 'active';
  categoryId: string;
  tier: TierName;
  resumed: boolean;
  startedAt: string;
}

export interface NextQuestionPayload {
  wordId: string;
  prompt: string;
  options: string[];
  issuedAt: string;
  questionToken: string;
}

export interface SessionProgressMeta {
  totalWords: number;
  answeredWords: number;
  remainingWords: number;
  sessionAccuracy: number;
}

export interface NextQuestionResponse {
  sessionId: string;
  categoryId: string;
  tier: TierName;
  completed: boolean;
  progress: SessionProgressMeta;
  question: NextQuestionPayload | null;
}

export interface AnswerQuestionRequest {
  questionToken: string;
  selectedOption: string;
}

export interface WordProgressSnapshot {
  wordId: string;
  correctCount: number;
  wrongCount: number;
  requiredCorrect: number;
  mastered: boolean;
}

export interface AnswerQuestionResponse {
  sessionId: string;
  wordId: string;
  isCorrect: boolean;
  wasTimeout: boolean;
  recordedOption: string;
  progress: SessionProgressMeta;
  wordProgress: WordProgressSnapshot;
}

export interface RewardBreakdown {
  basePoints: number;
  accuracyBonusPoints: number;
  antiGrindMultiplier: number;
  grantedPoints: number;
  repeatPointsToday: number;
  repeatPointsCap: number;
}

export interface FinishQuizSessionResponse {
  sessionId: string;
  categoryId: string;
  tier: TierName;
  status: 'finished';
  idempotent: boolean;
  score: number;
  accuracy: number;
  finishedAt: string;
  progress: SessionProgressMeta;
  tierCompleted: boolean;
  rewards: RewardBreakdown;
  wallet: {
    pointsBalance: number;
    lifetimePoints: number;
  };
}
