import type { PoolClient } from 'pg';
import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { RewardBreakdownDto, RewardLedgerSnapshotDto } from '../quiz/dto/finish-quiz-session-response.dto';
import type { QuizTier } from '../quiz/dto/quiz-tier.dto';
import type { UnlockCategoryResponseDto } from '../catalog/dto/unlock-category-response.dto';
import type { WalletLedgerResponseDto } from './dto/wallet-ledger-response.dto';
import type { WalletResponseDto } from './dto/wallet-response.dto';
import { RewardsRepository } from './rewards.repository';
export declare const TIER_BASE_POINTS: Record<QuizTier, number>;
export declare const REPEAT_POINTS_DAILY_CAP = 300;
interface TierRewardInput {
    tier: QuizTier;
    accuracy: number;
    repeatsInLast24h: number;
    repeatPointsToday: number;
}
interface UnlockEligibility {
    categoryId: string;
    unlockCost: number;
    isUnlocked: boolean;
    pointsBalance: number;
    canUnlock: boolean;
}
export declare class RewardsService {
    private readonly rewardsRepository;
    constructor(rewardsRepository: RewardsRepository);
    getWallet(user: AuthUserDto): Promise<WalletResponseDto>;
    getLedger(user: AuthUserDto, limit: number): Promise<WalletLedgerResponseDto>;
    calculateTierReward(input: TierRewardInput): RewardBreakdownDto;
    applyReward(params: {
        client: PoolClient;
        userId: string;
        sessionId: string;
        categoryId: string;
        tier: QuizTier;
        accuracy: number;
        tierCompleted: boolean;
    }): Promise<{
        rewardBreakdown: RewardBreakdownDto;
        ledgerSnapshot: RewardLedgerSnapshotDto;
    }>;
    canUnlockCategory(client: PoolClient, userId: string, categoryId: string): Promise<UnlockEligibility>;
    unlockCategory(userId: string, categoryId: string): Promise<UnlockCategoryResponseDto>;
    private resolveAccuracyBand;
    private resolveAntiGrindMultiplier;
}
export {};
