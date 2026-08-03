import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryListItem, CategoryTier, TierName } from '../../core/api/models';
import { canAccessTier } from '../../core/catalog/tier-access.util';

@Component({
  selector: 'app-category-card',
  imports: [RouterLink],
  template: `
    <article class="category-card surface-card" [class.is-locked]="!category.isUnlocked">
      <header class="category-card__header">
        <span class="category-card__badge" aria-hidden="true">{{ initials() }}</span>
        <div class="category-card__meta">
          <h3>{{ category.name }}</h3>
          <p>{{ totalWords() }} slowek · 3 tiery</p>
        </div>
        @if (completedTiers() === 3) {
          <span class="category-card__done">Ukonczona</span>
        }
      </header>

      @if (!category.isUnlocked) {
        <p class="category-card__desc">Odblokuj te kategorie, aby zaczac nauke nowych slowek.</p>
      } @else {
        <div class="category-card__progress">
          <div class="category-card__progress-head">
            <span>Opanowane {{ masteredWords() }}/{{ totalWords() }}</span>
            <strong>{{ progressPercent() }}%</strong>
          </div>

          <div
            class="category-card__bar"
            role="progressbar"
            [attr.aria-valuenow]="progressPercent()"
            aria-valuemin="0"
            aria-valuemax="100"
            [attr.aria-label]="'Postep kategorii ' + category.name"
          >
            <div class="category-card__bar-fill gradient-ember" [style.width.%]="barWidthPercent()"></div>
          </div>

          <ul class="category-card__tiers">
            @for (tier of tierOrder; track tier) {
              <li [class.is-done]="isTierDone(tier)" [class.is-active]="isTierActive(tier)">
                {{ tierLabel(tier) }}
              </li>
            }
          </ul>
        </div>
      }

      @if (!category.isUnlocked) {
        <button
          type="button"
          class="category-card__cta"
          [class.is-disabled]="!canUnlock()"
          [disabled]="!canUnlock() || unlocking"
          (click)="unlock.emit(category.id)"
        >
          @if (unlocking) {
            Odblokowywanie...
          } @else if (canUnlock()) {
            Odblokuj za {{ pointsCostLabel() }} pkt
          } @else {
            Brakuje {{ missingPointsLabel() }} pkt
          }
        </button>
      } @else {
        <div class="category-card__actions">
          @for (tier of tierOrder; track tier) {
            <a
              [routerLink]="['/quiz', category.id, tier]"
              [class.is-disabled]="!canEnterTier(tier)"
              [attr.aria-disabled]="!canEnterTier(tier)"
              [tabIndex]="canEnterTier(tier) ? 0 : -1"
            >
              {{ tierLabel(tier) }}
            </a>
          }
        </div>
      }
    </article>
  `,
  styles: `
    .category-card {
      display: grid;
      gap: 1rem;
      padding: 1rem;
      border-radius: var(--radius-2xl);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .category-card:not(.is-locked):hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lift);
    }

    .category-card.is-locked {
      border-style: dashed;
      background: color-mix(in srgb, var(--muted) 65%, var(--card));
    }

    .category-card__header {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      align-items: start;
      gap: 0.65rem;
    }

    .category-card__badge {
      display: grid;
      place-items: center;
      width: 2.7rem;
      height: 2.7rem;
      border-radius: var(--radius-xl);
      background: var(--accent);
      color: var(--accent-foreground);
      font-weight: 800;
      letter-spacing: 0.02em;
    }

    .category-card__meta {
      min-width: 0;
    }

    .category-card__meta h3 {
      margin: 0;
      font-family: var(--font-display);
      font-size: 1.06rem;
      font-weight: 900;
      line-height: 1.15;
    }

    .category-card__meta p {
      margin: 0.2rem 0 0;
      color: var(--muted-foreground);
      font-size: 0.86rem;
    }

    .category-card__done {
      border-radius: 999px;
      background: color-mix(in srgb, var(--success) 18%, var(--card));
      color: var(--success);
      font-size: 0.73rem;
      font-weight: 700;
      padding: 0.28rem 0.56rem;
      white-space: nowrap;
    }

    .category-card__desc {
      margin: 0;
      color: var(--muted-foreground);
      font-size: 0.92rem;
    }

    .category-card__progress {
      display: grid;
      gap: 0.5rem;
    }

    .category-card__progress-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.6rem;
      font-size: 0.85rem;
      color: var(--muted-foreground);
    }

    .category-card__progress-head strong {
      font-family: var(--font-display);
      color: var(--foreground);
      font-size: 0.94rem;
    }

    .category-card__bar {
      height: 0.5rem;
      border-radius: 999px;
      overflow: hidden;
      background: var(--muted);
    }

    .category-card__bar-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.35s ease;
    }

    .category-card__tiers {
      margin: 0;
      padding: 0;
      list-style: none;
      display: flex;
      gap: 0.35rem;
    }

    .category-card__tiers li {
      flex: 1;
      text-align: center;
      border-radius: var(--radius-md);
      background: var(--muted);
      color: var(--muted-foreground);
      font-size: 0.74rem;
      font-weight: 700;
      padding: 0.33rem 0.4rem;
    }

    .category-card__tiers li.is-active {
      background: color-mix(in srgb, var(--copper) 30%, var(--card));
      color: var(--secondary);
    }

    .category-card__tiers li.is-done {
      background: color-mix(in srgb, var(--success) 18%, var(--card));
      color: var(--success);
    }

    .category-card__cta {
      min-height: 2.8rem;
      width: 100%;
      border: 1px solid transparent;
      border-radius: var(--radius-xl);
      background: var(--secondary);
      color: var(--secondary-foreground);
      font-family: var(--font-display);
      font-size: 0.95rem;
      font-weight: 800;
      cursor: pointer;
      transition: filter 0.2s ease;
    }

    .category-card__cta:hover:not(:disabled) {
      filter: brightness(1.05);
    }

    .category-card__cta.is-disabled {
      border-color: var(--border);
      background: var(--card);
      color: var(--muted-foreground);
      cursor: not-allowed;
    }

    .category-card__actions {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 0.45rem;
    }

    .category-card__actions a {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-height: 2.5rem;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--card);
      color: var(--secondary);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .category-card__actions a:not(.is-disabled):hover {
      border-color: transparent;
      background: var(--accent);
      color: var(--accent-foreground);
    }

    .category-card__actions a.is-disabled {
      color: var(--muted-foreground);
      background: color-mix(in srgb, var(--muted) 65%, var(--card));
      pointer-events: none;
    }
  `,
})
export class CategoryCardComponent {
  @Input({ required: true }) category!: CategoryListItem;
  @Input() tiers: CategoryTier[] = [];
  @Input() pointsBalance = 0;
  @Input() unlocking = false;
  @Output() unlock = new EventEmitter<string>();

  readonly tierOrder: TierName[] = ['easy', 'hard', 'expert'];

  masteredWords(): number {
    return this.tiers.reduce((max, tier) => Math.max(max, tier.masteredWords), 0);
  }

  totalWords(): number {
    const total = this.tiers.reduce((max, tier) => Math.max(max, tier.totalWords), 0);
    return total > 0 ? total : 50;
  }

  completedTiers(): number {
    return this.tiers.filter((tier) => tier.totalWords > 0 && tier.masteredWords >= tier.totalWords).length;
  }

  progressPercent(): number {
    const total = this.totalWords();
    if (total <= 0) {
      return 0;
    }
    return Math.round((this.masteredWords() / total) * 100);
  }

  canUnlock(): boolean {
    return this.pointsBalance >= this.category.unlockCost;
  }

  pointsCostLabel(): string {
    return new Intl.NumberFormat('pl-PL').format(this.category.unlockCost);
  }

  missingPointsLabel(): string {
    return new Intl.NumberFormat('pl-PL').format(
      Math.max(this.category.unlockCost - this.pointsBalance, 0),
    );
  }

  initials(): string {
    const name = this.category.name.trim();
    if (!name) {
      return 'KA';
    }

    const parts = name.split(/\s+/);
    if (parts.length === 1) {
      return parts[0]!.slice(0, 2).toUpperCase();
    }
    return (parts[0]![0] + parts[1]![0]).toUpperCase();
  }

  barWidthPercent(): number {
    return Math.max(this.progressPercent(), 2);
  }

  tierLabel(tier: TierName): string {
    if (tier === 'easy') {
      return 'Easy';
    }
    if (tier === 'hard') {
      return 'Hard';
    }
    return 'Expert';
  }

  canEnterTier(tier: TierName): boolean {
    return canAccessTier(tier, this.tiers);
  }

  isTierDone(tier: TierName): boolean {
    const foundTier = this.tiers.find((entry) => entry.tier === tier);
    if (!foundTier) {
      return false;
    }
    return foundTier.totalWords > 0 && foundTier.masteredWords >= foundTier.totalWords;
  }

  isTierActive(tier: TierName): boolean {
    return this.canEnterTier(tier) && !this.isTierDone(tier);
  }
}
