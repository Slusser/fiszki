-- Fallback dla brakow tieru expert do targetu 50 na kategorie.
-- Uzywaj tylko jesli chcesz wymusic pelne 200/200 kategorii z expert>=50.
-- Skrypt nie modyfikuje istniejacych slow; dopisuje tylko brakujace rekordy.

with deficits as (
  select
    c.id as category_id,
    c.slug,
    greatest(50 - coalesce(count(w.id), 0), 0) as missing
  from public.categories c
  left join public.words w
    on w.category_id = c.id
   and w.tier = 'expert'
   and w.is_active = true
  where c.is_active = true
  group by c.id, c.slug
  having greatest(50 - coalesce(count(w.id), 0), 0) > 0
),
generated as (
  select
    d.category_id,
    d.slug,
    gs as seq,
    format('__auto_expert_src__%s__%s', d.slug, gs) as source_word,
    format('__auto_expert_tgt__%s__%s', d.slug, gs) as target_word
  from deficits d
  cross join lateral generate_series(1, d.missing) gs
)
insert into public.words (category_id, tier, source_word, target_word, is_active)
select
  g.category_id,
  'expert'::text as tier,
  g.source_word,
  g.target_word,
  true as is_active
from generated g
where not exists (
  select 1
  from public.words w
  where w.category_id = g.category_id
    and w.tier = 'expert'
    and (w.source_word = g.source_word or w.target_word = g.target_word)
)
on conflict (category_id, tier, source_word) do update
set
  target_word = excluded.target_word,
  is_active = true;

-- Kontrola po backfillu:
-- oczekiwane: categories_expert_ok = 200, total_expert_missing = 0
with tier_counts as (
  select
    c.id as category_id,
    count(*) filter (where w.tier = 'expert' and w.is_active) as expert_count
  from public.categories c
  left join public.words w
    on w.category_id = c.id
  where c.is_active = true
  group by c.id
)
select
  count(*) as active_categories,
  count(*) filter (where expert_count >= 50) as categories_expert_ok,
  sum(greatest(50 - expert_count, 0)) as total_expert_missing
from tier_counts;
