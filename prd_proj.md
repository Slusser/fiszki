# PRD - Aplikacja do fiszek hiszpańskich

## 1. Wizja produktu
Stworzyć aplikację webową do nauki słownictwa hiszpańskiego przez krótkie, grywalizowane sesje quizowe. Użytkownik ma czuć stały progres, odblokowywać kolejne poziomy trudności i kategorie, a jednocześnie utrzymywać wysoką skuteczność zapamiętywania.

## 2. Cele biznesowe i produktowe
- Zbudować MVP, które pozwala regularnie trenować słownictwo w formacie 1-z-4.
- Osiągnąć wysoki poziom retencji użytkowników dzięki progresji i nagrodom.
- Utrzymać niski koszt utrzymania przez statyczny katalog treści i prosty model operacyjny.
- Przygotować fundament pod rozszerzenia (np. powtórki SRS, audio, tryb mobilny).

## 3. Grupa docelowa
- Początkujący i średniozaawansowani uczący się hiszpańskiego.
- Osoby uczące się w krótkich sesjach (5-15 minut).
- Użytkownicy motywowani systemem poziomów, punktów i odblokowań.

## 4. Zakres MVP

### 4.1 Zawartość
- 200 statycznych kategorii.
- Każda kategoria zawiera do 200 słów podzielonych na 3 tiery:
  - Easy: 50 słów
  - Hard: 100 słów
  - Expert: 200 słów
- Na starcie dostępnych 10 kategorii.

### 4.2 Mechanika nauki
- W każdej turze losowane jest słowo źródłowe + 4 odpowiedzi (1 poprawna, 3 dystraktory).
- Użytkownik wybiera jedną odpowiedź.
- Słowo jest uznane za opanowane po 3 poprawnych odpowiedziach.
- Każda błędna odpowiedź zwiększa wymaganą liczbę poprawnych odpowiedzi dla tego słowa o +3.
- Sesja kończy się po wyczerpaniu puli aktywnych słów dla danego tieru.

### 4.3 Progresja i grywalizacja
- Odblokowanie kolejnego tieru w kategorii po ukończeniu poprzedniego.
- Za ukończenie tierów i dobre wyniki użytkownik zdobywa punkty.
- Punkty odblokowują nowe kategorie.
- Kategorie mają koszt odblokowania (progi punktowe).

## 5. Rekomendowany stack technologiczny

### 5.1 Frontend
- Angular (docelowo v22, jeśli stabilna i wspierana przez cały stack build/deploy).
- W przypadku ograniczeń ekosystemu (biblioteki, CI, pluginy): fallback do najnowszej stabilnej wersji LTS.
- Angular Router + guards do kontroli dostępu do odblokowanych zasobów.
- Stan aplikacji: sygnały Angular + lekki store domenowy (bez ciężkiego frameworka na start).

### 5.2 Backend
- NestJS (najnowsza stabilna wersja na moment wdrożenia).
- Modularna architektura:
  - `auth`
  - `catalog` (kategorie, słowa, tiery)
  - `quiz`
  - `progression`
  - `rewards`
  - `users`
- REST API na MVP; walidacja DTO (`class-validator`) i serializacja odpowiedzi.

### 5.3 Baza danych i auth
- Supabase Postgres jako główna baza.
- Supabase Auth do logowania i zarządzania sesją.
- RLS włączone dla tabel użytkownika i progresu.
- Statyczne dane słownikowe seedowane skryptem migracyjnym/importem.

### 5.4 Hosting i operacje
- Frontend: Vercel/Netlify (SSR nie jest wymagane w MVP).
- Backend: Render/Fly/Railway lub kontener na VPS.
- Baza: zarządzana instancja Supabase.
- Monitoring: podstawowe logi backend + metryki produktowe w tabelach analitycznych.

## 6. Słabe punkty pierwotnego pomysłu i rekomendowane poprawki

### 6.1 Ryzyko: niska retencja przez czyste losowanie
Problem: losowanie bez priorytetu trudnych słów może dawać słabe utrwalanie.
Rekomendacja:
- Wprowadzić adaptacyjny dobór pytań (większa szansa dla słów z błędami).
- Dodać lekki model powtórek: `next_review_at` zależny od skuteczności.

### 6.2 Ryzyko: farmienie punktów bez realnej nauki
Problem: użytkownik może powtarzać łatwe zadania dla punktów.
Rekomendacja:
- Malejące nagrody za kolejne powtórki tego samego tieru w krótkim oknie czasu.
- Bonus punktowy za dokładność (accuracy) i pass rate.
- Dzienne limity punktów z aktywności powtarzalnej.

### 6.3 Ryzyko: frustracja przez narastającą karę za błędy
Problem: mechanika +3 wymaganej poprawnej odpowiedzi za każdy błąd może eskalować.
Rekomendacja:
- Ustalić górny limit kary, np. max +10.
- Dodać mechanizm "ratunku": po serii poprawnych odpowiedzi redukcja 1 punktu kary.

### 6.4 Ryzyko: nierówna trudność kategorii
Problem: część kategorii może mieć trudniejsze słownictwo, co zaburza ekonomię punktów.
Rekomendacja:
- Skorygować punktację wagą trudności kategorii.
- Docelowo wprowadzić telemetryczny tuning rewardów.

### 6.5 Ryzyko: wydajność i skalowanie (do 40k słów)
Problem: wolne zapytania przy losowaniu i śledzeniu stanu każdego słowa.
Rekomendacja:
- Indeksy na (`user_id`, `word_id`, `tier`, `status`).
- Preselekcja puli pytań na początku sesji.
- Paginacja i limity API, brak zwracania pełnych list słów na frontend.

### 6.6 Ryzyko: nadużycia i cheatowanie
Problem: manipulacja żądaniami odpowiedzi po stronie klienta.
Rekomendacja:
- Walidować poprawność odpowiedzi wyłącznie na backendzie.
- Sesje quizowe z tokenem i ograniczeniem czasu.
- Rate limiting i podstawowe reguły anty-bot.

## 7. Model domenowy (MVP)

### 7.1 Encje
- `users`
  - `id`, `email`, `created_at`
- `categories`
  - `id`, `slug`, `name`, `unlock_cost`, `difficulty_weight`
- `words`
  - `id`, `category_id`, `tier`, `source_word`, `target_word`, `distractor_group`
- `user_category_unlocks`
  - `user_id`, `category_id`, `unlocked_at`
- `user_word_progress`
  - `user_id`, `word_id`, `tier`, `correct_count`, `required_correct`, `wrong_count`, `mastered`, `next_review_at`
- `quiz_sessions`
  - `id`, `user_id`, `category_id`, `tier`, `started_at`, `finished_at`, `score`, `accuracy`
- `quiz_answers`
  - `id`, `session_id`, `word_id`, `selected_option`, `is_correct`, `answered_at`
- `user_wallet`
  - `user_id`, `points_balance`, `lifetime_points`
- `points_ledger`
  - `id`, `user_id`, `reason`, `delta`, `created_at`

### 7.2 Relacje i zasady
- `words.category_id -> categories.id`
- `user_word_progress` unikalne po (`user_id`, `word_id`, `tier`)
- `user_category_unlocks` unikalne po (`user_id`, `category_id`)
- `quiz_answers.session_id -> quiz_sessions.id`

## 8. Reguły quizu i progresji (proponowany standard)

### 8.1 Start sesji
- Użytkownik wybiera odblokowaną kategorię i odblokowany tier.
- System tworzy sesję i pobiera aktywną pulę słów (nieopanowane + do powtórki).

### 8.2 Pytanie
- Backend zwraca:
  - słowo źródłowe,
  - 4 odpowiedzi (shuffle),
  - identyfikator pytania/sesji.

### 8.3 Ocena odpowiedzi
- Poprawna:
  - `correct_count += 1`
  - jeżeli `correct_count >= required_correct`, oznacz `mastered = true`.
- Błędna:
  - `wrong_count += 1`
  - `required_correct = min(required_correct + 1, 6)` (limit kary).

### 8.4 Zakończenie tieru
- Tier ukończony, gdy wszystkie słowa tieru mają `mastered = true`.
- Nagroda punktowa zależy od:
  - poziomu tieru,
  - accuracy sesji,
  - czasu ukończenia (opcjonalny bonus).

### 8.5 Odblokowania
- Tier 2 odblokowuje się po ukończeniu Tier 1, Tier 3 po Tier 2.
- Kategorie odblokowywane przez `unlock_cost` odejmowany z `points_balance`.

## 9. API wysokiego poziomu (MVP)
- `POST /auth/register`
- `POST /auth/login`
- `GET /me/profile`
- `GET /catalog/categories`
- `POST /catalog/categories/:id/unlock`
- `GET /catalog/categories/:id/tiers`
- `POST /quiz/sessions/start`
- `POST /quiz/sessions/:id/answer`
- `GET /quiz/sessions/:id/next-question`
- `POST /quiz/sessions/:id/finish`
- `GET /progress/overview`
- `GET /wallet`

## 10. Wymagania niefunkcjonalne
- Czas odpowiedzi API p95 < 300 ms dla endpointów quizowych.
- Dostępność miesięczna backendu >= 99.5% na MVP.
- Ochrona danych użytkownika zgodnie z dobrymi praktykami (hash haseł po stronie auth provider, HTTPS, brak secretów w kliencie).
- Audytowalność punktów przez `points_ledger`.
- Możliwość odtworzenia stanu progresu użytkownika po logach zdarzeń.

## 11. Bezpieczeństwo (MVP)
- RLS aktywne dla wszystkich tabel użytkownikocentrycznych.
- Każdy odczyt i zapis progresu ograniczony do `auth.uid()`.
- Brak `service_role` po stronie klienta.
- Ograniczenie liczby odpowiedzi na minutę na użytkownika/IP.
- Walidacja integralności sesji quizu (czy pytanie należy do sesji użytkownika).

## 12. Telemetria i metryki sukcesu

### 12.1 KPI produktowe
- D1/D7 retencja.
- Ukończenie pierwszego tieru przez nowych użytkowników.
- Średnia liczba sesji dziennie na aktywnego użytkownika.
- Średnia accuracy i tempo opanowywania słów.
- Odsetek odblokowanych kategorii per użytkownik.

### 12.2 KPI techniczne
- p95 latency endpointów quizowych.
- Błędy 4xx/5xx.
- Liczba przerwanych sesji quizowych.

## 13. Roadmapa

### Faza 1 (MVP)
- Rejestracja/logowanie.
- Katalog 200 kategorii i tierów.
- Quiz 1-z-4 + progres + punkty + odblokowania.
- Dashboard postępów użytkownika.

### Faza 2
- Spaced repetition pełniejsze (harmonogram powtórek).
- Daily streaki, questy, achievementy.
- Tabela rankingowa (opcjonalnie sezonowa).
- Eksport/import własnych paczek słów.

### Faza 3
- Tryb mobilny (PWA lub aplikacja natywna).
- Wymowa audio.
- Personalizacja planu nauki przez model adaptacyjny.

## 14. Ryzyka projektowe i mitigacje
- Ryzyko przeciążenia użytkownika dużą liczbą kategorii -> stopniowe rekomendacje i ścieżki nauki.
- Ryzyko spadku motywacji po błędach -> łagodniejszy system kar + szybkie nagrody.
- Ryzyko złożoności backendu na starcie -> trzymać MVP w prostym REST i ograniczyć liczbę workerów.
- Ryzyko niespójności ekonomii punktów -> eksperymenty A/B po starcie.

## 15. Kryteria akceptacji MVP
- Użytkownik może przejść pełną ścieżkę: rejestracja -> start quizu -> ukończenie tieru -> zdobycie punktów -> odblokowanie nowej kategorii.
- Wyniki i progres są trwałe po wylogowaniu i ponownym logowaniu.
- Reguła 3+ poprawnych odpowiedzi i kara za błędy działa zgodnie z definicją.
- Nieuprawniony użytkownik nie odczyta ani nie zmodyfikuje cudzego progresu.
