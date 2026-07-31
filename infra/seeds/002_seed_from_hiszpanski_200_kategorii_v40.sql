-- Faza 1: import pelnego katalogu 200 kategorii (v40)
-- Zrodlo CSV:
--   C:\Users\Jakub\Downloads\Hiszpanski_200_Kategorii-v40.csv
-- Oczekiwany header:
--   Categoria_ES,Categoria_PL,Palabra_ES,Palabra_PL
--
-- Mapowanie do modelu aplikacji:
-- - category_slug  <- Categoria_PL (slugify)
-- - category_name  <- Categoria_PL
-- - source_word    <- Palabra_PL
-- - target_word    <- Palabra_ES
--
-- Progi tierow (kumulatywne):
-- - easy   = pierwsze 10 slow w kategorii
-- - hard   = pierwsze 25 slow w kategorii
-- - expert = pierwsze 50 slow w kategorii
--
-- Wazne:
-- - Skrypt jest idempotentny (upsert po slug i po (category_id,tier,source_word)).
-- - Dla dev zalecany "soft reset aktywnosci": najpierw ustawiamy is_active=false, potem aktywujemy rekordy z CSV.
--
-- Sposob uruchomienia (psql):
-- 1) Uruchom sekcje CREATE TABLE (ponizej).
-- 2) Zaladuj CSV:
--    \copy seed_catalog_v40_staging (categoria_es, categoria_pl, palabra_es, palabra_pl)
--      from 'C:/Users/Jakub/Downloads/Hiszpanski_200_Kategorii-v40.csv'
--      with (format csv, header true, encoding 'UTF8');
-- 3) Uruchom pozostala czesc skryptu.

create extension if not exists unaccent;

create temporary table seed_catalog_v40_staging (
  row_id bigserial primary key,
  categoria_es text not null,
  categoria_pl text not null,
  palabra_es text not null,
  palabra_pl text not null
);

-- 0) Soft reset aktywnosci katalogu (bez kasowania rekordow i bez ruszania user progress).
update public.words set is_active = false;
update public.categories set is_active = false;

with normalized as (
  select
    row_id,
    trim(categoria_es) as categoria_es,
    trim(categoria_pl) as categoria_pl,
    trim(palabra_es) as palabra_es,
    trim(palabra_pl) as palabra_pl,
    regexp_replace(
      regexp_replace(lower(unaccent(trim(categoria_pl))), '[^a-z0-9]+', '_', 'g'),
      '^_+|_+$',
      '',
      'g'
    ) as category_slug
  from seed_catalog_v40_staging
  where trim(categoria_pl) <> ''
    and trim(palabra_es) <> ''
    and trim(palabra_pl) <> ''
),
ranked as (
  select
    n.*,
    row_number() over (partition by n.category_slug order by n.row_id) as word_rank
  from normalized n
  where n.category_slug <> ''
),
top50 as (
  select *
  from ranked
  where word_rank <= 50
),
category_upsert as (
  insert into public.categories (slug, name, unlock_cost, difficulty_weight, is_active)
  select
    t.category_slug,
    min(t.categoria_pl) as name,
    0 as unlock_cost,
    1 as difficulty_weight,
    true as is_active
  from top50 t
  group by t.category_slug
  on conflict (slug) do update
  set
    name = excluded.name,
    is_active = true
  returning id, slug
),
category_map as (
  select id, slug from category_upsert
  union
  select c.id, c.slug
  from public.categories c
  join (select distinct category_slug from top50) s
    on s.category_slug = c.slug
),
tier_rows as (
  -- easy: pierwsze 10 slow
  select
    cm.id as category_id,
    'easy'::text as tier,
    t.palabra_pl as source_word,
    t.palabra_es as target_word,
    t.word_rank as source_rank
  from top50 t
  join category_map cm
    on cm.slug = t.category_slug
  where t.word_rank <= 10

  union all

  -- hard: pierwsze 25 slow
  select
    cm.id as category_id,
    'hard'::text as tier,
    t.palabra_pl as source_word,
    t.palabra_es as target_word,
    t.word_rank as source_rank
  from top50 t
  join category_map cm
    on cm.slug = t.category_slug
  where t.word_rank <= 25

  union all

  -- expert: pierwsze 50 slow
  select
    cm.id as category_id,
    'expert'::text as tier,
    t.palabra_pl as source_word,
    t.palabra_es as target_word,
    t.word_rank as source_rank
  from top50 t
  join category_map cm
    on cm.slug = t.category_slug
  where t.word_rank <= 50
),
dedup_source as (
  select distinct on (category_id, tier, source_word)
    category_id,
    tier,
    source_word,
    target_word,
    source_rank
  from tier_rows
  order by category_id, tier, source_word, source_rank
),
dedup_final as (
  select distinct on (category_id, tier, target_word)
    category_id,
    tier,
    source_word,
    target_word,
    source_rank
  from dedup_source
  order by category_id, tier, target_word, source_rank
),
update_by_target as (
  update public.words w
  set
    source_word = d.source_word,
    target_word = d.target_word,
    is_active = true
  from dedup_final d
  where w.category_id = d.category_id
    and w.tier = d.tier
    and w.target_word = d.target_word
    and w.source_word <> d.source_word
    and not exists (
      select 1
      from public.words w2
      where w2.category_id = d.category_id
        and w2.tier = d.tier
        and w2.source_word = d.source_word
    )
  returning w.id
)
insert into public.words (category_id, tier, source_word, target_word, is_active)
select
  tr.category_id,
  tr.tier,
  tr.source_word,
  tr.target_word,
  true as is_active
from dedup_final tr
where not exists (
  select 1
  from public.words w
  where w.category_id = tr.category_id
    and w.tier = tr.tier
    and w.target_word = tr.target_word
    and w.source_word <> tr.source_word
)
on conflict (category_id, tier, source_word) do update
set
  target_word = excluded.target_word,
  is_active = true;

-- Kontrola po imporcie:
-- Oczekiwane wartosci sa zblizone do:
-- - aktywne kategorie: ~200
-- - aktywne slowa lacznie: ~17000 (tiers kumulatywne 10+25+50, pomniejszone o duplikaty target/source).
