/* ===== 60 · VÍDEOS — abre o embed oficial do Instagram num modal (iframe criado só ao clicar) ===== */
window.PH && PH.secao('videos', function (ctx) {
  var el = ctx.el; if (!el) return;
  var modal = document.getElementById('videosModal');
  var player = document.getElementById('videosPlayer');
  var fechar = document.getElementById('videosFechar');
  var fundo = document.getElementById('videosFundo');
  var ultimoFoco = null;

  function abrir(caminho) {
    if (!modal || !player) return;
    ultimoFoco = document.activeElement;
    player.innerHTML = '<div class="videos__carregando">Carregando vídeo…</div>';
    var f = document.createElement('iframe');
    f.src = 'https://www.instagram.com/' + caminho + '/embed/';
    f.setAttribute('allow', 'autoplay; encrypted-media; fullscreen; picture-in-picture');
    f.setAttribute('allowfullscreen', '');
    f.setAttribute('title', 'Vídeo do Instagram da Prime Higienize');
    f.setAttribute('loading', 'eager');
    f.addEventListener('load', function () { var c = player.querySelector('.videos__carregando'); if (c) c.remove(); });
    player.appendChild(f);
    modal.hidden = false;
    document.body.classList.add('video-aberto');
    if (window.PH && PH.fecharMenu) PH.fecharMenu();
    setTimeout(function () { fechar && fechar.focus(); }, 30);
  }
  function encerrar() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    player.innerHTML = '';
    document.body.classList.remove('video-aberto');
    if (ultimoFoco && ultimoFoco.focus) ultimoFoco.focus();
  }
  ctx.q('.videos__card', el).forEach(function (b) {
    b.addEventListener('click', function () { abrir(b.getAttribute('data-embed')); });
  });
  fechar && fechar.addEventListener('click', encerrar);
  fundo && fundo.addEventListener('click', encerrar);
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') { encerrar(); return; }
    if (e.key === 'Tab') { e.preventDefault(); fechar.focus(); } // único focável do modal além do iframe
  });
});
