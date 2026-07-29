import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { SessionService } from '../../../core/auth/session.service';

@Component({
  selector: 'app-auth-page',
  imports: [RouterLink, ReactiveFormsModule],
  template: `
    <main class="auth-page">
      <h1>{{ title() }}</h1>

      <form [formGroup]="form" (ngSubmit)="submit()" class="auth-page__form">
        <label>
          Email
          <input type="email" formControlName="email" autocomplete="email" />
        </label>

        <label>
          Haslo
          <input
            type="password"
            formControlName="password"
            autocomplete="{{ isRegisterMode() ? 'new-password' : 'current-password' }}"
          />
        </label>

        @if (isRegisterMode()) {
          <label>
            Nazwa wyswietlana (opcjonalnie)
            <input type="text" formControlName="displayName" autocomplete="nickname" />
          </label>
        }

        @if (errorMessage()) {
          <p class="auth-page__error">{{ errorMessage() }}</p>
        }

        @if (infoMessage()) {
          <p class="auth-page__info">{{ infoMessage() }}</p>
        }

        <button type="submit" [disabled]="form.invalid || submitting()">
          {{ submitLabel() }}
        </button>
      </form>

      <div class="auth-page__actions">
        @if (isRegisterMode()) {
          <a routerLink="/auth/login" [queryParams]="redirectQuery()"
            >Masz juz konto? Zaloguj sie</a
          >
        } @else {
          <a routerLink="/auth/register" [queryParams]="redirectQuery()"
            >Nie masz konta? Zarejestruj sie</a
          >
        }
      </div>
    </main>
  `,
  styles: `
    .auth-page {
      min-height: 100vh;
      max-width: 640px;
      margin: 0 auto;
      display: grid;
      align-content: center;
      gap: 1rem;
      padding: 1.5rem;
    }

    .auth-page h1 {
      margin: 0;
    }

    .auth-page__form {
      display: grid;
      gap: 0.85rem;
    }

    .auth-page__form label {
      display: grid;
      gap: 0.35rem;
      font-weight: 500;
    }

    .auth-page__form input {
      border: 1px solid #cbd5e1;
      border-radius: 0.5rem;
      padding: 0.6rem;
      font: inherit;
    }

    .auth-page__form button {
      margin-top: 0.25rem;
      width: fit-content;
      border: 1px solid #2563eb;
      color: #fff;
      background: #2563eb;
      border-radius: 0.5rem;
      padding: 0.5rem 0.85rem;
      font: inherit;
      cursor: pointer;
    }

    .auth-page__form button:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .auth-page__error {
      margin: 0;
      color: #991b1b;
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 0.5rem;
      padding: 0.6rem;
    }

    .auth-page__info {
      margin: 0;
      color: #1e3a8a;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 0.5rem;
      padding: 0.6rem;
    }

    .auth-page__actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
  `,
})
export class AuthPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly fb = inject(FormBuilder);

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly infoMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    displayName: [''],
  });

  private readonly mode = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });

  readonly isRegisterMode = computed(() => this.mode().get('mode') === 'register');
  readonly title = computed(() => (this.isRegisterMode() ? 'Rejestracja' : 'Logowanie'));
  readonly submitLabel = computed(() =>
    this.submitting()
      ? 'Przetwarzanie...'
      : this.isRegisterMode()
        ? 'Zarejestruj sie'
        : 'Zaloguj sie',
  );

  constructor() {
    void this.redirectIfAuthenticated();
  }

  redirectQuery(): { redirect?: string } {
    const redirectPath = this.route.snapshot.queryParamMap.get('redirect') || '/katalog';
    return redirectPath ? { redirect: redirectPath } : {};
  }

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.submitting.set(true);

    const { email, password, displayName } = this.form.getRawValue();
    const result = this.isRegisterMode()
      ? await this.authService.register(email, password, displayName.trim() || null)
      : await this.authService.login(email, password);

    this.submitting.set(false);

    if (!result.ok) {
      this.errorMessage.set(result.message ?? 'Nie udalo sie wykonac operacji auth.');
      return;
    }

    if (result.message) {
      this.infoMessage.set(result.message);
      return;
    }

    if (!this.sessionService.isAuthenticated()) {
      this.infoMessage.set(
        'Sesja zostala utworzona, ale profil jeszcze sie synchronizuje. Sprobuj za chwile.',
      );
      return;
    }

    const redirectPath = this.route.snapshot.queryParamMap.get('redirect') || '/katalog';
    await this.router.navigateByUrl(redirectPath);
  }

  private async redirectIfAuthenticated(): Promise<void> {
    await this.sessionService.init();
    if (!this.sessionService.isAuthenticated()) {
      return;
    }

    const redirectPath = this.route.snapshot.queryParamMap.get('redirect') || '/katalog';
    await this.router.navigateByUrl(redirectPath);
  }
}
