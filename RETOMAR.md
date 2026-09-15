# RETOMAR — Prime Higienizações (landing)

Status: EM ANDAMENTO — site no GitHub (guilhermepoirotsph-web/prime-higienize, privado, main 82f9665); pacote _site + publicar.mjs prontos para Cloudflare Pages
Atualizado: 2026-09-14 (sessão 7b4c5db8)

## Pedido original do Guilherme
Landing page "mega imersiva" para a Prime Higienize (@prime.higienize), usando o Mega Brain,
efeitos, componentes e copy de alta conversão. Logo, informações, serviços, CTAs, feedbacks,
vídeos e atendimentos vêm todos do Instagram. Se a sessão cair, RETOMAR sozinho.

## Dados já coletados (fonte: Instagram público + posts)
- Nome: Prime Higienize | Higienização de Estofados e Ar-condicionados · @prime.higienize · 1.235 seguidores · 25 posts
- Bio: Limpeza de estofados e ar-condicionado · Proteção contra líquidos (impermeabilização) · Adeus ácaros, bactérias e microrganismos · Faça seu orçamento gratuito
- WhatsApp: +55 51 99437-2227 (link da bio). Região: Rio Grande do Sul (tag de localização dos posts; DDD 51 = Grande Porto Alegre). Cidade exata: A CONFIRMAR.
- Destaques: Clientes (feedbacks), Cadeiras, Colchões, Sofás, Poltronas
- Feedback real (post 14/08/2026): "A melhor propaganda é um cliente satisfeito! Ficou excelente. Os meninos muito educados e comprometido com trabalho. Adorei! Já estou indicando para os amigos e moradores do prédio"
- Reels/posts (shortcodes): DdHsiLeD_DW (ar-cond preventivo) · Dc6aP-OO_e6 (colchão, "Minha mãe me criou direito") · DczRmeHvhw0 (ar-cond limpo?) · DcUVbVoPPu1 (sofá mais sujo do que parece) · DcB9TaVOPEA (feedback) · DbytjXOvJmK (sofá colorido) · DbtlpCfvkl1 (vídeo-game) · DbYWCYcjl6Q (impermeabilização) · Da0-zEkBpYX (sofá claro) · DaoFV2ZvwtJ (transformação colchão) · DaV-UIqj3f0 (carrossel) · DaDyj0qOlyC (impermeabilização, 16 likes)
- Imagens baixadas no scratchpad da sessão em `scratchpad/ig/` (perfil, capas dos destaques, 12 capas de posts) — se o scratchpad sumiu, rebaixar pelo Instagram.

## Plano (molde = Clientes\Odonto Vitallis\site: partes/ + montar.mjs + base.css + nucleo.js + GSAP local)
1. [ ] Coletar destaques "Clientes" (feedbacks) e legendas restantes pelo Chrome logado
2. [ ] Copiar base do Odonto (vendor GSAP, nucleo.js, montar.mjs, molde) e adaptar identidade (cores do logo da Prime)
3. [ ] Escrever seções: herói 3D/imersivo, prova, serviços (sofá, colchão, cadeira, poltrona, ar-condicionado, impermeabilização), antes/depois, processo, vídeos (reels embed), feedbacks, FAQ, área/atendimento, CTA final
4. [ ] Montar, testar (Chrome headless desktop + mobile emulado), corrigir
5. [ ] Publicar prévia (GitHub Pages noindex) e mensagem pronta pro WhatsApp
6. [ ] Registrar no Segundo Cérebro (nota do projeto + diário)

## Próximo passo
Passos 1-5 FEITOS (repo criado e push feito em 15/09). Passo atual: auditoria multi-agente do pacote (workflow wf_66d887aa-daf, script em ~/.claude/projects/.../workflows/scripts/auditoria-pacote-prime-wf_66d887aa-daf.js; se caiu, relançar com resumeFromRunId ou auditar à mão: CSP do _headers, pacote, LEIA-ME x doc do Cloudflare, resíduos do Odonto). Depois: aplicar achados, node publicar.mjs, commit + push, registrar no cofre, apagar cron.
