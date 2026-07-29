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
exports.UsersRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../common/database/database.service");
let UsersRepository = class UsersRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async getProfileAndWallet(userId) {
        const result = await this.databaseService.query(`
        select
          p.user_id,
          p.display_name,
          p.created_at::text as created_at,
          coalesce(w.points_balance, 0) as points_balance,
          coalesce(w.lifetime_points, 0) as lifetime_points
        from public.profiles p
        left join public.user_wallet w on w.user_id = p.user_id
        where p.user_id = $1
        limit 1
      `, [userId]);
        const row = result.rows[0];
        if (!row) {
            return {
                userId,
                displayName: null,
                pointsBalance: 0,
                lifetimePoints: 0,
                createdAt: null,
            };
        }
        return {
            userId: row.user_id,
            displayName: row.display_name,
            pointsBalance: Number(row.points_balance ?? 0),
            lifetimePoints: Number(row.lifetime_points ?? 0),
            createdAt: row.created_at,
        };
    }
};
exports.UsersRepository = UsersRepository;
exports.UsersRepository = UsersRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], UsersRepository);
//# sourceMappingURL=users.repository.js.map