import { DatabaseService } from '../../common/database/database.service';
import type { WalletLedgerResponseDto } from './dto/wallet-ledger-response.dto';
import type { WalletResponseDto } from './dto/wallet-response.dto';
export declare class RewardsRepository {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getWallet(userId: string): Promise<WalletResponseDto>;
    getLedger(userId: string, limit: number): Promise<WalletLedgerResponseDto>;
}
