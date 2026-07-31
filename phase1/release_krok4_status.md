# Faza 1 - Krok 4 (Smoke test po deployu) - status wykonania

Data: 2026-07-30
Srodowisko: `dev`
Frontend URL: `https://iridescent-gecko-d55c93.netlify.app/`
Backend URL: `https://fiszki-xv3u.onrender.com`

## 1) Auth i autoryzacja backendu

- PASS - endpoint chroniony bez tokena zwraca `401` (`GET /v1/me`).
- PASS - endpoint chroniony z falszywym tokenem zwraca `401` (`GET /v1/me`).
- PASS - readiness backendu po poprawce DB URL: `status=ready`, `database=ok`, `supabase=ok`.
- INFO (automatyzacja) - nieudana automatyczna rejestracja nowego usera przez Supabase Auth:
  - `email_address_invalid` dla domeny `example.com`,
  - `429` (rate limit) dla testowego adresu `gmail.com`.

## 2) Quiz flow (start -> next-question -> answer -> finish)

- PASS - flow jest wykonywany przez realnego usera po deployu.
- PASS - potwierdzone powtorki tych samych slow w jednej sesji:
  - sesja `hard`: `repeated_words=25`, `all_attempts=75` (srednio 3 proby/slowo),
  - sesja `easy`: widoczne sesje z `all_attempts=14` dla puli 10 slow.
- PASS - backend losuje pytania z puli slow nieopanowanych (`mastered=false`), zgodnie z fixem.

## 3) Rewards / unlock / ledger

- PASS - po `finish` powstaja wpisy rewardowe w `points_ledger` (`reference_type='quiz_session'`), m.in.:
  - `tier_completed` `+125`,
  - `tier_completed` `+275`,
  - `tier_completed_repeat` `+40`.
- PASS - spojnosc `wallet` vs `points_ledger` potwierdzona (`wallet_ledger_mismatched_users=0`).
- PASS - odblokowania kategorii sa zapisywane (`category_unlocks=1`).

## 4) Sesja i kontynuacja po odswiezeniu

- FIX DEPLOYED - frontend summary usuniety z petli `effect` przez `untracked(...)` (naprawa ryzyka OOM na stronie podsumowania).
- PASS (manual) - brak OOM po przejsciu do summary (potwierdzone przez QA manualny).

## Decyzja

- **Krok 4: ZALICZONY**.

## Minimalny manualny run (2-3 min)

1. Zaloguj sie w frontendzie (Supabase Auth).
2. Wejdz w kategorie `podroze` (tier `easy`) i uruchom sesje.
3. Odpowiedz na wszystkie pytania i zakoncz `finish`.
4. Sprawdz, ze:
   - pojawily sie punkty po `finish`,
   - `wallet` i `ledger` sa zaktualizowane,
   - odswiezenie strony nie psuje aktywnej sesji (jesli sesja byla w toku).
