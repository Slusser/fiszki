-- Backfill brakow tierow 10/25/50 z realnych danych staging (bez sztucznych slow).
-- Wymaga zaladowanego `public.seed_catalog_v40_staging`.
-- Skrypt idempotentny: dodaje tylko kandydatow bez konfliktow unikalnosci.

create extension if not exists unaccent;

drop table if exists pg_temp.seed_ranked_v40;
create temporary table seed_ranked_v40 as
with normalized as (
  select
    row_id,
    trim(categoria_pl) as categoria_pl,
    trim(palabra_es) as palabra_es,
    trim(palabra_pl) as palabra_pl,
    regexp_replace(
      regexp_replace(lower(unaccent(trim(categoria_pl))), '[^a-z0-9]+', '_', 'g'),
      '^_+|_+$',
      '',
      'g'
    ) as category_slug
  from public.seed_catalog_v40_staging
  where trim(categoria_pl) <> ''
    and trim(palabra_es) <> ''
    and trim(palabra_pl) <> ''
),
ranked as (
  select
    n.category_slug,
    n.palabra_pl as source_word,
    n.palabra_es as target_word,
    row_number() over (partition by n.category_slug order by n.row_id) as word_rank
  from normalized n
  where n.category_slug <> ''
)
select
  c.id as category_id,
  r.source_word,
  r.target_word,
  r.word_rank
from ranked r
join public.categories c
  on c.slug = r.category_slug
where c.is_active = true;

-- EASY -> target 10 (dobieramy z rank > 10)
with need as (
  select
    c.id as category_id,
    greatest(10 - coalesce(count(w.id), 0), 0) as missing
  from public.categories c
  left join public.words w
    on w.category_id = c.id
   and w.tier = 'easy'
   and w.is_active = true
  where c.is_active = true
  group by c.id
  having greatest(10 - coalesce(count(w.id), 0), 0) > 0
),
candidates_raw as (
  select
    sr.category_id,
    sr.source_word,
    sr.target_word,
    sr.word_rank
  from seed_ranked_v40 sr
  join need n on n.category_id = sr.category_id
  where sr.word_rank > 10
),
candidates_dedup_source as (
  select distinct on (category_id, source_word)
    category_id, source_word, target_word, word_rank
  from candidates_raw
  order by category_id, source_word, word_rank
),
candidates_dedup_target as (
  select distinct on (category_id, target_word)
    category_id, source_word, target_word, word_rank
  from candidates_dedup_source
  order by category_id, target_word, word_rank
),
candidates_no_conflict as (
  select cdt.*
  from candidates_dedup_target cdt
  where not exists (
    select 1
    from public.words w
    where w.category_id = cdt.category_id
      and w.tier = 'easy'
      and w.target_word = cdt.target_word
      and w.source_word <> cdt.source_word
  )
),
picked as (
  select
    cnc.category_id,
    cnc.source_word,
    cnc.target_word,
    row_number() over (partition by cnc.category_id order by cnc.word_rank) as rn
  from candidates_no_conflict cnc
)
insert into public.words (category_id, tier, source_word, target_word, is_active)
select
  p.category_id,
  'easy',
  p.source_word,
  p.target_word,
  true
from picked p
join need n
  on n.category_id = p.category_id
where p.rn <= n.missing
on conflict (category_id, tier, source_word) do update
set
  target_word = excluded.target_word,
  is_active = true;

-- HARD -> target 25 (dobieramy z rank > 25)
with need as (
  select
    c.id as category_id,
    greatest(25 - coalesce(count(w.id), 0), 0) as missing
  from public.categories c
  left join public.words w
    on w.category_id = c.id
   and w.tier = 'hard'
   and w.is_active = true
  where c.is_active = true
  group by c.id
  having greatest(25 - coalesce(count(w.id), 0), 0) > 0
),
candidates_raw as (
  select
    sr.category_id,
    sr.source_word,
    sr.target_word,
    sr.word_rank
  from seed_ranked_v40 sr
  join need n on n.category_id = sr.category_id
  where sr.word_rank > 25
),
candidates_dedup_source as (
  select distinct on (category_id, source_word)
    category_id, source_word, target_word, word_rank
  from candidates_raw
  order by category_id, source_word, word_rank
),
candidates_dedup_target as (
  select distinct on (category_id, target_word)
    category_id, source_word, target_word, word_rank
  from candidates_dedup_source
  order by category_id, target_word, word_rank
),
candidates_no_conflict as (
  select cdt.*
  from candidates_dedup_target cdt
  where not exists (
    select 1
    from public.words w
    where w.category_id = cdt.category_id
      and w.tier = 'hard'
      and w.target_word = cdt.target_word
      and w.source_word <> cdt.source_word
  )
),
picked as (
  select
    cnc.category_id,
    cnc.source_word,
    cnc.target_word,
    row_number() over (partition by cnc.category_id order by cnc.word_rank) as rn
  from candidates_no_conflict cnc
)
insert into public.words (category_id, tier, source_word, target_word, is_active)
select
  p.category_id,
  'hard',
  p.source_word,
  p.target_word,
  true
from picked p
join need n
  on n.category_id = p.category_id
where p.rn <= n.missing
on conflict (category_id, tier, source_word) do update
set
  target_word = excluded.target_word,
  is_active = true;

-- EXPERT -> target 50 (dobieramy z rank > 50)
with need as (
  select
    c.id as category_id,
    greatest(50 - coalesce(count(w.id), 0), 0) as missing
  from public.categories c
  left join public.words w
    on w.category_id = c.id
   and w.tier = 'expert'
   and w.is_active = true
  where c.is_active = true
  group by c.id
  having greatest(50 - coalesce(count(w.id), 0), 0) > 0
),
candidates_raw as (
  select
    sr.category_id,
    sr.source_word,
    sr.target_word,
    sr.word_rank
  from seed_ranked_v40 sr
  join need n on n.category_id = sr.category_id
  where sr.word_rank > 50
),
candidates_dedup_source as (
  select distinct on (category_id, source_word)
    category_id, source_word, target_word, word_rank
  from candidates_raw
  order by category_id, source_word, word_rank
),
candidates_dedup_target as (
  select distinct on (category_id, target_word)
    category_id, source_word, target_word, word_rank
  from candidates_dedup_source
  order by category_id, target_word, word_rank
),
candidates_no_conflict as (
  select cdt.*
  from candidates_dedup_target cdt
  where not exists (
    select 1
    from public.words w
    where w.category_id = cdt.category_id
      and w.tier = 'expert'
      and w.target_word = cdt.target_word
      and w.source_word <> cdt.source_word
  )
),
picked as (
  select
    cnc.category_id,
    cnc.source_word,
    cnc.target_word,
    row_number() over (partition by cnc.category_id order by cnc.word_rank) as rn
  from candidates_no_conflict cnc
)
insert into public.words (category_id, tier, source_word, target_word, is_active)
select
  p.category_id,
  'expert',
  p.source_word,
  p.target_word,
  true
from picked p
join need n
  on n.category_id = p.category_id
where p.rn <= n.missing
on conflict (category_id, tier, source_word) do update
set
  target_word = excluded.target_word,
  is_active = true;
