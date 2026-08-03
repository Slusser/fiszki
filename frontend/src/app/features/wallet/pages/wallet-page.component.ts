import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CategoryListItem, WalletLedgerItem } from '../../../core/api/models';
import { CatalogApiService } from '../../../core/catalog/catalog-api.service';
import { WalletService } from '../../../core/wallet/wallet.service';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { RetryStateComponent } from '../../../shared/ui/retry-state.component';

@Component({
  selector: 'app-wallet-page',
  imports: [RetryStateComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <section class="wallet-page">
      @if (errorMessage(); as error) {
        <app-retry-state [message]="error" (retry)="reload()" />
      }

      @if (loading()) {
        <app-loading-state message="Ladowanie wallet..." />
      } @else {
        <section class="wallet-hero surface-card gradient-warm">
          <div>
            <p class="wallet-hero__badge">Portfel punktow</p>
            <h2>Saldo: {{ pointsBalanceLabel() }} pkt</h2>
            <p>Lacznie zdobyte: {{ lifetimePointsLabel() }} pkt</p>
            <p>Aktualizacja: {{ updatedAtLabel() }}</p>
          </div>
          <dl class="wallet-hero__stats">
            <div>
              <dt>Zdobyte</dt>
              <dd>+{{ earnedPointsLabel() }}</dd>
            </div>
            <div>
              <dt>Wydane</dt>
              <dd>-{{ spentPointsLabel() }}</dd>
            </div>
            <div>
              <dt>Operacje</dt>
              <dd>{{ ledgerEntries().length }}</dd>
            </div>
          </dl>
        </section>

        <section class="wallet-grid">
          <article class="wallet-ledger surface-card">
            <h3>Historia punktow</h3>
            @if (!ledgerEntries().length) {
              <app-empty-state
                title="Brak wpisow w historii"
                description="Nowe operacje punktowe pojawia sie tutaj."
              />
            } @else {
              <ul>
                @for (entry of ledgerEntries(); track entry.id) {
                  <li class="wallet-ledger__item" [class.is-positive]="entry.delta > 0">
                    <div class="wallet-ledger__main">
                      <p>{{ entry.reason }}</p>
                      <span>{{ formatDate(entry.createdAt) }}</span>
                    </div>
                    <strong>{{ entry.delta >= 0 ? '+' : '' }}{{ formatPoints(entry.delta) }} pkt</strong>
                  </li>
                }
              </ul>
            }
          </article>

          <article class="wallet-unlock surface-card">
            <h3>Do odblokowania</h3>
            <p>Kategorie posortowane od najtanszej.</p>
            @if (!lockedCategories().length) {
              <app-empty-state
                title="Brak zablokowanych kategorii"
                description="Wszystkie kategorie sa juz odblokowane."
              />
            } @else {
              <ul>
                @for (category of lockedCategories(); track category.id) {
                  <li>
                    <div>
                      <h4>{{ category.name }}</h4>
                      <span>{{ formatPoints(category.unlockCost) }} pkt</span>
                    </div>
                    <strong [class.is-affordable]="canAfford(category.unlockCost)">
                      {{
                        canAfford(category.unlockCost)
                          ? 'Gotowa do odblokowania'
                          : 'Brakuje ' +
                            formatPoints(category.unlockCost - (pointsBalance() ?? 0)) +
                            ' pkt'
                      }}
                    </strong>
                  </li>
                }
              </ul>
            }
          </article>
        </section>
      }
    </section>
  `,
  styles: `
    .wallet-page {
      display: grid;
      gap: 0.95rem;
    }

    .wallet-hero {
      display: grid;
      gap: 0.9rem;
      padding: 1rem;
    }

    .wallet-hero__badge {
      margin: 0;
      display: inline-flex;
      width: fit-content;
      border-radius: 999px;
      background: color-mix(in srgb, var(--primary) 12%, var(--card));
      color: var(--primary);
      font-size: 0.8rem;
      font-weight: 700;
      padding: 0.32rem 0.66rem;
    }

    .wallet-hero h2 {
      margin: 0.55rem 0 0;
      font-size: clamp(1.5rem, 4vw, 2.1rem);
    }

    .wallet-hero p {
      margin: 0.4rem 0 0;
      color: var(--muted-foreground);
    }

    .wallet-hero__stats {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.5rem;
    }

    .wallet-hero__stats div {
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      background: var(--card);
      text-align: center;
      padding: 0.6rem;
    }

    .wallet-hero__stats dt {
      margin: 0;
      color: var(--muted-foreground);
      font-size: 0.72rem;
    }

    .wallet-hero__stats dd {
      margin: 0.3rem 0 0;
      font-family: var(--font-display);
      font-size: 1.08rem;
      font-weight: 900;
    }

    .wallet-grid {
      display: grid;
      gap: 0.7rem;
    }

    .wallet-ledger,
    .wallet-unlock {
      padding: 0.9rem;
    }

    .wallet-ledger h3,
    .wallet-unlock h3 {
      margin: 0;
      font-size: 1.15rem;
    }

    .wallet-unlock p {
      margin: 0.42rem 0 0;
      color: var(--muted-foreground);
      font-size: 0.86rem;
    }

    .wallet-ledger ul,
    .wallet-unlock ul {
      list-style: none;
      margin: 0.75rem 0 0;
      padding: 0;
      display: grid;
      gap: 0.5rem;
    }

    .wallet-ledger__item {
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--muted) 45%, var(--card));
      padding: 0.56rem 0.64rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.6rem;
    }

    .wallet-ledger__item.is-positive {
      border-color: color-mix(in srgb, var(--success) 32%, var(--border));
      background: color-mix(in srgb, var(--success) 8%, var(--card));
    }

    .wallet-ledger__main p {
      margin: 0;
      font-weight: 700;
    }

    .wallet-ledger__main span {
      color: var(--muted-foreground);
      font-size: 0.79rem;
    }

    .wallet-ledger__item strong {
      white-space: nowrap;
      font-family: var(--font-display);
      font-size: 0.92rem;
    }

    .wallet-unlock li {
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      background: color-mix(in srgb, var(--muted) 40%, var(--card));
      padding: 0.55rem 0.62rem;
      display: grid;
      gap: 0.3rem;
    }

    .wallet-unlock li > div {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .wallet-unlock h4 {
      margin: 0;
      font-size: 0.94rem;
    }

    .wallet-unlock span {
      font-size: 0.82rem;
      color: var(--muted-foreground);
    }

    .wallet-unlock strong {
      font-size: 0.82rem;
      color: var(--secondary);
    }

    .wallet-unlock strong.is-affordable {
      color: var(--success);
    }

    @media (min-width: 820px) {
      .wallet-hero {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
      }

      .wallet-hero__stats {
        width: 18.5rem;
      }

      .wallet-grid {
        grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
      }
    }

    @media (max-width: 620px) {
      .wallet-ledger__item {
        align-items: flex-start;
      }
    }
  `,
})
export class WalletPageComponent {
  private readonly walletService = inject(WalletService);
  private readonly catalogApi = inject(CatalogApiService);

  readonly loading = signal(true);
  readonly errorMessage = signal<string | null>(null);
  readonly pointsBalance = signal<number | null>(null);
  readonly lifetimePoints = signal<number | null>(null);
  readonly updatedAt = signal<string | null>(null);
  readonly ledgerEntries = signal<WalletLedgerItem[]>([]);
  readonly categories = signal<CategoryListItem[]>([]);
  readonly lockedCategories = computed(() =>
    this.categories()
      .filter((category) => !category.isUnlocked)
      .sort((a, b) => a.unlockCost - b.unlockCost)
      .slice(0, 12),
  );
  readonly earnedPoints = computed(() =>
    this.ledgerEntries()
      .filter((entry) => entry.delta > 0)
      .reduce((sum, entry) => sum + entry.delta, 0),
  );
  readonly spentPoints = computed(() =>
    this.ledgerEntries()
      .filter((entry) => entry.delta < 0)
      .reduce((sum, entry) => sum + Math.abs(entry.delta), 0),
  );

  constructor() {
    void this.reload();
  }

  pointsBalanceLabel(): string {
    return this.formatPoints(this.pointsBalance() ?? 0);
  }

  lifetimePointsLabel(): string {
    return this.formatPoints(this.lifetimePoints() ?? 0);
  }

  earnedPointsLabel(): string {
    return this.formatPoints(this.earnedPoints());
  }

  spentPointsLabel(): string {
    return this.formatPoints(this.spentPoints());
  }

  updatedAtLabel(): string {
    return this.updatedAt() ? this.formatDate(this.updatedAt()!) : 'brak danych';
  }

  formatPoints(value: number): string {
    return new Intl.NumberFormat('pl-PL').format(value);
  }

  formatDate(value: string): string {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat('pl-PL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  }

  canAfford(cost: number): boolean {
    return (this.pointsBalance() ?? 0) >= cost;
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const [wallet, ledger, categoriesResponse] = await Promise.all([
        this.walletService.getWallet(),
        this.walletService.getLedger({ limit: 50 }),
        firstValueFrom(this.catalogApi.getCategories()),
      ]);

      this.pointsBalance.set(wallet.pointsBalance);
      this.lifetimePoints.set(wallet.lifetimePoints);
      this.updatedAt.set(wallet.updatedAt);
      this.ledgerEntries.set(ledger.entries);
      this.categories.set(categoriesResponse.categories);
    } catch {
      this.errorMessage.set('Nie udalo sie pobrac danych wallet.');
    } finally {
      this.loading.set(false);
    }
  }
}
