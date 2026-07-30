"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.REPEAT_POINTS_DAILY_CAP = exports.TIER_BASE_POINTS = void 0;
exports.calculateAccuracyBonus = calculateAccuracyBonus;
exports.resolveAntiGrindMultiplier = resolveAntiGrindMultiplier;
exports.applyRepeatCap = applyRepeatCap;
exports.TIER_BASE_POINTS = {
    easy: 100,
    hard: 220,
    expert: 420,
};
exports.REPEAT_POINTS_DAILY_CAP = 300;
function calculateAccuracyBonus(basePoints, accuracy) {
    if (basePoints <= 0) {
        return 0;
    }
    if (accuracy >= 95) {
        return Math.round(basePoints * 0.25);
    }
    if (accuracy >= 85) {
        return Math.round(basePoints * 0.1);
    }
    return 0;
}
function resolveAntiGrindMultiplier(repeatsInLast24h) {
    if (repeatsInLast24h <= 0) {
        return 1;
    }
    if (repeatsInLast24h === 1) {
        return 0.4;
    }
    if (repeatsInLast24h === 2) {
        return 0.2;
    }
    return 0.1;
}
function applyRepeatCap(params) {
    const preCapPoints = Math.round(params.grossPoints * params.antiGrindMultiplier);
    if (params.repeatsInLast24h <= 0) {
        return preCapPoints;
    }
    const remainingRepeatCap = Math.max(exports.REPEAT_POINTS_DAILY_CAP - params.repeatPointsToday, 0);
    return Math.min(preCapPoints, remainingRepeatCap);
}
//# sourceMappingURL=reward-policy.js.map