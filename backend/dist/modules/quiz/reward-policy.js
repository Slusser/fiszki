"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPEAT_POINTS_DAILY_CAP = exports.ANTI_GRIND_MULTIPLIERS = exports.TIER_BASE_POINTS = void 0;
exports.calculateAccuracyBonus = calculateAccuracyBonus;
exports.resolveAntiGrindMultiplier = resolveAntiGrindMultiplier;
exports.applyRepeatCap = applyRepeatCap;
exports.TIER_BASE_POINTS = {
    easy: 20,
    hard: 45,
    expert: 80,
};
exports.ANTI_GRIND_MULTIPLIERS = [1, 0.6, 0.35, 0.2, 0.1];
exports.REPEAT_POINTS_DAILY_CAP = 120;
function calculateAccuracyBonus(basePoints, accuracy) {
    if (basePoints <= 0) {
        return 0;
    }
    const normalizedAccuracy = Math.max(0, Math.min(100, accuracy));
    return Math.round(basePoints * Math.min(0.3, (normalizedAccuracy / 100) * 0.3));
}
function resolveAntiGrindMultiplier(rewardCountToday) {
    const index = Math.min(Math.max(0, Math.floor(rewardCountToday)), exports.ANTI_GRIND_MULTIPLIERS.length - 1);
    return exports.ANTI_GRIND_MULTIPLIERS[index] ?? 0.1;
}
function applyRepeatCap(params) {
    const preCapPoints = Math.round(params.grossPoints * params.antiGrindMultiplier);
    if (params.rewardCountToday === 0) {
        return preCapPoints;
    }
    const remainingRepeatCap = Math.max(exports.REPEAT_POINTS_DAILY_CAP - params.repeatPointsToday, 0);
    return Math.min(preCapPoints, remainingRepeatCap);
}
//# sourceMappingURL=reward-policy.js.map