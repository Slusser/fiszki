import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import type {
  ProgressCategoryOverviewDto,
  ProgressOverviewResponseDto,
  ProgressTierOverviewDto,
} from './dto/progress-overview.dto';
import type { QuizTier } from '../quiz/dto/quiz-tier.dto';

interface ProgressOverviewRow {
  category_id: string;
  category_slug: string;
  category_name: string;
  tier: QuizTier;
  total_words: number | string;
  mastered_words: number | string;
}

@Injectable()
export class ProgressionRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getOverview(userId: string): Promise<ProgressOverviewResponseDto> {
    const result = await this.databaseService.query<ProgressOverviewRow>(
      `
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
      `,
      [userId],
    );

    const byCategory = new Map<string, ProgressCategoryOverviewDto>();
    for (const row of result.rows) {
      const existing = byCategory.get(row.category_id);
      const tierEntry: ProgressTierOverviewDto = {
        tier: row.tier,
        totalWords: Number(row.total_words),
        masteredWords: Number(row.mastered_words),
        completed: Number(row.total_words) > 0 && Number(row.total_words) === Number(row.mastered_words),
      };

      if (!existing) {
        byCategory.set(row.category_id, {
          categoryId: row.category_id,
          categorySlug: row.category_slug,
          categoryName: row.category_name,
          tiers: [tierEntry],
        });
      } else {
        existing.tiers.push(tierEntry);
      }
    }

    return { categories: Array.from(byCategory.values()) };
  }
}
