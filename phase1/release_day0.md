# Faza 1 - Release Day 0 (dev)

Data: 2026-07-30  
Srodowisko: `dev`  
Frontend: `https://iridescent-gecko-d55c93.netlify.app/`  
Backend: `https://fiszki-xv3u.onrender.com`  
Supabase project: `ctcafwwzrzatwtpjtojd` (`fiszki`)

## 1) Co wdrozono

- Backend NestJS na Render (API + docs + health + readiness).
- Frontend Angular na Netlify z poprawnym `apiBaseUrl` do backendu Render.
- Konfiguracje CORS backendu dla originu Netlify (preflight `OPTIONS` dziala).
- Readiness check backendu rozszerzony o realny ping DB (`database=ok/error/not_configured`).
- Fix logiki quizu:
  - pytania losowane z puli slow nieopanowanych (`mastered=false`),
  - usuniety warunek blokujacy ponowne odpowiedzi na to samo slowo w sesji.
- Fix frontend summary:
  - usuniecie petli reaktywnej powodujacej ryzyko OOM (`untracked(...)`).
- DB/Supabase:
  - migracje Fazy 1 (001-004) + baseline marker `005_phase1_baseline_marker`,
  - seed/backfill modelu `10/25/50` per kategoria,
  - RLS aktywne na tabelach user-centric.

## 2) Wynik smoke testu

Status: **PASS** (Kroki 2-5 zaliczone, krytyczna sciezka dziala w `dev`).

- Auth i ochrona endpointow:
  - `/v1/me` bez tokena -> `401`,
  - `/v1/me` z blednym tokenem -> `401`.
- Backend readiness:
  - `/v1/health/ready` -> `status=ready`, `app=ok`, `database=ok`, `supabase=ok`.
- Frontend deploy:
  - root + deep link SPA dzialaja (`200`),
  - bundle wskazuje aktualny backend URL.
- Quiz flow E2E:
  - `start -> next-question -> answer -> finish` przechodzi.
  - potwierdzone powtorki slow:
    - sesja `hard`: `25` slow, `75` odpowiedzi (ok. 3 proby/slowo),
    - sesja `easy`: sesje z `14` odpowiedziami dla puli `10` slow.
- Rewards/ledger/wallet:
  - wpisy `points_ledger` powstaja po `finish` (`tier_completed`, `tier_completed_repeat`),
  - spojnosci `wallet` vs `ledger` bez rozjazdow (`wallet_ledger_mismatched_users=0`).
- Summary:
  - brak OOM po przejsciu na ekran podsumowania (potwierdzenie manualne).

## 3) KPI Day 0 (snapshot)

- `started_sessions`: `5`
- `finished_sessions`: `5`
- `avg_accuracy`: `78.00`
- `category_unlocks`: `1`
- `points_today`: `440`
- `quiz_reward_entries`: `3`

## 4) Otwarte problemy i priorytety poprawek

1. **P1 - Security**: Supabase Auth ma wylaczone Leaked Password Protection.  
   Akcja: wlaczyc opcje w panelu Auth.  
   Referencja: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection

2. **P2 - Performance/porzadek**: indeks `idx_user_category_unlocks_category_id` oznaczony jako nieuzywany.  
   Akcja: obserwacja ruchu przez min. 7 dni; potem decyzja zostawic/usunac.  
   Referencja: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

3. **P3 - Frontend bundle size**: build przechodzi, ale przekroczony budget initial bundle (`+81.76 kB` ponad 500 kB).  
   Akcja: backlog optymalizacji bundle (split/treeshake/lazy-load audit).

## 5) Decyzja release

- **Release MVP w `dev`: GO**
- Warunki utrzymania GO:
  - monitorowanie health/readiness i logow 4xx/5xx,
  - szybka reakcja na alerty Day 0,
  - zamkniecie P1 (password protection) w najblizszym oknie zmian.
