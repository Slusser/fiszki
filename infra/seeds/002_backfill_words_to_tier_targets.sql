-- Faza 1 / Release readiness: dopelnienie puli slow do modelu 10/25/50.
-- Skrypt idempotentny: dopisuje tylko brakujace rekordy.
-- Dla kazdej kategorii zapewnia:
--   easy   -> 10 slow
--   hard   -> 25 slow
--   expert -> 50 slow

with targets(tier, target_cnt) as (
  values ('easy'::text, 10), ('hard'::text, 25), ('expert'::text, 50)
),
current_counts as (
  select
    c.id as category_id,
    c.slug,
    t.tier,
    t.target_cnt,
    coalesce(count(w.id), 0)::int as current_cnt
  from public.categories c
  cross join targets t
  left join public.words w
    on w.category_id = c.id
   and w.tier = t.tier
  group by c.id, c.slug, t.tier, t.target_cnt
),
missing as (
  select
    category_id,
    slug,
    tier,
    generate_series(1, greatest(target_cnt - current_cnt, 0)) as seq
  from current_counts
)
insert into public.words (category_id, tier, source_word, target_word, is_active)
select
  m.category_id,
  m.tier,
  format('auto_%s_%s_src_%s', m.slug, m.tier, m.seq),
  format('auto_%s_%s_tgt_%s', m.slug, m.tier, m.seq),
  true
from missing m
on conflict (category_id, tier, source_word) do nothing;
