import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { WalletLedgerResponseDto } from './dto/wallet-ledger-response.dto';
import { WalletLedgerQueryDto } from './dto/wallet-ledger-query.dto';
import type { WalletResponseDto } from './dto/wallet-response.dto';
import { RewardsService } from './rewards.service';
export declare class RewardsController {
    private readonly rewardsService;
    constructor(rewardsService: RewardsService);
    getWallet(user: AuthUserDto): Promise<WalletResponseDto>;
    getLedger(user: AuthUserDto, query: WalletLedgerQueryDto): Promise<WalletLedgerResponseDto>;
}
