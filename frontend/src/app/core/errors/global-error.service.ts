import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiErrorResponse } from '../api/models';

export interface GlobalApiError {
  status: number;
  code: string;
  message: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class GlobalErrorService {
  private readonly state = signal<GlobalApiError | null>(null);

  readonly error = this.state.asReadonly();

  clear(): void {
    this.state.set(null);
  }

  setFromHttpError(error: HttpErrorResponse): void {
    const payload = this.toApiErrorResponse(error.error);
    const fallbackMessage =
      error.status >= 500 ? 'Wystapil blad serwera. Sprobuj ponownie.' : 'Wystapil blad API.';

    this.state.set({
      status: error.status,
      code: payload?.error.code ?? `HTTP_${error.status || 0}`,
      message: payload?.error.message ?? fallbackMessage,
      timestamp: payload?.timestamp ?? new Date().toISOString(),
    });
  }

  private toApiErrorResponse(value: unknown): ApiErrorResponse | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    const payload = value as Partial<ApiErrorResponse>;
    if (!payload.error || typeof payload.error !== 'object') {
      return null;
    }

    if (typeof payload.error.code !== 'string' || typeof payload.error.message !== 'string') {
      return null;
    }

    return {
      success: false,
      error: {
        code: payload.error.code,
        message: payload.error.message,
        details: payload.error.details,
      },
      timestamp:
        typeof payload.timestamp === 'string' ? payload.timestamp : new Date().toISOString(),
      path: typeof payload.path === 'string' ? payload.path : '',
    };
  }
}
