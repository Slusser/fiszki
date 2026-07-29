import { Injectable } from '@nestjs/common';
import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { WalletLedgerResponseDto } from './dto/wallet-ledger-response.dto';
import type { WalletResponseDto } from './dto/wallet-response.dto';
import { RewardsRepository } from './rewards.repository';

@Injectable()
export class RewardsService {
  constructor(private readonly rewardsRepository: RewardsRepository) {}

  getWallet(user: AuthUserDto): Promise<WalletResponseDto> {
    return this.rewardsRepository.getWallet(user.userId);
  }

  getLedger(user: AuthUserDto, limit: number): Promise<WalletLedgerResponseDto> {
    return this.rewardsRepository.getLedger(user.userId, limit);
  }
}
