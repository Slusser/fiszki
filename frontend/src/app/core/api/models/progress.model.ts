import { TierName } from './catalog.model';

export interface ProgressTierOverview {
  tier: TierName;
  totalWords: number;
  masteredWords: number;
  completed: boolean;
}

export interface ProgressCategoryOverview {
  categoryId: string;
  categorySlug: string;
  categoryName: string;
  tiers: ProgressTierOverview[];
}

export interface ProgressOverviewResponse {
  categories: ProgressCategoryOverview[];
}
