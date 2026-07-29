-- Faza 1 / Dzien 3: walidacja krytycznych zapytan.
-- Uruchamiaj po podaniu rzeczywistych UUID uzytkownika i kategorii.

-- 0) Parametry sesji testowej (podmien wartosci).
-- select
--   '00000000-0000-0000-0000-000000000001'::uuid as v_user_id,
--   '00000000-0000-0000-0000-000000000002'::uuid as v_category_id,
--   'easy'::text as v_tier;

-- 1) Pula pytan dla (user_id, category_id, tier) z pominieciem opanowanych slow.
-- Uwaga: LEFT JOIN do progresu i filtrowanie po mastered=false lub null.
with params as (
  select
    '00000000-0000-0000-0000-000000000001'::uuid as v_user_id,
    '00000000-0000-0000-0000-000000000002'::uuid as v_category_id,
    'easy'::text as v_tier
)
select
  w.id as word_id,
  w.source_word,
  w.target_word
from public.words w
cross join params p
left join public.user_word_progress uwp
  on uwp.word_id = w.id
 and uwp.user_id = p.v_user_id
 and uwp.tier = p.v_tier
where w.category_id = p.v_category_id
  and w.tier = p.v_tier
  and w.is_active = true
  and coalesce(uwp.mastered, false) = false
order by random()
limit 20;

-- 2) Zapis odpowiedzi + aktualizacja progresu (MVP, jedna odpowiedz).
-- Ten blok symuluje backendowy flow transakcyjny.
begin;

with params as (
  select
    '00000000-0000-0000-0000-000000000001'::uuid as v_user_id,
    '00000000-0000-0000-0000-000000000002'::uuid as v_category_id,
    'easy'::text as v_tier
),
session_insert as (
  insert into public.quiz_sessions (user_id, category_id, tier, status)
  select v_user_id, v_category_id, v_tier, 'in_progress'
  from params
  returning id, user_id, tier
),
question_pick as (
  select w.id as word_id, s.id as session_id, s.user_id, s.tier
  from session_insert s
  join public.words w on w.category_id = (select v_category_id from params)
                    and w.tier = (select v_tier from params)
                    and w.is_active = true
  order by random()
  limit 1
),
answer_insert as (
  insert into public.quiz_answers (session_id, word_id, selected_option, is_correct)
  select q.session_id, q.word_id, 'mock_answer', false
  from question_pick q
  returning session_id, word_id, is_correct
),
progress_upsert as (
  insert into public.user_word_progress (
    user_id,
    word_id,
    tier,
    correct_count,
    required_correct,
    wrong_count,
    mastered
  )
  select
    q.user_id,
    q.word_id,
    q.tier,
    0,
    6, -- bazowe 3 + kara +3 po bledzie
    1,
    false
  from question_pick q
  on conflict (user_id, word_id, tier)
  do update set
    wrong_count = public.user_word_progress.wrong_count + 1,
    required_correct = least(13, public.user_word_progress.required_correct + 3),
    mastered = false,
    updated_at = now()
  returning user_id, word_id, tier, correct_count, wrong_count, required_correct, mastered
)
select * from progress_upsert;

-- rollback zostawia baze bez zmian po tescie.
rollback;

-- 3) Naliczenie punktow i wpis do points_ledger (symulacja transakcji backendu).
begin;

with params as (
  select
    '00000000-0000-0000-0000-000000000001'::uuid as v_user_id,
    100::integer as v_delta_points,
    'tier_completion'::text as v_reason
),
wallet_upsert as (
  insert into public.user_wallet (user_id, points_balance, lifetime_points, updated_at)
  select v_user_id, v_delta_points, v_delta_points, now()
  from params
  on conflict (user_id)
  do update set
    points_balance = public.user_wallet.points_balance + excluded.points_balance,
    lifetime_points = public.user_wallet.lifetime_points + excluded.lifetime_points,
    updated_at = now()
  returning user_id, points_balance, lifetime_points
),
ledger_insert as (
  insert into public.points_ledger (user_id, reason, delta, reference_type, reference_id)
  select
    p.v_user_id,
    p.v_reason,
    p.v_delta_points,
    'quiz_session',
    null
  from params p
  returning id, user_id, reason, delta, created_at
)
select
  (select row_to_json(w) from wallet_upsert w) as wallet_after,
  (select row_to_json(l) from ledger_insert l) as ledger_entry;

rollback;
