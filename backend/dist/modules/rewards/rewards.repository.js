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
};
exports.RewardsRepository = RewardsRepository;
exports.RewardsRepository = RewardsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RewardsRepository);
//# sourceMappingURL=rewards.repository.js.map