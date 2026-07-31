create extension if not exists unaccent;
create temporary table seed_catalog_v40_staging (
  row_id bigserial primary key,
  categoria_es text,
  categoria_pl text,
  palabra_es text,
  palabra_pl text
);
