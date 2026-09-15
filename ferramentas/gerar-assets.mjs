// Gera os assets de imagem do site da Prime Higienize a partir do material do Instagram (../ig).
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path';
const IG = path.resolve('../ig');
const PR = 'C:/Users/sandr/OneDrive/Área de Trabalho/Clientes/Prime Higienizações/site/assets/img';
const MARCA = path.join(PR, 'marca'), FOTOS = path.join(PR, 'fotos');
fs.mkdirSync(MARCA, { recursive: true }); fs.mkdirSync(FOTOS, { recursive: true });
const log = (...a) => console.log(...a);

/* ---------- 1. LOGO: fundo branco -> alfa; versões cor / branca / ouro / preta ---------- */
const { data, info } = await sharp(path.join(IG, 'perfil-hd.jpg')).raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
const rgba = Buffer.alloc(W * H * 4);
for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const d = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2); // distância do branco
  const a = Math.max(0, Math.min(1, (d - 18) / 90));
  if (a > 0 && a < 1) { // un-premultiply contra branco: sem borda esbranquiçada
    rgba[j] = Math.max(0, Math.min(255, 255 + (r - 255) / a));
    rgba[j + 1] = Math.max(0, Math.min(255, 255 + (g - 255) / a));
    rgba[j + 2] = Math.max(0, Math.min(255, 255 + (b - 255) / a));
  } else { rgba[j] = r; rgba[j + 1] = g; rgba[j + 2] = b; }
  rgba[j + 3] = Math.round(a * 255);
}
const recolor = (buf, fn) => {
  const o = Buffer.from(buf);
  for (let j = 0; j < o.length; j += 4) { if (o[j + 3] === 0) continue; const c = fn(o[j], o[j + 1], o[j + 2]); o[j] = c[0]; o[j + 1] = c[1]; o[j + 2] = c[2]; }
  return o;
};
const OURO = [248, 200, 40];
const ehEscuro = (r, g, b) => (r + g + b) / 3 < 150 && Math.max(r, g, b) - Math.min(r, g, b) < 60;
const versoes = {
  cor: rgba,
  branco: recolor(rgba, (r, g, b) => ehEscuro(r, g, b) ? [255, 255, 255] : [r, g, b]),
  ouro: recolor(rgba, () => OURO),
  preto: recolor(rgba, () => [12, 12, 12]),
};
const meta = { raw: { width: W, height: H, channels: 4 } };
const trimmed = await sharp(versoes.cor, meta).trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true });
const ti = trimmed.info;
const L = -ti.trimOffsetLeft, T = -ti.trimOffsetTop, TW = ti.width, TH = ti.height;
log('logo trim', TW + 'x' + TH, 'em', L, T);
const SY = 455; // "PRIME" começa ~y=460 na imagem 1052x1052
const aparar = async (png) => { // trim em duas etapas (raw -> png -> trim) evita "bad extract area" do pipeline raw
  try { return await sharp(png).trim({ threshold: 10 }).png().toBuffer({ resolveWithObject: true }); }
  catch (e) { log('! trim falhou, usando sem aparar:', e.message); return await sharp(png).png().toBuffer({ resolveWithObject: true }); }
};
for (const nome of Object.keys(versoes)) {
  const buf = versoes[nome];
  const full = await sharp(buf, meta).png().toBuffer();
  const base = sharp(full).extract({ left: L, top: T, width: TW, height: TH });
  await base.clone().png().toFile(path.join(MARCA, `logo-${nome}.png`));
  await base.clone().resize({ width: 700 }).png().toFile(path.join(MARCA, `logo-${nome}-700.png`));
  const s = await aparar(await sharp(full).extract({ left: 0, top: 0, width: W, height: SY }).png().toBuffer());
  await sharp(s.data).png().toFile(path.join(MARCA, `simbolo-${nome}.png`));
  const wm = await aparar(await sharp(full).extract({ left: 0, top: SY, width: W, height: H - SY }).png().toBuffer());
  await sharp(wm.data).png().toFile(path.join(MARCA, `wordmark-${nome}.png`));
  // lockup horizontal (altura 196, como o padrão da casa): símbolo à esquerda + wordmark à direita
  const simb = await sharp(s.data).resize({ height: 196 }).png().toBuffer({ resolveWithObject: true });
  const word = await sharp(wm.data).resize({ height: 150 }).png().toBuffer({ resolveWithObject: true });
  const gap = 22, totalW = simb.info.width + gap + word.info.width;
  const lock = await sharp({ create: { width: totalW, height: 196, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: simb.data, left: 0, top: 0 }, { input: word.data, left: simb.info.width + gap, top: Math.round((196 - word.info.height) / 2) }])
    .png().toBuffer();
  await sharp(lock).toFile(path.join(MARCA, `logo-${nome}-h.png`));
  await sharp(lock).webp({ quality: 92 }).toFile(path.join(MARCA, `logo-${nome}-h.webp`));
  if (nome === 'cor') log('simbolo', s.info.width + 'x' + s.info.height, 'wordmark', wm.info.width + 'x' + wm.info.height, 'lockup', totalW + 'x196');
}
// favicons: símbolo preto sobre quadrado arredondado ouro
const simbPreto = await sharp(path.join(MARCA, 'simbolo-preto.png')).resize({ width: 380 }).png().toBuffer({ resolveWithObject: true });
const circ = Buffer.from('<svg width="512" height="512"><rect width="512" height="512" rx="110" fill="#F8C828"/></svg>');
// sharp aplica resize ANTES do composite na mesma cadeia: compor primeiro, redimensionar em cadeia separada
const fav512 = await sharp(circ).composite([{ input: simbPreto.data, left: Math.round((512 - simbPreto.info.width) / 2), top: Math.round((512 - simbPreto.info.height) / 2) }]).png().toBuffer();
for (const [nome, size] of [['favicon-64.png', 64], ['favicon-512.png', 512], ['apple-touch-icon.png', 180]]) {
  await sharp(fav512).resize(size, size).png().toFile(path.join(MARCA, nome));
}
// og.jpg 1200x630
const ogLogo = await sharp(path.join(MARCA, 'logo-branco.png')).resize({ height: 380 }).png().toBuffer({ resolveWithObject: true });
const ogBg = Buffer.from('<svg width="1200" height="630"><defs><radialGradient id="g" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="#2a2410"/><stop offset="1" stop-color="#0b0b0b"/></radialGradient></defs><rect width="1200" height="630" fill="url(#g)"/><rect x="0" y="622" width="1200" height="8" fill="#F8C828"/></svg>');
await sharp(ogBg).composite([{ input: ogLogo.data, left: Math.round((1200 - ogLogo.info.width) / 2), top: 90 }]).jpeg({ quality: 88 }).toFile(path.join(PR, 'og.jpg'));

/* ---------- 2. ANTES/DEPOIS das colagens 1284x2282 ---------- */
const colagens = [['sofa-2025-07-29', 'sofa-1'], ['sofa-2025-07-18', 'sofa-2'], ['sofa-2025-07-11', 'sofa-3'], ['col-2025-07-17', 'colchao-1'], ['col-2025-07-08', 'colchao-2']];
for (const [f, nome] of colagens) {
  const m = await sharp(path.join(IG, f + '.jpg')).metadata();
  if (m.width !== 1284) { log('! colagem com tamanho diferente', f, m.width, m.height); continue; }
  await sharp(path.join(IG, f + '.jpg')).extract({ left: 105, top: 422, width: 1081, height: 718 }).resize({ width: 1000 }).webp({ quality: 82 }).toFile(path.join(FOTOS, `${nome}-antes.webp`));
  await sharp(path.join(IG, f + '.jpg')).extract({ left: 105, top: 1368, width: 1081, height: 707 }).resize({ width: 1000 }).webp({ quality: 82 }).toFile(path.join(FOTOS, `${nome}-depois.webp`));
}
for (const [f, nome] of [['col-2025-10-24-a', 'colchao-3-antes'], ['col-2025-10-24-b', 'colchao-3-depois']]) {
  await sharp(path.join(IG, f + '.jpg')).extract({ left: 0, top: 220, width: 1179, height: 1300 }).resize({ width: 1000 }).webp({ quality: 82 }).toFile(path.join(FOTOS, `${nome}.webp`));
}
await sharp(path.join(IG, 'cad-2025-08-28.jpg')).extract({ left: 0, top: 380, width: 1179, height: 1500 }).resize({ width: 900 }).webp({ quality: 82 }).toFile(path.join(FOTOS, 'cadeira-meio.webp'));

/* ---------- 3. Reposts de clientes (stories) ---------- */
const clientes = [['cli-v1-capa', 'cliente-cecinara'], ['cli-v2-capa', 'cliente-milena'], ['cli-v3-capa', 'cliente-bortollozo'], ['cli-v4-capa', 'cliente-nick'], ['cli-v5-capa', 'cliente-pkdocess'], ['cli-2026-04-04-a', 'cliente-laura-1'], ['cli-2026-04-04-b', 'cliente-laura-2']];
for (const [f, nome] of clientes) await sharp(path.join(IG, f + '.jpg')).resize({ width: 540 }).webp({ quality: 80 }).toFile(path.join(FOTOS, `${nome}.webp`));
await sharp(path.join(IG, 'p05-DcB9TaVOPEA.jpg')).webp({ quality: 84 }).toFile(path.join(FOTOS, 'cliente-whatsapp.webp'));

/* ---------- 4. Capas dos reels/posts ---------- */
for (const f of fs.readdirSync(IG).filter(x => /^p\d\d-/.test(x))) {
  const code = f.replace(/^p\d\d-/, '').replace(/\.jpg$/, '');
  await sharp(path.join(IG, f)).webp({ quality: 80 }).toFile(path.join(FOTOS, `reel-${code}.webp`));
}
/* ---------- 5. Quadros dos vídeos de feedback (se existirem) ---------- */
const QD = path.join(IG, 'quadros');
if (fs.existsSync(QD)) for (const f of fs.readdirSync(QD)) await sharp(path.join(QD, f)).resize({ width: 540 }).webp({ quality: 80 }).toFile(path.join(FOTOS, 'quadro-' + f.replace(/\.jpg$/, '.webp')));
log('fotos:', fs.readdirSync(FOTOS).length, 'marca:', fs.readdirSync(MARCA).length);
