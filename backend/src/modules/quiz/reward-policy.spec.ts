import {
  applyRepeatCap,
  calculateAccuracyBonus,
  resolveAntiGrindMultiplier,
} from './reward-policy';

describe('reward-policy', () => {
  it('uses fixed accuracy bonus bands', () => {
    expect(calculateAccuracyBonus(100, 97)).toBe(25);
    expect(calculateAccuracyBonus(100, 90)).toBe(10);
    expect(calculateAccuracyBonus(100, 80)).toBe(0);
  });

  it('uses decreasing anti-grind multipliers', () => {
    expect(resolveAntiGrindMultiplier(0)).toBe(1);
    expect(resolveAntiGrindMultiplier(1)).toBe(0.4);
    expect(resolveAntiGrindMultiplier(2)).toBe(0.2);
    expect(resolveAntiGrindMultiplier(4)).toBe(0.1);
    expect(resolveAntiGrindMultiplier(99)).toBe(0.1);
  });

  it('applies repeat daily cap only for repeats', () => {
    expect(
      applyRepeatCap({
        grossPoints: 125,
        antiGrindMultiplier: 1,
        repeatsInLast24h: 0,
        repeatPointsToday: 0,
      }),
    ).toBe(125);

    expect(
      applyRepeatCap({
        grossPoints: 420,
        antiGrindMultiplier: 0.4,
        repeatsInLast24h: 1,
        repeatPointsToday: 260,
      }),
    ).toBe(40);
  });
});
