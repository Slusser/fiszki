export type TierName = 'easy' | 'hard' | 'expert';

export interface CategoryTierDto {
  tier: TierName;
  totalWords: number;
  masteredWords: number;
}

export interface CategoryTiersResponseDto {
  categoryId: string;
  tiers: CategoryTierDto[];
}
