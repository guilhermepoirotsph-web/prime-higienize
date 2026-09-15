/* ===== 15 · FAIXA — letreiro contínuo (GSAP), pausa fora da tela e no hover ===== */
window.PH && PH.secao('faixa', function (ctx) {
  var trilho = document.getElementById('faixaTrilho');
  if (!trilho || !ctx.animando) return;
  var tween = ctx.gsap.to(trilho, { xPercent: -50, duration: 36, ease: 'none', repeat: -1, paused: true });
  PH.quandoVisivel(ctx.el, function () { tween.play(); }, function () { tween.pause(); });
  ctx.el.addEventListener('pointerenter', function () { ctx.gsap.to(tween, { timeScale: .25, duration: .6 }); });
  ctx.el.addEventListener('pointerleave', function () { ctx.gsap.to(tween, { timeScale: 1, duration: .6 }); });
});
