# Faza 1 - Release MVP (1 dzień)

## 1. Cel
Przeprowadzić bezpieczny release MVP do środowiska `dev` (jedyne aktywne środowisko), potwierdzić działanie pełnego flow aplikacji po deployu i uruchomić minimalny monitoring błędów oraz KPI.

## 2. Założenia wejściowe
- Brak środowiska `staging` i `prod` na tym etapie.
- Frontend: Netlify Free.
- Backend: deployment w modelu free-tier.
- Baza i auth: Supabase (`public` schema, RLS aktywne).
- Testy backend i frontend przechodzą przed releasem.

## 3. Zakres release
- Deploy frontend + backend + konfiguracja zmiennych środowiskowych.
- Smoke test pełnej ścieżki użytkownika po wdrożeniu.
- Monitoring błędów i podstawowe dashboardy KPI.
- Krótka procedura rollback/recovery dla `dev`.

## 4. Plan wykonania (1 dzień)

## Krok 1 - Release readiness (przed deployem)
1. Potwierdzić zielone CI (`lint`, `test`, `build`).
2. Potwierdzić aktualne migracje i seed dla modelu `10/25/50`.
3. Sprawdzić komplet env varów:
   - frontend: URL backendu, Supabase URL, publishable key,
   - backend: URL bazy, sekrety serwisowe, konfiguracja auth/JWT.
4. Zamrozić release commit/branch (bez dodatkowych zmian w trakcie wdrożenia).

## Krok 2 - Deploy backend
1. Wykonać deploy backendu na wybranym hostingu.
2. Zweryfikować health endpoint (`/health`, `/ready`).
3. Sprawdzić logi startupowe:
   - brak błędów połączenia z DB,
   - brak błędów konfiguracji auth,
   - poprawny start modułów.

## Krok 3 - Deploy frontend (Netlify)
1. Wdrożyć aktualny build Angular.
2. Potwierdzić poprawne env vars na Netlify.
3. Potwierdzić SPA redirect (`/* -> /index.html`).
4. Zweryfikować, że frontend używa aktualnego backend URL.

## Krok 4 - Smoke test po deployu
1. Auth:
   - rejestracja/logowanie przez Supabase Auth,
   - poprawna autoryzacja żądań backendu (JWT).
2. Quiz flow:
   - wejście do odblokowanej kategorii i tieru,
   - start sesji, odpowiedzi, timeout 30 s,
   - zakończenie sesji po wyczerpaniu puli.
3. Rewards/unlock:
   - naliczenie punktów po `finish`,
   - wpisy w ledgerze,
   - odblokowanie kategorii przy wystarczającym saldzie.
4. Sesja:
   - odświeżenie strony i kontynuacja aktywnej sesji.

## Krok 5 - Monitoring i KPI
1. Błędy techniczne:
   - 4xx/5xx backend,
   - nieudane requesty frontendowe,
   - błędy auth i timeouty quizu.
2. KPI produktowe (minimum):
   - liczba rozpoczętych sesji,
   - liczba ukończonych sesji,
   - średnia accuracy,
   - liczba odblokowań kategorii,
   - dzienne naliczone punkty.
3. Spisać raport "Release Day 0":
   - co wdrożono,
   - wynik smoke testu,
   - otwarte problemy i priorytety poprawek.

## 5. Backlog zadań (release checklist)
- Zweryfikować checklistę "ready for deploy".
- Wykonać deploy backendu i potwierdzić health.
- Wykonać deploy frontendu na Netlify.
- Przeprowadzić smoke test pełnego flow MVP.
- Zweryfikować spójność `wallet` i `points_ledger`.
- Uruchomić monitoring błędów i podstawowe KPI.
- Spisać notatkę release + lista follow-up fixów.

## 6. Kryteria ukończenia (Definition of Done)
- Frontend i backend są dostępne i działają po deployu.
- Krytyczna ścieżka użytkownika przechodzi end-to-end.
- Reguły quizu/rewardów/unlock działają zgodnie z założeniami.
- Monitoring błędów i KPI działa i zbiera dane.
- Istnieje krótka procedura rollback/recovery na wypadek awarii.

## 7. Ryzyka i mitigacje
- Ryzyko błędnych env varów:
  - mitigation: checklista konfiguracji + health check po deployu.
- Ryzyko niespójności po migracji/seedzie:
  - mitigation: testy walidacyjne SQL + smoke test funkcjonalny.
- Ryzyko limitów free-tier (host/baza):
  - mitigation: monitoring użycia i fallback plan (restart/redeploy).
- Ryzyko braku staging:
  - mitigation: małe, kontrolowane wdrożenia i szybki rollback.

## 8. Minimalny plan rollback/recovery (dev)
- Frontend: rollback do poprzedniego udanego deployu w Netlify.
- Backend: redeploy poprzedniego stabilnego commita/obrazu.
- Baza:
  - jeśli problem logiczny danych: odtworzyć z backupu lub wykonać reset + reseed (zaakceptowane w `dev`),
  - jeśli problem migracji: migration fix-forward.

## 9. Pytania doprecyzowujące
- Jaki hosting backendu wybieramy finalnie na release day (`Render`, `Fly`, `Railway`)?
- Czy release wykonujemy bezpośrednio z brancha `dev`, czy przez tag/release branch?
- Czy smoke test ma być manualny checklistą, czy częściowo automatyczny skryptem?
- Czy chcesz alerty e-mail na błędy krytyczne już w Fazie 1, czy na razie tylko dashboard?
- Jak często mamy przeglądać KPI po release (np. co 24h przez pierwszy tydzień)?
