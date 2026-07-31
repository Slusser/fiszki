-- Raport pokrycia danych po seedzie v40.
-- Cel: wykryc kategorie, ktore po deduplikacji nie osiagaja progow tierow 10/25/50.

with tier_counts as (
  select
    c.id as category_id,
    c.slug,
    c.name,
    count(*) filter (where w.tier = 'easy' and w.is_active) as easy_count,
    count(*) filter (where w.tier = 'hard' and w.is_active) as hard_count,
    count(*) filter (where w.tier = 'expert' and w.is_active) as expert_count
  from public.categories c
  left join public.words w
    on w.category_id = c.id
  where c.is_active = true
  group by c.id, c.slug, c.name
),
deficits as (
  select
    slug,
    name,
    easy_count,
    hard_count,
    expert_count,
    greatest(10 - easy_count, 0) as easy_missing,
    greatest(25 - hard_count, 0) as hard_missing,
    greatest(50 - expert_count, 0) as expert_missing
  from tier_counts
)
select
  slug,
  name,
  easy_count,
  hard_count,
  expert_count,
  easy_missing,
  hard_missing,
  expert_missing
from deficits
where easy_missing > 0 or hard_missing > 0 or expert_missing > 0
order by (easy_missing + hard_missing + expert_missing) desc, slug;

-- Globalne podsumowanie pokrycia.
with tier_counts as (
  select
    c.id as category_id,
    count(*) filter (where w.tier = 'easy' and w.is_active) as easy_count,
    count(*) filter (where w.tier = 'hard' and w.is_active) as hard_count,
    count(*) filter (where w.tier = 'expert' and w.is_active) as expert_count
  from public.categories c
  left join public.words w
    on w.category_id = c.id
  where c.is_active = true
  group by c.id
)
select
  count(*) as active_categories,
  count(*) filter (where easy_count >= 10) as categories_easy_ok,
  count(*) filter (where hard_count >= 25) as categories_hard_ok,
  count(*) filter (where expert_count >= 50) as categories_expert_ok,
  sum(greatest(10 - easy_count, 0)) as total_easy_missing,
  sum(greatest(25 - hard_count, 0)) as total_hard_missing,
  sum(greatest(50 - expert_count, 0)) as total_expert_missing
from tier_counts;
