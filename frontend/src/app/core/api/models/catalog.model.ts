export type TierName = 'easy' | 'hard' | 'expert';

export interface CategoryListItem {
  id: string;
  slug: string;
  name: string;
  unlockCost: number;
  difficultyWeight: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface CategoriesResponse {
  categories: CategoryListItem[];
}

export interface CategoryTier {
  tier: TierName;
  totalWords: number;
  masteredWords: number;
}

export interface CategoryTiersResponse {
  categoryId: string;
  tiers: CategoryTier[];
}

export interface UnlockCategoryResponse {
  categoryId: string;
  unlocked: boolean;
  alreadyUnlocked: boolean;
  spentPoints: number;
  pointsBalance: number;
}
