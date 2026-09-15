# Prime Higienize — landing page

Site estático (HTML + CSS + JS puro, GSAP e Three.js locais, sem build) montado por partes.
Padrão da casa GD Studio X (mesmo molde do Odonto Vitallis).

## Rodar / conferir
```powershell
# prévia local (http://localhost:8806)
node "C:\Users\sandr\OneDrive\Área de Trabalho\Clientes\Prime Higienizações\site\preview-server.mjs"

# prévia pública temporária para o cliente (cloudflared; link muda a cada vez, só funciona com o PC ligado)
powershell -ExecutionPolicy Bypass -File "C:\Users\sandr\OneDrive\Área de Trabalho\Clientes\Prime Higienizações\site\previa.ps1"
```

## Editar
- Cada seção é `partes/NN-nome.html` + `assets/css/secoes/NN-nome.css` + `assets/js/secoes/NN-nome.js`.
- Cabeçalho/nav/rodapé/preloader: `partes/_molde.html`. Tokens e componentes: `assets/css/base.css`. Núcleo (GSAP, reveal, magnético, WhatsApp): `assets/js/nucleo.js` (expõe `window.PH`).
- Depois de editar: `node montar.mjs` gera o `index.html` (nunca edite o index na mão).
- Dados e lacunas: `docs/DADOS.md` (fonte única de verdade). Manual das seções: `docs/DESIGN.md`.
- `?anim=0` na URL desliga todos os efeitos; `?3d=0` desliga só as partículas 3D do herói.

## Publicar (Cloudflare Pages)
O repositório guarda tudo; a hospedagem recebe só a pasta `_site/`, gerada por `node publicar.mjs`
(prévia, com noindex) ou `node publicar.mjs --dominio=https://www.primehigienize.com` (produção:
sem noindex, canonical/og:url, robots aberto, sitemap). O script aborta se um arquivo de bastidor,
um JWT perigoso ou uma referência quebrada entrar no pacote.

**Opção A — Git integrado (recomendado):** Cloudflare dashboard → Workers & Pages → Create → Pages →
Connect to Git → repo `prime-higienize` → Framework preset: *None* · Build command: `node publicar.mjs` ·
Build output directory: `_site` · Root directory: `/`. Cada `git push` republica. Quando o domínio for
ligado, trocar o build command para `node publicar.mjs --dominio=https://www.primehigienize.com`.

**Opção B — upload direto (sem Git):**
```powershell
node "C:\Users\sandr\OneDrive\Área de Trabalho\Clientes\Prime Higienizações\site\publicar.mjs"
npx wrangler pages deploy "C:\Users\sandr\OneDrive\Área de Trabalho\Clientes\Prime Higienizações\site\_site" --project-name prime-higienize
```

**Domínio:** Custom domains do projeto Pages → adicionar `www.primehigienize.com` (e o apex) — se o
domínio já estiver na Cloudflare, o DNS é criado sozinho; senão, CNAME `www` → `<projeto>.pages.dev`.
A bio do Instagram já aponta para `www.primehigienize.com` (sem DNS em 15/09/2026) — confirmar com o cliente se o domínio é dele.

`_headers` do pacote traz CSP, HSTS, X-Frame DENY, Referrer-Policy, Permissions-Policy e cache; em prévia também `X-Robots-Tag: noindex`.

## Pendências (confirmar com o cliente)
- Cidade/bairro e raio de atendimento (o site diz só "Rio Grande do Sul").
- Horário de atendimento, formas de pagamento, tempo médio de secagem (não foram publicados no site).
- Fotos em alta da equipe e dos serviços (as atuais vieram de prints de stories).
