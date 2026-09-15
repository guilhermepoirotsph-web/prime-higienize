/* ===== 75 · PROTEÇÃO — gotas caem, viram bolinha na película e escorrem; brilho passa no tecido ===== */
window.PH && PH.secao('protecao', function (ctx) {
  var el = ctx.el; if (!el || !ctx.animando) return;
  var gsap = ctx.gsap;
  var gotas = ctx.q('.protecao__gota', el);
  var reflexo = el.querySelector('.protecao__reflexo');
  // altura do tecido em cada x (curva M0 200 C60 186 120 214 200 200 S340 186 400 200): aproximação suficiente
  function ySuperficie(x) { return 200 + Math.sin((x / 400) * Math.PI * 2) * -10; }

  var tl = gsap.timeline({ repeat: -1, repeatDelay: .6, paused: true });
  gotas.forEach(function (g, i) {
    var x = parseFloat(g.getAttribute('data-x'));
    var y = ySuperficie(x);
    var forma = g.querySelector('path');
    gsap.set(g, { attr: { transform: 'translate(' + x + ' ' + 40 + ')' }, autoAlpha: 0 });
    var t = i * .55;
    tl.set(g, { attr: { transform: 'translate(' + x + ' 40)' } }, t)
      .to(g, { autoAlpha: 1, duration: .15 }, t)
      .to(g, { attr: { transform: 'translate(' + x + ' ' + (y - 6) + ')' }, duration: .7, ease: 'power2.in' }, t)
      // impacto: achata e vira gota "de pé" sobre a película
      .to(forma, { scaleY: .55, scaleX: 1.35, transformOrigin: '50% 100%', duration: .12, ease: 'power2.out' }, t + .7)
      .to(forma, { scaleY: .85, scaleX: 1.05, duration: .35, ease: 'elastic.out(1,.5)' }, t + .82)
      // escorre pela superfície e some
      .to(g, { attr: { transform: 'translate(' + (x + 70) + ' ' + (ySuperficie(x + 70) - 4) + ')' }, duration: 1.2, ease: 'power1.in' }, t + 1.2)
      .to(g, { autoAlpha: 0, duration: .3 }, t + 2.1)
      .set(forma, { scaleX: 1, scaleY: 1 }, t + 2.5);
  });
  if (reflexo) tl.fromTo(reflexo, { attr: { x: -120 } }, { attr: { x: 420 }, duration: 2.2, ease: 'power1.inOut' }, 0.4);
  PH.quandoVisivel(el, function () { tl.play(); }, function () { tl.pause(); });
});
