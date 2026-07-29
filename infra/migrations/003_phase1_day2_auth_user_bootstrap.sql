-- Faza 1 / Dzien 2: bootstrap rekordu user-centric po insercie do auth.users.
-- Zgodnie z decyzja: profile tworzone triggerem.
-- Funkcja SECURITY DEFINER umieszczona poza schema public.

create schema if not exists private;

create or replace function private.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (user_id) do nothing;

  insert into public.user_wallet (user_id, points_balance, lifetime_points)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure private.handle_auth_user_created();
