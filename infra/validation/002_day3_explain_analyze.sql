-- Faza 1 / Dzien 3: EXPLAIN ANALYZE dla krytycznych sciezek.
-- Podmien UUID-y przed uruchomieniem.

-- 1) Pobranie puli pytan.
explain (analyze, buffers, verbose)
with params as (
  select
    '00000000-0000-0000-0000-000000000001'::uuid as v_user_id,
    '00000000-0000-0000-0000-000000000002'::uuid as v_category_id,
    'easy'::text as v_tier
)
select
  w.id,
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

-- 2) Historia sesji usera.
explain (analyze, buffers, verbose)
select id, category_id, tier, started_at, finished_at, score, accuracy, status
from public.quiz_sessions
where user_id = '00000000-0000-0000-0000-000000000001'::uuid
order by started_at desc
limit 20;

-- 3) Historia punktow usera.
explain (analyze, buffers, verbose)
select id, reason, delta, reference_type, reference_id, created_at
from public.points_ledger
where user_id = '00000000-0000-0000-0000-000000000001'::uuid
order by created_at desc
limit 50;
