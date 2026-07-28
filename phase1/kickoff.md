# Faza 1 - Kickoff (sesja pytań i decyzji)

## 1. Cel sesji
Ustalić finalny zakres MVP, kontrakty API, model danych oraz decyzje deploymentowe dla Fazy 1, aby zminimalizować ryzyko zmian architektonicznych w trakcie implementacji.

## 2. Analiza założeń (z `phase1_plan.md`, sekcja 1)

### 2.1 Założenie: zakres MVP
Aktualnie zakładamy:
- auth,
- quiz 1-z-4,
- progres tierów,
- punkty,
- odblokowanie kategorii.

Ocena:
- Zakres jest dobry na MVP i spójny z PRD.
- Największe ryzyko to niedookreślone reguły punktacji i progresji (mogą powodować duże zmiany backendu).
- Warto zamrozić reguły ekonomii punktów przed implementacją endpointów `quiz/progression/rewards`.

### 2.2 Założenie: kontrakty API + model danych
Ocena:
- To krytyczny krok i powinien zakończyć się krótką specyfikacją endpointów oraz tabel.
- Najlepiej zdefiniować wersjonowanie API (`/v1`) od początku.
- Konieczne jest wyraźne rozdzielenie danych:
  - statyczny katalog słów/kategorii,
  - dane użytkownika i progres.

### 2.3 Założenie: decyzje deploymentowe
Ocena:
- Decyzje środowiskowe wpływają na auth, CORS, sekrety i CI/CD.
- Na start przyjmujemy jedno środowisko `dev`, żeby szybciej dowieźć MVP i ograniczyć koszt.

## 3. Proponowany zakres kickoff (output sesji)
Po sesji powinny powstać 4 artefakty:
- `MVP Scope Freeze` - lista funkcji in/out.
- `API v1 Draft` - lista endpointów + payloady.
- `Data Model v1` - lista tabel + kluczowe relacje + indeksy.
- `Deployment Decisions v1` - docelowy hosting i pipeline.

## 4. Propozycja API (MVP v1)

### 4.1 Auth
- `POST /v1/auth/register`
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `GET /v1/me`

### 4.2 Katalog i odblokowania
- `GET /v1/catalog/categories`
- `GET /v1/catalog/categories/:categoryId/tiers`
- `POST /v1/catalog/categories/:categoryId/unlock`

### 4.3 Quiz
- `POST /v1/quiz/sessions/start`
- `GET /v1/quiz/sessions/:sessionId/next-question`
- `POST /v1/quiz/sessions/:sessionId/answer`
- `POST /v1/quiz/sessions/:sessionId/finish`

### 4.4 Progres i punkty
- `GET /v1/progress/overview`
- `GET /v1/wallet`
- `GET /v1/wallet/ledger`

## 5. Propozycja modelu danych (MVP v1)

### 5.1 Dane statyczne
- `categories(id, slug, name, unlock_cost, difficulty_weight, is_active)`
- `words(id, category_id, tier, source_word, target_word, distractor_group, is_active)`

### 5.2 Dane użytkownika
- `profiles(user_id, display_name, created_at)`
- `user_category_unlocks(user_id, category_id, unlocked_at)`
- `user_word_progress(user_id, word_id, tier, correct_count, required_correct, wrong_count, mastered, next_review_at, updated_at)`
- `quiz_sessions(id, user_id, category_id, tier, started_at, finished_at, score, accuracy, status)`
- `quiz_answers(id, session_id, word_id, selected_option, is_correct, answered_at)`
- `user_wallet(user_id, points_balance, lifetime_points, updated_at)`
- `points_ledger(id, user_id, reason, delta, reference_type, reference_id, created_at)`

### 5.3 Minimalne indeksy
- `user_word_progress(user_id, tier, mastered)`
- `user_word_progress(user_id, word_id)` (unikat)
- `quiz_sessions(user_id, started_at DESC)`
- `points_ledger(user_id, created_at DESC)`
- `user_category_unlocks(user_id, category_id)` (unikat)

## 6. Decyzje deploymentowe - propozycja startowa

### 6.1 Środowiska
- `dev` (jedyne środowisko na etap Fazy 1).
- Plan rozszerzenia po MVP: dodać `staging`, a następnie `prod`.

### 6.2 Hosting
- Frontend Angular: Netlify (plan darmowy).
- Backend NestJS: Render/Fly/Railway (Docker).
- Baza + Auth: Supabase.

### 6.3 CI/CD
- PR checks: lint + test + build.
- Merge do `main`: deploy na `dev`.
- Migracje DB wykonywane w kontrolowanym kroku pipeline (nie ręcznie z lokalnego środowiska).

### 6.4 Bezpieczeństwo i operacje
- Sekrety tylko w managerze środowiska (nie w repo).
- `service_role` nigdy po stronie frontendu.
- Podstawowy monitoring:
  - API errors,
  - latency endpointów quizowych,
  - procent nieudanych odpowiedzi.

## 7. Pytania doprecyzowujące (do decyzji na kickoffie)

### 7.1 Produkt i zakres
- Decyzja: MVP obejmuje wyłącznie język hiszpański.
- Decyzja: brak resetu postępu kategorii i tieru w Fazie 1.
- Decyzja: ranking użytkowników trafia do Fazy 2.

### 7.2 Reguły nauki i ekonomia
- Decyzja: kara za błąd zwiększa `required_correct` o `+3`.
- Decyzja: obowiązuje sztywny limit kary `max +10` (ponad bazowe wymaganie).
- Decyzja: włączamy anti-grind (malejące nagrody za powtórki).

Sugerowany wzór punktacji (MVP):
- Bazowe punkty za pierwsze ukończenie tieru:
  - Easy: 100
  - Hard: 220
  - Expert: 420
- Bonus accuracy:
  - accuracy >= 95%: +25%
  - accuracy 85-94%: +10%
  - accuracy < 85%: +0%
- Mnożnik anti-grind dla ponownych ukończeń tego samego tieru w oknie 24h:
  - 1. powtórka: x0.40
  - 2. powtórka: x0.20
  - 3+ powtórka: x0.10
- Dzienne ograniczenie anti-grind:
  - max 300 punktów dziennie z powtórek (nie dotyczy pierwszych ukończeń tieru).

### 7.3 API i UX
- Decyzja: na starcie wyłącznie REST (bez GraphQL).
- Decyzja: po błędnej odpowiedzi nie pokazujemy poprawnej odpowiedzi natychmiast.
- Decyzja: limit czasu na pytanie wynosi 30 sekund.

### 7.4 Dane i treść
- Decyzja: słowa będą generowane automatycznie.
- Decyzja: optymalny format wejściowy to `CSV UTF-8` (jeden plik per tier lub jeden plik globalny z kolumną tier) pod szybki import do Postgresa (`COPY`) i prosty pipeline seedowania.
- Proponowany minimalny schemat CSV:
  - `category_slug,tier,source_word,target_word`
- Decyzja: dystraktory losujemy dynamicznie dla każdego pytania:
  - 3 losowe tłumaczenia z pozostałych słów w tym samym tierze (z wykluczeniem bieżącego słowa),
  - bez predefiniowanych aliasów i bez alternatywnych poprawnych form.
- Decyzja: aliasy tłumaczeń nie są obsługiwane w Fazie 1.

### 7.5 Deployment i operacje
- Decyzja: na obecnym etapie nie tworzymy środowiska `staging`.
- Decyzja: bazujemy wyłącznie na środowisku `dev`.
- Decyzja: używamy darmowych planów usług (hosting + baza/auth) na czas Fazy 1.

## 8. Rekomendowane decyzje „na teraz”
- Utrzymać MVP w REST + NestJS + Supabase (bez dodatkowych usług).
- Zamrozić reguły punktacji i progresji przed rozpoczęciem kodowania.
- Utrzymać na starcie wyłącznie środowisko `dev` i przejść na Netlify free dla frontendu.
- Traktować `categories` i `words` jako dane wersjonowane seedem.
- Zakres językowy MVP: tylko hiszpański; ranking odkładamy do Fazy 2.
- Ograniczenia UX/API: tylko REST, brak natychmiastowego ujawniania poprawnej odpowiedzi, 30 s na pytanie.
- Dane słów: generowane automatycznie, format `CSV UTF-8`, dystraktory losowane runtime z tego samego tieru.
- Operacyjnie: bez `staging`, tylko `dev` i darmowe plany do czasu zamknięcia Fazy 1.
