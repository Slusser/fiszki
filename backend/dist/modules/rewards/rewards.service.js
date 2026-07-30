"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardsService = exports.REPEAT_POINTS_DAILY_CAP = exports.TIER_BASE_POINTS = void 0;
const common_1 = require("@nestjs/common");
const rewards_repository_1 = require("./rewards.repository");
exports.TIER_BASE_POINTS = {
    easy: 100,
    hard: 220,
    expert: 420,
};
exports.REPEAT_POINTS_DAILY_CAP = 300;
let RewardsService = class RewardsService {
    rewardsRepository;
    constructor(rewardsRepository) {
        this.rewardsRepository = rewardsRepository;
    }
    getWallet(user) {
        return this.rewardsRepository.getWallet(user.userId);
    }
    getLedger(user, limit) {
        return this.rewardsRepository.getLedger(user.userId, limit);
    }
    calculateTierReward(input) {
        const basePoints = exports.TIER_BASE_POINTS[input.tier];
        const accuracyBand = this.resolveAccuracyBand(input.accuracy);
        const accuracyBonusMultiplier = accuracyBand === 'high' ? 0.25 : accuracyBand === 'mid' ? 0.1 : 0;
        const accuracyBonusPoints = Math.round(basePoints * accuracyBonusMultiplier);
        const grossPoints = basePoints + accuracyBonusPoints;
        const isRepeatReward = input.repeatsInLast24h > 0;
        const antiGrindMultiplier = this.resolveAntiGrindMultiplier(input.repeatsInLast24h);
        const preCapPoints = Math.round(grossPoints * antiGrindMultiplier);
        const repeatCapRemaining = Math.max(exports.REPEAT_POINTS_DAILY_CAP - input.repeatPointsToday, 0);
        const finalPoints = isRepeatReward
            ? Math.min(preCapPoints, repeatCapRemaining)
            : preCapPoints;
        return {
            basePoints,
            accuracyBonusPoints,
            grossPoints,
            antiGrindMultiplier,
            repeatsInLast24h: input.repeatsInLast24h,
            isRepeatReward,
            repeatPointsToday: input.repeatPointsToday,
            repeatPointsCap: exports.REPEAT_POINTS_DAILY_CAP,
            finalPoints,
            grantedPoints: finalPoints,
        };
    }
    async applyReward(params) {
        if (!params.tierCompleted) {
            return {
                rewardBreakdown: {
                    basePoints: 0,
                    accuracyBonusPoints: 0,
                    grossPoints: 0,
                    antiGrindMultiplier: 1,
                    repeatsInLast24h: 0,
                    isRepeatReward: false,
                    repeatPointsToday: 0,
                    repeatPointsCap: exports.REPEAT_POINTS_DAILY_CAP,
                    finalPoints: 0,
                    grantedPoints: 0,
                },
                ledgerSnapshot: { reason: null, delta: 0 },
            };
        }
        await this.rewardsRepository.ensureWalletRow(params.client, params.userId);
        const repeatsInLast24h = await this.rewardsRepository.getTierRepeatCountInLast24h(params.client, {
            userId: params.userId,
            categoryId: params.categoryId,
            tier: params.tier,
        });
        const repeatPointsToday = await this.rewardsRepository.getRepeatPointsToday(params.client, params.userId);
        const rewardBreakdown = this.calculateTierReward({
            tier: params.tier,
            accuracy: params.accuracy,
            repeatsInLast24h,
            repeatPointsToday,
        });
        const reason = rewardBreakdown.isRepeatReward
            ? 'tier_completed_repeat'
            : 'tier_completed';
        if (rewardBreakdown.finalPoints > 0) {
            await this.rewardsRepository.creditWallet(params.client, params.userId, rewardBreakdown.finalPoints);
        }
        await this.rewardsRepository.insertLedgerEntry(params.client, {
            userId: params.userId,
            reason,
            delta: rewardBreakdown.finalPoints,
            referenceType: 'quiz_session',
            referenceId: params.sessionId,
        });
        return {
            rewardBreakdown,
            ledgerSnapshot: {
                reason,
                delta: rewardBreakdown.finalPoints,
            },
        };
    }
    async canUnlockCategory(client, userId, categoryId) {
        const category = await this.rewardsRepository.getCategoryForUnlock(client, categoryId);
        if (!category) {
            throw new common_1.NotFoundException('Category not found');
        }
        await this.rewardsRepository.ensureWalletRow(client, userId);
        const pointsBalance = await this.rewardsRepository.getWalletBalanceForUpdate(client, userId);
        const isUnlocked = await this.rewardsRepository.isCategoryUnlocked(client, userId, categoryId);
        const unlockCost = Number(category.unlock_cost);
        return {
            categoryId,
            unlockCost,
            isUnlocked,
            pointsBalance,
            canUnlock: isUnlocked || pointsBalance >= unlockCost,
        };
    }
    async unlockCategory(userId, categoryId) {
        const client = await this.rewardsRepository.getClient();
        try {
            await client.query('begin');
            const eligibility = await this.canUnlockCategory(client, userId, categoryId);
            if (eligibility.isUnlocked) {
                await client.query('commit');
                return {
                    categoryId,
                    unlocked: true,
                    alreadyUnlocked: true,
                    spentPoints: 0,
                    pointsBalance: eligibility.pointsBalance,
                };
            }
            const unlockInserted = await this.rewardsRepository.insertCategoryUnlock(client, userId, categoryId);
            if (!unlockInserted) {
                const currentBalance = await this.rewardsRepository.getWalletBalanceForUpdate(client, userId);
                await client.query('commit');
                return {
                    categoryId,
                    unlocked: true,
                    alreadyUnlocked: true,
                    spentPoints: 0,
                    pointsBalance: currentBalance,
                };
            }
            if (!eligibility.canUnlock) {
                throw new Error('INSUFFICIENT_POINTS');
            }
            let pointsBalance = eligibility.pointsBalance;
            if (eligibility.unlockCost > 0) {
                pointsBalance = await this.rewardsRepository.debitWallet(client, userId, eligibility.unlockCost);
                await this.rewardsRepository.insertLedgerEntry(client, {
                    userId,
                    reason: 'category_unlock',
                    delta: -eligibility.unlockCost,
                    referenceType: 'category',
                    referenceId: categoryId,
                });
            }
            await client.query('commit');
            return {
                categoryId,
                unlocked: true,
                alreadyUnlocked: false,
                spentPoints: eligibility.unlockCost,
                pointsBalance,
            };
        }
        catch (error) {
            await client.query('rollback');
            throw error;
        }
        finally {
            client.release();
        }
    }
    resolveAccuracyBand(accuracy) {
        if (accuracy >= 95) {
            return 'high';
        }
        if (accuracy >= 85) {
            return 'mid';
        }
        return 'none';
    }
    resolveAntiGrindMultiplier(repeatsInLast24h) {
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
};
exports.RewardsService = RewardsService;
exports.RewardsService = RewardsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [rewards_repository_1.RewardsRepository])
], RewardsService);
//# sourceMappingURL=rewards.service.js.map