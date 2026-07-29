import { Injectable, NotFoundException } from '@nestjs/common';
import { type PoolClient } from 'pg';
import { DatabaseService } from '../../common/database/database.service';
import { CategoriesResponseDto } from './dto/categories-response.dto';
import { CategoryTiersResponseDto, type TierName } from './dto/tiers-response.dto';
import { UnlockCategoryResponseDto } from './dto/unlock-category-response.dto';

interface CategoryRow {
  id: string;
  slug: string;
  name: string;
  unlock_cost: number | string;
  difficulty_weight: number | string;
  is_unlocked: boolean;
  unlocked_at: string | null;
}

interface TierProgressRow {
  tier: TierName;
  total_words: number | string;
  mastered_words: number | string;
}

@Injectable()
export class CatalogRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getCategories(userId: string): Promise<CategoriesResponseDto> {
    const result = await this.databaseService.query<CategoryRow>(
      `
        select
          c.id,
          c.slug,
          c.name,
          c.unlock_cost,
          c.difficulty_weight,
          (u.id is not null) as is_unlocked,
          u.unlocked_at::text as unlocked_at
        from public.categories c
        left join public.user_category_unlocks u
          on u.category_id = c.id and u.user_id = $1
        where c.is_active = true
        order by c.name asc
      `,
      [userId],
    );

    return {
      categories: result.rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        unlockCost: Number(row.unlock_cost),
        difficultyWeight: Number(row.difficulty_weight),
        isUnlocked: row.is_unlocked,
        unlockedAt: row.unlocked_at,
      })),
    };
  }

  async getCategoryTiers(categoryId: string, userId: string): Promise<CategoryTiersResponseDto> {
    const categoryExists = await this.databaseService.query<{ id: string }>(
      `select id from public.categories where id = $1 and is_active = true limit 1`,
      [categoryId],
    );
    if (!categoryExists.rows[0]) {
      throw new NotFoundException('Category not found');
    }

    const result = await this.databaseService.query<TierProgressRow>(
      `
        select
          w.tier,
          count(*)::int as total_words,
          coalesce(sum(case when uwp.mastered then 1 else 0 end), 0)::int as mastered_words
        from public.words w
        left join public.user_word_progress uwp
          on uwp.word_id = w.id and uwp.user_id = $2
        where w.category_id = $1
          and w.is_active = true
        group by w.tier
        order by
          case w.tier
            when 'easy' then 1
            when 'hard' then 2
            when 'expert' then 3
            else 99
          end
      `,
      [categoryId, userId],
    );

    return {
      categoryId,
      tiers: result.rows.map((row) => ({
        tier: row.tier,
        totalWords: Number(row.total_words),
        masteredWords: Number(row.mastered_words),
      })),
    };
  }

  async unlockCategory(userId: string, categoryId: string): Promise<UnlockCategoryResponseDto> {
    const client = await this.databaseService.getClient();

    try {
      await client.query('begin');
      const result = await this.unlockCategoryTx(client, userId, categoryId);
      await client.query('commit');
      return result;
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  private async unlockCategoryTx(
    client: PoolClient,
    userId: string,
    categoryId: string,
  ): Promise<UnlockCategoryResponseDto> {
    const categoryResult = await client.query<{ unlock_cost: number | string }>(
      `
        select unlock_cost
        from public.categories
        where id = $1 and is_active = true
        limit 1
      `,
      [categoryId],
    );
    const categoryRow = categoryResult.rows[0];
    if (!categoryRow) {
      throw new NotFoundException('Category not found');
    }

    const lockInsertResult = await client.query<{ user_id: string }>(
      `
        insert into public.user_category_unlocks (user_id, category_id)
        values ($1, $2)
        on conflict (user_id, category_id) do nothing
        returning user_id
      `,
      [userId, categoryId],
    );

    const alreadyUnlocked = !lockInsertResult.rows[0];
    const unlockCost = Number(categoryRow.unlock_cost);

    const walletLock = await client.query<{ points_balance: number | string }>(
      `
        select points_balance
        from public.user_wallet
        where user_id = $1
        for update
      `,
      [userId],
    );

    if (!walletLock.rows[0]) {
      await client.query(
        `
          insert into public.user_wallet (user_id, points_balance, lifetime_points)
          values ($1, 0, 0)
          on conflict (user_id) do nothing
        `,
        [userId],
      );
    }

    if (alreadyUnlocked) {
      const walletState = await client.query<{ points_balance: number | string }>(
        `select points_balance from public.user_wallet where user_id = $1 limit 1`,
        [userId],
      );

      return {
        categoryId,
        unlocked: true,
        alreadyUnlocked: true,
        spentPoints: 0,
        pointsBalance: Number(walletState.rows[0]?.points_balance ?? 0),
      };
    }

    if (unlockCost > 0) {
      const walletUpdate = await client.query<{ points_balance: number | string }>(
        `
          update public.user_wallet
          set
            points_balance = points_balance - $2,
            updated_at = now()
          where user_id = $1
            and points_balance >= $2
          returning points_balance
        `,
        [userId, unlockCost],
      );

      const updatedWallet = walletUpdate.rows[0];
      if (!updatedWallet) {
        throw new Error('INSUFFICIENT_POINTS');
      }

      await client.query(
        `
          insert into public.points_ledger (user_id, reason, delta, reference_type, reference_id)
          values ($1, $2, $3, $4, $5)
        `,
        [userId, 'category_unlock', -unlockCost, 'category', categoryId],
      );

      return {
        categoryId,
        unlocked: true,
        alreadyUnlocked: false,
        spentPoints: unlockCost,
        pointsBalance: Number(updatedWallet.points_balance),
      };
    }

    const walletState = await client.query<{ points_balance: number | string }>(
      `select points_balance from public.user_wallet where user_id = $1 limit 1`,
      [userId],
    );

    return {
      categoryId,
      unlocked: true,
      alreadyUnlocked: false,
      spentPoints: 0,
      pointsBalance: Number(walletState.rows[0]?.points_balance ?? 0),
    };
  }
}
