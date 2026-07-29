import { CategoryTier } from '../api/models';
import { canAccessTier } from './tier-access.util';

describe('canAccessTier', () => {
  it('zawsze pozwala wejsc na easy', () => {
    const tiers: CategoryTier[] = [];
    expect(canAccessTier('easy', tiers)).toBeTrue();
  });

  it('blokuje hard gdy easy nie jest ukonczony', () => {
    const tiers: CategoryTier[] = [
      { tier: 'easy', totalWords: 10, masteredWords: 9 },
      { tier: 'hard', totalWords: 10, masteredWords: 0 },
    ];
    expect(canAccessTier('hard', tiers)).toBeFalse();
  });

  it('pozwala na hard gdy easy jest ukonczony', () => {
    const tiers: CategoryTier[] = [
      { tier: 'easy', totalWords: 10, masteredWords: 10 },
      { tier: 'hard', totalWords: 10, masteredWords: 0 },
    ];
    expect(canAccessTier('hard', tiers)).toBeTrue();
  });

  it('pozwala na expert dopiero po ukonczeniu hard', () => {
    const lockedExpert: CategoryTier[] = [
      { tier: 'easy', totalWords: 10, masteredWords: 10 },
      { tier: 'hard', totalWords: 10, masteredWords: 9 },
      { tier: 'expert', totalWords: 10, masteredWords: 0 },
    ];
    expect(canAccessTier('expert', lockedExpert)).toBeFalse();

    const unlockedExpert: CategoryTier[] = [
      { tier: 'easy', totalWords: 10, masteredWords: 10 },
      { tier: 'hard', totalWords: 10, masteredWords: 10 },
      { tier: 'expert', totalWords: 10, masteredWords: 0 },
    ];
    expect(canAccessTier('expert', unlockedExpert)).toBeTrue();
  });
});
