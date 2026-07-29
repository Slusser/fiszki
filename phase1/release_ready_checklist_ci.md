# Faza 1 - Release Ready Checklist (CI Gate)

Cel: szybki, powtarzalny gate przed deployem.  
Status kazdego punktu: `PASS` / `FAIL` (bez stanow posrednich).

## 1) Build i testy

| Check | Komenda / Kryterium | Owner | Status |
|---|---|---|---|
| Backend build | `pnpm --dir backend build` | Backend | [ ] PASS [ ] FAIL |
| Backend unit | `pnpm --dir backend test` | Backend | [ ] PASS [ ] FAIL |
| Backend e2e | `pnpm --dir backend test:e2e` | Backend QA | [ ] PASS [ ] FAIL |
| Frontend smoke build | `pnpm --dir frontend build` | Frontend | [ ] PASS [ ] FAIL |

## 2) Konfiguracja runtime

| Check | Kryterium | Owner | Status |
|---|---|---|---|
| Supabase URL | `SUPABASE_URL` ustawione | DevOps | [ ] PASS [ ] FAIL |
| Supabase anon key | `SUPABASE_ANON_KEY` ustawione | DevOps | [ ] PASS [ ] FAIL |
| DB connection | `SUPABASE_DB_URL` lub `DATABASE_URL` ustawione | DevOps | [ ] PASS [ ] FAIL |
| Token secret | `QUIZ_QUESTION_TOKEN_SECRET` ustawione (nie domyslne) | DevOps | [ ] PASS [ ] FAIL |
| Slow query threshold | `DB_SLOW_QUERY_MS` ustawione (rekomendacja 120-200) | Backend | [ ] PASS [ ] FAIL |

## 3) Schema i dane

| Check | Kryterium | Owner | Status |
|---|---|---|---|
| Migracje 001-004 | Wszystkie migracje Fazy 1 zastosowane | Data/Backend | [ ] PASS [ ] FAIL |
| Seed slownikow | Seed wykonany i idempotentny | Data/Backend | [ ] PASS [ ] FAIL |
| RLS | Dostep owner-only dla danych user-centric potwierdzony | Data/Security | [ ] PASS [ ] FAIL |

## 4) API smoke

| Check | Kryterium | Owner | Status |
|---|---|---|---|
| Liveness | `GET /v1/health` -> 200 | Backend QA | [ ] PASS [ ] FAIL |
| Readiness | `GET /v1/health/ready` -> 200 | Backend QA | [ ] PASS [ ] FAIL |
| OpenAPI JSON | `GET /docs-json` -> 200 | Backend QA | [ ] PASS [ ] FAIL |
| Auth guard | Endpointy chronione bez tokena -> 401 | Backend QA | [ ] PASS [ ] FAIL |
| Quiz flow | `start -> next-question -> answer -> finish` przechodzi | Backend QA | [ ] PASS [ ] FAIL |
| Finish idempotent | Powtorne `finish` nie dubluje rewardu | Backend QA | [ ] PASS [ ] FAIL |

## 5) Security baseline

| Check | Kryterium | Owner | Status |
|---|---|---|---|
| Brak sekretow w logach | Brak tokenow/hasel/service keys w logach | Security/Backend | [ ] PASS [ ] FAIL |
| Brak service role na froncie | Publiczny klient nie uzywa `service_role` | Security/Frontend | [ ] PASS [ ] FAIL |
| Throttling aktywny | Limity dla `start/answer/finish` dzialaja | Backend | [ ] PASS [ ] FAIL |
| Policy claims | Brak autoryzacji opartej o `user_metadata` | Security/Data | [ ] PASS [ ] FAIL |

---

## Warunek release

- **Release DOZWOLONY** tylko gdy wszystkie punkty maja `PASS`.
- Dowolny `FAIL` blokuje deploy i wymaga nowego runu gate po poprawkach.

## Szybkie progi alertow po deployu (MVP)

| Alert | Prog | Priorytet |
|---|---|---|
| 5xx spike | >= 5/5 min lub >2%/10 min | High |
| 429 spike | >= 30/10 min na quiz endpointach | Medium |
| Slow SQL logs | >= 20 ostrzezen/10 min | Medium |
| Readiness fail | `/v1/health` lub `/v1/health/ready` != 200 przez 2 min | Critical |

