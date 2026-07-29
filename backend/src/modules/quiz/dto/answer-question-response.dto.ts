import type { SessionProgressMetaDto } from './next-question-response.dto';

export interface WordProgressSnapshotDto {
  wordId: string;
  correctCount: number;
  wrongCount: number;
  requiredCorrect: number;
  mastered: boolean;
}

export interface AnswerQuestionResponseDto {
  sessionId: string;
  wordId: string;
  isCorrect: boolean;
  wasTimeout: boolean;
  recordedOption: string;
  progress: SessionProgressMetaDto;
  wordProgress: WordProgressSnapshotDto;
}
