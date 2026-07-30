import { Injectable } from '@nestjs/common';
import type { PoolClient } from 'pg';
import { DatabaseService } from '../../common/database/database.service';
import type { QuizTier } from '../quiz/dto/quiz-tier.dto';
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

interface QueryExecutor {
  query<T>(text: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

@Injectable()
export class RewardsRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  getClient(): Promise<PoolClient> {
    return this.databaseService.getClient();
  }

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

  async getLedger(
    userId: string,
    limit: number,
  ): Promise<WalletLedgerResponseDto> {
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

  async ensureWalletRow(client: QueryExecutor, userId: string): Promise<void> {
    await client.query(
      `
        insert into public.user_wallet (user_id, points_balance, lifetime_points)
        values ($1, 0, 0)
        on conflict (user_id) do nothing
      `,
      [userId],
    );
  }

  async getWalletBalanceForUpdate(
    client: QueryExecutor,
    userId: string,
  ): Promise<number> {
    const result = await client.query<{ points_balance: number | string }>(
      `
        select points_balance
        from public.user_wallet
        where user_id = $1
        for update
      `,
      [userId],
    );
    return Number(result.rows[0]?.points_balance ?? 0);
  }

  async debitWallet(
    client: QueryExecutor,
    userId: string,
    points: number,
  ): Promise<number> {
    const result = await client.query<{ points_balance: number | string }>(
      `
        update public.user_wallet
        set
          points_balance = points_balance - $2,
          updated_at = now()
        where user_id = $1
          and points_balance >= $2
        returning points_balance
      `,
      [userId, points],
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('INSUFFICIENT_POINTS');
    }

    return Number(row.points_balance);
  }

  async creditWallet(
    client: QueryExecutor,
    userId: string,
    points: number,
  ): Promise<void> {
    await client.query(
      `
        update public.user_wallet
        set
          points_balance = points_balance + $2,
          lifetime_points = lifetime_points + $2,
          updated_at = now()
        where user_id = $1
      `,
      [userId, points],
    );
  }

  async insertLedgerEntry(
    client: QueryExecutor,
    params: {
      userId: string;
      reason: string;
      delta: number;
      referenceType: string;
      referenceId: string;
    },
  ): Promise<void> {
    await client.query(
      `
        insert into public.points_ledger (user_id, reason, delta, reference_type, reference_id)
        values ($1, $2, $3, $4, $5::uuid)
      `,
      [
        params.userId,
        params.reason,
        params.delta,
        params.referenceType,
        params.referenceId,
      ],
    );
  }

  async getTierRepeatCountInLast24h(
    client: QueryExecutor,
    params: { userId: string; categoryId: string; tier: QuizTier },
  ): Promise<number> {
    const result = await client.query<{ repeats_count: number | string }>(
      `
        select count(*)::int as repeats_count
        from public.points_ledger pl
        join public.quiz_sessions qs
          on qs.id = pl.reference_id
        where pl.user_id = $1
          and pl.reason in ('tier_completed', 'tier_completed_repeat')
          and pl.reference_type = 'quiz_session'
          and qs.category_id = $2
          and qs.tier = $3
          and pl.created_at >= (now() - interval '24 hours')
      `,
      [params.userId, params.categoryId, params.tier],
    );

    return Number(result.rows[0]?.repeats_count ?? 0);
  }

  async getRepeatPointsToday(
    client: QueryExecutor,
    userId: string,
  ): Promise<number> {
    const result = await client.query<{ repeat_points_today: number | string }>(
      `
        select coalesce(sum(delta), 0)::int as repeat_points_today
        from public.points_ledger
        where user_id = $1
          and reason = 'tier_completed_repeat'
          and created_at >= date_trunc('day', now())
      `,
      [userId],
    );

    return Number(result.rows[0]?.repeat_points_today ?? 0);
  }

  async getCategoryForUnlock(
    client: QueryExecutor,
    categoryId: string,
  ): Promise<{ unlock_cost: number | string } | null> {
    const result = await client.query<{ unlock_cost: number | string }>(
      `
        select unlock_cost
        from public.categories
        where id = $1
          and is_active = true
        limit 1
      `,
      [categoryId],
    );
    return result.rows[0] ?? null;
  }

  async isCategoryUnlocked(
    client: QueryExecutor,
    userId: string,
    categoryId: string,
  ): Promise<boolean> {
    const result = await client.query<{ id: string }>(
      `
        select id
        from public.user_category_unlocks
        where user_id = $1
          and category_id = $2
        limit 1
      `,
      [userId, categoryId],
    );

    return Boolean(result.rows[0]);
  }

  async insertCategoryUnlock(
    client: QueryExecutor,
    userId: string,
    categoryId: string,
  ): Promise<boolean> {
    const result = await client.query<{ id: string }>(
      `
        insert into public.user_category_unlocks (user_id, category_id)
        values ($1, $2)
        on conflict (user_id, category_id) do nothing
        returning id
      `,
      [userId, categoryId],
    );

    return Boolean(result.rows[0]);
  }
}
