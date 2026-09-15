/* ===== 20 · PROBLEMA — camadas geradas no SVG + timeline scrubada com pin (desktop) ===== */
window.PH && PH.secao('problema', function (ctx) {
  var el = ctx.el; if (!el) return;
  var NS = 'http://www.w3.org/2000/svg';
  // área útil do sofá no viewBox 200x200: encosto (44..156, 82..110) e assento (16..184, 110..142)
  function pontoNoSofa() {
    var r = Math.random();
    if (r < .38) return { x: 46 + Math.random() * 108, y: 84 + Math.random() * 24 };
    return { x: 18 + Math.random() * 164, y: 112 + Math.random() * 28 };
  }
  function povoar(id, qtd, fn) {
    var g = document.getElementById(id); if (!g) return [];
    var lista = [];
    for (var i = 0; i < qtd; i++) { var p = pontoNoSofa(); var n = fn(p, i); g.appendChild(n); lista.push(n); }
    return lista;
  }
  var poeira = povoar('camadaPoeira', 46, function (p) {
    var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
    c.setAttribute('r', (1 + Math.random() * 1.6).toFixed(2)); c.setAttribute('fill', '#b9b9b9'); c.setAttribute('opacity', '.75'); return c;
  });
  var acaros = povoar('camadaAcaros', 34, function (p) {
    var g = document.createElementNS(NS, 'g'); g.setAttribute('transform', 'translate(' + p.x.toFixed(1) + ' ' + p.y.toFixed(1) + ')');
    var c = document.createElementNS(NS, 'circle'); c.setAttribute('r', (1.4 + Math.random() * 1.2).toFixed(2)); c.setAttribute('fill', '#f8c828');
    var l = document.createElementNS(NS, 'path'); l.setAttribute('d', 'M-3 -1.5l6 3M-3 1.5l6-3M0 -3v6'); l.setAttribute('stroke', '#f8c828'); l.setAttribute('stroke-width', '.5'); l.setAttribute('opacity', '.8');
    g.appendChild(l); g.appendChild(c); return g;
  });
  var manchas = povoar('camadaManchas', 7, function (p) {
    var e = document.createElementNS(NS, 'ellipse'); e.setAttribute('cx', p.x); e.setAttribute('cy', p.y);
    e.setAttribute('rx', (7 + Math.random() * 12).toFixed(1)); e.setAttribute('ry', (4 + Math.random() * 6).toFixed(1));
    e.setAttribute('fill', '#7a5a2a'); e.setAttribute('opacity', '.55'); return e;
  });

  var etapas = ctx.q('.problema__etapa', el);
  var num = document.getElementById('problemaNum');
  function ativar(n) {
    etapas.forEach(function (e) { e.classList.toggle('is-ativa', parseInt(e.getAttribute('data-etapa'), 10) === n); });
    if (num) num.textContent = String(n).padStart(2, '0');
  }

  if (!ctx.animando) { ativar(4); return; } // estático: tudo visível, sofá "limpo" com etapas listadas
  var gsap = ctx.gsap;
  var camadas = [poeira, acaros, manchas];
  // começa só com a poeira; as outras camadas entram por etapa
  gsap.set(acaros, { scale: 0, autoAlpha: 0 });
  gsap.set(manchas, { scale: 0, autoAlpha: 0 });
  var bocal = document.getElementById('problemaBocal');

  gsap.matchMedia().add({ desktop: '(min-width: 901px)', mobile: '(max-width: 900px)' }, function (c) {
    var desktop = c.conditions.desktop;
    var tl = gsap.timeline({
      scrollTrigger: desktop
        ? { trigger: '#problemaPin', start: 'top top+=' + (ctx.navAltura() + 24), end: '+=2400', pin: true, scrub: .6, invalidateOnRefresh: true, refreshPriority: -20,
            onUpdate: function (st) { ativar(Math.min(4, 1 + Math.floor(st.progress * 4 * .999))); } }
        : { trigger: '#problemaPalco', start: 'top 70%', end: 'bottom 30%', scrub: .6, invalidateOnRefresh: true,
            onUpdate: function (st) { ativar(Math.min(4, 1 + Math.floor(st.progress * 4 * .999))); } }
    });
    // etapa 1 → 2: ácaros aparecem
    tl.to(acaros, { scale: 1, autoAlpha: 1, stagger: { each: .02, from: 'random' }, duration: .6, ease: 'back.out(2)' }, .25)
      // etapa 2 → 3: manchas aparecem
      .to(manchas, { scale: 1, autoAlpha: 1, stagger: .05, duration: .6, ease: 'power2.out' }, 1.0)
      // etapa 3 → 4: o bocal varre e tudo some no rastro
      .to(bocal, { autoAlpha: 1, duration: .15 }, 1.7)
      .fromTo(bocal, { attr: { transform: 'translate(18 86)' } }, { attr: { transform: 'translate(182 86)' }, duration: .9, ease: 'none' }, 1.75)
      .fromTo(bocal, { attr: { transform: 'translate(182 86)' } }, { attr: { transform: 'translate(18 112)' }, duration: .9, ease: 'none' }, 2.65)
      .to(poeira, { scale: 0, autoAlpha: 0, duration: .5, stagger: { each: .012, from: 'start' } }, 1.8)
      .to(acaros, { scale: 0, autoAlpha: 0, duration: .5, stagger: { each: .015, from: 'start' } }, 1.95)
      .to(manchas, { scaleX: 0, autoAlpha: 0, duration: .6, stagger: .06, ease: 'power2.in' }, 2.2)
      .to(bocal, { autoAlpha: 0, duration: .2 }, 3.55)
      .to('.problema__corpo', { attr: { stroke: '#f8c828' }, duration: .4 }, 3.4)
      .to('.problema__palco', { '--brilho': 1, duration: .4 }, 3.4);
    return function () { tl.scrollTrigger && tl.scrollTrigger.kill(); tl.kill(); };
  });

  // no mobile as etapas entram com reveal normal
  if (ctx.mobile) etapas.forEach(function (e) { e.setAttribute('data-reveal', 'up'); });
});
