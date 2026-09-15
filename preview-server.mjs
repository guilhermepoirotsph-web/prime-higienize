/**
 * Prévia — Prime Higienize
 *
 * Servidor estático simples para o Guilherme conferir o site e, com o
 * previa.ps1 + cloudflared, gerar um link temporário para a clínica aprovar.
 * Não indexa (X-Robots-Tag + robots.txt) e não expõe bastidores (.mjs/.ps1/.md).
 *
 *   node preview-server.mjs            → http://localhost:8806
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 8806);
const RAIZ = path.dirname(fileURLToPath(import.meta.url));

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml',
  '.glb': 'model/gltf-binary', '.webmanifest': 'application/manifest+json',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://interno');
  if (url.pathname === '/robots.txt') {
    res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('User-agent: *\nDisallow: /\n');
  }
  let p = decodeURIComponent(url.pathname);
  if (p.endsWith('/')) p += 'index.html';
  let arquivo = path.join(RAIZ, p);
  if (fs.existsSync(arquivo) && fs.statSync(arquivo).isDirectory()) arquivo = path.join(arquivo, 'index.html');
  // vendor .mjs é permitido; scripts de bastidor na raiz não
  const nome = path.basename(arquivo);
  const bastidor = /^\.|\.ps1$|\.md$/.test(nome) || (/\.mjs$/.test(nome) && !arquivo.includes(path.join('assets', 'js')));
  if (!arquivo.startsWith(RAIZ) || bastidor || arquivo.includes(path.sep + 'partes' + path.sep) || arquivo.includes(path.sep + 'docs' + path.sep)
      || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    return res.end('404');
  }
  const st = fs.statSync(arquivo);
  const base = {
    'content-type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream',
    'x-robots-tag': 'noindex, nofollow',
    'cache-control': 'no-store',
  };
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const ini = m[1] ? parseInt(m[1], 10) : 0;
    const fim = m[2] ? parseInt(m[2], 10) : st.size - 1;
    res.writeHead(206, { ...base, 'accept-ranges': 'bytes', 'content-range': `bytes ${ini}-${fim}/${st.size}`, 'content-length': fim - ini + 1 });
    return fs.createReadStream(arquivo, { start: ini, end: fim }).pipe(res);
  }
  res.writeHead(200, { ...base, 'accept-ranges': 'bytes', 'content-length': st.size });
  fs.createReadStream(arquivo).pipe(res);
}).listen(PORT, () => {
  console.log(`\n  Prévia Odonto Vitallis em http://localhost:${PORT}\n`);
});
