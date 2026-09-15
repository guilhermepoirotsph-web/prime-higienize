// Sonda interativa do site da Prime: preloader, partículas, comparador, modal de vídeo, FAQ, chips, menu mobile, nav 320px, ?anim=0.
import puppeteer from 'puppeteer-core';
const URL = process.argv[2] || 'http://localhost:8806/';
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const nav = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--window-size=1440,900'] });
const out = [];
const ok = (t, c, extra) => out.push((c ? '✓ ' : '✗ ') + t + (extra ? '  — ' + extra : ''));
const dorme = ms => new Promise(r => setTimeout(r, ms));

/* ---------- desktop ---------- */
let pg = await nav.newPage(); await pg.setViewport({ width: 1440, height: 900 });
const erros = [];
pg.on('pageerror', e => erros.push('pageerror: ' + String(e).slice(0, 200)));
pg.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0, 200)); });
await pg.goto(URL, { waitUntil: 'load' });
const t0 = Date.now();
await pg.waitForFunction(() => !document.getElementById('preloader'), { timeout: 9000 }).catch(() => {});
ok('preloader sumiu em ' + (Date.now() - t0) + ' ms', !(await pg.$('#preloader')));
await dorme(2500);
const part = await pg.evaluate(() => { const a = document.getElementById('heroiParticulas'); const c = a && a.querySelector('canvas'); return { canvas: !!c, pronto: a && a.classList.contains('is-pronto'), w: c && c.width, h: c && c.height }; });
ok('partículas 3D: canvas criado', part.canvas && part.pronto, JSON.stringify(part));
// nav: logo visível e classes
const navInfo = await pg.evaluate(() => { const n = document.getElementById('nav'); const cs = getComputedStyle(n); const l = n.querySelector('.nav__logo--claro'); return { opacity: cs.opacity, cor: cs.color, logoClaro: getComputedStyle(l).opacity, larguraLogo: l.getBoundingClientRect().width }; });
ok('nav visível com logo claro sobre o herói', navInfo.opacity === '1' && navInfo.logoClaro === '1', JSON.stringify(navInfo));
// comparador: arrasta a alça
const alca = await pg.$('#heroi .comparar__alca');
const bb = await alca.boundingBox();
await pg.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await pg.mouse.down(); await pg.mouse.move(bb.x + 150, bb.y + bb.height / 2, { steps: 8 }); await pg.mouse.up();
await dorme(400);
const xDepois = await pg.evaluate(() => getComputedStyle(document.querySelector('#heroi .comparar')).getPropertyValue('--x').trim());
ok('comparador do herói respondeu ao arraste', /%/.test(xDepois) && parseFloat(xDepois) > 55, '--x=' + xDepois + ' (alça em x=' + Math.round(bb.x) + ')');
// modal de vídeo
await pg.evaluate(() => document.getElementById('videos').scrollIntoView()); await dorme(800);
await pg.click('.videos__card');
await dorme(600);
const modal = await pg.evaluate(() => { const m = document.getElementById('videosModal'); const f = m.querySelector('iframe'); return { hidden: m.hidden, display: getComputedStyle(m).display, iframe: f ? f.src : null, foco: document.activeElement && document.activeElement.id, bodyLock: document.body.classList.contains('video-aberto') }; });
ok('modal do vídeo abre com iframe do Instagram', !modal.hidden && modal.display === 'grid' && /instagram\.com\/reel\/.+\/embed/.test(modal.iframe || ''), JSON.stringify(modal));
await pg.keyboard.press('Escape'); await dorme(300);
const fechado = await pg.evaluate(() => ({ hidden: document.getElementById('videosModal').hidden, display: getComputedStyle(document.getElementById('videosModal')).display, iframes: document.querySelectorAll('#videosPlayer iframe').length }));
ok('Esc fecha o modal e remove o iframe', fechado.hidden && fechado.display === 'none' && fechado.iframes === 0, JSON.stringify(fechado));
// FAQ
await pg.evaluate(() => document.getElementById('faq').scrollIntoView()); await dorme(600);
const faq1 = await pg.evaluate(() => ({ aberto: document.querySelector('.faq__item').classList.contains('is-aberto'), hidden: document.getElementById('faq-r1').hidden }));
ok('FAQ: primeira pergunta já aberta', faq1.aberto && !faq1.hidden, JSON.stringify(faq1));
await pg.click('#faq-p2'); await dorme(700);
const faq2 = await pg.evaluate(() => ({ r1: document.getElementById('faq-r1').hidden, r2: document.getElementById('faq-r2').hidden, exp2: document.getElementById('faq-p2').getAttribute('aria-expanded'), alt: document.getElementById('faq-r2').getBoundingClientRect().height }));
ok('FAQ: abrir a 2ª fecha a 1ª (aria-expanded ok)', faq2.r1 === true && faq2.r2 === false && faq2.exp2 === 'true' && faq2.alt > 20, JSON.stringify(faq2));
// chips
await pg.evaluate(() => document.getElementById('atendimento').scrollIntoView()); await dorme(500);
await pg.click('#atendimentoChips .chip[data-item="sofá"]'); await pg.click('#atendimentoChips .chip[data-item="ar-condicionado"]');
const chips = await pg.evaluate(() => ({ previa: document.getElementById('atendimentoPrevia').textContent, href: document.getElementById('atendimentoBotao').href }));
ok('chips montam a mensagem e o link do WhatsApp', /sofá e ar-condicionado/.test(chips.previa) && /wa\.me\/5551994372227\?text=/.test(chips.href) && /sof%C3%A1/.test(chips.href), chips.previa);
// links WhatsApp: todos com o número certo
const wa = await pg.evaluate(() => { const a = [...document.querySelectorAll('a[href*="wa.me"]')]; return { total: a.length, errados: a.filter(x => !/wa\.me\/5551994372227/.test(x.href)).length, semTexto: a.filter(x => !/text=/.test(x.href)).length }; });
ok('links do WhatsApp com o número da Prime', wa.errados === 0 && wa.semTexto === 0, JSON.stringify(wa));
// tap targets
const tap = await pg.evaluate(() => [...document.querySelectorAll('a,button')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.height < 44 && !e.closest('.faixa'); }).map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().height)).slice(0, 12));
ok('tap targets ≥ 44px (desktop)', tap.length === 0, tap.join(', '));
// h1 único / seções com aria-labelledby
const sem = await pg.evaluate(() => ({ h1: document.querySelectorAll('h1').length, secoesSemLabel: [...document.querySelectorAll('main > section')].filter(s => !s.getAttribute('aria-labelledby') && !s.getAttribute('aria-label')).map(s => s.id), imgsSemAlt: [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length }));
ok('semântica: 1 h1, seções rotuladas, imgs com alt', sem.h1 === 1 && sem.secoesSemLabel.length === 0 && sem.imgsSemAlt === 0, JSON.stringify(sem));
const peso = await pg.evaluate(() => { const r = performance.getEntriesByType('resource'); const tot = r.reduce((s, x) => s + (x.transferSize || x.encodedBodySize || 0), 0); const grandes = r.filter(x => (x.transferSize || 0) > 150000).map(x => x.name.split('/').pop() + ' ' + Math.round((x.transferSize || 0) / 1024) + 'KB'); return { kb: Math.round(tot / 1024), qtd: r.length, grandes }; });
out.push('  peso carregado: ' + peso.kb + ' KB em ' + peso.qtd + ' recursos; >150KB: ' + peso.grandes.join(', '));
await pg.close();

/* ---------- mobile: menu, 320px, elementos invisíveis ---------- */
pg = await nav.newPage(); await pg.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
pg.on('pageerror', e => erros.push('m pageerror: ' + String(e).slice(0, 200)));
await pg.goto(URL, { waitUntil: 'load' }); await pg.waitForFunction(() => !document.getElementById('preloader'), { timeout: 9000 }).catch(() => {}); await dorme(1500);
await pg.tap('#burger'); await dorme(600);
const menu = await pg.evaluate(() => { const m = document.getElementById('menu'); return { aberto: m.classList.contains('is-aberto'), vis: getComputedStyle(m).visibility, exp: document.getElementById('burger').getAttribute('aria-expanded'), foco: document.activeElement && document.activeElement.textContent.trim().slice(0, 20) }; });
ok('menu mobile abre e foca o 1º link', menu.aberto && menu.vis === 'visible' && menu.exp === 'true', JSON.stringify(menu));
await pg.tap('#menu a[href="#servicos"]'); await dorme(1500);
const posM = await pg.evaluate(() => ({ menuAberto: document.getElementById('menu').classList.contains('is-aberto'), y: Math.round(scrollY), topoServicos: Math.round(document.getElementById('servicos').getBoundingClientRect().top) }));
ok('link do menu fecha o menu e rola até Serviços', !posM.menuAberto && posM.topoServicos < 120 && posM.topoServicos > -10, JSON.stringify(posM));
// elementos invisíveis por seção (o que a captura acusou)
const inv = await pg.evaluate(async () => {
  const ids = ['faixa', 'problema', 'servicos', 'protecao', 'faq']; const res = {};
  for (const id of ids) { const el = document.getElementById(id); scrollTo(0, el.getBoundingClientRect().top + scrollY - 10); await new Promise(r => setTimeout(r, 1600)); res[id] = [...document.querySelectorAll('.reveal,[data-reveal],[data-split]')].filter(e => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && Number(getComputedStyle(e).opacity) < .1; }).map(e => e.tagName + '.' + String(e.className).split(' ').slice(0, 2).join('.') + '@' + Math.round(e.getBoundingClientRect().top)); }
  return res;
});
out.push('  invisíveis por seção (mobile): ' + JSON.stringify(inv));
const ovM = await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth);
ok('mobile sem vazamento horizontal', ovM <= 0, 'scrollWidth-innerWidth=' + ovM);
await pg.setViewport({ width: 320, height: 640, isMobile: true, hasTouch: true }); await dorme(600);
const n320 = await pg.evaluate(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const l = r('.nav__marca'), b = r('.nav .btn--sm'), g = r('#burger'); return { logo: Math.round(l.right), cta: [Math.round(b.left), Math.round(b.right), Math.round(b.width)], burger: [Math.round(g.left), Math.round(g.right)], overflow: document.documentElement.scrollWidth - innerWidth, txt: getComputedStyle(document.querySelector('.nav .btn--sm span')).position }; });
ok('nav em 320px: logo, CTA-ícone e burger cabem sem sobrepor', n320.logo < n320.cta[0] && n320.cta[1] <= n320.burger[0] && n320.burger[1] <= 320 && n320.overflow <= 0 && n320.txt === 'absolute', JSON.stringify(n320));
await pg.close();

/* ---------- ?anim=0: tudo visível sem animação ---------- */
pg = await nav.newPage(); await pg.setViewport({ width: 1440, height: 900 });
await pg.goto(URL + '?anim=0', { waitUntil: 'load' }); await dorme(800);
const est = await pg.evaluate(() => ({ anim: document.documentElement.classList.contains('anim'), preloader: !!document.getElementById('preloader'), invisiveis: [...document.querySelectorAll('.reveal,[data-reveal],[data-split],.heroi__lead,.heroi__palco')].filter(e => Number(getComputedStyle(e).opacity) < .1).length, navOp: getComputedStyle(document.getElementById('nav')).opacity }));
ok('?anim=0: sem preloader, nada invisível, nav visível', !est.anim && !est.preloader && est.invisiveis === 0 && est.navOp === '1', JSON.stringify(est));
await pg.close();

console.log(out.join('\n'));
console.log(erros.length ? '\n⚠ erros:\n  ' + [...new Set(erros)].join('\n  ') : '\n✓ zero erro de página/console');
await nav.close();
