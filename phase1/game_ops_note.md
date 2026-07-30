# Notatka operacyjna - diagnoza rozjazdu salda

## Szybka checklista
- Sprawdź ostatnie wpisy w `points_ledger` dla `user_id` (powody: `tier_completed`, `tier_completed_repeat`, `category_unlock`).
- Zweryfikuj, czy suma `delta` z ledgera zgadza się z `user_wallet.points_balance`.
- Dla rewardów z quizu sprawdź `reference_type = 'quiz_session'` i `reference_id = session_id`.
- Dla unlocków sprawdź `reference_type = 'category'` i `reference_id = category_id`.

## Typowe scenariusze
- **Podwójny reward za sesję**: sprawdź, czy istnieje więcej niż jeden wpis ledgera dla tego samego `session_id`.
- **Brak punktów po unlocku**: sprawdź wpis `category_unlock` z ujemnym `delta` i zgodność z `unlock_cost`.
- **Cap anti-grind**: dla rewardów repeat porównaj `repeatPointsToday` z limitem `300`.

## Zapytania pomocnicze
```sql
-- Ostatnie operacje punktowe użytkownika
select reason, delta, reference_type, reference_id, created_at
from public.points_ledger
where user_id = $1
order by created_at desc
limit 100;
```

```sql
-- Kontrola spójności wallet vs ledger
select
  uw.user_id,
  uw.points_balance,
  coalesce(sum(pl.delta), 0) as ledger_balance
from public.user_wallet uw
left join public.points_ledger pl on pl.user_id = uw.user_id
where uw.user_id = $1
group by uw.user_id, uw.points_balance;
```
