import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { CatalogApiService } from '../../../core/catalog/catalog-api.service';
import { ProgressService } from '../../../core/progress/progress.service';
import { SessionService } from '../../../core/auth/session.service';
import { CategoryListItem, CategoryTier } from '../../../core/api/models';
import { EmptyStateComponent } from '../../../shared/ui/empty-state.component';
import { LoadingStateComponent } from '../../../shared/ui/loading-state.component';
import { RetryStateComponent } from '../../../shared/ui/retry-state.component';
import { CategoryCardComponent } from '../../../shared/ui/category-card.component';

const FILTERS = [
  { id: 'all', label: 'Wszystkie' },
  { id: 'in-progress', label: 'W trakcie' },
  { id: 'unlocked', label: 'Odblokowane' },
  { id: 'locked', label: 'Zablokowane' },
] as const;

type FilterId = (typeof FILTERS)[number]['id'];

@Component({
  selector: 'app-catalog-page',
  imports: [
    RetryStateComponent,
    LoadingStateComponent,
    EmptyStateComponent,
    CategoryCardComponent,
  ],
  template: `
    <section class="catalog-page">
      <section class="catalog-hero surface-card gradient-warm">
        <div class="catalog-hero__content">
          <p class="catalog-hero__badge">Seria 4 dni</p>
          <h2>Katalog kategorii</h2>
          <p>
            Wybierz kategorie, przejdz przez tiery Easy · Hard · Expert i odblokowuj kolejne
            zestawy punktami.
          </p>
        </div>

        <dl class="catalog-hero__stats">
          <div>
            <dt>Odblokowane</dt>
            <dd>{{ unlockedCount() }}/{{ categories().length }}</dd>
          </div>
          <div>
            <dt>Ukonczone tiery</dt>
            <dd>{{ completedTiersCount() }}</dd>
          </div>
          <div>
            <dt>Punkty</dt>
            <dd>{{ pointsBalanceLabel() }}</dd>
          </div>
        </dl>
      </section>

      @if (guardMessage(); as message) {
        <p class="catalog-alert catalog-alert--warning">
          <span>{{ message }}</span>
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
        <p class="catalog-alert catalog-alert--info">{{ feedback }}</p>
      }

      @if (errorMessage(); as error) {
        <app-retry-state [message]="error" (retry)="reloadCatalog()" />
      }

      <section class="catalog-toolbar">
        <label class="catalog-search">
          <span class="sr-only">Szukaj kategorii</span>
          <input
            type="search"
            [value]="query()"
            (input)="onQueryInput($event)"
            placeholder="Szukaj kategorii..."
            aria-label="Szukaj kategorii"
          />
        </label>

        <div class="catalog-filters" role="tablist" aria-label="Filtruj kategorie">
          @for (filter of filters; track filter.id) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="activeFilter() === filter.id"
              [class.is-active]="activeFilter() === filter.id"
              (click)="setFilter(filter.id)"
            >
              {{ filter.label }}
            </button>
          }
        </div>
      </section>

      @if (loading()) {
        <app-loading-state message="Ladowanie katalogu..." />
      } @else if (!categories().length) {
        <app-empty-state
          title="Brak kategorii"
          description="Katalog jest pusty lub chwilowo niedostepny."
        />
      } @else if (!visibleCategories().length) {
        <section class="catalog-empty surface-card">
          <p class="catalog-empty__icon" aria-hidden="true">?</p>
          <h3>Brak wynikow</h3>
          <p>Nie znalezlismy kategorii pasujacej do filtrow. Sprobuj innej frazy.</p>
          <button type="button" (click)="clearFilters()">Wyczysc filtry</button>
        </section>
      } @else {
        <div class="catalog-grid">
          @for (category of visibleCategories(); track category.id) {
            <app-category-card
              [category]="category"
              [tiers]="tiersForCategory(category.id)"
              [pointsBalance]="pointsBalance()"
              [unlocking]="unlockingCategoryId() === category.id"
              (unlock)="unlockCategory($event)"
            />
          }
        </div>
      }
    </section>
  `,
  styles: `
    .catalog-page {
      display: grid;
      gap: 1.1rem;
      padding-bottom: 1rem;
    }

    .catalog-hero {
      display: grid;
      gap: 1.15rem;
      padding: 1.15rem;
    }

    .catalog-hero__content h2 {
      margin: 0.55rem 0 0;
      font-size: clamp(1.7rem, 3.6vw, 2.35rem);
    }

    .catalog-hero__content p {
      margin: 0.5rem 0 0;
      max-width: 56ch;
      color: var(--muted-foreground);
      line-height: 1.5;
    }

    .catalog-hero__badge {
      margin: 0;
      display: inline-flex;
      align-items: center;
      width: fit-content;
      border-radius: 999px;
      background: color-mix(in srgb, var(--primary) 12%, var(--card));
      color: var(--primary);
      font-size: 0.83rem;
      font-weight: 700;
      padding: 0.35rem 0.72rem;
    }

    .catalog-hero__stats {
      margin: 0;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.55rem;
    }

    .catalog-hero__stats div {
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      background: var(--card);
      text-align: center;
      padding: 0.7rem 0.8rem;
      min-height: 5rem;
      display: grid;
      align-content: space-between;
      justify-items: center;
    }

    .catalog-hero__stats dt {
      color: var(--muted-foreground);
      font-size: 0.72rem;
      margin: 0;
      min-height: 2em;
      display: grid;
      align-items: center;
    }

    .catalog-hero__stats dd {
      margin: 0.35rem 0 0;
      font-family: var(--font-display);
      font-size: 1.16rem;
      font-weight: 900;
      line-height: 1;
    }

    .catalog-alert {
      margin: 0;
      border-radius: var(--radius-xl);
      padding: 0.75rem 0.85rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .catalog-alert--warning {
      border: 1px solid color-mix(in srgb, var(--warning) 38%, var(--border));
      background: color-mix(in srgb, var(--warning) 16%, var(--card));
      color: color-mix(in srgb, var(--warning-foreground) 65%, #000);
    }

    .catalog-alert--warning button {
      border: 1px solid transparent;
      border-radius: var(--radius-lg);
      background: var(--secondary);
      color: var(--secondary-foreground);
      font-weight: 700;
      padding: 0.35rem 0.7rem;
      cursor: pointer;
    }

    .catalog-alert--info {
      border: 1px solid color-mix(in srgb, var(--secondary) 20%, var(--border));
      background: color-mix(in srgb, var(--accent) 35%, var(--card));
      color: var(--secondary);
    }

    .catalog-toolbar {
      display: grid;
      gap: 0.65rem;
      align-items: center;
    }

    .catalog-search input {
      width: 100%;
      min-height: 2.8rem;
      border: 1px solid var(--input);
      border-radius: var(--radius-xl);
      background: var(--card);
      padding: 0.6rem 0.85rem;
    }

    .catalog-search input:focus {
      border-color: var(--ring);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring) 24%, transparent);
      outline: none;
    }

    .catalog-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
    }

    .catalog-filters button {
      min-height: 2.65rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-xl);
      background: var(--card);
      color: var(--muted-foreground);
      padding: 0.46rem 0.8rem;
      font-size: 0.87rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease;
    }

    .catalog-filters button:hover {
      background: var(--accent);
      color: var(--accent-foreground);
      border-color: transparent;
    }

    .catalog-filters button.is-active {
      background: var(--secondary);
      color: var(--secondary-foreground);
      border-color: transparent;
    }

    .catalog-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 0.75rem;
    }

    .catalog-empty {
      display: grid;
      justify-items: center;
      text-align: center;
      gap: 0.55rem;
      padding: 1.35rem;
    }

    .catalog-empty__icon {
      margin: 0;
      width: 2.7rem;
      height: 2.7rem;
      border-radius: var(--radius-xl);
      display: grid;
      place-items: center;
      background: var(--muted);
      color: var(--muted-foreground);
      font-weight: 800;
    }

    .catalog-empty h3,
    .catalog-empty p {
      margin: 0;
    }

    .catalog-empty p {
      max-width: 44ch;
      color: var(--muted-foreground);
    }

    .catalog-empty button {
      margin-top: 0.2rem;
      min-height: 2.55rem;
      border: 1px solid transparent;
      border-radius: var(--radius-xl);
      background: var(--secondary);
      color: var(--secondary-foreground);
      font-weight: 700;
      padding: 0.45rem 0.95rem;
      cursor: pointer;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    @media (min-width: 740px) {
      .catalog-hero {
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
      }

      .catalog-hero__stats {
        width: 23.5rem;
      }

      .catalog-toolbar {
        grid-template-columns: minmax(0, 1fr) auto;
      }
    }

    @media (min-width: 760px) {
      .catalog-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (min-width: 1120px) {
      .catalog-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
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
  readonly filters = FILTERS;
  readonly activeFilter = signal<FilterId>('all');
  readonly query = signal('');

  readonly pointsBalance = computed(() => this.sessionService.user()?.pointsBalance ?? 0);
  readonly pointsBalanceLabel = computed(() =>
    new Intl.NumberFormat('pl-PL').format(this.pointsBalance()),
  );
  readonly unlockedCount = computed(() => this.categories().filter((category) => category.isUnlocked).length);
  readonly completedTiersCount = computed(() =>
    this.categories().reduce((sum, category) => sum + this.completedTiersForCategory(category.id), 0),
  );
  readonly visibleCategories = computed(() => {
    const query = this.query().trim().toLowerCase();
    const filter = this.activeFilter();

    return this.categories()
      .filter((category) => {
        const matchesQuery = !query || category.name.toLowerCase().includes(query);
        if (!matchesQuery) {
          return false;
        }
        return this.matchesFilter(category, filter);
      })
      .sort((left, right) => {
        const rankDiff = this.categoryDisplayRank(left) - this.categoryDisplayRank(right);
        if (rankDiff !== 0) {
          return rankDiff;
        }
        return left.name.localeCompare(right.name, 'pl');
      });
  });

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

  setFilter(filter: FilterId): void {
    this.activeFilter.set(filter);
  }

  onQueryInput(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.query.set(input?.value ?? '');
  }

  clearFilters(): void {
    this.query.set('');
    this.activeFilter.set('all');
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

  private completedTiersForCategory(categoryId: string): number {
    return this.tiersForCategory(categoryId).filter(
      (tier) => tier.totalWords > 0 && tier.masteredWords >= tier.totalWords,
    ).length;
  }

  private masteredWordsForCategory(categoryId: string): number {
    return this.tiersForCategory(categoryId).reduce((sum, tier) => sum + tier.masteredWords, 0);
  }

  private matchesFilter(category: CategoryListItem, filter: FilterId): boolean {
    if (filter === 'all') {
      return true;
    }

    if (filter === 'locked') {
      return !category.isUnlocked;
    }

    if (filter === 'unlocked') {
      return category.isUnlocked;
    }

    if (!category.isUnlocked) {
      return false;
    }

    const completedTiers = this.completedTiersForCategory(category.id);
    const mastered = this.masteredWordsForCategory(category.id);
    return mastered > 0 && completedTiers < 3;
  }

  private categoryDisplayRank(category: CategoryListItem): number {
    const isCompleted = this.completedTiersForCategory(category.id) >= 3;
    if (isCompleted) {
      return 2;
    }
    if (category.isUnlocked) {
      return 0;
    }
    return 1;
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
