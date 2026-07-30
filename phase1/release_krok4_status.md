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

- PENDING - flow wymaga poprawnego JWT z Supabase Auth.
- BLOCKER - brak pozyskanego tokena w automacie przez ograniczenia signup/rate limit.
- FIX PREPARED - backend zmieniony tak, aby pytania byly losowane z puli slow nieopanowanych (`mastered=false`), co wymusza powtorki az do opanowania.

## 3) Rewards / unlock / ledger

- PENDING - wymaga przejscia flow quizu na poprawnym tokenie.

## 4) Sesja i kontynuacja po odswiezeniu

- PENDING - wymaga aktywnej sesji quizowej utworzonej przez zalogowanego usera.
- FIX PREPARED - frontend summary usuniety z petli `effect` przez `untracked(...)` (naprawa ryzyka OOM na stronie podsumowania).

## Decyzja

- **Krok 4: CZESCIOWO POTWIERDZONY** (infrastruktura i autoryzacja negatywna OK),
- **Do pelnego zaliczenia potrzebny 1 manualny przebieg E2E z konta usera**.

## Minimalny manualny run (2-3 min)

1. Zaloguj sie w frontendzie (Supabase Auth).
2. Wejdz w kategorie `podroze` (tier `easy`) i uruchom sesje.
3. Odpowiedz na wszystkie pytania i zakoncz `finish`.
4. Sprawdz, ze:
   - pojawily sie punkty po `finish`,
   - `wallet` i `ledger` sa zaktualizowane,
   - odswiezenie strony nie psuje aktywnej sesji (jesli sesja byla w toku).
