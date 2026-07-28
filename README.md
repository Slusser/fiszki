# Fiszki - MVP Monorepo

Monorepo dla MVP aplikacji do nauki slowek:
- `backend/` - API w NestJS
- `frontend/` - aplikacja Angular
- `infra/` - materialy infrastrukturalne (migrations, seeds)

## Wymagania

- Node.js `22.23.1` (patrz `.nvmrc`)
- `pnpm` globalnie (`pnpm -v` powinno zwrocic `10.x`)

## Szybki start lokalnie

1. Zainstaluj zaleznosci:
   - `pnpm --dir backend install`
   - `pnpm --dir frontend install`
2. Uruchom backend:
   - `pnpm --dir backend run start:dev`
3. Uruchom frontend:
   - `pnpm --dir frontend run start`

## Uwaga o Corepack

W tym projekcie uzywaj globalnego `pnpm 10.x`.
`corepack pnpm` moze uruchomic `pnpm 11`, co wprowadza dodatkowe polityki
bezpieczenstwa lockfile i moze blokowac instalacje w lokalnym dev.

## Komendy zbiorcze (root)

Z poziomu katalogu glownego projektu:
- `pnpm run lint:all`
- `pnpm run test:all`
- `pnpm run build:all`

## Struktura katalogow

```text
.
|-- backend/
|-- frontend/
`-- infra/
    |-- migrations/
    `-- seeds/
```
