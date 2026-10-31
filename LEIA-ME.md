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
(prévia, com noindex) ou `node publicar.mjs --dominio=https://www.primehigienize.com.br` (produção:
sem noindex, canonical/og:url, robots aberto, sitemap). O script aborta se um arquivo de bastidor,
um JWT perigoso ou uma referência quebrada entrar no pacote.

**Opção A — Git integrado (recomendado):** Cloudflare dashboard → Workers & Pages → Create → Pages →
Connect to Git → repo `prime-higienize` → Framework preset: *None* · Build command: `node publicar.mjs` ·
Build output directory: `_site` · Root directory: `/`. Cada `git push` republica. Com o domínio
ligado, o build command é `node publicar.mjs --dominio=https://www.primehigienize.com.br`.

**Opção B — upload direto (sem Git):**
```powershell
node "C:\Users\sandr\OneDrive\Área de Trabalho\Clientes\Prime Higienizações\site\publicar.mjs"
npx wrangler pages deploy "C:\Users\sandr\OneDrive\Área de Trabalho\Clientes\Prime Higienizações\site\_site" --project-name prime-higienize
```

**Opção C — de uma sessão na nuvem (Claude Code web), sem o wrangler logado:** guardar nas variáveis do
ambiente `CLOUDFLARE_API_TOKEN` (token de API com permissão *Cloudflare Pages: Edit*) e
`CLOUDFLARE_ACCOUNT_ID`; o wrangler lê as duas sozinho:
```bash
node publicar.mjs --dominio=https://www.primehigienize.com.br
npx --yes wrangler@4 pages deploy _site --project-name prime-higienize --branch main --commit-dirty=true
```

**Domínio:** `www.primehigienize.com.br` está ligado ao projeto Pages e, desde 30/10/2026, serve o pacote de
PRODUÇÃO (sem noindex, canonical, robots aberto, sitemap; deploy 5642475f). O DNS fica no Registro.br
(`a.auto.dns.br`): `www` é CNAME para o Pages. O apex `primehigienize.com.br` NÃO resolve (sem registro): criar
no Registro.br um redirecionamento do apex para `https://www.primehigienize.com.br`. A bio do Instagram aponta para
`www.primehigienize.com` (sem `.br`) — alinhar a bio ao domínio real.

**Tag do Google:** o contêiner GTM-PD6F9S38 não pertence a nenhuma das 4 contas Google logadas no Chrome do
Guilherme. O gatilho de conversão do WhatsApp (`ferramentas/ler-gtm.mjs`) está com "contém 555194372227", que não
bate com o número real 5551994372227: quem administra o contêiner (gestor de tráfego) precisa trocar para
"Click URL contém wa.me" e publicar. Depois, rodar `node ferramentas/ler-gtm.mjs` para conferir.

`_headers` do pacote traz CSP, HSTS, X-Frame DENY, Referrer-Policy, Permissions-Policy e cache; em prévia também `X-Robots-Tag: noindex`.

## Pendências (confirmar com o cliente)
- Horário de atendimento, formas de pagamento, tempo médio de secagem (não foram publicados no site).
- Fotos em alta da equipe e dos serviços (as atuais vieram de prints de stories).
