import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../../core/auth/session.service';
import { GlobalErrorService } from '../../core/errors/global-error.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="app-shell">
      <header class="app-header">
        <div class="page-container app-header__main">
          <a routerLink="/katalog" class="app-brand">
            Fiszki<span class="app-brand__accent">ES</span>
          </a>

          <nav class="app-nav app-nav--desktop" aria-label="Nawigacja glowna">
            <a routerLink="/katalog" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }"
              >Katalog</a
            >
            <a routerLink="/quiz" routerLinkActive="is-active">Quiz</a>
            <a routerLink="/postep" routerLinkActive="is-active">Postep</a>
            <a routerLink="/wallet" routerLinkActive="is-active">Portfel</a>
          </nav>

          <div class="app-header__actions">
            <p class="points-badge" aria-label="Aktualny stan punktow">
              {{ pointsLabel() }} pkt
            </p>
            <button type="button" class="logout-btn" (click)="logout()">Wyloguj</button>
          </div>
        </div>

        <nav class="page-container app-nav app-nav--mobile" aria-label="Nawigacja mobilna">
          <a routerLink="/katalog" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }"
            >Katalog</a
          >
          <a routerLink="/quiz" routerLinkActive="is-active">Quiz</a>
          <a routerLink="/postep" routerLinkActive="is-active">Postep</a>
          <a routerLink="/wallet" routerLinkActive="is-active">Portfel</a>
        </nav>
      </header>

      <main class="page-container app-content">
        @if (session.user(); as user) {
          <p class="welcome-line">
            {{ userDisplayName() }}
          </p>
        }

        @if (errors.error(); as error) {
          <section class="app-error" role="alert">
            <p>
              <strong>{{ error.code }}</strong>
              <span>{{ error.message }}</span>
            </p>
            <button type="button" (click)="errors.clear()">Zamknij</button>
          </section>
        }

        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .app-shell {
      min-height: 100vh;
    }

    .app-header {
      position: sticky;
      top: 0;
      z-index: 30;
      border-bottom: 1px solid var(--border);
      background: color-mix(in srgb, var(--background) 88%, transparent);
      backdrop-filter: blur(10px);
    }

    .app-header__main {
      display: grid;
      grid-template-columns: auto minmax(0, 1fr) auto;
      gap: 0.75rem;
      align-items: center;
      padding-block: 0.85rem;
    }

    .app-brand {
      font-family: var(--font-display);
      font-size: 1.25rem;
      font-weight: 900;
      text-decoration: none;
      color: var(--primary);
      line-height: 1;
    }

    .app-brand__accent {
      color: var(--secondary);
    }

    .app-nav {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .app-nav a {
      text-decoration: none;
      border-radius: var(--radius-xl);
      padding: 0.55rem 0.85rem;
      color: var(--muted-foreground);
      font-size: 0.92rem;
      font-weight: 700;
      transition: background-color 0.2s ease, color 0.2s ease;
      white-space: nowrap;
    }

    .app-nav a:hover {
      background: var(--accent);
      color: var(--accent-foreground);
    }

    .app-nav a.is-active {
      background: var(--accent);
      color: var(--accent-foreground);
    }

    .app-nav--desktop {
      justify-content: center;
    }

    .app-nav--mobile {
      display: none;
      gap: 0.3rem;
      overflow-x: auto;
      padding-block: 0.45rem 0.65rem;
      border-top: 1px solid var(--border);
    }

    .app-header__actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.5rem;
      min-width: 0;
    }

    .points-badge {
      margin: 0;
      border-radius: 999px;
      background: var(--accent);
      color: var(--accent-foreground);
      font-family: var(--font-display);
      font-size: 0.82rem;
      font-weight: 800;
      letter-spacing: 0.01em;
      padding: 0.48rem 0.72rem;
      white-space: nowrap;
      line-height: 1;
    }

    .logout-btn {
      border: 1px solid transparent;
      border-radius: var(--radius-xl);
      min-height: 2.75rem;
      padding: 0.5rem 0.8rem;
      background: transparent;
      color: var(--foreground);
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s ease, color 0.2s ease;
    }

    .logout-btn:hover {
      background: var(--accent);
      color: var(--accent-foreground);
    }

    .app-content {
      display: grid;
      gap: 0.9rem;
      padding-block: 1.15rem 1.5rem;
    }

    .welcome-line {
      margin: 0;
      color: var(--muted-foreground);
      font-size: 0.92rem;
    }

    .app-error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin: 0;
      border: 1px solid color-mix(in srgb, var(--destructive) 35%, var(--border));
      border-radius: var(--radius-xl);
      background: color-mix(in srgb, var(--destructive) 10%, var(--card));
      color: var(--destructive);
      padding: 0.75rem 0.9rem;
    }

    .app-error p {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem;
      margin: 0;
      min-width: 0;
    }

    .app-error button {
      border: 1px solid color-mix(in srgb, var(--destructive) 55%, var(--border));
      border-radius: var(--radius-lg);
      background: transparent;
      color: var(--destructive);
      font-weight: 700;
      padding: 0.35rem 0.65rem;
      cursor: pointer;
      white-space: nowrap;
    }

    @media (max-width: 720px) {
      .app-header__main {
        grid-template-columns: auto minmax(0, 1fr) auto;
      }

      .app-nav--desktop {
        display: none;
      }

      .app-nav--mobile {
        display: flex;
      }

      .points-badge {
        font-size: 0.74rem;
        padding-inline: 0.6rem;
      }

      .logout-btn {
        min-height: 2.5rem;
        padding-inline: 0.65rem;
      }
    }

    @media (max-width: 560px) {
      .app-content {
        gap: 0.75rem;
        padding-block: 0.95rem 1.2rem;
      }

      .welcome-line {
        font-size: 0.86rem;
      }

      .app-error {
        flex-wrap: wrap;
      }
    }
  `,
})
export class MainLayoutComponent {
  readonly session = inject(SessionService);
  readonly errors = inject(GlobalErrorService);

  readonly userDisplayName = computed(() => {
    const user = this.session.user();
    return user?.displayName || user?.email || 'Uzytkownik';
  });

  readonly pointsLabel = computed(() => {
    const points = this.session.user()?.pointsBalance ?? 0;
    return new Intl.NumberFormat('pl-PL').format(points);
  });

  async logout(): Promise<void> {
    await this.session.logout();
  }
}
