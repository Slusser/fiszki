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
exports.ProgressionRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../common/database/database.service");
let ProgressionRepository = class ProgressionRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async getOverview(userId) {
        const result = await this.databaseService.query(`
        select
          c.id as category_id,
          c.slug as category_slug,
          c.name as category_name,
          w.tier,
          count(w.id)::int as total_words,
          coalesce(sum(case when uwp.mastered then 1 else 0 end), 0)::int as mastered_words
        from public.categories c
        join public.words w
          on w.category_id = c.id
          and w.is_active = true
        left join public.user_word_progress uwp
          on uwp.word_id = w.id
          and uwp.user_id = $1
        where c.is_active = true
        group by c.id, c.slug, c.name, w.tier
        order by c.name asc,
          case w.tier
            when 'easy' then 1
            when 'hard' then 2
            when 'expert' then 3
            else 99
          end
      `, [userId]);
        const byCategory = new Map();
        for (const row of result.rows) {
            const existing = byCategory.get(row.category_id);
            const tierEntry = {
                tier: row.tier,
                totalWords: Number(row.total_words),
                masteredWords: Number(row.mastered_words),
                completed: Number(row.total_words) > 0 &&
                    Number(row.total_words) === Number(row.mastered_words),
            };
            if (!existing) {
                byCategory.set(row.category_id, {
                    categoryId: row.category_id,
                    categorySlug: row.category_slug,
                    categoryName: row.category_name,
                    tiers: [tierEntry],
                });
            }
            else {
                existing.tiers.push(tierEntry);
            }
        }
        return { categories: Array.from(byCategory.values()) };
    }
};
exports.ProgressionRepository = ProgressionRepository;
exports.ProgressionRepository = ProgressionRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], ProgressionRepository);
//# sourceMappingURL=progression.repository.js.map