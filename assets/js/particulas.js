/* ===== Partículas 3D do herói — "poeira" dourada no feixe de luz que o cursor aspira =====
   Three.js local (importmap 'three'). Carregado só no idle pelo 10-heroi.js; se falhar, o herói segue igual.
   Regras: um canvas WebGL por página · pausa fora da tela · pixelRatio limitado · menos partículas no celular. */
import * as THREE from 'three';

export function iniciar(alvo, opts) {
  if (!alvo || alvo._phTres) return; alvo._phTres = true;
  opts = opts || {};
  var mobile = !!opts.mobile;
  var N = mobile ? 900 : 2200;

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' }); }
  catch (e) { console.warn('[PH] WebGL indisponível', e); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 1.25));
  renderer.setClearColor(0x000000, 0);
  alvo.appendChild(renderer.domElement);

  var cena = new THREE.Scene();
  var cam = new THREE.PerspectiveCamera(50, 1, .1, 100);
  cam.position.set(0, 0, 9);

  // geometria: nuvem de poeira num volume raso, mais densa à direita (onde está a "luz" do CSS)
  var pos = new Float32Array(N * 3), base = new Float32Array(N * 3), tam = new Float32Array(N), fase = new Float32Array(N);
  for (var i = 0; i < N; i++) {
    var x = (Math.random() * 2 - 1) * 9 + (Math.random() < .55 ? 2.5 : 0);
    var y = (Math.random() * 2 - 1) * 5.5;
    var z = (Math.random() * 2 - 1) * 3;
    pos[i * 3] = base[i * 3] = x; pos[i * 3 + 1] = base[i * 3 + 1] = y; pos[i * 3 + 2] = base[i * 3 + 2] = z;
    tam[i] = .35 + Math.random() * 1.3; fase[i] = Math.random() * Math.PI * 2;
  }
  var geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
  geo.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));

  var mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTempo: { value: 0 }, uPR: { value: renderer.getPixelRatio() }, uCor: { value: new THREE.Color(0xf8c828) } },
    vertexShader: [
      'attribute float aTam; attribute float aFase; uniform float uTempo; uniform float uPR; varying float vA;',
      'void main(){',
      '  vec3 p = position;',
      '  p.x += sin(uTempo*.35 + aFase)*.25; p.y += cos(uTempo*.28 + aFase*1.7)*.22;',
      '  vec4 mv = modelViewMatrix * vec4(p,1.0);',
      '  gl_PointSize = aTam * uPR * (26.0 / -mv.z);',
      '  vA = .35 + .65*abs(sin(uTempo*.6 + aFase*3.0));',
      '  gl_Position = projectionMatrix * mv; }'
    ].join('\n'),
    fragmentShader: [
      'uniform vec3 uCor; varying float vA;',
      'void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); if (d > .5) discard;',
      '  float a = smoothstep(.5, .05, d) * vA * .55; gl_FragColor = vec4(uCor, a); }'
    ].join('\n')
  });
  var nuvem = new THREE.Points(geo, mat);
  cena.add(nuvem);

  // "aspirador": o cursor puxa as partículas próximas; ao sair, elas voltam devagar ao lugar
  var alvoMouse = new THREE.Vector3(99, 99, 0), mouse = new THREE.Vector3(99, 99, 0), temMouse = false;
  var raio = 2.6;
  function aoMover(ev) {
    var r = alvo.getBoundingClientRect();
    var nx = ((ev.clientX - r.left) / r.width) * 2 - 1, ny = -(((ev.clientY - r.top) / r.height) * 2 - 1);
    // projeta para o plano z=0 da cena (câmera em z=9, fov 50)
    var alt = Math.tan(THREE.MathUtils.degToRad(25)) * 9, larg = alt * cam.aspect;
    alvoMouse.set(nx * larg, ny * alt, 0); temMouse = true;
  }
  window.addEventListener('pointermove', aoMover, { passive: true });
  document.documentElement.addEventListener('mouseleave', function () { temMouse = false; alvoMouse.set(99, 99, 0); });

  function redimensionar() {
    var w = alvo.clientWidth || 1, h = alvo.clientHeight || 1;
    renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  redimensionar();
  window.addEventListener('resize', redimensionar);

  var ativo = true, relogio = new THREE.Clock(), acumulado = 0;
  var fps = mobile ? 30 : 60, passo = 1 / fps;
  function quadro() {
    if (!ativo) return;
    requestAnimationFrame(quadro);
    var dt = relogio.getDelta(); acumulado += dt; if (acumulado < passo) return; acumulado = 0;
    var t = relogio.elapsedTime; mat.uniforms.uTempo.value = t;
    mouse.lerp(alvoMouse, .12);
    var arr = geo.attributes.position.array;
    for (var i = 0; i < N; i++) {
      var ix = i * 3, bx = base[ix], by = base[ix + 1];
      var dx = mouse.x - arr[ix], dy = mouse.y - arr[ix + 1], d = Math.sqrt(dx * dx + dy * dy);
      if (temMouse && d < raio) { // sugado para o cursor (mais forte perto)
        var f = (1 - d / raio) * .18;
        arr[ix] += dx * f; arr[ix + 1] += dy * f;
      } else { // volta ao lugar de origem
        arr[ix] += (bx - arr[ix]) * .02; arr[ix + 1] += (by - arr[ix + 1]) * .02;
      }
    }
    geo.attributes.position.needsUpdate = true;
    nuvem.rotation.z = Math.sin(t * .05) * .03;
    renderer.render(cena, cam);
  }
  quadro();

  // pausa fora da tela (PH.quandoVisivel usa ScrollTrigger)
  if (opts.quandoVisivel) opts.quandoVisivel(alvo, function () { if (!ativo) { ativo = true; relogio.getDelta(); quadro(); } }, function () { ativo = false; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) ativo = false; else if (!ativo) { ativo = true; relogio.getDelta(); quadro(); } });
  alvo.classList.add('is-pronto');
}
