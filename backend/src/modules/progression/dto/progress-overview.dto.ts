import type { QuizTier } from '../../quiz/dto/quiz-tier.dto';

export interface ProgressTierOverviewDto {
  tier: QuizTier;
  totalWords: number;
  masteredWords: number;
  completed: boolean;
}

export interface ProgressCategoryOverviewDto {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  tiers: ProgressTierOverviewDto[];
}

export interface ProgressOverviewResponseDto {
  categories: ProgressCategoryOverviewDto[];
}
