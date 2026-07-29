import { CategoryTier, TierName } from '../api/models';

function isTierCompleted(tiers: CategoryTier[], tier: TierName): boolean {
  const foundTier = tiers.find((entry) => entry.tier === tier);
  if (!foundTier) {
    return false;
  }

  return foundTier.totalWords > 0 && foundTier.masteredWords >= foundTier.totalWords;
}

export function canAccessTier(tier: TierName, tiers: CategoryTier[]): boolean {
  if (tier === 'easy') {
    return true;
  }

  if (tier === 'hard') {
    return isTierCompleted(tiers, 'easy');
  }

  return isTierCompleted(tiers, 'hard');
}
