import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import { ApiSuccessResponse, ProgressOverviewResponse } from '../api/models';

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly apiClient = inject(ApiClientService);
  private readonly overviewState = signal<ProgressOverviewResponse | null>(null);

  readonly overview = computed(() => this.overviewState());

  async refresh(): Promise<void> {
    const response = await firstValueFrom(
      this.apiClient.get<ApiSuccessResponse<ProgressOverviewResponse>>('/progress/overview'),
    );
    this.overviewState.set(response.data);
  }
}
