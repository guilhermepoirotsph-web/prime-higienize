import puppeteer from 'puppeteer-core';
const W = Number(process.argv[2] || 320);
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new', args: ['--no-sandbox'] });
const pg = await nav.newPage(); await pg.setViewport({ width: W, height: 640, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
await pg.goto('http://localhost:8806/?anim=0', { waitUntil: 'load' }); await new Promise(r => setTimeout(r, 800));
console.log(JSON.stringify(await pg.evaluate((W) => {
  const fora = [];
  for (const e of document.querySelectorAll('body *')) {
    const r = e.getBoundingClientRect(); if (r.width === 0) continue;
    const cs = getComputedStyle(e);
    if (cs.position === 'fixed') continue;
    if (r.right > W + 1 || r.left < -1) {
      // ignora quem está dentro de um contêiner com overflow escondido/rolável
      let p = e.parentElement, contido = false; while (p && p !== document.body) { const o = getComputedStyle(p).overflowX; if (o === 'hidden' || o === 'auto' || o === 'scroll' || o === 'clip') { contido = true; break; } p = p.parentElement; }
      if (!contido) fora.push((e.tagName + '.' + String(e.className).split(' ').slice(0, 2).join('.')) + ' [' + Math.round(r.left) + '→' + Math.round(r.right) + ']' + (e.textContent ? ' "' + e.textContent.trim().slice(0, 30) + '"' : ''));
    }
  }
  return { innerWidth, docW: document.documentElement.clientWidth, scrollW: document.documentElement.scrollWidth, fora: fora.slice(0, 25) };
}, W), null, 1));
await nav.close();
