# Performance testy quizu (k6)

Skrypt `quiz-flow.k6.js` mierzy opóźnienia endpointów:

- `POST /v1/quiz/sessions/start`
- `GET /v1/quiz/sessions/:sessionId/next-question`
- `POST /v1/quiz/sessions/:sessionId/answer`
- `POST /v1/quiz/sessions/:sessionId/finish`

## Scenariusze

- `1 user` (smoke)
- `10 users` (burst)
- `50 users` (burst)

## Progi (thresholds)

- `p95 < 300 ms` dla `start/next-question/answer/finish`
- `error rate < 1%`

## Uruchomienie

Wymagane: zainstalowany `k6` i uruchomiony backend.

Przykladowe uruchomienie (PowerShell):

```powershell
$env:BASE_URL="http://localhost:3000/v1"
$env:AUTH_TOKEN="twoj_jwt"
$env:CATEGORY_ID="00000000-0000-4000-8000-000000000001"
npm run perf:quiz:report
```

Wynik zbiorczy zapisuje sie do `perf/quiz-summary.json`.
