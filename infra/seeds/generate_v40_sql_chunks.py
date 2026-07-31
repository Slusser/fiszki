from __future__ import annotations

import csv
from pathlib import Path


SRC = Path(r"C:\Users\Jakub\Downloads\Hiszpanski_200_Kategorii-v40.csv")
OUT = Path(r"C:\Users\Jakub\Desktop\Taski\fiszki\infra\seeds\generated_v40")
CHUNK_SIZE = 800


def quote_sql(value: str) -> str:
    return "'" + value.replace("'", "''") + "'"


def load_rows() -> list[tuple[str, str, str, str]]:
    rows: list[tuple[str, str, str, str]] = []
    with SRC.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            categoria_es = (row.get("Categoria_ES") or "").strip()
            categoria_pl = (row.get("Categoria_PL") or "").strip()
            palabra_es = (row.get("Palabra_ES") or "").strip()
            palabra_pl = (row.get("Palabra_PL") or "").strip()
            if categoria_es and categoria_pl and palabra_es and palabra_pl:
                rows.append((categoria_es, categoria_pl, palabra_es, palabra_pl))
    return rows


def write_chunks(rows: list[tuple[str, str, str, str]]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    create_sql = """create extension if not exists unaccent;
create table if not exists public.seed_catalog_v40_staging (
  row_id bigserial primary key,
  categoria_es text not null,
  categoria_pl text not null,
  palabra_es text not null,
  palabra_pl text not null
);
truncate table public.seed_catalog_v40_staging;
"""
    (OUT / "000_create_stage.sql").write_text(create_sql, encoding="utf-8")

    for index in range(0, len(rows), CHUNK_SIZE):
        part = rows[index : index + CHUNK_SIZE]
        values_sql = ",\n".join(
            f"({quote_sql(a)},{quote_sql(b)},{quote_sql(c)},{quote_sql(d)})"
            for a, b, c, d in part
        )
        sql = (
            "insert into public.seed_catalog_v40_staging "
            "(categoria_es, categoria_pl, palabra_es, palabra_pl) values\n"
            f"{values_sql};\n"
        )
        (OUT / f"insert_{index // CHUNK_SIZE + 1:03d}.sql").write_text(sql, encoding="utf-8")

    transform_sql = """update public.words set is_active = false;
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
"""
    (OUT / "999_apply_transform.sql").write_text(transform_sql, encoding="utf-8")


def main() -> None:
    rows = load_rows()
    write_chunks(rows)
    files_count = len(list(OUT.glob("*.sql")))
    print(f"rows={len(rows)} files={files_count} output={OUT}")


if __name__ == "__main__":
    main()
