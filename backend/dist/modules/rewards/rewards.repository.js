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
exports.RewardsRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../common/database/database.service");
let RewardsRepository = class RewardsRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    getClient() {
        return this.databaseService.getClient();
    }
    async getWallet(userId) {
        const result = await this.databaseService.query(`
        select
          user_id,
          points_balance,
          lifetime_points,
          updated_at::text as updated_at
        from public.user_wallet
        where user_id = $1
        limit 1
      `, [userId]);
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
    async getLedger(userId, limit) {
        const result = await this.databaseService.query(`
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
      `, [userId, limit]);
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
    async ensureWalletRow(client, userId) {
        await client.query(`
        insert into public.user_wallet (user_id, points_balance, lifetime_points)
        values ($1, 0, 0)
        on conflict (user_id) do nothing
      `, [userId]);
    }
    async getWalletBalanceForUpdate(client, userId) {
        const result = await client.query(`
        select points_balance
        from public.user_wallet
        where user_id = $1
        for update
      `, [userId]);
        return Number(result.rows[0]?.points_balance ?? 0);
    }
    async debitWallet(client, userId, points) {
        const result = await client.query(`
        update public.user_wallet
        set
          points_balance = points_balance - $2,
          updated_at = now()
        where user_id = $1
          and points_balance >= $2
        returning points_balance
      `, [userId, points]);
        const row = result.rows[0];
        if (!row) {
            throw new Error('INSUFFICIENT_POINTS');
        }
        return Number(row.points_balance);
    }
    async creditWallet(client, userId, points) {
        await client.query(`
        update public.user_wallet
        set
          points_balance = points_balance + $2,
          lifetime_points = lifetime_points + $2,
          updated_at = now()
        where user_id = $1
      `, [userId, points]);
    }
    async insertLedgerEntry(client, params) {
        await client.query(`
        insert into public.points_ledger (user_id, reason, delta, reference_type, reference_id)
        values ($1, $2, $3, $4, $5::uuid)
      `, [
            params.userId,
            params.reason,
            params.delta,
            params.referenceType,
            params.referenceId,
        ]);
    }
    async getTierRepeatCountInLast24h(client, params) {
        const result = await client.query(`
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
      `, [params.userId, params.categoryId, params.tier]);
        return Number(result.rows[0]?.repeats_count ?? 0);
    }
    async getRepeatPointsToday(client, userId) {
        const result = await client.query(`
        select coalesce(sum(delta), 0)::int as repeat_points_today
        from public.points_ledger
        where user_id = $1
          and reason = 'tier_completed_repeat'
          and created_at >= date_trunc('day', now())
      `, [userId]);
        return Number(result.rows[0]?.repeat_points_today ?? 0);
    }
    async getCategoryForUnlock(client, categoryId) {
        const result = await client.query(`
        select unlock_cost
        from public.categories
        where id = $1
          and is_active = true
        limit 1
      `, [categoryId]);
        return result.rows[0] ?? null;
    }
    async isCategoryUnlocked(client, userId, categoryId) {
        const result = await client.query(`
        select id
        from public.user_category_unlocks
        where user_id = $1
          and category_id = $2
        limit 1
      `, [userId, categoryId]);
        return Boolean(result.rows[0]);
    }
    async insertCategoryUnlock(client, userId, categoryId) {
        const result = await client.query(`
        insert into public.user_category_unlocks (user_id, category_id)
        values ($1, $2)
        on conflict (user_id, category_id) do nothing
        returning id
      `, [userId, categoryId]);
        return Boolean(result.rows[0]);
    }
};
exports.RewardsRepository = RewardsRepository;
exports.RewardsRepository = RewardsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RewardsRepository);
//# sourceMappingURL=rewards.repository.js.map