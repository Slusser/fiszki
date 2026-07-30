# Faza 1 - Krok 3 (Deploy frontend Netlify) - status wykonania

Data: 2026-07-30
Srodowisko: `dev`
Frontend URL: `https://iridescent-gecko-d55c93.netlify.app/`
Backend URL: `https://fiszki-xv3u.onrender.com`

## 1) Dostepnosc frontendu

- PASS - `GET /` -> `200`
- PASS - `GET /index.html` -> `200`
- PASS - deep link SPA (`/quiz/sessions/test`) -> `200` (redirect fallback dziala).

## 2) Powiazanie frontend -> backend

- PASS - w bundle frontendu jest URL backendu `https://fiszki-xv3u.onrender.com`.
- PASS - placeholder `https://api-dev.example.com` nie wystepuje w live bundle.

## 3) Uwaga krytyczna (CORS)

- FAIL (na aktualnie wdrozonym backendzie) - preflight `OPTIONS` na `/v1/me` z origin Netlify zwraca `404`, brak naglowkow CORS.
- Dzialanie naprawcze wykonane lokalnie:
  - backend `main.ts` zostal rozszerzony o `app.enableCors(...)`,
  - domyslne originy: `http://localhost:4200` i `https://iridescent-gecko-d55c93.netlify.app`,
  - opcja runtime: `FRONTEND_ORIGINS` (lista CSV).
- Wymagany krok operacyjny: redeploy backendu na Render z tym kodem.

## Decyzja

- **Krok 3: WARUNKOWO ZALICZONY** (frontend poprawnie wdrozony),
- **Smoke E2E z przegladarki zablokowany do czasu redeployu backendu z CORS fixem**.
