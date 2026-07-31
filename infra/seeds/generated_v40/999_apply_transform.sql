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
  from public.seed_catalog_v40_staging
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
  select cm.id as category_id, 'easy'::text as tier, t.palabra_pl as source_word, t.palabra_es as target_word
  from top50 t join category_map cm on cm.slug = t.category_slug where t.word_rank <= 10
  union all
  select cm.id as category_id, 'hard'::text as tier, t.palabra_pl as source_word, t.palabra_es as target_word
  from top50 t join category_map cm on cm.slug = t.category_slug where t.word_rank <= 25
  union all
  select cm.id as category_id, 'expert'::text as tier, t.palabra_pl as source_word, t.palabra_es as target_word
  from top50 t join category_map cm on cm.slug = t.category_slug where t.word_rank <= 50
)
insert into public.words (category_id, tier, source_word, target_word, is_active)
select tr.category_id, tr.tier, tr.source_word, tr.target_word, true as is_active
from tier_rows tr
on conflict (category_id, tier, source_word) do update
set
  target_word = excluded.target_word,
  is_active = true;

select
  (select count(*) from public.categories where is_active=true) as active_categories,
  (select count(*) from public.words where is_active=true and tier='easy') as active_easy,
  (select count(*) from public.words where is_active=true and tier='hard') as active_hard,
  (select count(*) from public.words where is_active=true and tier='expert') as active_expert,
  (select count(*) from public.words where is_active=true) as active_words_total;
