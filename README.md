# Fiszki - MVP Monorepo

Monorepo dla MVP aplikacji do nauki slowek:
- `backend/` - API w NestJS
- `frontend/` - aplikacja Angular
- `infra/` - materialy infrastrukturalne (migrations, seeds)

## Wymagania

- Node.js `22.23.1` (patrz `.nvmrc`)
- `pnpm` globalnie (`pnpm -v` powinno zwrocic `10.x`)

## Szybki start lokalnie

1. Zainstaluj zaleznosci:
   - `pnpm --dir backend install`
   - `pnpm --dir frontend install`
2. Uruchom backend:
   - `pnpm --dir backend run start:dev`
3. Uruchom frontend:
   - `pnpm --dir frontend run start`
4. Otworz dokumentacje API:
   - `http://localhost:3000/docs`

## Uwaga o Corepack

W tym projekcie uzywaj globalnego `pnpm 10.x`.
`corepack pnpm` moze uruchomic `pnpm 11`, co wprowadza dodatkowe polityki
bezpieczenstwa lockfile i moze blokowac instalacje w lokalnym dev.

## Komendy zbiorcze (root)

Z poziomu katalogu glownego projektu:
- `pnpm run lint:all`
- `pnpm run test:all`
- `pnpm run build:all`

## Migracje i seed (Supabase / Faza 1)

- Migracje SQL znajduja sie w `infra/migrations/`.
- Seed CSV i skrypt importu znajduja sie w `infra/seeds/`.
- Skrypty walidacji Dnia 3 znajduja sie w `infra/validation/`.
- Kolejnosc uruchomienia:
  - zastosuj migracje `001_phase1_day1_schema_constraints.sql`,
  - zastosuj migracje `002_phase1_day2_rls_and_policies.sql`,
  - zastosuj migracje `003_phase1_day2_auth_user_bootstrap.sql`,
  - zastosuj migracje `004_phase1_day3_advisor_performance_fixes.sql`,
  - uruchom `infra/seeds/001_seed_words_from_csv.sql` z importem `infra/seeds/words_es.csv` (instrukcja jest w komentarzu na gorze pliku SQL),
  - wykonaj `infra/validation/001_day3_validation_queries.sql`,
  - wykonaj `infra/validation/002_day3_explain_analyze.sql`,
  - odhacz `infra/validation/003_day3_db_ready_checklist.md`.

## Konfiguracja backend env (Faza 1)

- Wymagane:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_DB_URL` (lub `DATABASE_URL`)
  - `QUIZ_QUESTION_TOKEN_SECRET`
- Opcjonalne tuning/profiling:
  - `DB_SLOW_QUERY_MS` (domyslnie `150`, loguje wolne zapytania SQL)

## Endpointy quizu pod limitem

- `POST /v1/quiz/sessions/start` -> `20 req/min`
- `POST /v1/quiz/sessions/:sessionId/answer` -> `60 req/min`
- `POST /v1/quiz/sessions/:sessionId/finish` -> `20 req/min`

## Release checklist i alerty

- Gotowy checklist deploy-ready i minimalne alerty sa w:
  - `phase1/release_ready_checklist.md`
- Wersja pod CI gate (PASS/FAIL + owner) jest w:
  - `phase1/release_ready_checklist_ci.md`

## Frontend MVP status (Faza 1)

- Status implementacji Dzien 1-7 znajduje sie w:
  - `frontend/MVP_DONE.md`
- Dokument zawiera:
  - mapowanie Definition of Done vs zakres,
  - znane ograniczenia MVP,
  - manualny smoke test pod `dev`,
  - release gate `Go/No-Go`.

## Struktura katalogow

```text
.
|-- backend/
|-- frontend/
`-- infra/
    |-- migrations/
    `-- seeds/
```
