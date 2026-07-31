import fs from 'node:fs';

const srcPath = 'C:/Users/Jakub/Downloads/Hiszpanski_200_Kategorii-v40.csv';
const outPath = 'C:/Users/Jakub/Desktop/Taski/fiszki/infra/seeds/Hiszpanski_200_Kategorii-v40.clean.csv';

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

function quoteCsv(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

const raw = fs.readFileSync(srcPath, 'utf8').replace(/^\uFEFF/, '');
const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
const header = lines.shift();
if (!header) {
  throw new Error('Pusty plik CSV.');
}

const out = [];
out.push('categoria_es,categoria_pl,palabra_es,palabra_pl');

let accepted = 0;
let skipped = 0;
for (const line of lines) {
  const cols = parseCsvLine(line);
  if (cols.length !== 4) {
    skipped += 1;
    continue;
  }
  const [categoriaEs, categoriaPl, palabraEs, palabraPl] = cols;
  if (!categoriaEs || !categoriaPl || !palabraEs || !palabraPl) {
    skipped += 1;
    continue;
  }
  out.push(
    [
      quoteCsv(categoriaEs),
      quoteCsv(categoriaPl),
      quoteCsv(palabraEs),
      quoteCsv(palabraPl),
    ].join(','),
  );
  accepted += 1;
}

fs.writeFileSync(outPath, `${out.join('\n')}\n`, 'utf8');
console.log(`accepted=${accepted} skipped=${skipped} out=${outPath}`);
