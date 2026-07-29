import { type User } from '@supabase/supabase-js';
export declare class AuthRepository {
    private readonly supabaseUrl;
    private readonly supabaseAnonKey;
    private readonly client;
    getUserByAccessToken(accessToken: string): Promise<User | null>;
}
