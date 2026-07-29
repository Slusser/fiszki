import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService } from '../../../core/catalog/catalog-api.service';
import { ProgressService } from '../../../core/progress/progress.service';
import { SessionService } from '../../../core/auth/session.service';
import { CategoryListItem, CategoryTier, TierName } from '../../../core/api/models';
import { canAccessTier } from '../../../core/catalog/tier-access.util';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { RetryStateComponent } from '../../../shared/ui/retry-state.component';

@Component({
  selector: 'app-catalog-page',
  imports: [RouterLink, RetryStateComponent, LoadingStateComponent, EmptyStateComponent],
  template: `
    <section class="catalog-page">
      <h2>Katalog kategorii</h2>

      @if (guardMessage(); as message) {
        <p class="catalog-page__warning">
          {{ message }}
          @if (shouldShowBlockedUnlockCta()) {
            <button
              type="button"
              (click)="unlockBlockedCategory()"
              [disabled]="unlockingCategoryId() === blockedCategoryId()"
            >
              {{
                unlockingCategoryId() === blockedCategoryId()
                  ? 'Odblokowywanie...'
                  : 'Odblokuj teraz'
              }}
            </button>
          }
        </p>
      }

      @if (feedbackMessage(); as feedback) {
        <p class="catalog-page__info">{{ feedback }}</p>
      }

      @if (errorMessage(); as error) {
        <app-retry-state [message]="error" (retry)="reloadCatalog()" />
      }

      @if (loading()) {
        <app-loading-state message="Ladowanie kategorii..." />
      } @else if (!categories().length) {
        <app-empty-state
          title="Brak kategorii"
          description="Katalog jest pusty lub chwilowo niedostepny."
        />
      } @else {
        <div class="catalog-page__list">
          @for (category of categories(); track category.id) {
            <article class="catalog-page__card">
              <header>
                <h3>{{ category.name }}</h3>
                <p>Slug: {{ category.slug }}</p>
              </header>

              <p>
                Status:
                <strong>{{ category.isUnlocked ? 'Odblokowana' : 'Zablokowana' }}</strong>
              </p>
              <p>Koszt odblokowania: {{ category.unlockCost }} pkt</p>

              @if (!category.isUnlocked) {
                <button
                  type="button"
                  (click)="unlockCategory(category.id)"
                  [disabled]="unlockingCategoryId() === category.id"
                >
                  {{ unlockingCategoryId() === category.id ? 'Odblokowywanie...' : 'Odblokuj' }}
                </button>
              } @else {
                <div class="catalog-page__tiers">
                  @for (tier of tiersForCategory(category.id); track tier.tier) {
                    <div>
                      <p>
                        Tier <strong>{{ tier.tier }}</strong> · {{ tier.masteredWords }}/{{
                          tier.totalWords
                        }}
                      </p>
                      <a
                        [routerLink]="['/quiz', category.id, tier.tier]"
                        [class.is-disabled]="!isTierAccessible(category.id, tier.tier)"
                        [attr.aria-disabled]="!isTierAccessible(category.id, tier.tier)"
                        [tabIndex]="isTierAccessible(category.id, tier.tier) ? 0 : -1"
                        >Rozpocznij quiz</a
                      >
                    </div>
                  }
                </div>
              }
            </article>
          }
        </div>
      }
    </section>
  `,
  styles: `
    .catalog-page {
      display: grid;
      gap: 1rem;
    }

    .catalog-page__warning,
    .catalog-page__info {
      margin: 0;
      border-radius: 0.5rem;
      padding: 0.75rem;
    }

    .catalog-page__warning {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      border: 1px solid #fcd34d;
      background: #fffbeb;
      color: #92400e;
    }

    .catalog-page__info {
      border: 1px solid #bfdbfe;
      background: #eff6ff;
      color: #1e3a8a;
    }

    .catalog-page__list {
      display: grid;
      gap: 0.75rem;
    }

    .catalog-page__card {
      border: 1px solid #e2e8f0;
      border-radius: 0.75rem;
      padding: 0.9rem;
      display: grid;
      gap: 0.5rem;
    }

    .catalog-page__card h3,
    .catalog-page__card p {
      margin: 0;
    }

    .catalog-page__tiers {
      display: grid;
      gap: 0.5rem;
    }

    .catalog-page a {
      color: #2563eb;
      width: fit-content;
    }

    .catalog-page a.is-disabled {
      color: #64748b;
      pointer-events: none;
      text-decoration: none;
    }

    .catalog-page button {
      width: fit-content;
      border: 1px solid #2563eb;
      border-radius: 0.5rem;
      background: #2563eb;
      color: #fff;
      padding: 0.45rem 0.75rem;
      font: inherit;
      cursor: pointer;
    }

    .catalog-page button:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
  `,
})
export class CatalogPageComponent {
  private readonly catalogApi = inject(CatalogApiService);
  private readonly progressService = inject(ProgressService);
  private readonly sessionService = inject(SessionService);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly loading = signal(true);
  readonly categories = signal<CategoryListItem[]>([]);
  readonly tiersByCategory = signal<Record<string, CategoryTier[]>>({});
  readonly unlockingCategoryId = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly feedbackMessage = signal<string | null>(null);

  readonly guardMessage = computed(() => {
    const reason = this.queryParams().get('reason');
    const blockedTier = this.queryParams().get('blockedTier');

    if (reason === 'category_locked') {
      return 'Wybrana kategoria jest zablokowana. Odblokuj ja, aby wejsc do quizu.';
    }

    if (reason === 'tier_locked') {
      return `Tier ${blockedTier ?? ''} jest jeszcze zablokowany. Ustanow wymagany progres we wczesniejszym tierze.`;
    }

    if (reason === 'category_not_found') {
      return 'Wybrana kategoria nie istnieje lub nie jest dostepna dla konta.';
    }

    if (reason === 'invalid_quiz_route') {
      return 'Niepoprawny adres quizu. Wybierz kategorie i tier z listy.';
    }

    return null;
  });
  readonly blockedCategoryId = computed(() => this.queryParams().get('blockedCategoryId'));
  readonly shouldShowBlockedUnlockCta = computed(
    () =>
      this.queryParams().get('reason') === 'category_locked' && Boolean(this.blockedCategoryId()),
  );

  constructor() {
    void this.loadCatalog();
  }

  tiersForCategory(categoryId: string): CategoryTier[] {
    return this.tiersByCategory()[categoryId] ?? [];
  }

  isTierAccessible(categoryId: string, tier: TierName): boolean {
    return canAccessTier(tier, this.tiersForCategory(categoryId));
  }

  async unlockCategory(categoryId: string): Promise<void> {
    if (this.unlockingCategoryId()) {
      return;
    }

    this.unlockingCategoryId.set(categoryId);
    this.errorMessage.set(null);
    this.feedbackMessage.set(null);

    try {
      const response = await firstValueFrom(this.catalogApi.unlockCategory(categoryId));
      const info = response.alreadyUnlocked
        ? 'Kategoria byla juz odblokowana.'
        : `Kategoria odblokowana. Wydano ${response.spentPoints} pkt.`;
      this.feedbackMessage.set(info);

      await Promise.allSettled([
        this.loadCatalog(),
        this.sessionService.refreshProfile(),
        this.progressService.refresh(),
      ]);
    } catch {
      this.errorMessage.set(
        'Nie udalo sie odblokowac kategorii. Sprawdz saldo punktow i sprobuj ponownie.',
      );
    } finally {
      this.unlockingCategoryId.set(null);
    }
  }

  unlockBlockedCategory(): void {
    const categoryId = this.blockedCategoryId();
    if (!categoryId) {
      return;
    }

    void this.unlockCategory(categoryId);
  }

  reloadCatalog(): void {
    void this.loadCatalog();
  }

  private async loadCatalog(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);

    try {
      const categoriesResponse = await firstValueFrom(this.catalogApi.getCategories());
      const categories = categoriesResponse.categories;
      this.categories.set(categories);

      const tierPairs = await Promise.all(
        categories
          .filter((category) => category.isUnlocked)
          .map(async (category) => {
            const tiers = await firstValueFrom(this.catalogApi.getCategoryTiers(category.id));
            return [category.id, tiers.tiers] as const;
          }),
      );

      this.tiersByCategory.set(Object.fromEntries(tierPairs));
    } catch {
      this.errorMessage.set('Nie udalo sie pobrac katalogu. Sprobuj ponownie za chwile.');
    } finally {
      this.loading.set(false);
    }
  }
}
