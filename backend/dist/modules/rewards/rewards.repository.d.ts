import type { PoolClient } from 'pg';
import { DatabaseService } from '../../common/database/database.service';
import type { QuizTier } from '../quiz/dto/quiz-tier.dto';
import type { WalletLedgerResponseDto } from './dto/wallet-ledger-response.dto';
import type { WalletResponseDto } from './dto/wallet-response.dto';
interface QueryExecutor {
    query<T>(text: string, params?: unknown[]): Promise<{
        rows: T[];
    }>;
}
export declare class RewardsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getClient(): Promise<PoolClient>;
    getWallet(userId: string): Promise<WalletResponseDto>;
    getLedger(userId: string, limit: number): Promise<WalletLedgerResponseDto>;
    ensureWalletRow(client: QueryExecutor, userId: string): Promise<void>;
    getWalletBalanceForUpdate(client: QueryExecutor, userId: string): Promise<number>;
    debitWallet(client: QueryExecutor, userId: string, points: number): Promise<number>;
    creditWallet(client: QueryExecutor, userId: string, points: number): Promise<void>;
    insertLedgerEntry(client: QueryExecutor, params: {
        userId: string;
        reason: string;
        delta: number;
        referenceType: string;
        referenceId: string;
    }): Promise<void>;
    getTierRepeatCountInLast24h(client: QueryExecutor, params: {
        userId: string;
        categoryId: string;
        tier: QuizTier;
    }): Promise<number>;
    getRepeatPointsToday(client: QueryExecutor, userId: string): Promise<number>;
    getCategoryForUnlock(client: QueryExecutor, categoryId: string): Promise<{
        unlock_cost: number | string;
    } | null>;
    isCategoryUnlocked(client: QueryExecutor, userId: string, categoryId: string): Promise<boolean>;
    insertCategoryUnlock(client: QueryExecutor, userId: string, categoryId: string): Promise<boolean>;
}
export {};
