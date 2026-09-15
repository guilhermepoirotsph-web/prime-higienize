/* ============================================================
   PRIME HIGIENIZE · nucleo.js (base da casa, adaptada do molde Odonto Vitallis)
   Núcleo do site: flags de movimento, preloader com cortina,
   nav, menu mobile, cursor, magnético, tilt, reveal, split,
   âncoras suaves, WhatsApp flutuante e o registro de seções.

   Expõe window.PH:
     PH.reduzido · PH.toque · PH.mobile · PH.temGsap · PH.animando (GSAP ok e sem reduce)
     PH.secao(nome, fn)          → registra uma seção; fn(ctx) roda depois do DOM
                                   pronto e do preloader (erro numa seção não derruba as outras)
     PH.split(el, {tipo, mascara}) → divide texto; devolve os spans (chars|words|lines)
     PH.magnetico(el, forca)     → botão magnético (desktop, sem reduce) + scale ao pressionar
     PH.tilt(el, {max})          → tilt 3D + holofote (--mx/--my)
     PH.revelar(escopo)          → aplica reveal em .reveal/[data-reveal] dentro do escopo
     PH.wa(mensagem)             → URL do WhatsApp com a mensagem
     PH.quandoVisivel(el, onEntrar, onSair) → pausar/retomar animação fora da tela
     PH.refresh()                → ScrollTrigger.refresh() com debounce
     PH.q(seletor, raiz)         → Array de elementos
     PH.navAltura()              → altura da nav em px
     PH.fecharMenu()             → fecha o menu mobile se estiver aberto
   Carregue este arquivo como ÚLTIMO script síncrono do body (o molde já faz): ele
   inicia na hora, sem esperar DOMContentLoaded (que só dispara depois dos módulos
   pesados como o Three), então o preloader começa a contar imediatamente.
   ============================================================ */
(function () {
  'use strict';

  var html = document.documentElement;
  html.classList.add('js');

  /* ---------- flags ---------- */
  var forcaAnim = /[?&]anim=1(&|$)/.test(location.search);
  // Decisão do Guilherme (06/09/2026): os efeitos de scroll são o chamariz do site e ficam ligados mesmo com
  // "reduzir movimento" no sistema (o Windows liga isso quando "Efeitos de animação" está desligado).
  // Só ?anim=0 na URL desliga tudo. `prefereReduzir` continua exposto para as seções acalmarem loops decorativos.
  var prefereReduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches && !forcaAnim;
  var reduzido = /[?&]anim=0(&|$)/.test(location.search);
  var toque = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var mobile = window.matchMedia('(max-width: 760px)').matches;
  var temGsap = !!(window.gsap && window.ScrollTrigger);
  var animando = temGsap && !reduzido; // só aqui o html ganha .anim

  if (animando) html.classList.add('anim'); else html.classList.remove('anim');

  var WA_NUMERO = '5551994372227';
  var WA_PADRAO = 'Olá! Vim pelo site da Prime Higienize e quero um orçamento.';

  var gsap = window.gsap, ST = window.ScrollTrigger;
  if (temGsap) {
    var plugins = [ST];
    if (window.ScrollToPlugin) plugins.push(window.ScrollToPlugin);
    if (window.SplitText) plugins.push(window.SplitText);
    gsap.registerPlugin.apply(gsap, plugins);
    ST.config({ ignoreMobileResize: true });
  }

  /* ---------- utilitários internos ---------- */
  function q(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function el(sel) { return typeof sel === 'string' ? document.querySelector(sel) : sel; }
  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
  function navAltura() { var n = document.getElementById('nav'); return n ? n.offsetHeight : 80; }

  /* ---------- PH (API pública) ---------- */
  var secoes = [], secoesRodaram = false;
  var PH = window.PH = {
    versao: '1.1.0-prime',
    reduzido: reduzido, prefereReduzir: prefereReduzir, toque: toque, mobile: mobile, temGsap: temGsap, animando: animando,
    gsap: gsap, ScrollTrigger: ST,
    WA_NUMERO: WA_NUMERO, WA_PADRAO: WA_PADRAO,
    q: q,
    navAltura: navAltura
  };

  /* WhatsApp: URL com mensagem em PT-BR já codificada */
  PH.wa = function (mensagem) {
    return 'https://wa.me/' + WA_NUMERO + '?text=' + encodeURIComponent(mensagem || WA_PADRAO);
  };

  /* refresh com debounce (chamar depois de mudar layout: fontes, imagens, acordeão…) */
  var refreshAgora = debounce(function () {
    if (temGsap) ST.refresh();
    setTimeout(conferirReveals, 300);
  }, 150);
  PH.refresh = function () { refreshAgora(); };

  /* registro de seções: fn(ctx) roda uma vez, depois do preloader, em ordem de registro */
  PH.secao = function (nome, fn) {
    var s = { nome: nome, fn: fn };
    secoes.push(s);
    if (secoesRodaram) executarSecao(s);
  };
  function contexto(nome) {
    return {
      nome: nome,
      el: document.getElementById(nome) || document.querySelector('[data-secao="' + nome + '"]'),
      gsap: gsap, ScrollTrigger: ST,
      reduzido: reduzido, prefereReduzir: prefereReduzir, toque: toque, mobile: mobile, animando: animando,
      wa: PH.wa, q: q, navAltura: navAltura
    };
  }
  function executarSecao(s) {
    try { s.fn(contexto(s.nome)); }
    catch (e) { console.error('[PH] seção "' + s.nome + '" falhou e foi ignorada:', e); }
  }
  function rodarSecoes() {
    if (secoesRodaram) return;
    secoesRodaram = true;
    secoes.forEach(executarSecao);
    if (temGsap) {
      if (animando) autoSplit(); // com reduce o título fica inteiro e visível (sem movimento)
      PH.revelar(document);
      ST.sort();
      ST.refresh();
    }
    setTimeout(conferirReveals, 1500);
  }

  /* visibilidade: pausar animações contínuas fora da tela */
  PH.quandoVisivel = function (alvo, onEntrar, onSair) {
    var e = el(alvo); if (!e) return null;
    if (temGsap) {
      return ST.create({
        trigger: e, start: 'top bottom', end: 'bottom top',
        onToggle: function (self) { self.isActive ? (onEntrar && onEntrar(self)) : (onSair && onSair(self)); }
      });
    }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (x) { x.isIntersecting ? (onEntrar && onEntrar(x)) : (onSair && onSair(x)); });
      });
      io.observe(e); return io;
    }
    onEntrar && onEntrar(); return null;
  };

  /* magnético: o elemento segue o mouse com mola (desktop, com animação) */
  PH.magnetico = function (alvo, forca) {
    var e = el(alvo); if (!e || toque || !animando || e._ovMag) return;
    e._ovMag = true;
    forca = typeof forca === 'number' ? forca : 0.3;
    var mx = gsap.quickTo(e, 'x', { duration: .45, ease: 'power3' });
    var my = gsap.quickTo(e, 'y', { duration: .45, ease: 'power3' });
    e.addEventListener('pointermove', function (ev) {
      var r = e.getBoundingClientRect();
      mx((ev.clientX - (r.left + r.width / 2)) * forca);
      my((ev.clientY - (r.top + r.height / 2)) * forca);
    });
    // pressionado: o :active do CSS não aparece aqui (o transform inline do GSAP vence a folha),
    // então o "apertar" é feito pelo GSAP — só scale, sem mexer no x/y do quickTo
    var soltar = function () { gsap.to(e, { scale: 1, duration: .3, ease: 'power2.out' }); };
    e.addEventListener('pointerdown', function () { gsap.to(e, { scale: .96, duration: .15, ease: 'power2.out' }); });
    e.addEventListener('pointerup', soltar);
    e.addEventListener('pointercancel', soltar);
    e.addEventListener('pointerleave', function () { mx(0); my(0); soltar(); });
  };

  /* tilt 3D + holofote: alimenta --mx/--my para o ::after do .cartao */
  PH.tilt = function (alvo, opts) {
    var e = el(alvo); if (!e || toque || !animando || e._ovTilt) return;
    e._ovTilt = true;
    var max = (opts && opts.max) || 10;
    gsap.set(e, { transformPerspective: 900 });
    var rx = gsap.quickTo(e, 'rotationX', { duration: .5, ease: 'power2' });
    var ry = gsap.quickTo(e, 'rotationY', { duration: .5, ease: 'power2' });
    e.addEventListener('pointermove', function (ev) {
      var r = e.getBoundingClientRect();
      var nx = (ev.clientX - r.left) / r.width - .5;
      var ny = (ev.clientY - r.top) / r.height - .5;
      rx(ny * -max); ry(nx * max * 1.2);
      e.style.setProperty('--mx', ((nx + .5) * 100) + '%');
      e.style.setProperty('--my', ((ny + .5) * 100) + '%');
    });
    e.addEventListener('pointerleave', function () { rx(0); ry(0); });
  };

  /* ---------- reveal genérico ----------
     .reveal ou [data-reveal="up|left|right|zoom|fade"], opcional data-reveal-atraso="0.2".
     Só anima quando html.anim; senão o CSS já deixa tudo visível. */
  var ESTADOS = {
    up: { y: 34 }, left: { x: -44 }, right: { x: 44 }, zoom: { scale: .9 }, fade: {}
  };
  PH.revelar = function (escopo) {
    if (!animando) return;
    var raiz = el(escopo) || document;
    var lista = q('.reveal:not([data-ov-r]), [data-reveal]:not([data-ov-r])', raiz);
    if (!lista.length) return;
    lista.forEach(function (e) {
      e.setAttribute('data-ov-r', '1');
      var tipo = e.getAttribute('data-reveal') || 'up';
      var de = Object.assign({ autoAlpha: 0 }, ESTADOS[tipo] || ESTADOS.up);
      gsap.set(e, de);
    });
    ST.batch(lista, {
      start: 'top 98%', once: true, // revela assim que entra (98%): nada fica invisível no pé da tela
      onEnter: function (lote) {
        lote.forEach(function (e) {
          var atraso = parseFloat(e.getAttribute('data-reveal-atraso')) || 0;
          gsap.to(e, {
            autoAlpha: 1, x: 0, y: 0, scale: 1, duration: .95, ease: 'power3.out',
            delay: atraso + lote.indexOf(e) * .09, overwrite: 'auto',
            onComplete: function () { e.classList.add('is-visto'); gsap.set(e, { clearProps: 'opacity,visibility,transform' }); }
          });
        });
      }
    });
  };
  /* fallback: nada pode ficar invisível na dobra (ex.: pin/refresh perdeu o gatilho) */
  function conferirReveals() {
    if (!animando) return;
    var vh = window.innerHeight;
    q('.reveal:not(.is-visto), [data-reveal]:not(.is-visto), [data-split]:not(.is-visto)').forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      if (parseFloat(getComputedStyle(e).opacity) > .05) return;
      e.classList.add('is-visto');
      gsap.to(e, { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: .6, overwrite: 'auto',
        onComplete: function () { gsap.set(e, { clearProps: 'opacity,visibility,transform' }); } });
      q('.c, .w, .l', e).forEach(function (p) { gsap.set(p, { clearProps: 'all' }); });
    });
    // split automático: o contêiner já é .is-visto, quem some são as partes — se o gatilho não
    // disparou (título acima da dobra depois de âncora/refresh), mostra tudo e mata o tween
    q('[data-ov-split]').forEach(function (e) {
      var r = e.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      var partes = q('.c, .w, .l', e);
      var escondidas = partes.filter(function (p) { return parseFloat(getComputedStyle(p).opacity) < .05; });
      if (!escondidas.length) return;
      if (e._ovSplitTween) { if (e._ovSplitTween.scrollTrigger) e._ovSplitTween.scrollTrigger.kill(); e._ovSplitTween.kill(); e._ovSplitTween = null; }
      gsap.to(partes, { autoAlpha: 1, yPercent: 0, duration: .5, overwrite: 'auto',
        onComplete: function () { gsap.set(partes, { clearProps: 'opacity,visibility,transform' }); } });
    });
  }

  /* ---------- split de texto ----------
     PH.split(el, {tipo:'chars'|'words'|'lines', mascara:true}) → Array de spans.
     Usa SplitText quando existe; senão divide à mão (chars/words). */
  PH.split = function (alvo, opts) {
    var e = el(alvo); if (!e) return [];
    opts = opts || {};
    var tipo = opts.tipo || 'chars';
    if (opts.mascara) e.classList.add('split-mascara');
    e.setAttribute('data-split', tipo);
    e.setAttribute('data-ov-split', '1');
    // o contêiner fica visível (quem esconde/anima são os pedaços devolvidos)
    e.classList.add('is-visto');
    if (temGsap) gsap.set(e, { autoAlpha: 1 });
    if (window.SplitText) {
      try {
        var type = tipo === 'lines' ? 'lines' : tipo === 'words' ? 'words' : 'words,chars';
        var s = window.SplitText.create(e, { type: type, charsClass: 'c', wordsClass: 'w', linesClass: 'l', tag: 'span', aria: 'auto' });
        e._ovSplit = s;
        return tipo === 'lines' ? s.lines : tipo === 'words' ? s.words : s.chars;
      } catch (err) { console.warn('[PH] SplitText falhou, dividindo à mão', err); }
    }
    // divisão manual (preserva um filho inline como .acento)
    var texto = e.textContent.replace(/\s+/g, ' ').trim();
    e.setAttribute('aria-label', texto);
    var saida = [];
    var nos = Array.prototype.slice.call(e.childNodes);
    e.textContent = '';
    nos.forEach(function (no) {
      var destino = e;
      if (no.nodeType === 1) { destino = no.cloneNode(false); e.appendChild(destino); }
      var t = (no.textContent || '').replace(/\s+/g, ' ');
      t.split(' ').forEach(function (palavra, i, arr) {
        if (palavra) {
          var w = document.createElement('span'); w.className = 'w'; w.setAttribute('aria-hidden', 'true');
          if (tipo === 'chars') {
            palavra.split('').forEach(function (ch) { var c = document.createElement('span'); c.className = 'c'; c.textContent = ch; w.appendChild(c); saida.push(c); });
          } else { w.textContent = palavra; saida.push(w); }
          destino.appendChild(w);
        }
        if (i < arr.length - 1) destino.appendChild(document.createTextNode(' '));
      });
    });
    return saida;
  };
  /* [data-split] automático: divide quando as fontes carregam e sobe as letras ao entrar na tela.
     Só roda com `animando` (sem reduce); com reduce o título não é dividido e fica visível. */
  function autoSplit() {
    if (!animando) return;
    var alvos = q('[data-split]:not([data-ov-split])');
    if (!alvos.length) return;
    var rodar = function () {
      alvos.forEach(function (e) {
        var tipo = e.getAttribute('data-split') || 'chars';
        if (tipo === 'true' || tipo === '') tipo = 'chars';
        var partes = PH.split(e, { tipo: tipo, mascara: true });
        if (!partes.length) return;
        gsap.set(partes, { yPercent: 110, autoAlpha: 0 });
        e._ovSplitTween = gsap.to(partes, {
          yPercent: 0, autoAlpha: 1, duration: .8, ease: 'power3.out',
          stagger: tipo === 'chars' ? .018 : tipo === 'words' ? .06 : .12,
          scrollTrigger: { trigger: e, start: 'top 96%', once: true },
          onComplete: function () { e._ovSplitTween = null; gsap.set(partes, { clearProps: 'opacity,visibility,transform' }); }
        });
      });
      ST.refresh();
      setTimeout(conferirReveals, 1200); // rede de segurança para título já acima da dobra
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(rodar); else rodar();
  }

  /* ---------- essenciais (funcionam mesmo sem GSAP) ---------- */
  function essenciais() {
    // ano no rodapé
    var ano = document.getElementById('ano'); if (ano) ano.textContent = new Date().getFullYear();

    // data-wa="mensagem" → href do WhatsApp
    q('a[data-wa]').forEach(function (a) {
      a.href = PH.wa(a.getAttribute('data-wa') || WA_PADRAO);
      a.target = '_blank'; a.rel = 'noopener';
    });

    // nav sobre a primeira seção: clara (logo verde) ou escura (logo marfim).
    // A seção do topo declara data-nav="escura" | "clara"; sem declaração, decide pelas classes.
    var nav = document.getElementById('nav');
    var primeira = document.querySelector('main > section');
    if (nav) {
      var declarado = primeira && primeira.getAttribute('data-nav');
      var escura = declarado ? declarado === 'escura'
        : !!(primeira && primeira.matches('.secao--escura, .secao--verde, .escuro'));
      nav.classList.toggle('is-clara', !escura);
    }

    // nav sólida + barra de progresso + wafloat (um só listener de scroll)
    var barra = document.getElementById('progressoBarra');
    var wa = document.getElementById('wafloat');
    var agendado = false;
    function aoRolar() {
      agendado = false;
      var y = window.scrollY || window.pageYOffset;
      if (nav) nav.classList.toggle('is-solida', y > 40);
      if (wa) wa.classList.toggle('is-visivel', y > 500);
      if (barra) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        barra.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      }
    }
    window.addEventListener('scroll', function () { if (!agendado) { agendado = true; requestAnimationFrame(aoRolar); } }, { passive: true });
    aoRolar();

    // menu mobile com foco preso. O laço inclui o que fica visível sobre o menu (logo, CTA e burger
    // da nav) + os links do menu, na ordem do documento — assim o Tab passa pelo "Fechar menu".
    var burger = document.getElementById('burger');
    var menu = document.getElementById('menu');
    if (burger && menu) {
      var aberto = false;
      var visivel = function (x) { return x.offsetParent !== null; };
      var focaveis = function () {
        var daNav = nav ? q('a[href], button', nav) : [burger];
        return daNav.concat(q('a[href], button', menu)).filter(visivel);
      };
      var dentroDoLaco = function (x) { return menu.contains(x) || (nav ? nav.contains(x) : x === burger); };
      var alternar = function (forcar) {
        aberto = typeof forcar === 'boolean' ? forcar : !aberto;
        menu.classList.toggle('is-aberto', aberto);
        burger.classList.toggle('is-aberto', aberto);
        burger.setAttribute('aria-expanded', String(aberto));
        burger.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
        menu.setAttribute('aria-hidden', String(!aberto));
        document.body.classList.toggle('menu-aberto', aberto);
        if (aberto) { setTimeout(function () { var f = q('a[href], button', menu).filter(visivel)[0]; if (aberto && f) f.focus(); }, 60); }
        else if (menu.contains(document.activeElement)) burger.focus();
      };
      burger.addEventListener('click', function () { alternar(); });
      document.addEventListener('keydown', function (e) {
        if (!aberto) return;
        if (e.key === 'Escape') { alternar(false); burger.focus(); return; }
        if (e.key === 'Tab') {
          var f = focaveis(); if (!f.length) return;
          var primeiro = f[0], ultimo = f[f.length - 1];
          if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
          else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
          else if (!dentroDoLaco(document.activeElement)) { e.preventDefault(); primeiro.focus(); }
        }
      });
      // clicar num link de âncora do menu (ou no logo da nav, que fica visível sobre o menu) fecha o menu
      q('a[href^="#"]', menu).concat(nav ? q('.nav__marca[href^="#"]', nav) : []).forEach(function (a) { a.addEventListener('click', function () { alternar(false); }); });
      window.addEventListener('resize', function () { if (aberto && window.innerWidth > 900) alternar(false); });
      PH.fecharMenu = function () { if (aberto) alternar(false); };
    }

    // âncoras suaves com offset da nav (ScrollToPlugin quando existe)
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href'); if (!id || id.length < 2) return;
      var alvo = document.querySelector(id); if (!alvo) return;
      e.preventDefault();
      // foco vai para o alvo NA HORA (leitor de tela e teclado não esperam a rolagem); o tween só rola
      if (!alvo.hasAttribute('tabindex')) alvo.setAttribute('tabindex', '-1');
      alvo.focus({ preventScroll: true });
      if (temGsap && window.ScrollToPlugin && !reduzido) {
        gsap.to(window, {
          scrollTo: { y: alvo, offsetY: navAltura() - 1, autoKill: true },
          duration: 1.1, ease: 'power3.inOut', overwrite: 'auto'
        });
      } else {
        var y = alvo.getBoundingClientRect().top + window.scrollY - navAltura() + 1;
        window.scrollTo({ top: y, behavior: reduzido ? 'auto' : 'smooth' });
      }
    });

    // link ativo na nav conforme a seção visível
    if (temGsap) {
      q('.nav__links a[href^="#"]').forEach(function (a) {
        var sec = document.querySelector(a.getAttribute('href')); if (!sec) return;
        ST.create({
          trigger: sec, start: 'top 45%', end: 'bottom 45%',
          onToggle: function (self) { a.classList.toggle('is-ativo', self.isActive); }
        });
      });
    }
  }

  /* ---------- cursor customizado (desktop, com animação) ---------- */
  function cursor() {
    var cur = document.getElementById('cursor'), ponto = document.getElementById('cursorPonto');
    if (!cur || !ponto || !animando || toque || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    // nasce escondido (.is-fora no HTML) para não sobrar um pedaço de anel no canto (0,0) antes do 1º movimento
    cur.classList.add('is-fora'); ponto.classList.add('is-fora');
    html.classList.add('cursor-ok');
    var cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' });
    var cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
    var px = gsap.quickTo(ponto, 'x', { duration: .1, ease: 'power3' });
    var py = gsap.quickTo(ponto, 'y', { duration: .1, ease: 'power3' });
    var primeiro = true;
    var mostrar = function () { cur.classList.remove('is-fora'); ponto.classList.remove('is-fora'); };
    var esconder = function () { cur.classList.add('is-fora'); ponto.classList.add('is-fora'); };
    window.addEventListener('pointermove', function (e) {
      if (primeiro) { primeiro = false; gsap.set([cur, ponto], { x: e.clientX, y: e.clientY }); } // sem deslizar desde o canto
      cx(e.clientX); cy(e.clientY); px(e.clientX); py(e.clientY); mostrar();
    }, { passive: true });
    document.addEventListener('pointerover', function (e) { if (e.target.closest && e.target.closest('a, button, [data-tilt], [data-cursor], label')) cur.classList.add('is-hover'); });
    document.addEventListener('pointerout', function (e) { if (e.target.closest && e.target.closest('a, button, [data-tilt], [data-cursor], label')) cur.classList.remove('is-hover'); });
    document.documentElement.addEventListener('mouseleave', esconder);
    document.documentElement.addEventListener('mouseenter', function () { if (!primeiro) mostrar(); });
  }

  /* ---------- preloader: contador + arco desenhado + cortina ---------- */
  function preloader(aoRevelar) {
    var pre = document.getElementById('preloader');
    var nav = document.getElementById('nav');
    var mostrarNav = function () { if (nav) gsap.set(nav, { autoAlpha: 1, y: 0 }); };

    if (!pre) { mostrarNav(); aoRevelar(); return; }
    if (!animando) { pre.parentNode.removeChild(pre); mostrarNav(); aoRevelar(); return; }

    var num = document.getElementById('preNum');
    var barra = pre.querySelector('.preloader__barra i');
    var tiras = q('.preloader__cortina i', pre);
    var tracos = q('.preloader__sofa path', pre);
    var contador = { v: 0 };
    var revelou = false;

    tracos.forEach(function (p) {
      var L = p.getTotalLength ? p.getTotalLength() : 600;
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
    });

    function subirCortina() {
      if (revelou) return; revelou = true;
      var tl = gsap.timeline({ onComplete: function () { if (pre.parentNode) pre.parentNode.removeChild(pre); PH.refresh(); } });
      tl.to(pre.querySelector('.preloader__miolo'), { autoAlpha: 0, y: -22, duration: .35, ease: 'power2.in' })
        .set(pre, { backgroundColor: 'transparent', pointerEvents: 'none' })
        .add(function () { aoRevelar(); })
        .to(tiras, { scaleY: 0, duration: .8, stagger: .06, ease: 'power4.inOut' }, '-=.05')
        .to(nav, { autoAlpha: 1, y: 0, duration: .8, ease: 'power3.out' }, '-=.5');
    }

    gsap.timeline({ onComplete: subirCortina })
      .to(tracos, { strokeDashoffset: 0, duration: 1.0, ease: 'power2.inOut', stagger: .14 }, 0)
      .to(contador, {
        v: 100, duration: 1.3, ease: 'power2.inOut',
        onUpdate: function () {
          if (num) num.textContent = String(Math.round(contador.v)).padStart(2, '0');
          if (barra) barra.style.width = contador.v + '%';
        }
      }, 0);

    // seguro: nada pode prender o site atrás do preloader
    setTimeout(function () {
      if (pre.parentNode) { console.warn('[PH] preloader forçado a fechar'); pre.parentNode.removeChild(pre); mostrarNav(); aoRevelar(); }
    }, 6000);
  }

  /* ---------- refresh garantido ---------- */
  function refreshes() {
    window.addEventListener('load', function () { PH.refresh(); setTimeout(conferirReveals, 1500); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { PH.refresh(); });
    var larguraAntes = window.innerWidth;
    var conferirDepois = debounce(conferirReveals, 400);
    window.addEventListener('resize', function () {
      conferirDepois(); // qualquer resize (até só de altura) reconfere o que ficou invisível na dobra
      if (window.innerWidth === larguraAntes) return; // iOS: barra de endereço muda só a altura
      larguraAntes = window.innerWidth;
      PH.mobile = window.matchMedia('(max-width: 760px)').matches;
      PH.refresh();
    });
    // imagens lazy que mudam o layout ao carregar
    document.addEventListener('load', function (e) { if (e.target && e.target.tagName === 'IMG') PH.refresh(); }, true);
  }

  /* ---------- fallback sem GSAP: site estático legível ---------- */
  function semGsap() {
    console.warn('[PH] GSAP não carregou — site em modo estático');
    html.classList.remove('anim');
    var pre = document.getElementById('preloader'); if (pre) pre.parentNode.removeChild(pre);
    var nav = document.getElementById('nav'); if (nav) { nav.style.opacity = '1'; nav.style.transform = 'none'; }
  }

  /* ---------- boot ---------- */
  function iniciar() {
    essenciais();
    if (!temGsap) { semGsap(); rodarSecoes(); return; }
    cursor();
    q('[data-magnetico]').forEach(function (e) { PH.magnetico(e, parseFloat(e.getAttribute('data-magnetico')) || .3); });
    q('[data-tilt]').forEach(function (e) { PH.tilt(e, { max: parseFloat(e.getAttribute('data-tilt')) || 10 }); });
    refreshes();
    preloader(rodarSecoes);
  }

  // Este script é o último síncrono do body: tudo acima (nav, seções, rodapé, wafloat) já foi parseado,
  // então inicia na hora — DOMContentLoaded só dispararia depois de TODOS os <script type="module">
  // (um .module.js com Three ≈ 750 KB deixaria o contador do preloader parado em "00%").
  // Se alguém carregar o núcleo no <head>, o wafloat ainda não existe e aí esperamos o DOM.
  if (document.readyState !== 'loading' || document.getElementById('wafloat')) iniciar();
  else document.addEventListener('DOMContentLoaded', iniciar);
})();
