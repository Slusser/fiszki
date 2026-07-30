# Faza 1 - Frontend Angular (4-6 dni)

## 1. Cel
Zbudować frontend Angular dla MVP aplikacji fiszek, który obsługuje pełny flow użytkownika:
`logowanie/rejestracja -> wybór kategorii -> quiz -> podsumowanie -> progres/wallet`,
z uwzględnieniem guardów dostępu, reguł UX quizu i integracji z backendem REST.

## 2. Założenia wejściowe
- Angular (aktualnie ustalony stack projektowy).
- API wyłącznie REST (`/v1`).
- Auth: realizowany przez Supabase po stronie frontendu, backend przyjmuje i weryfikuje JWT.
- Wolumen słów per kategoria: `easy=10`, `hard=25`, `expert=50` (łącznie 50).
- 30 sekund na pytanie, timeout traktowany jak błąd.
- Brak natychmiastowego pokazywania poprawnej odpowiedzi po błędzie.
- Możliwa kontynuacja aktywnej sesji po odświeżeniu strony.
- Jedno środowisko: `dev`, hosting frontendu na Netlify Free.

## 3. Zakres funkcjonalny (Faza 1)
- Ekrany:
  - logowanie/rejestracja,
  - lista kategorii,
  - widok tierów i stan odblokowań,
  - ekran quizu,
  - podsumowanie sesji,
  - widok postępu,
  - wallet + historia punktów.
- Guardy:
  - dostęp do quizu tylko dla odblokowanych kategorii/tierów,
  - dostęp do widoków użytkownika tylko po autoryzacji.
- UX quizu:
  - pobieranie kolejnych pytań (`next-question`),
  - feedback poprawna/błędna bez reveal tłumaczenia,
  - licznik czasu 30 s i auto-submit timeout,
  - licznik postępu sesji.

## 4. Proponowana struktura frontendu
```text
frontend/src/app/
  core/
    api/
    auth/
    interceptors/
    guards/
  features/
    auth/
    catalog/
    quiz/
    progress/
    wallet/
  shared/
    ui/
    utils/
  app.routes.ts
```

## 5. Plan implementacji (4-6 dni)

## Dzień 1 - Fundament aplikacji i Core
1. Ustawić routing i układ główny aplikacji.
2. Przygotować `CoreModule`/core providers:
   - klient API,
   - interceptor JWT,
   - globalny error handling (401/403/500),
   - guard autoryzacyjny.
3. Dodać modele TypeScript dla kontraktów backendu.
4. Dodać bazowy service dla sesji użytkownika (`me`, stan auth).

## Dzień 2 - Auth + katalog + guardy dostępu
1. Ekrany logowania/rejestracji z Supabase Auth.
2. Integracja po zalogowaniu:
   - pobranie `GET /v1/me`,
   - zapis stanu użytkownika.
3. Lista kategorii i tierów:
   - `GET /v1/catalog/categories`,
   - `GET /v1/catalog/categories/:categoryId/tiers`.
4. Guard dla odblokowania:
   - blokada wejścia na quiz jeśli tier/kategoria niedostępna,
   - czytelny komunikat + CTA odblokowania.
5. Akcja odblokowania kategorii:
   - `POST /v1/catalog/categories/:categoryId/unlock`,
   - odświeżenie wallet/progresu po sukcesie.

## Dzień 3 - Quiz (sesja + pytania + odpowiedzi)
1. Start sesji:
   - `POST /v1/quiz/sessions/start`.
2. Pobieranie pytania:
   - `GET /v1/quiz/sessions/:sessionId/next-question`.
3. Odpowiedź:
   - `POST /v1/quiz/sessions/:sessionId/answer`.
4. UX pytania:
   - licznik 30 s,
   - blokada wielokliku podczas requestu,
   - wizualny feedback poprawna/błędna bez reveal poprawnej odpowiedzi.
5. Obsługa timeout:
   - auto-submit jako błąd po 30 s,
   - przejście do kolejnego pytania.

## Dzień 4 - Podsumowanie, progres, wallet
1. Finalizacja sesji:
   - `POST /v1/quiz/sessions/:sessionId/finish` tylko gdy backend pozwala.
2. Ekran podsumowania:
   - accuracy, wynik, zdobyte punkty, status ukończenia tieru.
3. Widok postępu:
   - `GET /v1/progress/overview`.
4. Wallet:
   - `GET /v1/wallet`,
   - `GET /v1/wallet/ledger`.

## Dzień 5 - Kontynuacja sesji + odporność UX
1. Przywracanie aktywnej sesji po refreshu:
   - przechowywanie `sessionId`,
   - check statusu sesji i resume flow.
2. Obsługa błędów i przypadków granicznych:
   - wygaśnięty token,
   - sesja już zakończona,
   - brak pytań w puli.
3. Spójne komponenty UI:
   - loading/skeleton,
   - empty states,
   - retry.

## Dzień 6 (bufor) - testy i polish
1. Testy jednostkowe:
   - serwisy API,
   - guardy,
   - logika timera pytania.
2. Testy integracyjne kluczowych ekranów.
3. Finalny smoke test ścieżki E2E z backendem dev.
4. Drobne poprawki UX i dostępności.

## 6. Zadania (backlog implementacyjny)
- Skonfigurować `AuthInterceptor` z JWT Supabase.
- Zaimplementować `AuthGuard` i `UnlockGuard`.
- Zbudować widok `CategoriesPage` + `TiersPanel`.
- Zbudować `QuizPage` z timerem, stanami pytania i auto-timeout.
- Zaimplementować `QuizSessionStore` (stan sesji, current question, progress).
- Zbudować `SessionSummaryPage`.
- Zbudować `ProgressPage`.
- Zbudować `WalletPage` + `LedgerTable`.
- Dodać globalny handling błędów API i toasty.
- Dodać testy krytycznych serwisów i guardów.

## 7. Założenia UX dla quizu
- Jedno pytanie aktywne naraz.
- Po wyborze odpowiedzi karta pytania jest chwilowo blokowana do odpowiedzi API.
- Użytkownik widzi informację "poprawna/błędna", ale nie poprawne tłumaczenie.
- Pasek/licznik pokazuje postęp w sesji.
- Timeout traktowany jak odpowiedź błędna i przechodzi do kolejnego kroku flow.

## 8. Kryteria ukończenia (Definition of Done dla frontendu)
- Wszystkie wymagane ekrany są dostępne i podłączone do API.
- Guardy blokują niedozwolony dostęp (auth oraz unlock tier/kategorii).
- Quiz obsługuje pełny cykl sesji wraz z timeoutem 30 s.
- Użytkownik może wznowić aktywną sesję po odświeżeniu.
- Widoki `progress` i `wallet` pokazują aktualne dane z backendu.
- Podstawowe testy frontendowe przechodzą w CI.

## 9. Ryzyka i mitigacje
- Ryzyko desynchronizacji stanu quizu frontend-backend:
  - mitigation: backend jako source of truth, częste odświeżanie statusu sesji.
- Ryzyko błędów timera i race condition:
  - mitigation: pojedynczy kontroler timera + blokada wielokliku.
- Ryzyko słabego UX na wolnym łączu:
  - mitigation: wyraźne loading states i retry.
- Ryzyko wygasania tokenu w trakcie sesji:
  - mitigation: centralny handling 401 i odświeżenie sesji auth.

## 10. Pytania doprecyzowujące
- Czy chcesz na starcie prosty design system (np. Angular Material), czy własne lekkie komponenty bez biblioteki UI?
- Czy na liście kategorii mają być filtry/sortowanie już w Fazie 1 (np. odblokowane, najbliższe do odblokowania)?
- Czy po timeout pytania użytkownik ma widzieć osobny komunikat "czas minął", czy zwykły status błędu?
- Czy w `SessionSummaryPage` pokazujemy szczegółową listę pytań z sesji, czy tylko statystyki zbiorcze?
- Czy wallet/ledger ma być stronicowany od początku, czy wystarczy limit np. ostatnie 50 wpisów?
