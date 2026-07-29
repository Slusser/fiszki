import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { WalletLedgerResponseDto } from './dto/wallet-ledger-response.dto';
import type { WalletResponseDto } from './dto/wallet-response.dto';
import { RewardsRepository } from './rewards.repository';
export declare class RewardsService {
    private readonly rewardsRepository;
    constructor(rewardsRepository: RewardsRepository);
    getWallet(user: AuthUserDto): Promise<WalletResponseDto>;
    getLedger(user: AuthUserDto, limit: number): Promise<WalletLedgerResponseDto>;
}
