/* ===== 12 · ANTES E DEPOIS DO AR-CONDICIONADO — liga o comparador (definido no herói) ===== */
window.PH && PH.secao('antes-depois-ar', function (ctx) {
  if (!ctx.el) return;
  if (!PH.comparar) { console.warn('[PH] comparador não disponível (10-heroi.js não carregou)'); return; }
  ctx.q('[data-comparar]', ctx.el).forEach(function (f) { PH.comparar(f); });
});
