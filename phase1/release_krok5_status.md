# Faza 1 - Krok 5 (Monitoring i KPI) - status wykonania

Data: 2026-07-30
Srodowisko: `dev`
Frontend URL: `https://iridescent-gecko-d55c93.netlify.app/`
Backend URL: `https://fiszki-xv3u.onrender.com`

## 1) Monitoring techniczny

- PASS - backend health i readiness sa dostepne (`/v1/health/`, `/v1/health/ready`).
- PASS - readiness pokazuje realny status zaleznosci:
  - `app=ok`,
  - `database=ok`,
  - `supabase=ok`.
- PASS - CORS dla originu Netlify jest aktywny (preflight `OPTIONS` zwraca `204`).

## 2) KPI produktowe (snapshot Day 0)

Na podstawie danych z bazy (`public.quiz_sessions`, `public.points_ledger`, `public.user_category_unlocks`):

- `started_sessions`: `5`
- `finished_sessions`: `5`
- `avg_accuracy`: `78.00`
- `category_unlocks`: `1`
- `points_today`: `440`
- `quiz_reward_entries`: `3`

## 3) Spojnosc danych rewards

- PASS - `wallet_ledger_mismatched_users = 0` (saldo wallet zgodne z suma ledger per user).
- PASS - rewardy sesyjne sa zapisywane z poprawnymi powodami (`tier_completed`, `tier_completed_repeat`).

## 4) Advisors (Supabase)

- WARN (security): `auth_leaked_password_protection` - Leaked Password Protection w Auth jest wylaczone.
  - Remediation: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
- INFO (performance): `unused_index` - `idx_user_category_unlocks_category_id` nieuzywany.
  - Remediation: https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index

## Decyzja

- **Krok 5: ZALICZONY** (monitoring minimalny i KPI dzialaja),
- **Follow-up rekomendowany**:
  1. wlaczyc Leaked Password Protection w Supabase Auth,
  2. zostawic lub usunac nieuzywany indeks po tygodniu obserwacji ruchu.
