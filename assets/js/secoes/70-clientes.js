/* ===== 70 · CLIENTES — vitrine horizontal pinada no desktop (celular rola nativo) ===== */
window.PH && PH.secao('clientes', function (ctx) {
  var el = ctx.el; if (!el || !ctx.animando) return;
  var vitrine = document.getElementById('clientesVitrine');
  var trilho = document.getElementById('clientesTrilho');
  if (!vitrine || !trilho) return;
  var gsap = ctx.gsap;
  gsap.matchMedia().add('(min-width: 901px)', function () {
    var percurso = function () { return Math.max(0, trilho.scrollWidth - window.innerWidth); };
    var tween = gsap.to(trilho, {
      x: function () { return -percurso(); }, ease: 'none',
      scrollTrigger: {
        trigger: vitrine, start: function () { return 'top top+=' + (ctx.navAltura() + 40); }, end: function () { return '+=' + (percurso() + window.innerHeight * .3); },
        pin: true, scrub: .8, invalidateOnRefresh: true, refreshPriority: -70, anticipatePin: 1
      }
    });
    // cards entram com leve stagger enquanto o trilho passa
    gsap.from(ctx.q('.clientes__card', trilho), { y: 40, autoAlpha: 0, stagger: .08, duration: .7, ease: 'power3.out', scrollTrigger: { trigger: vitrine, start: 'top 80%', once: true } });
    return function () { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); gsap.set(trilho, { clearProps: 'transform' }); };
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { PH.refresh(); });
});
