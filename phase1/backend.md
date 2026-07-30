# Faza 1 - Backend NestJS (4-6 dni)

## 1. Cel
Zaimplementować backend `NestJS` dla MVP aplikacji fiszek, oparty o `REST API`, z integracją z Supabase (Postgres + Auth), tak aby obsłużyć pełną ścieżkę:
`rejestracja/logowanie -> quiz -> progres -> punkty -> odblokowanie kategorii`.

## 2. Założenia wejściowe
- API wyłącznie REST (`/v1`).
- Jedno środowisko: `dev`.
- Supabase jako baza i auth provider.
- Ranking poza Fazą 1.
- Wolumen słów per kategoria: `easy=10`, `hard=25`, `expert=50` (łącznie 50).
- Reguły quizu:
  - bazowe wymaganie opanowania słowa: 3 poprawne,
  - błąd: `required_correct += 3`,
  - limit kary: `max +10` (czyli sufit 13).
- Czas na pytanie: 30 sekund.
- Po błędzie frontend nie pokazuje poprawnej odpowiedzi natychmiast.

## 3. Zakres modułów backendu
- `auth` - sesja użytkownika, integracja z Supabase Auth.
- `users` - profil i dane konta.
- `catalog` - kategorie, tiery, dostępność i odblokowania.
- `quiz` - sesje quizowe, pytania, odpowiedzi, timeout.
- `progression` - postęp słów, opanowanie tierów.
- `rewards` - naliczanie punktów i `points_ledger`.
- `health` - endpointy techniczne (`/health`, `/ready`).

## 4. Kontrakty API (MVP v1)

## 4.1 Auth i użytkownik
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/me`

## 4.2 Katalog i odblokowania
- `GET /v1/catalog/categories`
- `GET /v1/catalog/categories/:categoryId/tiers`
- `POST /v1/catalog/categories/:categoryId/unlock`

## 4.3 Quiz
- `POST /v1/quiz/sessions/start`
- `GET /v1/quiz/sessions/:sessionId/next-question`
- `POST /v1/quiz/sessions/:sessionId/answer`
- `POST /v1/quiz/sessions/:sessionId/finish`

## 4.4 Progres i punkty
- `GET /v1/progress/overview`
- `GET /v1/wallet`
- `GET /v1/wallet/ledger`

## 5. Plan implementacji (4-6 dni)

## Dzień 1 - Fundament architektury backendu
1. Uporządkować strukturę modułów i warstw (`controller/service/repository`).
2. Dodać globalne elementy:
   - `ValidationPipe`,
   - globalny exception filter,
   - logger request/response (bez danych wrażliwych),
   - prefix `v1`.
3. Przygotować wspólne kontrakty DTO i response envelope.
4. Dodać `health` i bazowy smoke test backendu.

## Dzień 2 - Auth + users + catalog
1. Integracja z Supabase Auth (token verification po stronie backendu).
2. Guard autoryzacyjny i ekstrakcja `user_id`.
3. Endpointy:
   - `GET /v1/me`,
   - `GET /v1/catalog/categories`,
   - `GET /v1/catalog/categories/:categoryId/tiers`.
4. `POST /v1/catalog/categories/:categoryId/unlock`:
   - walidacja punktów,
   - transakcja: odjęcie z wallet + wpis do ledger + unlock.

## Dzień 3 - Quiz core (sesja, pytanie, odpowiedź)
1. `POST /v1/quiz/sessions/start`:
   - walidacja dostępu do kategorii/tieru,
   - utworzenie sesji w statusie `active`.
2. `GET /v1/quiz/sessions/:sessionId/next-question`:
   - wybór słowa z aktywnej puli,
   - losowanie 3 dystraktorów z tego samego tieru i kategorii,
   - zwrot paczki odpowiedzi w losowej kolejności.
3. `POST /v1/quiz/sessions/:sessionId/answer`:
   - walidacja, że pytanie należy do aktywnej sesji użytkownika,
   - walidacja limitu czasu 30 s,
   - zapis `quiz_answers`,
   - aktualizacja `user_word_progress` zgodnie z regułami.

## Dzień 4 - Progresja i rewards
1. Wykrywanie ukończenia tieru:
   - wszystkie słowa tieru opanowane.
2. Naliczanie punktów:
   - bazowe punkty tieru (Easy/Hard/Expert),
   - bonus accuracy,
   - anti-grind (malejące mnożniki + dzienny cap z powtórek).
3. `POST /v1/quiz/sessions/:sessionId/finish`:
   - finalizacja sesji,
   - zapis score/accuracy,
   - trigger naliczenia rewardów.
4. Endpointy:
   - `GET /v1/progress/overview`,
   - `GET /v1/wallet`,
   - `GET /v1/wallet/ledger`.

## Dzień 5 - Bezpieczeństwo, odporność, testy
1. Rate limiting endpointów krytycznych (`start/answer/finish`).
2. Idempotencja tam, gdzie potrzebna (np. `finish`).
3. Testy:
   - jednostkowe reguł quizu i rewards,
   - integracyjne dla flow:
     `start -> next-question -> answer -> finish`.
4. Testy negatywne:
   - próba dostępu do cudzej sesji,
   - timeout pytania,
   - brak punktów przy unlock.

## Dzień 6 (bufor) - tuning i domknięcie
1. Profilowanie najcięższych endpointów quizowych.
2. Drobne poprawki DTO/kontraktów.
3. Uzupełnienie dokumentacji endpointów (OpenAPI/Swagger).
4. Finalny smoke test z frontendem dev.

## 6. Reguły domenowe do implementacji (zamrożone)
- Słowo jest opanowane po osiągnięciu `correct_count >= required_correct`.
- Każdy błąd zwiększa `required_correct` o 3.
- `required_correct` nie może przekroczyć 10.
- Za każde pytanie liczony jest timeout 30 s od czasu wydania pytania; timeout jest traktowany jako błędna odpowiedź.
- Dystraktory dobierane są wyłącznie z tego samego tieru i kategorii.

## 7. Standardy jakości backendu
- Każdy endpoint ma DTO wejścia i DTO wyjścia.
- Brak logowania tokenów, haseł i sekretów.
- Operacje finansowe (`wallet`, `ledger`, `unlock`) wykonywane transakcyjnie.
- Błędy biznesowe zwracane z czytelnym kodem i komunikatem.

## 8. Kryteria ukończenia (Definition of Done dla backendu)
- Wszystkie endpointy MVP działają i są zintegrowane z Supabase.
- Reguły quizu/progresji/rewardów działają zgodnie z kickoff.
- Testy unit + integracyjne przechodzą w CI.
- Endpointy krytyczne mają guardy i rate limiting.
- Dokumentacja API jest dostępna i aktualna.

## 9. Ryzyka i mitigacje
- Ryzyko konfliktów przy równoległych odpowiedziach:
  - mitigation: blokady/transakcje i bezpieczne aktualizacje liczników.
- Ryzyko niespójnej punktacji:
  - mitigation: jedna centralna usługa `RewardsService`.
- Ryzyko nadużyć endpointu `answer`:
  - mitigation: walidacja sesji, timeout, throttling.
- Ryzyko złożoności SQL dla pytań:
  - mitigation: wydzielone repozytorium zapytań + testy wydajnościowe.

## 10. Pytania doprecyzowujące
## 10. Decyzje zamknięte
- Auth flow: rejestracja/logowanie całkowicie po stronie frontendu przez Supabase Auth; backend tylko weryfikuje JWT i egzekwuje autoryzację.
- Timeout 30 s: traktowany jako błąd (`incorrect`) i uruchamia karę progresji.
- `next-question`: backend może zwracać metadane postępu sesji (np. `remainingWords`, `sessionAccuracy`).
- `finish`: endpoint dostępny tylko gdy pula pytań sesji jest wyczerpana.
- Kontynuacja sesji: po odświeżeniu użytkownik może wrócić do aktywnej sesji.
