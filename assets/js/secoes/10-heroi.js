/* ===== 10 · HERÓI — entrada, comparador antes/depois (PH.comparar) e partículas 3D no idle ===== */
(function () {
  'use strict';

  /* Comparador antes/depois: arraste (pointer), teclado (setas) e clique na foto.
     Reutilizado pela seção 40. Exposto em PH.comparar(el). */
  function comparar(el) {
    if (!el || el._phCmp) return; el._phCmp = true;
    var alca = el.querySelector('.comparar__alca');
    var inicio = parseFloat(el.getAttribute('data-inicio')) || 50;
    var pos = inicio, arrastando = false, usado = false;
    var temGsap = !!window.gsap;
    var setX = temGsap ? window.gsap.quickTo(el, '--x', { duration: .25, ease: 'power3', unit: '%' }) : null;

    function aplicar(p, imediato) {
      pos = Math.max(0, Math.min(100, p));
      if (setX && !imediato) setX(pos); else el.style.setProperty('--x', pos + '%');
      if (alca) alca.setAttribute('aria-valuenow', String(Math.round(pos)));
      if (!usado && Math.abs(pos - inicio) > 3) { usado = true; el.classList.add('is-usado'); }
    }
    function daPosicao(ev) {
      var r = el.getBoundingClientRect();
      return ((ev.clientX - r.left) / r.width) * 100;
    }
    el.style.setProperty('--x', inicio + '%');

    el.addEventListener('pointerdown', function (ev) {
      if (ev.button !== undefined && ev.button !== 0) return;
      arrastando = true; el.classList.add('is-arrastando');
      try { el.setPointerCapture(ev.pointerId); } catch (e) {}
      aplicar(daPosicao(ev), true);
      ev.preventDefault();
    });
    el.addEventListener('pointermove', function (ev) { if (arrastando) aplicar(daPosicao(ev)); });
    var soltar = function (ev) { if (!arrastando) return; arrastando = false; el.classList.remove('is-arrastando'); try { el.releasePointerCapture(ev.pointerId); } catch (e) {} };
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
    if (alca) alca.addEventListener('keydown', function (ev) {
      var passo = ev.shiftKey ? 10 : 3;
      if (ev.key === 'ArrowLeft' || ev.key === 'ArrowDown') { aplicar(pos - passo); ev.preventDefault(); }
      else if (ev.key === 'ArrowRight' || ev.key === 'ArrowUp') { aplicar(pos + passo); ev.preventDefault(); }
      else if (ev.key === 'Home') { aplicar(0); ev.preventDefault(); }
      else if (ev.key === 'End') { aplicar(100); ev.preventDefault(); }
    });
    return { ir: aplicar, get pos() { return pos; } };
  }
  if (window.PH) window.PH.comparar = comparar;

  window.PH && PH.secao('heroi', function (ctx) {
    var el = ctx.el; if (!el) return;
    var cmp = comparar(el.querySelector('[data-comparar]'));

    if (!ctx.animando) {
      // sem animação: mostra tudo (o CSS esconde só com html.anim)
      ctx.q('.heroi__eyebrow,.heroi__lead,.heroi__acoes,.heroi__provas,.heroi__palco,.heroi__rolar', el).forEach(function (e) { e.style.opacity = 1; });
      return;
    }
    var gsap = ctx.gsap;
    var titulo = el.querySelector('.heroi__titulo');
    var partes = PH.split(titulo, { tipo: 'words', mascara: true });
    gsap.set(partes, { yPercent: 110, autoAlpha: 0 });

    // timeline de entrada (fromTo sempre — timeline nasce depois do preloader, mas o padrão da casa é destino explícito)
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.heroi__eyebrow', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .6 }, .1)
      .to(partes, { yPercent: 0, autoAlpha: 1, duration: .9, stagger: .055, ease: 'power4.out',
        onComplete: function () { gsap.set(partes, { clearProps: 'opacity,visibility,transform' }); } }, .2)
      .fromTo('.heroi__lead', { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .8 }, .75)
      .fromTo('.heroi__acoes', { autoAlpha: 0, y: 22 }, { autoAlpha: 1, y: 0, duration: .8 }, .9)
      .fromTo('.heroi__provas', { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: .7 }, 1.05)
      .fromTo('.heroi__palco', { autoAlpha: 0, y: 40, scale: .96 }, { autoAlpha: 1, y: 0, scale: 1, duration: 1.1, ease: 'power4.out' }, .5)
      .fromTo('.heroi__rolar', { autoAlpha: 0 }, { autoAlpha: .85, duration: .6 }, 1.4);

    // demonstração: a alça "limpa" sozinha uma vez, para o visitante entender o gesto
    if (cmp) {
      var demo = { v: cmp.pos };
      tl.to(demo, { v: 72, duration: 1.4, ease: 'power2.inOut', onUpdate: function () { if (!el.querySelector('.comparar').classList.contains('is-arrastando')) cmp.ir(demo.v, true); } }, 1.6)
        .to(demo, { v: 46, duration: 1.1, ease: 'power2.inOut', onUpdate: function () { if (!el.querySelector('.comparar').classList.contains('is-arrastando')) cmp.ir(demo.v, true); } }, 3.1);
    }

    // parallax leve do palco e da copy no scroll
    gsap.to('.heroi__palco', { yPercent: -8, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.heroi__copy', { yPercent: 10, autoAlpha: .35, ease: 'none', scrollTrigger: { trigger: el, start: '40% top', end: 'bottom top', scrub: true } });

    // partículas 3D (Three.js, ~730 KB) só no desktop com mouse (é o cursor que "aspira"), no idle,
    // e se não desligadas por ?3d=0. No celular o herói fica com a luz em CSS (peso e bateria).
    var querTres = !/[?&]3d=0(&|$)/.test(location.search) && !ctx.mobile && !ctx.toque;
    if (querTres) {
      var carregar = function () {
        // caminho absoluto a partir da raiz do site (o import() relativo resolvia a partir de assets/js/secoes/)
        import(new URL('assets/js/particulas.js', document.baseURI).href).then(function (m) { m.iniciar(document.getElementById('heroiParticulas'), { mobile: ctx.mobile, quandoVisivel: PH.quandoVisivel }); })
          .catch(function (e) { console.warn('[PH] partículas 3D não carregaram (o herói segue sem elas)', e); });
      };
      if ('requestIdleCallback' in window) requestIdleCallback(carregar, { timeout: 2500 }); else setTimeout(carregar, 1200);
    }
  });
})();
