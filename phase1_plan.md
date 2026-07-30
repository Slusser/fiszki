# Plan wdrożenia Fazy 1 (MVP)

## 1) Kickoff i architektura (1-2 dni)
- Potwierdzenie zakresu MVP: auth, quiz 1-z-4, progres tierów, punkty, odblokowanie kategorii.
- Ustalenie kontraktów API (request/response) i modelu danych.
- Decyzje deploymentowe: hosting API, frontend i Supabase project.

## 2) Setup projektu i CI (1-2 dni)
- Inicjalizacja monorepo: `backend/` (NestJS), `frontend/` (Angular), `infra/` (skrypty seed/migracje).
- Konfiguracja lint/format/test dla obu aplikacji.
- CI pipeline: build + test + lint dla PR.

## 3) Baza danych i Supabase (2-3 dni)
- Tabele MVP: użytkownicy, kategorie, słowa, postęp słów, sesje quizu, odpowiedzi, portfel punktów, ledger.
- RLS policies dla danych użytkownika.
- Seed statycznych danych: 200 kategorii, po 50 słów na kategorię (tiery 10/25/50).
- Indeksy pod ścieżki quizowe (`user_id`, `tier`, `mastered`, `category_id`).

## 4) Backend NestJS (4-6 dni)
- Moduły: `auth`, `catalog`, `quiz`, `progression`, `rewards`, `users`.
- Endpointy MVP z PRD (`/auth`, `/catalog`, `/quiz`, `/progress`, `/wallet`).
- Silnik reguł:
  - 3 poprawne = opanowane,
  - błąd podnosi `required_correct` (z limitem),
  - ukończenie tieru -> nagroda punktowa.
- Rate limiting + walidacja integralności sesji quizowej.

## 5) Frontend Angular (4-6 dni)
- Ekrany: logowanie/rejestracja, lista kategorii, ekran quizu, podsumowanie sesji, postęp, wallet.
- Guards dla blokad tierów/kategorii.
- UX sesji quizowej (next question, feedback, licznik postępu).

## 6) Grywalizacja i ekonomia punktów (1-2 dni)
- Implementacja odblokowań: startowe 10 kategorii + koszty punktowe.
- Podstawowy balans nagród za tier i accuracy.
- Audit points przez ledger (traceability).

## 7) Testy i hardening (2-3 dni)
- Testy backend: reguły quizu, progresja, odblokowania.
- Testy E2E krytycznej ścieżki:
  - rejestracja -> quiz -> ukończenie tieru -> punkty -> unlock kategorii.
- Testy wydajności endpointów quizowych (cel p95 < 300 ms).

## 8) Release MVP (1 dzień)
- Deploy frontend + backend + konfiguracja środowisk.
- Smoke test na produkcji.
- Monitoring błędów i podstawowe dashboardy KPI.

## Proponowany harmonogram
- Sprint 1: punkty 1-3 (setup + DB + seed + RLS).
- Sprint 2: punkt 4 (backend core).
- Sprint 3: punkty 5-6 (frontend + grywalizacja).
- Sprint 4: punkty 7-8 (testy + release).

## Definition of Done (Faza 1)
- Działa pełny flow MVP z `prd_proj.md`.
- Dane progresu są trwałe i odseparowane per user.
- Reguły quizu/progresji działają zgodnie ze specyfikacją.
- Użytkownik może odblokować nową kategorię punktami.
- CI przechodzi, a aplikacja jest wdrożona i monitorowana.
