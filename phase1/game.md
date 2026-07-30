# Faza 1 - Grywalizacja i ekonomia punktów (1-2 dni)

## 1. Cel
Zaprojektować i wdrożyć spójny system grywalizacji dla MVP, który:
- motywuje do realnej nauki,
- ogranicza farmienie punktów (anti-grind),
- umożliwia odblokowywanie kategorii,
- zapewnia pełny audyt operacji punktowych przez ledger.

## 2. Założenia wejściowe
- Startowe odblokowanie: 10 kategorii.
- Odblokowanie kolejnych kategorii za punkty.
- Wolumen słów per kategoria: `easy=10`, `hard=25`, `expert=50` (łącznie 50).
- Punktacja bazowa (z kickoff):
  - Easy: 100,
  - Hard: 220,
  - Expert: 420.
- Bonus accuracy:
  - >=95%: +25%,
  - 85-94%: +10%,
  - <85%: +0%.
- Anti-grind:
  - 1. powtórka: x0.40,
  - 2. powtórka: x0.20,
  - 3+ powtórka: x0.10,
  - dzienny cap z powtórek: 300 pkt.
- Wszystkie zmiany salda muszą mieć wpis w `points_ledger`.

## 3. Zakres funkcjonalny
- Mechanika odblokowań kategorii:
  - koszty punktowe per kategoria (`unlock_cost`),
  - walidacja salda i odjęcie punktów transakcyjnie.
- Nagradzanie za ukończenie tierów:
  - naliczenie bazowe + bonus accuracy + mnożnik anti-grind.
- Śledzenie ekonomii:
  - `user_wallet` (saldo operacyjne),
  - `points_ledger` (audit trail).
- Ochrona przed nadużyciami:
  - idempotencja naliczeń,
  - brak podwójnego rewardu za ten sam event.

## 4. Plan implementacji (1-2 dni)

## Dzień 1 - Reguły i model punktów
1. Zdefiniować finalny kontrakt reguł naliczania:
   - wejścia: tier, accuracy, liczba powtórek w 24h, suma punktów z powtórek dziś,
   - wyjście: `finalPoints`, `rewardBreakdown`.
2. Zaimplementować centralny `RewardsService`:
   - `calculateTierReward(...)`,
   - `applyReward(...)` (transakcyjnie wallet + ledger).
3. Zaimplementować odblokowanie kategorii:
   - `canUnlockCategory(...)`,
   - `unlockCategory(...)` (transakcyjnie: wallet debit + unlock + ledger).
4. Dodać reason codes w ledgerze, np.:
   - `tier_completed`,
   - `category_unlock`,
   - `manual_adjustment_dev` (opcjonalnie dev-only).

## Dzień 2 - Integracja, walidacja, testy
1. Spiąć rewards z flow `quiz/sessions/:id/finish`.
2. Dodać walidacje biznesowe:
   - brak podwójnego naliczenia za tę samą sesję,
   - brak unlock przy niewystarczającym saldzie.
3. Dodać endpointy/odpowiedzi z breakdown punktów:
   - frontend widzi skąd wyniknęła końcowa nagroda.
4. Testy:
   - unit testy `calculateTierReward`,
   - testy graniczne anti-grind i daily cap,
   - integracyjne testy transakcji wallet + ledger.
5. Dodać krótką notatkę operacyjną: jak diagnozować rozjazd salda.

## 5. Backlog zadań
- Dodać helper `AccuracyBand` i mapowanie progów bonusu.
- Dodać licznik powtórek tieru w oknie 24h.
- Dodać licznik dziennych punktów z powtórek.
- Zaimplementować mnożniki anti-grind i cap 300 pkt/dzień.
- Zaimplementować transakcję naliczenia: wallet credit + ledger insert.
- Zaimplementować transakcję unlock: wallet debit + unlock insert + ledger insert.
- Dodać `reward_breakdown` do odpowiedzi `finish`.
- Dodać testy idempotencji i antyduplikacji rewardów.

## 6. Reguły biznesowe (zamrożone)
- Reward przyznawany dopiero po poprawnym `finish` sesji.
- `finish` działa tylko przy wyczerpanej puli pytań.
- Ten sam `session_id` nie może wygenerować rewardu więcej niż raz.
- Każda operacja zmieniająca saldo musi utworzyć wpis w `points_ledger`.
- Unlock kategorii wymaga salda >= `unlock_cost`.

## 7. Kryteria ukończenia (Definition of Done)
- Odblokowania działają dla startowych 10 kategorii i kolejnych płatnych.
- Punktacja tier + accuracy + anti-grind działa zgodnie z ustaleniami.
- Daily cap z powtórek jest egzekwowany.
- `user_wallet` i `points_ledger` są zawsze spójne po operacji.
- Testy jednostkowe i integracyjne dla ekonomii przechodzą.

## 8. Ryzyka i mitigacje
- Ryzyko niespójności salda przy równoległych requestach:
  - mitigation: transakcje DB + lock logiczny/idempotency key.
- Ryzyko "zbyt hojnej" ekonomii i szybkiego unlocku wszystkiego:
  - mitigation: telemetryka i szybki tuning `unlock_cost` oraz mnożników.
- Ryzyko nieczytelności punktacji dla użytkownika:
  - mitigation: `reward_breakdown` w podsumowaniu sesji.
- Ryzyko regresji anti-grind:
  - mitigation: testy graniczne dla okna 24h i daily cap.

## 9. Pytania doprecyzowujące
- Czy `unlock_cost` ma być stały dla wszystkich kategorii, czy zależny od trudności (`difficulty_weight`)?
- Czy pierwsze 10 kategorii ma mieć `unlock_cost = 0`, czy mają być odblokowane flagą niezależnie od kosztu?
- Czy punkty za ukończenie tieru przyznajemy tylko raz "pełne", a później zawsze z anti-grind, czy dopuszczamy reset sezonowy w przyszłości?
- Czy w MVP potrzebny jest endpoint admin/dev do ręcznej korekty punktów (`manual_adjustment_dev`)?
- Czy `reward_breakdown` ma być zapisywany w ledgerze jako JSON (dla audytu), czy tylko liczony runtime do odpowiedzi?
