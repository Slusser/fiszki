# Dzien 3 - DB Ready for Backend (dev)

## 1) Krytyczne zapytania
- [ ] `infra/validation/001_day3_validation_queries.sql` wykonuje sie bez bledow.
- [ ] Pula pytan zwraca tylko aktywne i nieopanowane slowa.
- [ ] Zapis odpowiedzi aktualizuje `wrong_count` i podnosi `required_correct` max do 13.
- [ ] Naliczenie punktow aktualizuje `user_wallet` i dodaje wpis do `points_ledger`.

## 2) Wydajnosc
- [ ] `infra/validation/002_day3_explain_analyze.sql` uzywa indeksow:
  - `idx_user_word_progress_user_tier_mastered`
  - `idx_quiz_sessions_user_started_at_desc`
  - `idx_points_ledger_user_created_at_desc`
- [ ] Czasy zapytan sa akceptowalne dla dev (brak pelnych skanow na duzych tabelach).

## 3) Security / RLS
- [ ] Uzytkownik A nie widzi danych user-centric uzytkownika B.
- [ ] `categories` i `words` sa czytelne dla `anon`.
- [ ] Brak write dostepu do `categories` i `words` z klienta.
- [ ] Polityki `UPDATE` maja odpowiadajace polityki `SELECT`.
- [ ] Brak logiki autoryzacji opartej o `user_metadata`.

## 4) Advisors
- [ ] Uruchomiono Supabase advisors i poprawiono wszystkie krytyczne ostrzezenia.
- [ ] Potwierdzono brak ekspozycji `service_role` po stronie klienta.

## 5) Finalne potwierdzenie
- [ ] Schemat + RLS + seed sa odtwarzalne tylko przez pliki z `infra/`.
- [ ] Backend ma gotowe, zweryfikowane SQL pod flow quiz/progres/punkty.
