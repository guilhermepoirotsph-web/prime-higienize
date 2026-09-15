/* ===== 50 · PROCESSO — linha tracejada se desenha com o scroll ===== */
window.PH && PH.secao('como-funciona', function (ctx) {
  var traco = document.getElementById('processoTraco');
  if (!traco || !ctx.animando) return;
  var L = traco.getTotalLength ? traco.getTotalLength() : 1200;
  // mantém o tracejado e desenha por cima com um segundo caminho sólido
  var solido = traco.cloneNode(false);
  solido.removeAttribute('id'); solido.removeAttribute('stroke-dasharray');
  solido.setAttribute('stroke-width', '3'); solido.style.strokeDasharray = L; solido.style.strokeDashoffset = L;
  traco.parentNode.appendChild(solido);
  ctx.gsap.to(solido, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: '#processoPassos', start: 'top 75%', end: 'bottom 55%', scrub: .8 } });
});
