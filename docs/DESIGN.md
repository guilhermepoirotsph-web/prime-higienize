# Prime Higienize — manual do design system (para quem edita uma seção)

> Leia `DADOS.md` antes (dados, fotos, frases permitidas e lacunas). Mesmo molde do Odonto Vitallis, retokenizado.

## Contrato de arquivos
| o que | onde | regra |
|---|---|---|
| seção (HTML) | `partes/NN-nome.html` | UMA `<section id="…">` por arquivo; ordem pelo prefixo |
| CSS da seção | `assets/css/secoes/NN-nome.css` | classes prefixadas (`.servicos__card`) |
| JS da seção | `assets/js/secoes/NN-nome.js` | tudo dentro de `window.PH && PH.secao('id', fn)` |
| montar | `node montar.mjs` | gera `index.html` (não editar à mão) |

Ids que a nav linka: `#servicos`, `#antes-depois`, `#como-funciona`, `#videos`, `#clientes`, `#faq`. O herói é a primeira seção (`#heroi`, único `<h1>`).

## Tokens (`base.css`)
- Ouro `--ouro #f8c828` · `--ouro-claro` · `--ouro-escuro` · `--ouro-brilho` · **texto sobre claro: `--ouro-texto #7a5c00`** (ouro puro nunca como texto pequeno sobre claro)
- Escuros `--preto-950 #070707` · `--preto-900 #0f0f10` · `--carvao` · `--grafite` · Claros `--creme #fbf8f0` · `--creme-2` · `--cinza-claro` · `--branco`
- Texto `--texto #141414` · `--texto-suave` · `--muted-texto #595959` · WhatsApp `--wa #158043`
- Fontes: Montserrat (display, 700/800, caixa alta) · Manrope (texto) · Caveat (`.acento`, 1–2 palavras manuscritas em ouro)

### Fundos de seção
`.secao--clara` (creme) · `.secao--branca` · `.secao--creme-2` · `.secao--escura` (preto-900) · `.secao--ouro` (ouro com texto preto) · `.textura-marca` (letreiro PRIME em contorno) · `.grade-fina` · `.brilho-ouro`

## Componentes
- Cabeçalho: `.cabecalho-secao` (+`--centro`) com `.eyebrow` + `.h2[data-split="words"]` + `.lead.reveal`
- Botões: `.btn--wa` (WhatsApp, sempre com `data-wa="mensagem"`), `.btn--ouro`, `.btn--preto`, `.btn--vidro` (sobre escuro), `.btn--vidro-escuro` (sobre claro), `.btn--fantasma`; tamanhos `--sm/--lg/--xl`; `data-magnetico`
- `.cartao` (+`--vidro` sobre escuro) com `data-tilt` · `.moldura` (+`--paisagem/--quadrada/--retrato/--linha`) · `.icone-circulo` (+`--ouro`) · `.tag/.chip` · `.lista-check`
- **Comparador antes/depois** `figure.comparar[data-comparar][data-inicio="50"]` com `.comparar__antes`, `.comparar__depois`, rótulos, `.comparar__linha`, `button.comparar__alca[role=slider]`, `.comparar__dica` — `PH.comparar(el)` (definido em `10-heroi.js`)
- Ícones por `<use href="#ph-…">`: `ph-sofa` (símbolo do logo, `--traco`), `ph-whats`, `ph-insta`, `ph-pino`, `ph-seta`, `ph-check`, `ph-play`, `ph-estrela`, `ph-casa`, `ph-gota`, `ph-escudo`

## Movimento (`window.PH`)
Flags `PH.animando` (GSAP ok e sem `?anim=0`), `PH.mobile`, `PH.toque`. Atributos: `.reveal` / `data-reveal="up|left|right|zoom|fade"` (+`data-reveal-atraso`), `data-split="words|chars"`, `data-magnetico`, `data-tilt`, `data-wa`, `data-nav="escura|clara"` no herói.
API: `PH.secao`, `PH.split`, `PH.magnetico`, `PH.tilt`, `PH.revelar`, `PH.wa`, `PH.quandoVisivel` (obrigatório em loop contínuo), `PH.refresh`, `PH.q`, `PH.navAltura`, `PH.fecharMenu`, `PH.comparar`.
Regras: nada fica invisível (o CSS só esconde com `html.anim` e o JS sempre mostra); `fromTo` em timeline pausada; pin em wrapper próprio com `invalidateOnRefresh` e sem pin no celular; sem `transition: transform` em elemento que o GSAP move; um canvas WebGL por página (herói, só desktop); `?anim=0` desliga tudo, `?3d=0` só as partículas.

## Testar
```bash
node montar.mjs
# Chrome headless (puppeteer-core): scratchpad da sessão → ferr/capturar.mjs --largura=1440 --altura=900 | --largura=390 --altura=844
# sonda interativa: ferr/sonda.mjs (preloader, partículas, comparador, modal, FAQ, chips, menu, 320px, ?anim=0)
```
Checklist: zero erro de console, `overflowX 0`, nada invisível na dobra, tap targets ≥ 44px, 1 `<h1>`, `alt` reais, só dados do `DADOS.md`.
