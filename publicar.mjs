#!/usr/bin/env node
/**
 * publicar.mjs — monta o PACOTE que vai para a hospedagem (Cloudflare Pages) na pasta _site/.
 *
 * O repositório guarda tudo (partes/, docs/, ferramentas/); a hospedagem recebe só o pacote.
 *
 *   node publicar.mjs                                          → PRÉVIA: noindex (meta + header), robots fechado
 *   node publicar.mjs --dominio=https://www.primehigienize.com → PRODUÇÃO: sem noindex, canonical/og:url,
 *                                                                 URLs absolutas, robots aberto, sitemap.xml
 *
 * No Cloudflare Pages (integração com o GitHub): build command = `node publicar.mjs` (ou com --dominio),
 * output directory = `_site`. Upload direto: `npx wrangler pages deploy _site --project-name prime-higienize`.
 *
 * Redes de segurança (abortam a publicação):
 *  - nada de docs/, partes/, ferramentas/, *.md, *.ps1, *.mjs (fora de assets/js) dentro do _site
 *  - nenhum JWT com role diferente de "anon" em arquivo de texto (procura a CHAVE, não a palavra)
 *  - todo asset referenciado pelo index.html precisa existir no pacote
 * Node puro, sem dependências.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const SAIDA = path.join(RAIZ, '_site');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const DOMINIO = args.dominio ? String(args.dominio).replace(/\/+$/, '') : '';
const PRODUCAO = !!DOMINIO;
if (PRODUCAO && !/^https:\/\/[a-z0-9.-]+$/i.test(DOMINIO)) { console.error('✗ --dominio precisa ser https://dominio (sem caminho). Recebido:', DOMINIO); process.exit(1); }

const falhas = [], feito = [];
const ler = p => fs.readFileSync(p, 'utf8');

/* 1. index.html sempre fresco */
execFileSync(process.execPath, [path.join(RAIZ, 'montar.mjs')], { stdio: 'inherit' });

/* 2. pasta limpa */
fs.rmSync(SAIDA, { recursive: true, force: true });
fs.mkdirSync(SAIDA, { recursive: true });

/* 3. index.html (prévia ou produção) */
let html = ler(path.join(RAIZ, 'index.html'));
if (PRODUCAO) {
  const antes = html;
  html = html.replace(/^<meta name="robots" content="noindex, nofollow">\r?\n?/m, '');
  html = html.replace(/^<!-- PRÉVIA:[^\n]*\n/m, '');
  html = html.replace('<meta name="theme-color"', `<link rel="canonical" href="${DOMINIO}/">\n<meta property="og:url" content="${DOMINIO}/">\n<meta name="theme-color"`);
  html = html.replace(/(<meta property="og:image" content=")assets\//, `$1${DOMINIO}/assets/`);
  html = html.replace(/(<meta name="twitter:image" content=")assets\//, `$1${DOMINIO}/assets/`);
  html = html.replace(/("image":\s*")assets\//, `$1${DOMINIO}/assets/`);
  html = html.replace(/("logo":\s*")assets\//, `$1${DOMINIO}/assets/`);
  html = html.replace(/("@type": "LocalBusiness",)/, `$1\n  "url": "${DOMINIO}/",`);
  if (/name="robots"/.test(html)) falhas.push('produção: a meta robots noindex continua no index.html');
  if (html === antes) falhas.push('produção: nenhuma troca aplicada no index.html (âncoras mudaram?)');
  feito.push('index.html em modo PRODUÇÃO para ' + DOMINIO);
} else {
  if (!/name="robots" content="noindex/.test(html)) falhas.push('prévia: index.html está SEM a meta noindex');
  feito.push('index.html em modo PRÉVIA (noindex)');
}
fs.writeFileSync(path.join(SAIDA, 'index.html'), html);

/* 4. assets/ inteiro (fontes das seções ficam no repo, não no pacote) */
const copiarPasta = (de, para) => {
  fs.mkdirSync(para, { recursive: true });
  for (const item of fs.readdirSync(de, { withFileTypes: true })) {
    const o = path.join(de, item.name), d = path.join(para, item.name);
    if (item.isDirectory()) copiarPasta(o, d); else fs.copyFileSync(o, d);
  }
};
copiarPasta(path.join(RAIZ, 'assets'), path.join(SAIDA, 'assets'));
feito.push('assets/ copiada');

/* 5. robots.txt + sitemap.xml */
fs.writeFileSync(path.join(SAIDA, 'robots.txt'), PRODUCAO
  ? `User-agent: *\nAllow: /\n\nSitemap: ${DOMINIO}/sitemap.xml\n`
  : 'User-agent: *\nDisallow: /\n');
if (PRODUCAO) {
  const hoje = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(path.join(SAIDA, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${DOMINIO}/</loc><lastmod>${hoje}</lastmod><changefreq>monthly</changefreq><priority>1.0</priority></url>\n</urlset>\n`);
  feito.push('robots.txt aberto + sitemap.xml');
} else feito.push('robots.txt fechado (prévia)');

/* 6. _headers (formato do Cloudflare Pages): segurança + cache */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",                      // boot inline do <head> (marca .js/.anim) e JSON-LD
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data:",                                   // data: = ícone de check do .lista-check em CSS
  "frame-src https://www.instagram.com https://instagram.com", // player oficial dos reels (modal)
  "connect-src 'self'",
  "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');
const headers = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  X-Frame-Options: DENY',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  '  Cross-Origin-Opener-Policy: same-origin',
  '  Strict-Transport-Security: max-age=31536000; includeSubDomains',
  `  Content-Security-Policy: ${csp}`,
  ...(PRODUCAO ? [] : ['  X-Robots-Tag: noindex, nofollow']),
  '/index.html',
  '  Cache-Control: public, max-age=0, must-revalidate',
  '/assets/img/*',
  '  Cache-Control: public, max-age=2592000',
  '/assets/js/vendor/*',
  '  Cache-Control: public, max-age=2592000',
  '/assets/*',
  '  Cache-Control: public, max-age=86400',
  '',
].join('\n');
fs.writeFileSync(path.join(SAIDA, '_headers'), headers);
feito.push('_headers (CSP, HSTS, X-Frame DENY, cache' + (PRODUCAO ? ')' : ', X-Robots-Tag noindex)'));

/* 7. redes de segurança */
const todos = [];
const andar = d => { for (const it of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, it.name); it.isDirectory() ? andar(p) : todos.push(p); } };
andar(SAIDA);
const rel = p => path.relative(SAIDA, p).split(path.sep).join('/');
// 7a. nada de bastidor
for (const p of todos) {
  const r = rel(p);
  if (/^(docs|partes|ferramentas)\//.test(r) || /\.(md|ps1)$/i.test(r) || (/\.mjs$/i.test(r) && !r.startsWith('assets/js/'))) falhas.push('arquivo de bastidor no pacote: ' + r);
}
// 7b. JWT perigoso (decodifica o payload e olha o role; anon é pública por natureza)
const jwtPerigoso = txt => {
  for (const [, payload] of txt.matchAll(/\beyJ[A-Za-z0-9_-]{8,}\.([A-Za-z0-9_-]{20,})\./g)) {
    try { const p = JSON.parse(Buffer.from(payload, 'base64url').toString()); if (p.role && p.role !== 'anon') return p.role; } catch {}
  }
  return null;
};
for (const p of todos) {
  if (!/\.(html|css|js|mjs|txt|xml|json|_headers)$/i.test(p) && !p.endsWith('_headers')) continue;
  const role = jwtPerigoso(ler(p));
  if (role) falhas.push(`JWT com role "${role}" em ${rel(p)}`);
}
// 7c. tudo que o index referencia existe no pacote
const refs = new Set();
for (const m of html.matchAll(/(?:src|href)="(assets\/[^"#?]+)"/g)) refs.add(m[1]);
for (const m of html.matchAll(/url\((?:'|")?(assets\/[^)'"]+)/g)) refs.add(m[1]);
for (const css of todos.filter(p => p.endsWith('.css'))) for (const m of ler(css).matchAll(/url\((?:'|")?(?:\.\.\/)+(img\/[^)'"?#]+)/g)) refs.add('assets/' + m[1]);
for (const r of refs) if (!fs.existsSync(path.join(SAIDA, r))) falhas.push('referenciado e ausente: ' + r);
// 7d. o pacote de PRÉVIA não pode ter canonical de produção; o de PRODUÇÃO precisa dele
if (!PRODUCAO && /rel="canonical"/.test(html)) falhas.push('prévia com canonical');
if (PRODUCAO && !/rel="canonical"/.test(html)) falhas.push('produção sem canonical');

/* 8. relatório */
const tamanho = todos.reduce((s, p) => s + fs.statSync(p).size, 0);
console.log(`\n${PRODUCAO ? '🚀 PRODUÇÃO' : '👀 PRÉVIA'} → _site/ (${todos.length} arquivos, ${(tamanho / 1024 / 1024).toFixed(1)} MB)`);
feito.forEach(f => console.log('  ✓ ' + f));
if (falhas.length) { console.error('\n✗ PUBLICAÇÃO ABORTADA:'); falhas.forEach(f => console.error('  - ' + f)); fs.rmSync(SAIDA, { recursive: true, force: true }); process.exit(1); }
console.log('  ✓ redes: sem bastidor, sem JWT perigoso, ' + refs.size + ' referências conferidas');
