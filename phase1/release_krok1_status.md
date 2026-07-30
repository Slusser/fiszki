# Faza 1 - Krok 1 (Release readiness) - status wykonania

Data: 2026-07-29
Srodowisko: `dev`
Projekt Supabase: `ctcafwwzrzatwtpjtojd` (`fiszki`)

## 1) CI gate (`lint`, `test`, `build`)

- PASS - `pnpm run lint:all`
- PASS - `pnpm run test:all`
- PASS - `pnpm --dir backend run test:e2e`
- PASS - `pnpm run build:all`
- INFO - frontend build ma warning budgetu (`581.76 kB` vs `500 kB`), ale build przechodzi.

## 2) Migracje i seed modelu `10/25/50`

- PASS - migracje SQL `001-004` sa obecne lokalnie w `infra/migrations/`.
- PASS - historia migracji w Supabase jest widoczna po zastosowaniu markera `005_phase1_baseline_marker`.
- PASS - RLS wlaczone na wszystkich tabelach MVP (`categories`, `words`, `profiles`, `user_category_unlocks`, `user_word_progress`, `quiz_sessions`, `quiz_answers`, `user_wallet`, `points_ledger`).
- PASS - wykonano backfill danych do modelu `10/25/50` per kategoria.
  - globalnie: `easy=20`, `hard=50`, `expert=100` (2 kategorie),
  - per kategoria (`jedzenie`, `podroze`): `easy=10`, `hard=25`, `expert=50`.
- PASS - dodano idempotentny skrypt: `infra/seeds/002_backfill_words_to_tier_targets.sql`.
- PASS - dodano baseline marker migracji: `infra/migrations/005_phase1_baseline_marker.sql`.

## 3) Kompletnosc env varow

### Frontend
- PASS - `supabaseUrl` ustawione na URL projektu dev.
- PASS - `supabaseAnonKey` ustawione na klucz publishable.
- PASS - produkcyjny `apiBaseUrl` ustawione na `https://fiszki-xv3u.onrender.com`.

### Backend
- PASS (czesciowy) - endpoint `GET /v1/me` z falszywym tokenem zwraca `401` (nie `503`), co potwierdza aktywna konfiguracje auth runtime.
- FAIL - nadal brak twardego potwierdzenia dla `SUPABASE_DB_URL`/`DATABASE_URL` oraz `QUIZ_QUESTION_TOKEN_SECRET` bez wgladu do ustawien Render.

## 4) Freeze release commit/branch

- PASS - utworzono branch freeze:
  - `release/phase1-mvp-freeze-2026-07-29`
- Commit referencyjny:
  - `1ebc0d5fcdf5eb953c1e5c6dac631c8463fc50ef`

## Decyzja Go/No-Go dla Kroku 1

- **NO-GO** na ten moment.
- Powod blokujacy:
  - brak twardego potwierdzenia ustawienia `SUPABASE_DB_URL`/`DATABASE_URL` i `QUIZ_QUESTION_TOKEN_SECRET` w panelu Render.
