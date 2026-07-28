# Fiszki - MVP Monorepo

Monorepo dla MVP aplikacji do nauki slowek:
- `backend/` - API w NestJS
- `frontend/` - aplikacja Angular
- `infra/` - materialy infrastrukturalne (migrations, seeds)

## Wymagania

- Node.js `22 LTS`
- `pnpm` (uruchamiany przez `npx pnpm@10`)

## Szybki start lokalnie

1. Zainstaluj zaleznosci:
   - `npx -y pnpm@10 --dir backend install`
   - `npx -y pnpm@10 --dir frontend install`
2. Uruchom backend:
   - `npx -y pnpm@10 --dir backend run start:dev`
3. Uruchom frontend:
   - `npx -y pnpm@10 --dir frontend run start`

## Znany problem na Windows (Corepack)

Przy komendzie `corepack pnpm ...` moze pojawic sie blad:
`ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING`.
W takim przypadku uzyj komend z `npx pnpm@10` powyzej.

## Struktura katalogow

```text
.
|-- backend/
|-- frontend/
`-- infra/
    |-- migrations/
    `-- seeds/
```
