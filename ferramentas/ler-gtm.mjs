// Lê o container publicado do Google Tag Manager e mostra o que ele dispara de verdade
// (tags, gatilhos e condições) — sem precisar de acesso à conta do GTM.
//   node ferramentas/ler-gtm.mjs            → container da Prime (GTM-PD6F9S38)
//   node ferramentas/ler-gtm.mjs GTM-XXXXX  → outro container
// Confere também se o gatilho de clique no WhatsApp bate com o número real do site.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ID = process.argv[2] || 'GTM-PD6F9S38';
const NUMERO_REAL = '5551994372227'; // wa.me usado em todo o site (docs/DADOS.md)
const r = await fetch(`https://www.googletagmanager.com/gtm.js?id=${ID}`);
const txt = await r.text();
console.log(`gtm.js?id=${ID} → HTTP ${r.status}, ${txt.length} bytes`);
if (r.status !== 200) { console.error('✗ container não publicado ou ID errado'); process.exit(1); }

const i = txt.indexOf('"resource":'), j = txt.indexOf(',"runtime":');
const res = JSON.parse('{' + txt.slice(i, j) + '}').resource;
const curto = (o, n = 260) => { const s = JSON.stringify(o); return s.length > n ? s.slice(0, n) + '…' : s; };
console.log('versão do container:', res.version);
console.log('\n== MACROS (variáveis) =='); res.macros.forEach((m, k) => console.log(k, curto(m, 160)));
console.log('\n== TAGS =='); res.tags.forEach((t, k) => console.log(k, curto(t)));
console.log('\n== PREDICATES (condições) =='); res.predicates.forEach((p, k) => console.log(k, JSON.stringify(p)));
console.log('\n== RULES (gatilho → tags) =='); res.rules.forEach((rg, k) => console.log(k, JSON.stringify(rg)));

// Gatilho de clique no WhatsApp: a condição "_cn" (contém) precisa bater com o número real
const condicoes = res.predicates.filter(p => p.function === '_cn' && /^\d{10,}$/.test(String(p.arg1)));
for (const c of condicoes) {
  const ok = NUMERO_REAL.includes(String(c.arg1));
  console.log(`\n${ok ? '✓' : '✗'} gatilho "contém ${c.arg1}" ${ok ? 'bate' : 'NÃO bate'} com o número real ${NUMERO_REAL}${ok ? '' : ' → a conversão nunca dispara; corrigir o gatilho no GTM (ex.: "contém wa.me")'}`);
}
const salvar = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '_gtm-' + ID + '.js');
fs.writeFileSync(salvar, txt);
console.log('\ncontainer salvo em', path.relative(process.cwd(), salvar), '(ignorado pelo git)');
