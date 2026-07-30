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

## 3) CORS (frontend -> backend)

- PASS - preflight `OPTIONS /v1/me` z origin Netlify zwraca `204`.
- PASS - backend zwraca `access-control-allow-origin: https://iridescent-gecko-d55c93.netlify.app`.
- PASS - backend zwraca oczekiwane metody i naglowki CORS (`GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS`, `Content-Type,Authorization`).
- INFO - CORS jest konfigurowany przez `app.enableCors(...)` w `backend/src/main.ts` z opcja `FRONTEND_ORIGINS` (CSV).

## Decyzja

- **Krok 3: ZALICZONY**.
