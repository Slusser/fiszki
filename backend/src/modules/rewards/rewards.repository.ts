import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import type { WalletLedgerResponseDto } from './dto/wallet-ledger-response.dto';
import type { WalletResponseDto } from './dto/wallet-response.dto';

interface WalletRow {
  user_id: string;
  points_balance: number | string;
  lifetime_points: number | string;
  updated_at: string | null;
}

interface WalletLedgerRow {
  id: string;
  reason: string;
  delta: number | string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
}

@Injectable()
export class RewardsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getWallet(userId: string): Promise<WalletResponseDto> {
    const result = await this.databaseService.query<WalletRow>(
      `
        select
          user_id,
          points_balance,
          lifetime_points,
          updated_at::text as updated_at
        from public.user_wallet
        where user_id = $1
        limit 1
      `,
      [userId],
    );

    const row = result.rows[0];
    if (!row) {
      return {
        userId,
        pointsBalance: 0,
        lifetimePoints: 0,
        updatedAt: null,
      };
    }

    return {
      userId: row.user_id,
      pointsBalance: Number(row.points_balance),
      lifetimePoints: Number(row.lifetime_points),
      updatedAt: row.updated_at,
    };
  }

  async getLedger(userId: string, limit: number): Promise<WalletLedgerResponseDto> {
    const result = await this.databaseService.query<WalletLedgerRow>(
      `
        select
          id,
          reason,
          delta,
          reference_type,
          reference_id::text as reference_id,
          created_at::text as created_at
        from public.points_ledger
        where user_id = $1
        order by created_at desc
        limit $2
      `,
      [userId, limit],
    );

    return {
      entries: result.rows.map((row) => ({
        id: row.id,
        reason: row.reason,
        delta: Number(row.delta),
        referenceType: row.reference_type,
        referenceId: row.reference_id,
        createdAt: row.created_at,
      })),
    };
  }
}
