-- Faza 1 / Dzien 2: seed CSV UTF-8 -> Postgres (idempotentny).
-- Oczekiwany format CSV: category_slug,tier,source_word,target_word
--
-- Sposob (psql):
-- 1) Uruchom do linii CREATE TABLE (ponizej), aby utworzyc staging.
-- 2) Zaladuj CSV:
--    \copy seed_words_staging (category_slug, tier, source_word, target_word)
--      from 'infra/seeds/words_es.csv' with (format csv, header true, encoding 'UTF8');
-- 3) Uruchom pozostala czesc skryptu (upsert kategorii + slow).

create temporary table seed_words_staging (
  category_slug text not null,
  tier text not null,
  source_word text not null,
  target_word text not null
);

-- 1) Kategorie: idempotentny upsert po slug.
insert into public.categories (slug, name, unlock_cost, difficulty_weight, is_active)
select
  s.category_slug as slug,
  initcap(replace(s.category_slug, '_', ' ')) as name,
  0 as unlock_cost,
  1 as difficulty_weight,
  true as is_active
from seed_words_staging s
group by s.category_slug
on conflict (slug) do update
set
  name = excluded.name,
  is_active = true;

-- 2) Slowa: mapowanie category_slug -> category_id + upsert po kluczu logicznym.
insert into public.words (category_id, tier, source_word, target_word, is_active)
select
  c.id as category_id,
  s.tier,
  s.source_word,
  s.target_word,
  true as is_active
from seed_words_staging s
join public.categories c
  on c.slug = s.category_slug
where s.tier in ('easy', 'hard', 'expert')
on conflict (category_id, tier, source_word) do update
set
  target_word = excluded.target_word,
  is_active = true;
