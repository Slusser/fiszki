import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import type { Session } from '@supabase/supabase-js';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import { ApiSuccessResponse, MeResponse } from '../api/models';
import { SupabaseClientService } from './supabase-client.service';

interface SessionState {
  initialized: boolean;
  loading: boolean;
  accessToken: string | null;
  user: MeResponse | null;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly apiClient = inject(ApiClientService);
  private readonly supabaseClient = inject(SupabaseClientService);
  private readonly router = inject(Router);

  private readonly state = signal<SessionState>({
    initialized: false,
    loading: true,
    accessToken: null,
    user: null,
  });

  private bootstrapPromise: Promise<void> | null = null;
  private listenerAttached = false;

  readonly initialized = computed(() => this.state().initialized);
  readonly loading = computed(() => this.state().loading);
  readonly user = computed(() => this.state().user);
  readonly isAuthenticated = computed(
    () => Boolean(this.state().accessToken) && Boolean(this.state().user),
  );

  init(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.bootstrap();
    }

    return this.bootstrapPromise;
  }

  async getAccessToken(): Promise<string | null> {
    const tokenFromState = this.state().accessToken;
    if (tokenFromState) {
      return tokenFromState;
    }

    const { data } = await this.supabaseClient.client.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async logout(): Promise<void> {
    await this.supabaseClient.client.auth.signOut();
    this.setUnauthenticatedState();
    await this.router.navigateByUrl('/auth/login');
  }

  async handleUnauthorized(): Promise<void> {
    this.setUnauthenticatedState();
    if (!this.router.url.startsWith('/auth/')) {
      await this.router.navigate(['/auth/login'], {
        queryParams: { redirect: this.router.url },
      });
    }
  }

  async refreshProfile(): Promise<void> {
    const currentToken = await this.getAccessToken();
    if (!currentToken) {
      this.setUnauthenticatedState();
      return;
    }

    try {
      const meResponse = await this.fetchMe();
      this.state.update((value) => ({
        ...value,
        user: meResponse,
      }));
    } catch {
      await this.handleUnauthorized();
    }
  }

  async syncFromCurrentSession(): Promise<boolean> {
    const { data } = await this.supabaseClient.client.auth.getSession();
    await this.applySupabaseSession(data.session);
    return this.isAuthenticated();
  }

  private async bootstrap(): Promise<void> {
    if (!this.listenerAttached) {
      this.attachAuthStateListener();
    }

    const { data } = await this.supabaseClient.client.auth.getSession();
    await this.applySupabaseSession(data.session);
  }

  private attachAuthStateListener(): void {
    this.listenerAttached = true;

    this.supabaseClient.client.auth.onAuthStateChange((_event, session) => {
      void this.applySupabaseSession(session);
    });
  }

  private async applySupabaseSession(session: Session | null): Promise<void> {
    if (!session?.access_token) {
      this.setUnauthenticatedState();
      return;
    }

    this.state.update((value) => ({
      ...value,
      loading: true,
      accessToken: session.access_token,
    }));

    try {
      const meResponse = await this.fetchMe();
      this.state.set({
        initialized: true,
        loading: false,
        accessToken: session.access_token,
        user: meResponse,
      });
    } catch {
      this.setUnauthenticatedState();
    }
  }

  private setUnauthenticatedState(): void {
    this.state.set({
      initialized: true,
      loading: false,
      accessToken: null,
      user: null,
    });
  }

  private async fetchMe(): Promise<MeResponse> {
    const response = await firstValueFrom(
      this.apiClient.get<ApiSuccessResponse<MeResponse>>('/me'),
    );

    return response.data;
  }
}
