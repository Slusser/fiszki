"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatalogRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../common/database/database.service");
let CatalogRepository = class CatalogRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async getCategories(userId) {
        const result = await this.databaseService.query(`
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
      `, [userId]);
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
    async getCategoryTiers(categoryId, userId) {
        const categoryExists = await this.databaseService.query(`select id from public.categories where id = $1 and is_active = true limit 1`, [categoryId]);
        if (!categoryExists.rows[0]) {
            throw new common_1.NotFoundException('Category not found');
        }
        const result = await this.databaseService.query(`
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
      `, [categoryId, userId]);
        return {
            categoryId,
            tiers: result.rows.map((row) => ({
                tier: row.tier,
                totalWords: Number(row.total_words),
                masteredWords: Number(row.mastered_words),
            })),
        };
    }
    async unlockCategory(userId, categoryId) {
        const client = await this.databaseService.getClient();
        try {
            await client.query('begin');
            const result = await this.unlockCategoryTx(client, userId, categoryId);
            await client.query('commit');
            return result;
        }
        catch (error) {
            await client.query('rollback');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async unlockCategoryTx(client, userId, categoryId) {
        const categoryResult = await client.query(`
        select unlock_cost
        from public.categories
        where id = $1 and is_active = true
        limit 1
      `, [categoryId]);
        const categoryRow = categoryResult.rows[0];
        if (!categoryRow) {
            throw new common_1.NotFoundException('Category not found');
        }
        const lockInsertResult = await client.query(`
        insert into public.user_category_unlocks (user_id, category_id)
        values ($1, $2)
        on conflict (user_id, category_id) do nothing
        returning user_id
      `, [userId, categoryId]);
        const alreadyUnlocked = !lockInsertResult.rows[0];
        const unlockCost = Number(categoryRow.unlock_cost);
        const walletLock = await client.query(`
        select points_balance
        from public.user_wallet
        where user_id = $1
        for update
      `, [userId]);
        if (!walletLock.rows[0]) {
            await client.query(`
          insert into public.user_wallet (user_id, points_balance, lifetime_points)
          values ($1, 0, 0)
          on conflict (user_id) do nothing
        `, [userId]);
        }
        if (alreadyUnlocked) {
            const walletState = await client.query(`select points_balance from public.user_wallet where user_id = $1 limit 1`, [userId]);
            return {
                categoryId,
                unlocked: true,
                alreadyUnlocked: true,
                spentPoints: 0,
                pointsBalance: Number(walletState.rows[0]?.points_balance ?? 0),
            };
        }
        if (unlockCost > 0) {
            const walletUpdate = await client.query(`
          update public.user_wallet
          set
            points_balance = points_balance - $2,
            updated_at = now()
          where user_id = $1
            and points_balance >= $2
          returning points_balance
        `, [userId, unlockCost]);
            const updatedWallet = walletUpdate.rows[0];
            if (!updatedWallet) {
                throw new Error('INSUFFICIENT_POINTS');
            }
            await client.query(`
          insert into public.points_ledger (user_id, reason, delta, reference_type, reference_id)
          values ($1, $2, $3, $4, $5)
        `, [userId, 'category_unlock', -unlockCost, 'category', categoryId]);
            return {
                categoryId,
                unlocked: true,
                alreadyUnlocked: false,
                spentPoints: unlockCost,
                pointsBalance: Number(updatedWallet.points_balance),
            };
        }
        const walletState = await client.query(`select points_balance from public.user_wallet where user_id = $1 limit 1`, [userId]);
        return {
            categoryId,
            unlocked: true,
            alreadyUnlocked: false,
            spentPoints: 0,
            pointsBalance: Number(walletState.rows[0]?.points_balance ?? 0),
        };
    }
};
exports.CatalogRepository = CatalogRepository;
exports.CatalogRepository = CatalogRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], CatalogRepository);
//# sourceMappingURL=catalog.repository.js.map