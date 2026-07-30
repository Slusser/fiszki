# Faza 1 - Testy i hardening (2-3 dni)

## 1. Cel
Zabezpieczyć MVP przez testy automatyczne i hardening warstwy backend/frontend, tak aby:
- potwierdzić poprawność reguł quizu, progresji i odblokowań,
- zweryfikować krytyczny flow E2E użytkownika,
- osiągnąć cel wydajnościowy endpointów quizu (`p95 < 300 ms`).

## 2. Założenia wejściowe
- Backend: NestJS + Supabase.
- Frontend: Angular + Supabase Auth.
- Auth flow: logowanie/rejestracja po stronie frontendu, backend weryfikuje JWT.
- Reguły quizu i ekonomii są zamrożone w dokumentach kickoff/backend/game.
- Środowisko testowe: tylko `dev`.

## 3. Zakres testów
- Testy backend:
  - reguły quizu (`required_correct`, timeout, opanowanie słowa),
  - progresja tierów i ukończenie sesji,
  - odblokowania kategorii i transakcje punktowe.
- Testy E2E krytycznego flow:
  - `rejestracja -> quiz -> ukończenie tieru -> punkty -> unlock kategorii`.
- Testy wydajności:
  - endpointy quizowe (`start`, `next-question`, `answer`, `finish`),
  - walidacja `p95 < 300 ms`.

## 4. Plan implementacji (2-3 dni)

## Dzień 1 - Testy backend (unit + integration)
1. Testy jednostkowe reguł quizu:
   - poprawna odpowiedź zwiększa `correct_count`,
   - błędna odpowiedź zwiększa `required_correct` o `+3`,
   - limit `required_correct <= 13`,
   - timeout 30 s traktowany jako błąd.
2. Testy jednostkowe ekonomii:
   - reward tier + bonus accuracy,
   - anti-grind mnożniki i daily cap,
   - brak podwójnego rewardu dla jednego `session_id`.
3. Testy integracyjne backendu:
   - `start -> next-question -> answer -> finish`,
   - transakcje `wallet + points_ledger`,
   - unlock kategorii przy wystarczającym saldzie.

## Dzień 2 - E2E flow i testy negatywne
1. E2E krytycznej ścieżki:
   - użytkownik zakłada konto/loguje się,
   - przechodzi sesję quizową,
   - kończy tier i dostaje punkty,
   - odblokowuje nową kategorię.
2. E2E przypadków negatywnych:
   - brak dostępu do nieodblokowanej kategorii,
   - próba unlock przy za małym saldzie,
   - próba dostępu do cudzej sesji.
3. Hardening bezpieczeństwa:
   - weryfikacja auth guardów i ról,
   - weryfikacja RLS (user A nie czyta user B),
   - walidacja inputów DTO (błędne payloady).

## Dzień 3 (bufor) - wydajność i stabilizacja
1. Testy wydajności endpointów quizu:
   - scenariusze 1 user / 10 users / 50 users (krótkie bursty).
2. Pomiary:
   - `p50`, `p95`, `p99`, error rate.
3. Tuning:
   - analiza wolnych zapytań SQL,
   - korekta indeksów i zapytań,
   - ograniczenie payloadów.
4. Finalny smoke test całego flow po poprawkach.

## 5. Backlog zadań
- Dodać testy jednostkowe `QuizRulesService`.
- Dodać testy jednostkowe `RewardsService`.
- Dodać testy integracyjne endpointów `quiz`.
- Dodać testy integracyjne endpointu `unlock`.
- Dodać E2E happy path użytkownika.
- Dodać E2E negatywne (auth, saldo, cudza sesja).
- Przygotować skrypt performance testów endpointów quizu.
- Dodać raportowanie metryk (`p95`, error rate) do artefaktów CI.

## 6. Hardening checklist
- Rate limit aktywny na endpointach `start/answer/finish`.
- Idempotencja `finish` i ochrona przed podwójnym naliczeniem.
- Walidacja czasu pytania (timeout) po stronie backendu.
- Walidacja integralności sesji (`session_id` należy do usera).
- Brak wycieku danych przez błędy API (bez stack trace w produkcyjnych odpowiedziach).
- Spójność `wallet` i `points_ledger` po każdej operacji.

## 7. Kryteria ukończenia (Definition of Done)
- Testy backendowe krytycznych reguł przechodzą.
- E2E krytycznej ścieżki przechodzi stabilnie.
- E2E negatywne przypadki autoryzacji i odblokowań przechodzą.
- Endpointy quizowe osiągają `p95 < 300 ms` na uzgodnionym scenariuszu obciążenia.
- Po hardeningu brak blockerów bezpieczeństwa i spójności danych.

## 8. Ryzyka i mitigacje
- Ryzyko niestabilnych testów E2E:
  - mitigation: deterministyczne dane seed + izolowane konta testowe.
- Ryzyko fałszywie dobrego wyniku wydajności:
  - mitigation: pomiary na realistycznym wolumenie danych i warm-up testów.
- Ryzyko pominięcia edge-case timeout:
  - mitigation: osobne testy graniczne czasu (29 s, 30 s, 31 s).
- Ryzyko regresji po zmianach SQL:
  - mitigation: obowiązkowy rerun testów integracyjnych i performance smoke.

## 9. Pytania doprecyzowujące
- Jakie narzędzie wybieramy do testów wydajności (`k6`, `Artillery`, inne)?
- Czy performance testy mają odpalać się w każdym PR, czy tylko manualnie / nightly?
- Jaki minimalny próg dla error rate akceptujemy w testach wydajności (np. <1%)?
- Czy E2E mają być uruchamiane w CI zawsze, czy tylko na merge do `main`?
- Czy w Fazie 1 dodajemy contract tests (spójność DTO frontend-backend), czy odkładamy na później?
