import { Injectable, inject } from '@angular/core';
import type { AuthError } from '@supabase/supabase-js';
import { SupabaseClientService } from './supabase-client.service';
import { SessionService } from './session.service';

interface AuthResult {
  ok: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabaseClient = inject(SupabaseClientService);
  private readonly sessionService = inject(SessionService);

  async login(email: string, password: string): Promise<AuthResult> {
    const { error } = await this.supabaseClient.client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { ok: false, message: this.mapSupabaseError(error) };
    }

    const authenticated = await this.sessionService.syncFromCurrentSession();
    if (!authenticated) {
      return {
        ok: false,
        message: 'Nie udalo sie odswiezyc sesji po logowaniu. Sprobuj ponownie.',
      };
    }

    return { ok: true };
  }

  async register(email: string, password: string, displayName: string | null): Promise<AuthResult> {
    const { data, error } = await this.supabaseClient.client.auth.signUp({
      email,
      password,
      options: displayName ? { data: { display_name: displayName } } : undefined,
    });

    if (error) {
      return { ok: false, message: this.mapSupabaseError(error) };
    }

    if (!data.session) {
      return {
        ok: true,
        message:
          'Konto utworzone. Sprawdz skrzynke email i potwierdz rejestracje, aby sie zalogowac.',
      };
    }

    const authenticated = await this.sessionService.syncFromCurrentSession();
    if (!authenticated) {
      return {
        ok: false,
        message: 'Konto utworzono, ale nie udalo sie pobrac sesji. Zaloguj sie ponownie.',
      };
    }

    return { ok: true };
  }

  private mapSupabaseError(error: AuthError): string {
    if (error.status === 400 || error.status === 422) {
      return error.message;
    }

    return 'Blad uslugi logowania. Sprobuj ponownie za chwile.';
  }
}
