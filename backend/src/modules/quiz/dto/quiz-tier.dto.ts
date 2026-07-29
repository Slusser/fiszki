import { IsIn } from 'class-validator';

export const QUIZ_TIERS = ['easy', 'hard', 'expert'] as const;
export type QuizTier = (typeof QUIZ_TIERS)[number];

export class QuizTierDto {
  @IsIn(QUIZ_TIERS)
  tier!: QuizTier;
}
