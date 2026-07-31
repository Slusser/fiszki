create extension if not exists unaccent;
create table if not exists public.seed_catalog_v40_staging (
  row_id bigserial primary key,
  categoria_es text not null,
  categoria_pl text not null,
  palabra_es text not null,
  palabra_pl text not null
);
truncate table public.seed_catalog_v40_staging;
