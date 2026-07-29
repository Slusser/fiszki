import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { SessionService } from '../../core/auth/session.service';
import { GlobalErrorService } from '../../core/errors/global-error.service';

@Component({
  selector: 'app-main-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="layout">
      <header class="layout__header">
        <div>
          <h1>Fiszki MVP</h1>
          @if (session.user(); as user) {
            <p>
              {{ user.displayName || user.email || 'Uzytkownik' }} · {{ user.pointsBalance }} pkt
            </p>
          }
        </div>
        <button type="button" (click)="logout()">Wyloguj</button>
      </header>

      <nav class="layout__nav" aria-label="Nawigacja glowna">
        <a routerLink="/katalog" routerLinkActive="is-active">Katalog</a>
        <a routerLink="/quiz" routerLinkActive="is-active">Quiz</a>
        <a routerLink="/postep" routerLinkActive="is-active">Postep</a>
        <a routerLink="/wallet" routerLinkActive="is-active">Wallet</a>
      </nav>

      @if (errors.error(); as error) {
        <p class="layout__error">
          {{ error.code }}: {{ error.message }}
          <button type="button" (click)="errors.clear()">Zamknij</button>
        </p>
      }

      <main class="layout__content">
        <router-outlet />
      </main>
    </div>
  `,
  styles: `
    .layout {
      min-height: 100vh;
      max-width: 960px;
      margin: 0 auto;
      padding: 1.25rem;
      display: grid;
      gap: 1rem;
    }

    .layout__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .layout__header h1 {
      margin: 0;
      font-size: 1.5rem;
    }

    .layout__header p {
      margin: 0.25rem 0 0;
      color: #4b5563;
      font-size: 0.95rem;
    }

    .layout__nav {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .layout__nav a {
      text-decoration: none;
      color: #0f172a;
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.45rem 0.65rem;
    }

    .layout__nav a.is-active {
      border-color: #2563eb;
      color: #2563eb;
      font-weight: 600;
    }

    .layout__error {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin: 0;
      border: 1px solid #fecaca;
      background: #fef2f2;
      color: #991b1b;
      border-radius: 0.5rem;
      padding: 0.75rem;
    }
  `,
})
export class MainLayoutComponent {
  readonly session = inject(SessionService);
  readonly errors = inject(GlobalErrorService);

  async logout(): Promise<void> {
    await this.session.logout();
  }
}
