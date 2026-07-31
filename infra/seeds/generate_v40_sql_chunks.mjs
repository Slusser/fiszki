import fs from 'node:fs';
import path from 'node:path';

const src = 'C:/Users/Jakub/Downloads/Hiszpanski_200_Kategorii-v40.csv';
const defaultOutDir = 'C:/Users/Jakub/Desktop/Taski/fiszki/infra/seeds/generated_v40';
const requestedChunk = Number.parseInt(process.argv[2] ?? '', 10);
const chunkSize = Number.isFinite(requestedChunk) && requestedChunk > 0 ? requestedChunk : 800;
const outDir =
  process.argv[3] ?? `C:/Users/Jakub/Desktop/Taski/fiszki/infra/seeds/generated_v40_${chunkSize}`;

const text = fs.readFileSync(src, 'utf8').replace(/^\uFEFF/, '');
const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
const header = lines.shift();
if (!header || !header.includes('Categoria_ES')) {
  throw new Error('Niepoprawny naglowek CSV.');
}

function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((x) => x.trim());
}

function q(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

const rows = [];
for (const line of lines) {
  const [categoriaEs, categoriaPl, palabraEs, palabraPl] = parseCsvLine(line);
  if (categoriaEs && categoriaPl && palabraEs && palabraPl) {
    rows.push([categoriaEs, categoriaPl, palabraEs, palabraPl]);
  }
}

fs.mkdirSync(outDir, { recursive: true });

const createSql = `create extension if not exists unaccent;
create table if not exists public.seed_catalog_v40_staging (
  row_id bigserial primary key,
  categoria_es text not null,
  categoria_pl text not null,
  palabra_es text not null,
  palabra_pl text not null
);
truncate table public.seed_catalog_v40_staging;
`;
fs.writeFileSync(path.join(outDir, '000_create_stage.sql'), createSql, 'utf8');

for (let i = 0; i < rows.length; i += chunkSize) {
  const part = rows.slice(i, i + chunkSize);
  const values = part.map(([a, b, c, d]) => `(${q(a)},${q(b)},${q(c)},${q(d)})`).join(',\n');
  const sql = `insert into public.seed_catalog_v40_staging (categoria_es, categoria_pl, palabra_es, palabra_pl) values\n${values};\n`;
  const fileName = `insert_${String(i / chunkSize + 1).padStart(3, '0')}.sql`;
  fs.writeFileSync(path.join(outDir, fileName), sql, 'utf8');
}

const transformSql = `update public.words set is_active = false;
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
  select
    cm.id as category_id,
    'easy'::text as tier,
    t.palabra_pl as source_word,
    t.palabra_es as target_word,
    t.word_rank as source_rank
  from top50 t join category_map cm on cm.slug = t.category_slug where t.word_rank <= 10
  union all
  select
    cm.id as category_id,
    'hard'::text as tier,
    t.palabra_pl as source_word,
    t.palabra_es as target_word,
    t.word_rank as source_rank
  from top50 t join category_map cm on cm.slug = t.category_slug where t.word_rank <= 25
  union all
  select
    cm.id as category_id,
    'expert'::text as tier,
    t.palabra_pl as source_word,
    t.palabra_es as target_word,
    t.word_rank as source_rank
  from top50 t join category_map cm on cm.slug = t.category_slug where t.word_rank <= 50
),
dedup_tier_rows as (
  select distinct on (category_id, tier, source_word)
    category_id,
    tier,
    source_word,
    target_word
  from tier_rows
  order by category_id, tier, source_word, source_rank
)
insert into public.words (category_id, tier, source_word, target_word, is_active)
select tr.category_id, tr.tier, tr.source_word, tr.target_word, true as is_active
from dedup_tier_rows tr
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
`;
fs.writeFileSync(path.join(outDir, '999_apply_transform.sql'), transformSql, 'utf8');

const files = fs.readdirSync(outDir).filter((name) => name.endsWith('.sql')).length;
console.log(
  `rows=${rows.length} files=${files} chunkSize=${chunkSize} out=${outDir} defaultOutDir=${defaultOutDir}`,
);
