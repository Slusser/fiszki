import { Component, inject, signal } from '@angular/core';
import { WalletLedgerItem } from '../../../core/api/models';
import { WalletService } from '../../../core/wallet/wallet.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { RetryStateComponent } from '../../../shared/ui/retry-state.component';

@Component({
  selector: 'app-wallet-page',
  imports: [RetryStateComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <section class="wallet-page">
      <h2>Wallet</h2>

      @if (errorMessage(); as error) {
        <app-retry-state [message]="error" (retry)="reload()" />
      }

      @if (loading()) {
        <app-loading-state message="Ladowanie wallet..." />
      } @else {
        @if (pointsBalance() !== null) {
          <article class="wallet-page__card">
            <p><strong>Saldo:</strong> {{ pointsBalance() }} pkt</p>
            <p><strong>Punkty lacznie:</strong> {{ lifetimePoints() }} pkt</p>
            <p><strong>Aktualizacja:</strong> {{ updatedAt() || 'brak danych' }}</p>
          </article>
        }

        <h3>Historia punktow</h3>
        @if (!ledgerEntries().length) {
          <app-empty-state
            title="Brak wpisow w historii"
            description="Nowe operacje punktowe pojawia sie tutaj."
          />
        } @else {
          <div class="wallet-page__ledger">
            @for (entry of ledgerEntries(); track entry.id) {
              <article class="wallet-page__ledger-item">
                <p>
                  <strong>{{ entry.delta >= 0 ? '+' : '' }}{{ entry.delta }} pkt</strong>
                  · {{ entry.reason }}
                </p>
                <p>{{ entry.createdAt }}</p>
                @if (entry.referenceType || entry.referenceId) {
                  <p>Ref: {{ entry.referenceType || '-' }} / {{ entry.referenceId || '-' }}</p>
                }
              </article>
            }
          </div>
        }
      }
    </section>
  `,
  styles: `
    .wallet-page {
      display: grid;
      gap: 1rem;
    }

    .wallet-page__card {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.9rem;
      display: grid;
      gap: 0.5rem;
    }

    .wallet-page__card p {
      margin: 0;
    }

    .wallet-page__ledger {
      display: grid;
      gap: 0.65rem;
    }

    .wallet-page__ledger-item {
      border: 1px solid #e2e8f0;
      border-radius: 0.65rem;
      padding: 0.75rem;
      display: grid;
      gap: 0.25rem;
    }

    .wallet-page__ledger-item p {
      margin: 0;
    }
  `,
})
export class WalletPageComponent {
  private readonly walletService = inject(WalletService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly pointsBalance = signal<number | null>(null);
  readonly lifetimePoints = signal<number | null>(null);
  readonly updatedAt = signal<string | null>(null);
  readonly ledgerEntries = signal<WalletLedgerItem[]>([]);

  constructor() {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [wallet, ledger] = await Promise.all([
        this.walletService.getWallet(),
        this.walletService.getLedger({ limit: 50 }),
      ]);

      this.pointsBalance.set(wallet.pointsBalance);
      this.lifetimePoints.set(wallet.lifetimePoints);
      this.updatedAt.set(wallet.updatedAt);
      this.ledgerEntries.set(ledger.entries);
    } catch {
      this.errorMessage.set('Nie udalo sie pobrac danych wallet.');
    } finally {
      this.loading.set(false);
    }
  }
}
