#!/usr/bin/env node
/**
 * montar.mjs — gera o index.html a partir de partes/_molde.html + partes/NN-nome.html
 *
 *   node montar.mjs                                  → index.html com todas as partes
 *   node montar.mjs --so=30,40 --saida=index.teste-30.html
 *                                                    → só as partes 30 e 40 (testar isolado; apagar depois)
 *
 * Regras (contrato do projeto):
 *  - partes/_molde.html tem os marcadores <!-- @estilos-secoes -->, <!-- @secoes --> e <!-- @scripts-secoes -->
 *  - cada partes/NN-nome.html é UMA <section id="..."> completa; ordem pelo prefixo numérico
 *  - assets/css/secoes/NN-nome.css  → <link rel="stylesheet"> (mesmo nome-base da parte)
 *  - assets/js/secoes/NN-nome.js    → <script defer>
 *  - assets/js/secoes/NN-nome.module.js → <script type="module"> (para importar 'three' pelo importmap)
 * Node puro, sem dependências.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PARTES = path.join(RAIZ, 'partes');
const CSS_DIR = path.join(RAIZ, 'assets', 'css', 'secoes');
const JS_DIR = path.join(RAIZ, 'assets', 'js', 'secoes');

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const SAIDA = path.resolve(RAIZ, String(args.saida || 'index.html'));

const prefixo = f => /^(\d+)-/.exec(f)?.[1] ?? '';
const numero = f => parseInt(prefixo(f), 10) || 0;
const existe = p => fs.existsSync(p);

// 1. molde
const caminhoMolde = path.join(PARTES, '_molde.html');
if (!existe(caminhoMolde)) { console.error('✗ partes/_molde.html não encontrado'); process.exit(1); }
let html = fs.readFileSync(caminhoMolde, 'utf8');
for (const marcador of ['<!-- @estilos-secoes -->', '<!-- @secoes -->', '<!-- @scripts-secoes -->']) {
  if (!html.includes(marcador)) { console.error(`✗ marcador ${marcador} não está no molde`); process.exit(1); }
}

// 2. partes, ordenadas pelo prefixo numérico (desempate alfabético)
let arquivos = fs.readdirSync(PARTES)
  .filter(f => /^\d+-.+\.html$/i.test(f))
  .sort((a, b) => numero(a) - numero(b) || a.localeCompare(b, 'pt-BR'));

if (args.so) {
  const pedidos = String(args.so).split(',').map(s => s.trim()).filter(Boolean);
  arquivos = arquivos.filter(f => pedidos.some(p => parseInt(p, 10) === numero(f)));
  const faltando = pedidos.filter(p => !arquivos.some(f => parseInt(p, 10) === numero(f)));
  if (faltando.length) console.warn(`! partes pedidas em --so sem arquivo: ${faltando.join(', ')}`);
}
if (!arquivos.length) console.warn('! nenhuma parte encontrada em partes/ — montando só o molde');

// 3. injeção
const estilos = [], secoes = [], scripts = [], resumo = [];
for (const arquivo of arquivos) {
  const nome = arquivo.replace(/\.html$/i, '');
  const conteudo = fs.readFileSync(path.join(PARTES, arquivo), 'utf8').trim();
  const idSec = /<section\b[^>]*\bid="([^"]+)"/i.exec(conteudo)?.[1];
  if (!idSec) console.warn(`! ${arquivo}: não achei <section id="..."> — cada parte deve ser uma seção completa`);
  const qtdSecoes = (conteudo.match(/<section\b/gi) || []).length;
  if (qtdSecoes > 1) console.warn(`! ${arquivo}: tem ${qtdSecoes} <section> — o contrato é UMA por parte`);
  secoes.push(`<!-- ===== ${nome} ===== -->\n${conteudo}\n`);

  const css = `assets/css/secoes/${nome}.css`;
  const temCss = existe(path.join(RAIZ, css));
  if (temCss) estilos.push(`<link rel="stylesheet" href="${css}">`);

  const jsModulo = `assets/js/secoes/${nome}.module.js`;
  const jsComum = `assets/js/secoes/${nome}.js`;
  let js = '-';
  if (existe(path.join(RAIZ, jsModulo))) { scripts.push(`<script type="module" src="${jsModulo}"></script>`); js = 'module'; }
  else if (existe(path.join(RAIZ, jsComum))) { scripts.push(`<script defer src="${jsComum}"></script>`); js = 'defer'; }

  resumo.push(`  ${nome.padEnd(22)} id=#${(idSec || '?').padEnd(14)} css=${temCss ? 'sim' : '-'}  js=${js}`);
}

// avisa arquivos órfãos (css/js sem parte correspondente) para ninguém perder trabalho em silêncio
const nomes = new Set(arquivos.map(f => f.replace(/\.html$/i, '')));
const orfaos = [];
if (!args.so) {
  if (existe(CSS_DIR)) for (const f of fs.readdirSync(CSS_DIR)) if (/\.css$/i.test(f) && !nomes.has(f.replace(/\.css$/i, ''))) orfaos.push(`assets/css/secoes/${f}`);
  if (existe(JS_DIR)) for (const f of fs.readdirSync(JS_DIR)) if (/\.js$/i.test(f) && !nomes.has(f.replace(/(\.module)?\.js$/i, ''))) orfaos.push(`assets/js/secoes/${f}`);
}

// substituto em função: um "$&", "$'" ou "R$$" dentro de uma parte NÃO é interpretado como padrão do replace
const literal = texto => () => texto;
html = html
  .replace('<!-- @estilos-secoes -->', literal(estilos.join('\n')))
  .replace('<!-- @secoes -->', literal(secoes.join('\n')))
  .replace('<!-- @scripts-secoes -->', literal(scripts.join('\n')))
  .replace(/<!DOCTYPE html>\s*/i, literal('<!DOCTYPE html>\n<!-- GERADO por montar.mjs a partir de partes/ — não edite à mão -->\n'));

fs.writeFileSync(SAIDA, html, 'utf8');

// 4. relatório
console.log(`✓ ${path.relative(RAIZ, SAIDA)} montado com ${arquivos.length} parte(s)${args.so ? ` (--so=${args.so})` : ''}`);
if (resumo.length) console.log(resumo.join('\n'));
// a página inteira precisa de exatamente UM <h1> (o herói); em --so a checagem não vale
if (!args.so) {
  const semComentarios = html.replace(/<!--[\s\S]*?-->/g, ''); // um <h1> citado em comentário não conta
  const h1s = (semComentarios.match(/<h1\b/gi) || []).length;
  if (h1s > 1) console.warn(`! a página tem ${h1s} <h1> — só o herói pode usar <h1 class="h1">`);
  else if (h1s === 0) console.log('  i: a página ainda não tem <h1> — o herói (primeira parte) deve trazer o único <h1 class="h1">');
}
if (orfaos.length) console.warn(`! arquivos sem parte correspondente (não foram incluídos):\n  ${orfaos.join('\n  ')}`);
if (/index\.teste-/.test(path.basename(SAIDA))) console.log('  lembrete: apague este arquivo de teste ao terminar');
