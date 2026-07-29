import {
  applyRepeatCap,
  calculateAccuracyBonus,
  resolveAntiGrindMultiplier,
} from './reward-policy';

describe('reward-policy', () => {
  it('caps accuracy bonus at 30% of base points', () => {
    expect(calculateAccuracyBonus(100, 100)).toBe(30);
    expect(calculateAccuracyBonus(100, 50)).toBe(15);
  });

  it('uses decreasing anti-grind multipliers', () => {
    expect(resolveAntiGrindMultiplier(0)).toBe(1);
    expect(resolveAntiGrindMultiplier(1)).toBe(0.6);
    expect(resolveAntiGrindMultiplier(4)).toBe(0.1);
    expect(resolveAntiGrindMultiplier(99)).toBe(0.1);
  });

  it('applies repeat daily cap only after first reward', () => {
    expect(
      applyRepeatCap({
        grossPoints: 80,
        antiGrindMultiplier: 1,
        rewardCountToday: 0,
        repeatPointsToday: 0,
      }),
    ).toBe(80);

    expect(
      applyRepeatCap({
        grossPoints: 80,
        antiGrindMultiplier: 1,
        rewardCountToday: 1,
        repeatPointsToday: 110,
      }),
    ).toBe(10);
  });
});
