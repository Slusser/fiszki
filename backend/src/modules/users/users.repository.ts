import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { MeResponseDto } from './dto/me-response.dto';

interface UserProfileWalletRow {
  user_id: string;
  display_name: string | null;
  points_balance: number | string | null;
  lifetime_points: number | string | null;
  created_at: string | null;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly databaseService: DatabaseService) {}

  async getProfileAndWallet(userId: string): Promise<Omit<MeResponseDto, 'email'>> {
    const result = await this.databaseService.query<UserProfileWalletRow>(
      `
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
      `,
      [userId],
    );

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
}
