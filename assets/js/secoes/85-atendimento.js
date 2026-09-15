/* ===== 85 · ATENDIMENTO — chips montam a mensagem do WhatsApp ===== */
window.PH && PH.secao('atendimento', function (ctx) {
  var el = ctx.el; if (!el) return;
  var chips = ctx.q('#atendimentoChips .chip', el);
  var previa = document.getElementById('atendimentoPrevia');
  var botao = document.getElementById('atendimentoBotao');
  function mensagem() {
    var itens = chips.filter(function (c) { return c.getAttribute('aria-pressed') === 'true'; }).map(function (c) { return c.getAttribute('data-item'); });
    if (!itens.length) return 'Olá! Vim pelo site da Prime Higienize e quero um orçamento.';
    var lista = itens.length === 1 ? itens[0] : itens.slice(0, -1).join(', ') + ' e ' + itens[itens.length - 1];
    return 'Olá! Vim pelo site da Prime Higienize e quero um orçamento para: ' + lista + '. Posso mandar uma foto?';
  }
  function atualizar() {
    var m = mensagem();
    if (previa) previa.textContent = m;
    if (botao) botao.href = PH.wa(m);
  }
  chips.forEach(function (c) {
    c.addEventListener('click', function () { c.setAttribute('aria-pressed', c.getAttribute('aria-pressed') === 'true' ? 'false' : 'true'); atualizar(); });
  });
  atualizar();
});
