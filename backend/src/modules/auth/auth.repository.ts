import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

@Injectable()
export class AuthRepository {
  private readonly supabaseUrl = process.env.SUPABASE_URL;
  private readonly supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  private readonly client: SupabaseClient | null =
    this.supabaseUrl && this.supabaseAnonKey
      ? createClient(this.supabaseUrl, this.supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;

  async getUserByAccessToken(accessToken: string): Promise<User | null> {
    if (!this.client) {
      throw new ServiceUnavailableException(
        'Supabase auth is not configured (SUPABASE_URL / SUPABASE_ANON_KEY)',
      );
    }

    const { data, error } = await this.client.auth.getUser(accessToken);
    if (error) {
      return null;
    }

    return data.user;
  }
}
