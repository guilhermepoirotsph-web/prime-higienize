/* ===== 80 · FAQ — acordeão acessível (button + aria-expanded + hidden), altura animada com GSAP quando há animação ===== */
window.PH && PH.secao('faq', function (ctx) {
  var el = ctx.el; if (!el) return;
  var itens = ctx.q('.faq__item', el);
  function alternar(item, abrir) {
    var btn = item.querySelector('.faq__pergunta'), resp = item.querySelector('.faq__resposta');
    if (!btn || !resp) return;
    item.classList.toggle('is-aberto', abrir);
    btn.setAttribute('aria-expanded', String(abrir));
    if (ctx.animando) {
      if (abrir) {
        resp.hidden = false;
        ctx.gsap.fromTo(resp, { height: 0 }, { height: 'auto', duration: .45, ease: 'power3.out', onComplete: function () { ctx.gsap.set(resp, { clearProps: 'height' }); PH.refresh(); } });
        ctx.gsap.fromTo(resp.firstElementChild, { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: .4, delay: .1 });
      } else {
        ctx.gsap.to(resp, { height: 0, duration: .35, ease: 'power3.in', onComplete: function () { resp.hidden = true; ctx.gsap.set(resp, { clearProps: 'height' }); PH.refresh(); } });
      }
    } else { resp.hidden = !abrir; }
  }
  itens.forEach(function (item) {
    var btn = item.querySelector('.faq__pergunta');
    btn && btn.addEventListener('click', function () {
      var aberto = item.classList.contains('is-aberto');
      // um aberto por vez
      itens.forEach(function (o) { if (o !== item && o.classList.contains('is-aberto')) alternar(o, false); });
      alternar(item, !aberto);
    });
  });
  // primeira pergunta já aberta (a mais buscada: preço)
  if (itens[0]) alternar(itens[0], true);
});
