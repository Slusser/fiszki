# Faza 1 - Baza danych i Supabase (2-3 dni)

## 1. Cel
Zaprojektować i uruchomić warstwę danych MVP na Supabase tak, aby:
- wspierała pełny flow quizu i progresji,
- była bezpieczna przez RLS,
- miała prosty, powtarzalny seed danych słownikowych,
- działała wydajnie na darmowym planie i środowisku `dev`.

## 2. Założenia wejściowe
- Jedno środowisko: `dev`.
- Tylko język hiszpański w Fazie 1.
- Wolumen słów: 50 na kategorię, progresja tierów `easy=10`, `hard=25`, `expert=50`.
- Dystraktory losowane runtime z tego samego tieru.
- Brak aliasów tłumaczeń.
- Reguła błędów: `required_correct += 3`, limit kary `max +10`.
- Punkty z anti-grind zgodnie z `phase1/kickoff.md`.

## 3. Zakres implementacji
- Tabele MVP:
  - `categories`, `words`,
  - `profiles`, `user_category_unlocks`, `user_word_progress`,
  - `quiz_sessions`, `quiz_answers`,
  - `user_wallet`, `points_ledger`.
- Relacje, ograniczenia i indeksy pod zapytania quizowe.
- RLS policies dla danych użytkownika.
- Pipeline seedowania `CSV UTF-8` -> Postgres.
- Weryfikacja SQL i bezpieczeństwa (advisors + testowe zapytania).

## 4. Plan realizacji (2-3 dni)

## Dzień 1 - Schemat i constraints
1. Zdefiniować DDL tabel i klucze obce.
2. Dodać unikalności:
   - `user_word_progress(user_id, word_id, tier)`,
   - `user_category_unlocks(user_id, category_id)`.
3. Dodać check constraints:
   - `tier IN ('easy','hard','expert')`,
   - `required_correct >= 3`,
   - `required_correct <= 13` (bazowe 3 + max kara 10),
   - `correct_count >= 0`, `wrong_count >= 0`.
4. Przygotować bazowe indeksy:
   - `user_word_progress(user_id, tier, mastered)`,
   - `quiz_sessions(user_id, started_at DESC)`,
   - `points_ledger(user_id, created_at DESC)`.
5. Zapisać SQL w `infra/migrations`.

## Dzień 2 - RLS i seed danych
1. Włączyć RLS na wszystkich tabelach user-centric:
   - `profiles`, `user_category_unlocks`, `user_word_progress`,
   - `quiz_sessions`, `quiz_answers`, `user_wallet`, `points_ledger`.
2. Dodać policies:
   - `SELECT/INSERT/UPDATE` tylko dla `auth.uid()` właściciela,
   - brak dostępu do cudzych rekordów.
3. Dla `categories` i `words`:
   - `SELECT` publiczny także dla `anon`,
   - brak write z klienta.
4. Przygotować seed:
   - wejście: `infra/seeds/*.csv` (`category_slug,tier,source_word,target_word`),
   - mapowanie `category_slug -> category_id`,
   - idempotentny import (upsert po kluczach logicznych).
5. Wstępnie zasilić kategorie i słowa.

## Dzień 3 - Walidacja, tuning, gotowość pod backend
1. Przetestować krytyczne zapytania:
   - pobranie puli pytań dla (`user_id`, `category_id`, `tier`),
   - zapis odpowiedzi i aktualizacja progresu,
   - naliczenie punktów i wpis do `points_ledger`.
2. Sprawdzić plan wykonania (`EXPLAIN ANALYZE`) dla zapytań quizowych.
3. Uruchomić Supabase advisors i poprawić uwagi.
4. Sprawdzić checklistę bezpieczeństwa:
   - brak `service_role` po stronie klienta,
   - brak polityk opartych o `user_metadata`,
   - brak luk przez brak `SELECT` policy przy `UPDATE`.
5. Zamknąć "DB Ready for Backend" checklist.

## 5. Decyzje implementacyjne (proponowane)

### 5.1 Reprezentacja tieru
- Typ `TEXT` + `CHECK` (`easy|hard|expert`) w MVP.
- Uproszczenie migracji i seedowania CSV; enum można dodać później.

### 5.2 Przechowywanie dystraktorów
- Nie zapisujemy dystraktorów w tabeli.
- Generujemy je zapytaniem SQL runtime:
  - 3 losowe `target_word` z tego samego tieru i kategorii, z wykluczeniem bieżącego słowa.

### 5.3 Historia punktów
- `points_ledger` jako źródło prawdy audytu.
- `user_wallet.points_balance` jako cache operacyjny.

## 6. Kryteria ukończenia (Definition of Done dla DB/Supabase)
- Schemat i indeksy wdrożone w `dev`.
- RLS aktywne i przetestowane dla danych użytkownika.
- Seed `CSV UTF-8` działa idempotentnie.
- Zapytania quizowe działają poprawnie na danych testowych.
- Advisors i podstawowe testy bezpieczeństwa przechodzą.

## 7. Ryzyka i mitigacje
- Ryzyko wolnych zapytań losujących:
  - mitigation: indeksy + ograniczenie puli + testy `EXPLAIN ANALYZE`.
- Ryzyko błędnych policy RLS:
  - mitigation: osobne testy dla user A/user B + testy negatywne.
- Ryzyko duplikatów w seedzie:
  - mitigation: klucze logiczne i `upsert`.
- Ryzyko "dryfu" schematu:
  - mitigation: tylko migracje w repo, brak ręcznych zmian ad-hoc.

## 8. Artefakty do wytworzenia
- `infra/migrations/*` (DDL + indeksy + RLS).
- `infra/seeds/*.csv` (dane wejściowe).
- `infra/seeds/*.sql|*.ts` (import/idempotentny upsert).
- `infra/seeds/002_seed_from_hiszpanski_200_kategorii_v40.sql` (import pelnego katalogu 200 kategorii z mapowaniem tierow 10/25/50).
- Krótka instrukcja uruchomienia migracji i seeda w `README.md`.

## 9. Decyzje zamknięte
- `categories/words`: odczyt dostępny także dla `anon`.
- `profiles`: tworzone triggerem po insercie do `auth.users`.
- Schemat danych aplikacyjnych: `public` (MVP).
- Seed 200 kategorii i komplet słów (50 na kategorię, tiery 10/25/50): ładowany od razu (jednorazowo na start).
- W `dev` dopuszczamy pełne czyszczenie i reseed bazy jednym skryptem.
