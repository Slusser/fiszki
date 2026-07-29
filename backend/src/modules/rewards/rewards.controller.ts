import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthUserDto } from '../auth/dto/auth-user.dto';
import type { WalletLedgerResponseDto } from './dto/wallet-ledger-response.dto';
import { WalletLedgerQueryDto } from './dto/wallet-ledger-query.dto';
import type { WalletResponseDto } from './dto/wallet-response.dto';
import { RewardsService } from './rewards.service';

@Controller('wallet')
@UseGuards(SupabaseAuthGuard)
@ApiTags('wallet')
@ApiBearerAuth()
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get()
  @ApiOperation({ summary: 'Get wallet balances' })
  @ApiOkResponse({ description: 'Wallet snapshot returned' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getWallet(@CurrentUser() user: AuthUserDto): Promise<WalletResponseDto> {
    return this.rewardsService.getWallet(user);
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Get wallet ledger entries' })
  @ApiOkResponse({ description: 'Wallet ledger history returned' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid bearer token' })
  getLedger(
    @CurrentUser() user: AuthUserDto,
    @Query() query: WalletLedgerQueryDto,
  ): Promise<WalletLedgerResponseDto> {
    return this.rewardsService.getLedger(user, query.limit);
  }
}
