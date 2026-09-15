/* ===== 40 · ANTES E DEPOIS — liga o comparador (definido no herói) em cada figura ===== */
window.PH && PH.secao('antes-depois', function (ctx) {
  if (!ctx.el) return;
  var lista = ctx.q('[data-comparar]', ctx.el);
  if (!PH.comparar) { console.warn('[PH] comparador não disponível (10-heroi.js não carregou)'); return; }
  lista.forEach(function (f) { PH.comparar(f); });
  if (!ctx.animando) return;
  // ao entrar na tela, cada comparador dá uma "passada" curta para convidar o gesto
  lista.forEach(function (f, i) {
    var api = f._phApi; // não exposto; recria um controle leve pela variável CSS
    ctx.ScrollTrigger.create({
      trigger: f, start: 'top 80%', once: true,
      onEnter: function () {
        if (f.classList.contains('is-usado')) return;
        var o = { v: 50 };
        ctx.gsap.timeline({ delay: .2 + i * .1 })
          .to(o, { v: 64, duration: .8, ease: 'power2.inOut', onUpdate: function () { if (!f.classList.contains('is-arrastando') && !f.classList.contains('is-usado')) f.style.setProperty('--x', o.v + '%'); } })
          .to(o, { v: 50, duration: .7, ease: 'power2.inOut', onUpdate: function () { if (!f.classList.contains('is-arrastando') && !f.classList.contains('is-usado')) f.style.setProperty('--x', o.v + '%'); } });
      }
    });
  });
});
