# Plan implementacji warstwy wizualnej (na bazie `ui_draft/`)

## 1. Cel i zakres

Celem jest przeniesienie projektu wizualnego z `ui_draft/` do istniejącej aplikacji Angular (MVP), bez zmiany logiki domenowej i kontraktów API. Zakres obejmuje:

- globalny design system (kolory, typografia, promienie, cienie, utility),
- layout aplikacji (header, nawigacja desktop/mobile, kontener stron),
- widoki: logowanie/rejestracja, katalog, quiz, podsumowanie sesji, postęp, portfel,
- stany UX: loading/empty/error/retry oraz komunikaty inline.

Poza zakresem tego etapu: pełny dark mode toggle, ranking (faza 2), animacje zaawansowane i testy wizualne percy/chromatic.

## 2. Co wynika z analizy `ui_draft/`

## 2.1 Kluczowe elementy wizualne

- Ciepły branding: ember/copper/sage, gradienty i miękkie cienie.
- Bardzo spójny język komponentów: `surface-card`, zaokrąglenia XL/2XL, przyciski min 44px.
- Silny fokus na czytelne statystyki (badges, progress bary, liczby tabular).
- Układ mobile-first, ale z dopracowanym desktopem (`max-w-6xl`, sekcje hero, 2-3 kolumny).

## 2.2 Ekrany i ich intencje

- `auth-shell.tsx` + `auth-register.tsx` + `indes.tsx`: split-screen auth (hero + formularz), mocny onboarding.
- `katalog.tsx` + `category-card.tsx`: katalog jako centrum aplikacji, filtrowanie, search, status unlock/progres.
- `quiz.tsx`: sesja 1-z-4 z widocznym timerem 30s, paskiem postępu i wyraźnym feedbackiem.
- `postep.tsx`: dashboard metryk + tygodniowa aktywność + progress per kategoria.
- `portfel.tsx`: saldo, historia zmian i lista najbliższych odblokowań.
- `app-header.tsx`: wspólny shell po zalogowaniu, punkty + logout + nawigacja responsywna.

## 2.3 Różnice względem obecnego frontendu Angular

- Obecne widoki Angular mają prosty, techniczny CSS inline i brak wspólnego systemu tokenów.
- Struktura routingu jest zgodna funkcjonalnie, ale nazewnictwo części ścieżek jest inne (`/wallet` vs „Portfel”).
- Komponenty współdzielone UI istnieją tylko częściowo (loading/empty/retry), brakuje kart, badge, progress i headera produktowego.

## 3. Decyzje implementacyjne

- **Styling**: wdrożenie tokenów i utili jako globalne SCSS custom properties w `frontend/src/styles.scss` (bez migracji na React/Tailwind).
- **Architektura UI**: rozdzielenie na `shared/layout` + `shared/ui` + feature pages; maksymalnie dużo współdzielonych atomów.
- **Spójność z API**: UI musi konsumować istniejące modele (`catalog`, `quiz`, `progress`, `wallet`) bez zmiany kontraktów.
- **Routing**: zachowujemy istniejące ścieżki Angular (`/katalog`, `/quiz`, `/postep`, `/wallet`) i tylko mapujemy etykiety na język produktowy.
- **Dostępność**: focus-visible, aria dla pasków postępu i timera, kontrast i obsługa klawiatury jako wymaganie Definition of Done.

## 4. Plan wdrożenia (kolejność)

## Etap 1 — Fundament design systemu (1 dzień)

1. Dodać tokeny kolorów, radius, shadows, gradienty, typografię do `frontend/src/styles.scss`.
2. Wprowadzić utility klasy globalne: `surface-card`, `gradient-ember`, `gradient-warm`, `shadow-lift`.
3. Dodać resety bazowe (`body`, nagłówki, `:focus-visible`, skala spacing/font).
4. Zdefiniować standard kontenera strony (`max-width`, padding, odstępy sekcji).

## Etap 2 — Wspólny shell aplikacji (0.5-1 dnia)

1. Przebudować `MainLayoutComponent` na wariant z draftu `app-header.tsx`.
2. Dodać desktop + mobile nav, aktywne linki i badge punktów użytkownika.
3. Ujednolicić alert błędów globalnych do stylu kart/banerów.

## Etap 3 — Auth UX (1 dzień)

1. Przebudować `AuthPageComponent` do wzorca `AuthShell`:
   - desktop: panel hero + panel formularza,
   - mobile: sam formularz + branding.
2. Zachować obecną logikę rejestracji/logowania i walidację reactive forms.
3. Dodać warianty komunikatów error/info zgodne z designem.

## Etap 4 — Katalog i karta kategorii (1-1.5 dnia)

1. Przebudować `CatalogPageComponent`:
   - sekcja hero ze statystykami,
   - search + filtry,
   - grid kart.
2. Wyciągnąć nowy komponent `CategoryCardComponent` (Angular) jako odpowiednik `category-card.tsx`.
3. Podłączyć stan unlock/tiers/progress do istniejących danych API i guardów.
4. Dodać puste stany i CTA „wyczyść filtry”.

## Etap 5 — Quiz i podsumowanie (1-1.5 dnia)

1. Przebudować `QuizPageComponent` do layoutu z draftu:
   - meta (kategoria/tier),
   - timer badge + progress bar,
   - kafel pytania i opcje odpowiedzi.
2. Wprowadzić warianty odpowiedzi: idle/correct/wrong/dim.
3. Ujednolicić `SessionSummaryPageComponent` do estetyki kart i czytelnych metryk.

## Etap 6 — Postęp i Portfel (1 dzień)

1. `ProgressPageComponent`: dashboard KPI + sekcja aktywności tygodniowej + progress list.
2. `WalletPageComponent`: saldo hero + historia ledger + lista kategorii do odblokowania.
3. Zapewnić spójne formatowanie liczb (`toLocaleString('pl-PL')`) i dat.

## Etap 7 — Hardening wizualny i QA (0.5-1 dnia)

1. Responsive pass: 360px, 768px, 1024px, 1440px.
2. Accessibility pass: focus order, aria-labels, contrast.
3. Przegląd pustych i błędnych stanów we wszystkich widokach.
4. Szybki smoke test manualny pełnej ścieżki: auth -> katalog -> quiz -> summary -> postęp -> portfel.

## 5. Mapowanie plików draft -> Angular

- `ui_draft/styles.css` -> `frontend/src/styles.scss` + ewentualnie `frontend/src/app/shared/styles/*.scss`
- `ui_draft/fiszki/app-header.tsx` -> `frontend/src/app/shared/layout/main-layout.component.ts`
- `ui_draft/fiszki/auth-shell.tsx`, `auth-register.tsx`, `indes.tsx` -> `frontend/src/app/features/auth/pages/auth-page.component.ts`
- `ui_draft/fiszki/katalog.tsx`, `category-card.tsx` -> `frontend/src/app/features/catalog/pages/catalog-page.component.ts` (+ nowy `shared/ui/category-card`)
- `ui_draft/fiszki/quiz.tsx` -> `frontend/src/app/features/quiz/pages/quiz-page.component.ts`
- `ui_draft/fiszki/postep.tsx` -> `frontend/src/app/features/progress/pages/progress-page.component.ts`
- `ui_draft/fiszki/portfel.tsx` -> `frontend/src/app/features/wallet/pages/wallet-page.component.ts`

## 6. Kryteria akceptacji (Definition of Done)

- Każdy ekran MVP ma docelowy layout zgodny z kierunkiem wizualnym draftu.
- Aplikacja zachowuje wszystkie aktualne funkcje (auth, unlock, quiz flow, summary, progress, wallet).
- Brak regresji w guardach i logice sesji quizu.
- UI działa poprawnie na mobile i desktop.
- Brak krytycznych błędów lintera po zmianach.

## 7. Ryzyka i mitigacje

- Ryzyko: zbyt duży scope w jednym PR -> podzielić na PR-y per etap (shell/auth/katalog/quiz/postęp+portfel).
- Ryzyko: „pixel perfect” vs realne dane API -> priorytet dla semantycznej zgodności i stabilności.
- Ryzyko: inline styles w komponentach utrudnią utrzymanie -> wynosić style do wspólnych klas i sekcji feature-level.
- Ryzyko: niespójne nazwy tras i etykiet -> trasy techniczne bez zmian, etykiety UX po polsku.
