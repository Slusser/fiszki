# MVP Frontend - Release Prep

Dokument domykajacy Fazę 1 frontendu (`phase1/frontend.md`) i pomocny przed deployem na `dev`.

## 1) Status Definition of Done (Frontend)

### DoD #1: Wszystkie wymagane ekrany sa dostepne i podlaczone do API
- [x] `auth/login` + `auth/register` (Supabase Auth)
- [x] `katalog` (kategorie + tiery + unlock)
- [x] `quiz/:categoryId/:tier` (sesja, pytania, odpowiedzi)
- [x] `quiz/sessions/:sessionId/summary` (podsumowanie)
- [x] `postep` (overview)
- [x] `wallet` (saldo + ledger)

### DoD #2: Guardy blokuja niedozwolony dostep
- [x] `authGuard` dla widokow zalogowanego uzytkownika
- [x] `unlockGuard` dla quizu (blokada kategorii/tieru)
- [x] Czytelny komunikat + CTA unlock przy blokadzie kategorii

### DoD #3: Quiz obsluguje pelny cykl sesji + timeout 30s
- [x] `start` -> `next-question` -> `answer` -> `finish`
- [x] Timer 30s + auto-submit timeout
- [x] Blokada wielokliku podczas requestu
- [x] Feedback poprawna/bledna/timeout bez reveal poprawnej odpowiedzi

### DoD #4: Wznowienie aktywnej sesji po refresh
- [x] `sessionId` zapisywane lokalnie
- [x] Restore flow po odswiezeniu strony
- [x] Obsluga przypadku sesji juz zakonczonej (przejscie do summary)

### DoD #5: Widoki progress i wallet pokazuja aktualne dane backendu
- [x] `GET /v1/progress/overview`
- [x] `GET /v1/wallet`
- [x] `GET /v1/wallet/ledger`

### DoD #6: Podstawowe testy frontendowe przechodza w CI
- [x] Testy jednostkowe: guardy, tier access, store quizu/timer
- [x] Testy komponentowe: `ProgressPage`, `WalletPage`
- [x] Komendy walidacyjne przechodza:
  - [x] `pnpm test`
  - [x] `pnpm lint`
  - [x] `pnpm build --configuration development`

## 2) Known Limitations (swiadome ograniczenia MVP)

- Brak paginacji ledgera (uzywany limit 50).
- Brak rozbudowanego design systemu (celowo lekki UI MVP).
- Brak osobnego globalnego systemu toastow (jest globalny error banner + retry state).
- Brak dedykowanych testow E2E przegladarkowych (sa testy unit/integration komponentowe).
- Brak monitoringu produkcyjnego i dashboardow KPI po stronie frontu.

## 3) Smoke Test (manual) - Dev

Wykonaj ponizsza sciezke po podpieciu backendu dev:

1. **Auth**
   - Wejdz na `auth/register`, utworz konto.
   - Zaloguj sie przez `auth/login`.
   - Oczekiwane: wejscie do `katalog`, widoczne saldo punktow w headerze.

2. **Catalog + Unlock**
   - Otworz `katalog`.
   - Oczekiwane: lista kategorii i tiery dla odblokowanych.
   - Sprobuj wejscia na zablokowana kategorie/tier:
     - oczekiwane: blokada i komunikat.
   - Odblokuj kategorie:
     - oczekiwane: odswiezenie katalogu + wallet + progress.

3. **Quiz Session**
   - Wejdz do `quiz/:categoryId/:tier`.
   - Odpowiedz na pytania.
   - Zweryfikuj timeout 30s:
     - oczekiwane: auto-submit jako bledna odpowiedz.
   - Oczekiwane: widoczny licznik postepu i accuracy.

4. **Finish + Summary**
   - Po wyczerpaniu pytan kliknij finalizacje sesji.
   - Oczekiwane: strona podsumowania z wynikiem, accuracy, reward i snapshotem wallet.

5. **Progress + Wallet**
   - Wejdz na `postep`:
     - oczekiwane: aktualne tiery i status ukonczenia.
   - Wejdz na `wallet`:
     - oczekiwane: saldo, lifetime, historia ledger.

6. **Session Restore**
   - W trakcie aktywnej sesji odswiez strone.
   - Oczekiwane: wznowienie sesji (lub przejscie do summary, jesli backend sygnalizuje completion).

7. **Unauthorized Handling**
   - Wygas token (lub wyloguj) i sproboj wejsc na route chroniony.
   - Oczekiwane: przekierowanie do `auth/login` + zachowanie parametru `redirect`.

## 4) Release Gate (Go/No-Go)

Release na `dev` jest **GO**, jesli:
- [ ] Backend dev jest dostepny i zwraca kontrakty `/v1` zgodne z MVP.
- [ ] Smoke test z sekcji 3 przechodzi bez blockerow.
- [ ] `pnpm test`, `pnpm lint`, `pnpm build --configuration development` przechodza lokalnie.
- [ ] Zmienne srodowiskowe (`apiBaseUrl`, `supabaseUrl`, `supabaseAnonKey`) sa poprawnie ustawione.
