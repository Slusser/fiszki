import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

type PrimitiveParam = string | number | boolean;
type ParamsRecord = Record<string, PrimitiveParam | readonly PrimitiveParam[]>;

interface ApiRequestOptions {
  params?: HttpParams | ParamsRecord;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly apiBaseUrl = `${environment.apiBaseUrl.replace(/\/$/, '')}/v1`;

  get<TResponse>(path: string, options?: ApiRequestOptions): Observable<TResponse> {
    return this.http.get<TResponse>(this.toApiUrl(path), options);
  }

  post<TResponse, TRequest = unknown>(
    path: string,
    body: TRequest,
    options?: ApiRequestOptions,
  ): Observable<TResponse> {
    return this.http.post<TResponse>(this.toApiUrl(path), body, options);
  }

  private toApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.apiBaseUrl}${normalizedPath}`;
  }
}
