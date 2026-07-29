import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ApiClientService } from '../api/api-client.service';
import {
  ApiSuccessResponse,
  WalletLedgerQuery,
  WalletLedgerResponse,
  WalletResponse,
} from '../api/models';

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly apiClient = inject(ApiClientService);

  async getWallet(): Promise<WalletResponse> {
    const response = await firstValueFrom(
      this.apiClient.get<ApiSuccessResponse<WalletResponse>>('/wallet'),
    );
    return response.data;
  }

  async getLedger(query?: WalletLedgerQuery): Promise<WalletLedgerResponse> {
    let params = new HttpParams();
    if (query?.limit) {
      params = params.set('limit', String(query.limit));
    }

    const response = await firstValueFrom(
      this.apiClient.get<ApiSuccessResponse<WalletLedgerResponse>>('/wallet/ledger', { params }),
    );
    return response.data;
  }
}
