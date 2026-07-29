import type { QuizTier } from './quiz-tier.dto';

export interface NextQuestionPayloadDto {
  wordId: string;
  prompt: string;
  options: string[];
  issuedAt: string;
  questionToken: string;
}

export interface SessionProgressMetaDto {
  totalWords: number;
  answeredWords: number;
  remainingWords: number;
  sessionAccuracy: number;
}

export interface NextQuestionResponseDto {
  sessionId: string;
  categoryId: string;
  tier: QuizTier;
  completed: boolean;
  progress: SessionProgressMetaDto;
  question: NextQuestionPayloadDto | null;
}
