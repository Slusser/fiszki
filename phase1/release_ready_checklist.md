# Faza 1 - Release Ready Checklist (Backend)

Ten checklist sluzy do szybkiej oceny, czy backend MVP jest gotowy do wypchniecia na dev/staging.

## 1) Build i testy (must pass)

- [ ] `pnpm --dir backend build`
- [ ] `pnpm --dir backend test`
- [ ] `pnpm --dir backend test:e2e`
- [ ] `pnpm --dir frontend build` (smoke kompatybilnosci front-back)

## 2) Konfiguracja srodowiska (must have)

- [ ] Ustawione `SUPABASE_URL`
- [ ] Ustawione `SUPABASE_ANON_KEY`
- [ ] Ustawione `SUPABASE_DB_URL` (lub `DATABASE_URL`)
- [ ] Ustawione `QUIZ_QUESTION_TOKEN_SECRET` (nie domyslny dev secret)
- [ ] (Opcjonalnie) ustawione `DB_SLOW_QUERY_MS` (rekomendacja: `120`-`200`)

## 3) Migracje i dane (must have)

- [ ] Zastosowane migracje:
  - [ ] `001_phase1_day1_schema_constraints.sql`
  - [ ] `002_phase1_day2_rls_and_policies.sql`
  - [ ] `003_phase1_day2_auth_user_bootstrap.sql`
  - [ ] `004_phase1_day3_advisor_performance_fixes.sql`
- [ ] Seed danych slownikowych wykonany
- [ ] Kontrola `RLS` dla danych user-centric potwierdzona

## 4) Funkcjonalny smoke API (must pass)

- [ ] `GET /v1/health` -> 200
- [ ] `GET /v1/health/ready` -> 200
- [ ] `GET /docs` i `GET /docs-json` -> dostepne
- [ ] Endpointy chronione bez tokena zwracaja 401 (`/v1/me`, `/v1/wallet`, `/v1/quiz/...`)
- [ ] Flow quizu przechodzi:
  - [ ] `start -> next-question -> answer -> finish`
  - [ ] `finish` idempotentny (powtorne wywolanie nie dubluje rewardu)

## 5) Minimalny baseline bezpieczenstwa (must pass)

- [ ] Brak logowania sekretow/tokenow
- [ ] Brak `service_role` po stronie klienta
- [ ] Rate limit dziala dla `start/answer/finish`
- [ ] Polityki RLS nie opieraja autoryzacji o `user_metadata`

---

# Minimalne alerty operacyjne (MVP)

Ponizej minimalny zestaw alarmow na start, niezaleznie od narzedzia (Supabase logs, Grafana, Datadog, itp.).

## A) Wysoka liczba 5xx

- **Nazwa:** `api_5xx_spike`
- **Warunek:** `>= 5` odpowiedzi 5xx / 5 min **lub** error rate `> 2%` / 10 min
- **Priorytet:** wysoki
- **Akcja:** sprawdz `GlobalExceptionFilter` logi + ostatnie deploye

## B) Wzrost 429 (throttling)

- **Nazwa:** `api_throttle_429_spike`
- **Warunek:** `>= 30` odpowiedzi 429 / 10 min na endpointach quizu
- **Priorytet:** sredni
- **Akcja:** sprawdz, czy to naduzycie czy za ciasny limit; porownaj z ruchem legit userow

## C) Wolne zapytania SQL

- **Nazwa:** `db_slow_query_warning`
- **Warunek:** `>= 20` logow "Slow query detected" / 10 min
- **Priorytet:** sredni
- **Akcja:** zidentyfikuj najwolniejsze zapytania (szczegolnie `next-question`, `answer`, `finish`) i uruchom `EXPLAIN ANALYZE`

## D) Bledy polaczenia DB

- **Nazwa:** `db_connection_failures`
- **Warunek:** dowolny ciagly blad "Database connection is not configured" lub timeouty DB > 1 min
- **Priorytet:** wysoki
- **Akcja:** zweryfikuj env (`SUPABASE_DB_URL`/`DATABASE_URL`), dostepnosc bazy i limity polaczen

## E) Spadek gotowosci serwisu

- **Nazwa:** `health_readiness_failure`
- **Warunek:** `/v1/health` lub `/v1/health/ready` != 200 przez > 2 min
- **Priorytet:** krytyczny
- **Akcja:** rollback lub restart + diagnostyka logow

---

# Szybki runbook (pierwsze 10 minut incydentu)

1. Sprawdz status endpointow `health/ready`.
2. Sprawdz liczbe 5xx i 429 w ostatnich 10-15 min.
3. Przejrzyj logi backendu (zwlaszcza `GlobalExceptionFilter`, `Slow query detected`).
4. Potwierdz, czy byl deploy/migracja bezposrednio przed incydentem.
5. Przy problemie DB: sprawdz lacznosc i parametry env.
6. Gdy objawy utrzymuja sie > 10 min i brak szybkiej poprawy, wykonaj rollback.
