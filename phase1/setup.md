# Faza 1 - Setup projektu i CI (1-2 dni)

## 1. Cel
Przygotować spójny szkielet repozytorium pod MVP (`NestJS + Angular + Supabase`) oraz automatyczne kontrole jakości (lint, test, build) uruchamiane dla każdego PR, przy założeniu jednego środowiska `dev` i darmowych planów usług.

## 2. Założenia wejściowe (z kickoff)
- Tylko środowisko `dev`.
- Frontend hostowany na Netlify Free.
- Backend i DB w modelu budżetowym (free-tier gdzie możliwe).
- API wyłącznie REST.
- Dane słów seedowane z `CSV UTF-8`.

## 3. Docelowa struktura repo (monorepo)
```text
/
  backend/                 # NestJS API
  frontend/                # Angular app
  infra/
    seeds/                 # CSV + skrypty seedujące
    migrations/            # SQL/migracje DB
  .github/workflows/       # CI (PR checks)
  .editorconfig
  .gitignore
  .nvmrc                   # wersja Node
  package.json             # opcjonalny root scripts (workspace)
  README.md
```

## 4. Decyzje techniczne dla setupu

### 4.1 Runtime i package manager
- Node.js `22 LTS` (wersja przypięta w `.nvmrc` i CI).
- Jeden package manager dla całości: `pnpm`.

### 4.2 Wspólne standardy kodu
- TypeScript strict mode.
- ESLint + Prettier w obu aplikacjach.
- Jednolity styl commitów nie jest wymagany na tym etapie, ale zalecany.

### 4.3 Test strategy na start
- `backend`: testy jednostkowe + minimalne testy integracyjne modułów krytycznych.
- `frontend`: testy jednostkowe komponentów i serwisów.
- E2E poza zakresem tego kroku (wchodzi w kolejną fazę planu).

## 5. Plan implementacji (krok po kroku)

## Krok 1 - Bootstrap repo (ok. 1-2h)
- Zainicjalizować `backend/` jako projekt NestJS.
- Zainicjalizować `frontend/` jako projekt Angular.
- Utworzyć `infra/seeds` i `infra/migrations`.
- Dodać `README.md` z instrukcją uruchomienia lokalnego.

## Krok 2 - Lint/format/test lokalnie (ok. 2-3h)
- W `backend`:
  - skonfigurować ESLint + Prettier,
  - upewnić się, że `npm/pnpm run lint`, `test`, `build` działają.
- W `frontend`:
  - skonfigurować ESLint + Prettier,
  - upewnić się, że `npm/pnpm run lint`, `test`, `build` działają.
- Ujednolicić skrypty nazwami:
  - `lint`
  - `test`
  - `build`

## Krok 3 - Root scripts i ergonomia (ok. 1h)
- Dodać root-level skrypty do odpalania checków obu aplikacji (np. `lint:all`, `test:all`, `build:all`).
- Dodać `.nvmrc` i krótki opis wymaganej wersji Node.
- Dodać `.editorconfig`.

## Krok 4 - CI dla PR (ok. 2-3h)
- Dodać workflow GitHub Actions (`.github/workflows/ci.yml`) uruchamiany na `pull_request`.
- Macierz lub sekwencja kroków:
  - install dependencies,
  - lint backend + frontend,
  - test backend + frontend,
  - build backend + frontend.
- Dodać cache zależności (dla skrócenia czasu).
- Ustawić fail-fast (PR nie przechodzi przy pierwszym błędzie).

## Krok 5 - Netlify dev frontend (ok. 1h)
- Podpiąć repo do Netlify (free plan).
- Ustawić:
  - build command dla Angular,
  - publish directory (`dist/.../browser` lub `dist/...` zależnie od buildera),
  - zmienne środowiskowe dla `dev` (URL API, klucze publiczne Supabase).
- Dodać redirect SPA (`/* -> /index.html`).

## Krok 6 - Smoke verification (ok. 1h)
- Lokalnie: lint/test/build dla obu app.
- CI: potwierdzenie zielonego pipeline po pierwszym PR.
- Netlify: potwierdzenie działającego deploy preview/dev.

## 6. Zakres "Done" dla sekcji Setup i CI
- Repo ma strukturę `backend/frontend/infra`.
- Obie aplikacje budują się i przechodzą lint + test lokalnie.
- CI uruchamia `lint + test + build` dla PR.
- Frontend działa na Netlify Free w środowisku `dev`.
- Dokumentacja uruchomienia lokalnego jest w `README.md`.

## 7. Ryzyka i mitigacje
- Rozjazd wersji Node lokalnie vs CI vs Netlify:
  - mitigation: przypięta wersja przez `.nvmrc` i tożsama wersja w CI.
- Za wolny CI na darmowym runnerze:
  - mitigation: cache paczek + równoległe joby backend/frontend.
- Błędy SPA routing na Netlify:
  - mitigation: wymusić redirect do `index.html`.

## 8. Artefakty, które mają powstać
- `backend/` (NestJS bootstrap).
- `frontend/` (Angular bootstrap).
- `infra/seeds`, `infra/migrations`.
- `.github/workflows/ci.yml`.
- `README.md`, `.nvmrc`, `.editorconfig`.
- (opcjonalnie) root `package.json` ze skryptami agregującymi.

## 9. Pytania doprecyzowujące (krótkie, krytyczne)
Decyzje zamknięte:
- Repo: GitHub (prywatne), CI oparte o GitHub Actions.
- Package manager: `pnpm`.
- Runtime: Node `22 LTS`.
