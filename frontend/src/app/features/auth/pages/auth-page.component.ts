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
    <main class="auth-layout">
      <section class="auth-hero gradient-ember" aria-hidden="true">
        <a routerLink="/auth/login" class="auth-brand"
          >Fiszki<span class="auth-brand__accent">ES</span></a
        >
        <div class="auth-hero__intro">
          <h2>Hiszpanski, jedno slowko naraz.</h2>
          <p>
            Krotkie quizy 1-z-4, postep warstwowy i punkty odblokowujace kolejne kategorie.
          </p>
        </div>
        <ul class="auth-hero__highlights">
          <li>
            <span class="auth-hero__pill">30s</span>
            <span>30 sekund na pytanie</span>
          </li>
          <li>
            <span class="auth-hero__pill">3</span>
            <span>Easy, Hard i Expert</span>
          </li>
          <li>
            <span class="auth-hero__pill">10+</span>
            <span>Punkty i odblokowania kategorii</span>
          </li>
        </ul>
      </section>

      <section class="auth-panel grain-dots">
        <div class="auth-panel__inner">
          <a routerLink="/auth/login" class="auth-brand auth-brand--mobile">
            Fiszki<span class="auth-brand__accent">ES</span>
          </a>

          <h1>{{ title() }}</h1>
          <p class="auth-panel__subtitle">{{ subtitle() }}</p>

          <form [formGroup]="form" (ngSubmit)="submit()" class="auth-form">
            @if (isRegisterMode()) {
              <label class="auth-field">
                <span>Nazwa uzytkownika</span>
                <input
                  type="text"
                  formControlName="displayName"
                  autocomplete="nickname"
                  placeholder="np. maria_es"
                />
              </label>
            }

            <label class="auth-field">
              <span>E-mail</span>
              <input
                type="email"
                formControlName="email"
                autocomplete="email"
                placeholder="ty@example.com"
              />
            </label>

            <label class="auth-field">
              <span>Haslo</span>
              <input
                type="password"
                formControlName="password"
                autocomplete="{{ isRegisterMode() ? 'new-password' : 'current-password' }}"
                placeholder="{{ isRegisterMode() ? 'Minimum 6 znakow' : '••••••••' }}"
              />
            </label>

            @if (isRegisterMode()) {
              <p class="auth-form__hint">Haslo powinno miec min. 6 znakow.</p>
            }

            @if (errorMessage()) {
              <p class="auth-form__error">{{ errorMessage() }}</p>
            }

            @if (infoMessage()) {
              <p class="auth-form__info">{{ infoMessage() }}</p>
            }

            <button type="submit" [disabled]="form.invalid || submitting()" class="auth-submit">
              {{ submitLabel() }}
            </button>
          </form>

          <div class="auth-switch">
            @if (isRegisterMode()) {
              <a routerLink="/auth/login" [queryParams]="redirectQuery()">
                Masz juz konto? Zaloguj sie
              </a>
            } @else {
              <a routerLink="/auth/register" [queryParams]="redirectQuery()">
                Nie masz konta? Zarejestruj sie
              </a>
            }
          </div>
        </div>
      </section>
    </main>
  `,
  styles: `
    .auth-layout {
      min-height: 100vh;
      display: grid;
      grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
    }

    .auth-hero {
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 1.5rem;
      padding: 2.5rem;
      color: var(--primary-foreground);
      overflow: hidden;
    }

    .auth-hero::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(170deg, rgba(255, 255, 255, 0.08), rgba(0, 0, 0, 0.16));
      pointer-events: none;
    }

    .auth-hero > * {
      position: relative;
      z-index: 1;
    }

    .auth-brand {
      text-decoration: none;
      font-family: var(--font-display);
      font-size: 1.3rem;
      font-weight: 900;
      color: inherit;
      width: fit-content;
    }

    .auth-brand__accent {
      opacity: 0.76;
    }

    .auth-hero__intro h2 {
      margin: 0;
      font-size: clamp(2.1rem, 4.2vw, 3.4rem);
      line-height: 1.05;
    }

    .auth-hero__intro p {
      margin: 1rem 0 0;
      max-width: 36ch;
      font-size: 1rem;
      line-height: 1.55;
      color: color-mix(in srgb, var(--primary-foreground) 84%, transparent);
    }

    .auth-hero__highlights {
      margin: 0;
      padding: 0;
      list-style: none;
      display: grid;
      gap: 0.75rem;
    }

    .auth-hero__highlights li {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .auth-hero__pill {
      min-width: 2.35rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.18);
      color: var(--primary-foreground);
      text-align: center;
      padding: 0.2rem 0.55rem;
      font-family: var(--font-display);
      font-weight: 800;
      font-size: 0.78rem;
      line-height: 1.35;
      letter-spacing: 0.02em;
    }

    .auth-panel {
      display: grid;
      place-items: center;
      padding: 1.6rem;
      background: var(--background);
    }

    .auth-panel__inner {
      width: min(100%, 32rem);
      background: color-mix(in srgb, var(--card) 96%, transparent);
      border: 1px solid var(--border);
      border-radius: var(--radius-2xl);
      box-shadow: var(--shadow-soft);
      padding: 1.4rem;
    }

    .auth-brand--mobile {
      display: none;
      margin-bottom: 1rem;
      color: var(--primary);
    }

    h1 {
      margin: 0;
      font-size: clamp(1.85rem, 4vw, 2.35rem);
    }

    .auth-panel__subtitle {
      margin: 0.5rem 0 0;
      color: var(--muted-foreground);
      line-height: 1.5;
    }

    .auth-form {
      margin-top: 1.3rem;
      display: grid;
      gap: 0.8rem;
    }

    .auth-field {
      display: grid;
      gap: 0.38rem;
    }

    .auth-field span {
      font-weight: 700;
      font-size: 0.92rem;
    }

    .auth-field input {
      min-height: 2.9rem;
      border: 1px solid var(--input);
      border-radius: var(--radius-xl);
      background: var(--card);
      padding: 0.65rem 0.8rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .auth-field input:focus {
      border-color: var(--ring);
      box-shadow: 0 0 0 2px color-mix(in srgb, var(--ring) 24%, transparent);
      outline: none;
    }

    .auth-form__hint {
      margin: 0;
      color: var(--muted-foreground);
      font-size: 0.84rem;
    }

    .auth-form__error,
    .auth-form__info {
      margin: 0;
      border-radius: var(--radius-xl);
      padding: 0.65rem 0.75rem;
      font-size: 0.92rem;
      line-height: 1.45;
    }

    .auth-form__error {
      color: var(--destructive);
      border: 1px solid color-mix(in srgb, var(--destructive) 35%, var(--border));
      background: color-mix(in srgb, var(--destructive) 8%, var(--card));
    }

    .auth-form__info {
      color: var(--secondary);
      border: 1px solid color-mix(in srgb, var(--secondary) 25%, var(--border));
      background: color-mix(in srgb, var(--accent) 35%, var(--card));
    }

    .auth-submit {
      margin-top: 0.3rem;
      min-height: 3rem;
      border: 1px solid transparent;
      border-radius: var(--radius-xl);
      background: var(--primary);
      color: var(--primary-foreground);
      font-family: var(--font-display);
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: 0.01em;
      box-shadow: var(--shadow-lift);
      cursor: pointer;
      transition: transform 0.12s ease, filter 0.2s ease;
    }

    .auth-submit:hover:not(:disabled) {
      transform: translateY(-1px);
      filter: brightness(1.03);
    }

    .auth-submit:disabled {
      cursor: not-allowed;
      opacity: 0.65;
    }

    .auth-switch {
      margin-top: 1.15rem;
      text-align: center;
    }

    .auth-switch a {
      color: var(--primary);
      font-weight: 700;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s ease;
    }

    .auth-switch a:hover {
      border-color: currentColor;
    }

    @media (max-width: 980px) {
      .auth-layout {
        grid-template-columns: 1fr;
      }

      .auth-hero {
        display: none;
      }

      .auth-panel {
        min-height: 100vh;
      }

      .auth-brand--mobile {
        display: inline-block;
      }
    }

    @media (max-width: 460px) {
      .auth-panel {
        padding-inline: 1rem;
      }

      .auth-panel__inner {
        padding: 1.1rem;
      }
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
  readonly subtitle = computed(() =>
    this.isRegisterMode()
      ? 'Utworz konto i zacznij od 10 odblokowanych kategorii.'
      : 'Zaloguj sie, aby kontynuowac nauke i odblokowywanie kategorii.',
  );
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
