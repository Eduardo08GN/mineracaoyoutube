# Teste: Tempe montado com o buildKit do Polyfork (08/11/2026, noite)

**Objetivo:** 3 imagens paradas de Tempe que pareçam do MESMO jogo que a cena-demo do kit Roadside Americana (https://polyfork.dev/kit/roadside-americana-50d40c). **Só stills, nada de vídeo.**

**Teto:** 100 mil tokens e 30 min de G4. Ao chegar a 80%, pare e relate.

## Leia (só isto)
1. `D:/pesquisa_nichos/levantamento_tutoriais_animacao_ia_0811.md`: insights 2 a 5 (buildKit, `stage`, passe único, clipes assados).
2. O blog e a doc do Polyfork sobre `buildKit`, `stage` e personagens (polyfork.dev/blog, polyfork.dev/agents, polyfork.dev/prompt.txt). O MCP deles também pode ser usado.
3. `D:/producao/fb_que_pasaria_si/formatos/reels_noticia/r4_tempe/v1/`: o projeto atual (motor, HUD, render na G4) e `estilo/ref.png` (o modelo).
4. A chave grátis do `.mjs`, se precisar, já foi usada no batedor de Tempe (procure no `.env` local do projeto antigo `fb_reels/tempe_polyfork_congelado`). **Nunca imprima, nunca versione.** Se não existir, pare e avise: criar conta é com o Eduardo.

## Como fazer
1. **Monte o lugar com `buildKit`** do kit Roadside Americana (e kits irmãos, se precisar), **com a luz `stage` do próprio kit**. Não invente luz, céu ou material.
2. **Troque só o necessário:** a estrada vira o leito do rio, com a água marrom subindo (`nivel` do motor); entram a árvore do kit com o homem e, nos planos 2 e 3, a represa e o helicóptero. Mantenha a cena **cheia como a demo**: motel, posto, carros, cactos, rochas, pessoas.
3. **Personagens do Polyfork com os clipes assados** (Idle, Walk, Run). O homem agarrado à árvore em pose por ossos. **Nada de pose T.**
4. **Câmera:**
   - **still 1 (1,4 s):** a MESMA câmera alta em 3/4 da cena-demo;
   - **still 2 (43,9 s):** aproximação, ainda de cima, na comporta;
   - **still 3 (81,6 s):** aproximação, ainda de cima, no resgate.
5. **HUD e legenda do motor por cima**, sem crédito na imagem. Formato 1080×1920.
6. **Render na G4-1** (`T2_G4=1`, `T2_DONO=reels_r4_tempe`). A G4 está desligada; ligue só para o job. **Não desligue: avise PRONTO_DESLIGAR.**

## Entrega
Em `v1/teste/s4/`:
- os 3 stills;
- `folha_lado_a_lado.jpg` (cena-demo × cada still).

Não abra as imagens no seu contexto.

Responda em no máximo 6 linhas, com os caminhos.
