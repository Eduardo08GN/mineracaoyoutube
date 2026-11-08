# Batedor Tempe × Polyfork: 3 stills no estilo "No Sleep" (contrato)

## Por que este batedor existe
- **O que o Eduardo reprovou (08/11):** o Tempe v4 (`tempe20/`), "rascunho de estudante de animação". O kit dele não tem harmonia de arte: boneco Quaternius cru, EZ-Tree e terreno feito por código, tudo em paletas diferentes.
- **O alvo:** o reel "No Sleep" do scenario.com. A leitura óptica está em `D:/pesquisa_nichos/acidentes_fb/referencias/scenario_no_sleep/`. Olhe `leitura/folha_lado_a_lado.jpg` e `leitura/tira_ref_*.jpg`, em tamanho pequeno.
- **A regra:** IA generativa VETADA. Tudo é código e assets prontos.
- **A fonte nova de assets:** o **Polyfork** (https://polyfork.dev). São 3.104 modelos low-poly flat-shaded grátis, com uso comercial, em GLB e .mjs. O CDN dispensa conta, e os kits dividem uma paleta e uma escala.
  - Leia `https://polyfork.dev/prompt.txt` (a interface toda).
  - Use `/api/assets/{id}/matching` para manter a harmonia.
  - Use `/api/kits/{id}` e leia o `usage`, que é o contrato de montagem.
  - GLB: `https://polyfork.dev/cdn/{id}.glb`. O .mjs exige conta: não use, fique no GLB.
- **Kits que servem:**
  - `roadside-americana-50d40c`: deserto do Arizona, com saguaro, creosote, tumbleweed, sandstone-outcrop, mesa-backdrop e desert-floor-tile;
  - `frontier-town-a0085b`: dead-cottonwood e sagebrush;
  - `campground-lake-ad32b0`: canvas-ridge-tent, dome-tent, sleeping-bag, camping-lantern, camp-cooler e backpacker.
- **Personagem:** um `character` rigado (`hiker-3d1a41` tem rig; procure também em `/api/assets?class=character&free=1`) que vire um homem adulto sem-teto, de jaqueta VERMELHA (`#E63B2E`). Troque a cor do material.
- **Regra de harmonia:** UMA paleta-base. Prefira peças de um kit ou indicadas pelo `matching`. O que for de fora (água, por exemplo) é recolorido para a paleta.

## O que fazer
1. **Projeto:** `D:/pesquisa_nichos/acidentes_fb/tempe_polyfork/cena/`. Copie a base Remotion 4 + R3F 9 + three 0.180 de `D:/pesquisa_nichos/acidentes_fb/tempe20/cena/` (já renderiza na G4-2) e reaproveite o `Look.tsx` da biblioteca `C:/Users/edlut/mineracaoyoutube/.claude/worktrees/strange-kowalevski-09ebbf/eddie3d/biblioteca/src/look/`.
   - Os GLB baixados ficam em `cena/public/polyfork/`, com um `CREDITOS.md` listando id e URL.
2. **Três stills de 1080×1920 (9:16)** no estilo No Sleep:
   - **Personagem** em plano médio ou próximo, ocupando 35–55% da altura. Sem close de rosto deformado: se o rosto do modelo for fraco, use 3/4 de costas ou contraluz.
   - **Luz:** chave quente lateral + contraluz de recorte + sombras de contato (`ContactShadows`/`AccumulativeShadows` do drei, ou sombra real).
   - **Profundidade de campo** forte, com fundo desfocado.
   - **Paleta:** uma por estágio. Herói vermelho contra azul-petróleo/cinza.
   - **Câmera:** na altura do olho, composição de diorama.
   - **Os três estágios:**

     | Still | Momento | Cena | Paleta |
     |---|---|---|---|
     | A · ESTÁGIO 1/3 | Crepúsculo | Leito seco de cascalho sob um álamo grande (a árvore precisa ser grande, com copa). Barraca de lona, saco de dormir, lanterna acesa. O homem sentado, olhando o céu com nuvens escuras ao longe. | Teal e laranja |
     | B · ESTÁGIO 2/3 | Meia-noite | O mesmo lugar: água barrenta facetada (low-poly, flat-shaded, com frente de espuma) na altura da cintura, a barraca boiando. O homem agarrado ao tronco olhando para baixo. Luar frio + contraluz quente do brilho da cidade, chuva. | Azul-noite |
     | C · ESTÁGIO 3/3 | Amanhecer, horas depois | O homem montado num galho alto. Rio marrom larguíssimo, árvores vizinhas caídas. | Dessaturado, com cor seletiva só no vermelho da jaqueta |

   - **Água:** sua, por código, low-poly facetada (plano subdividido com ondas por vértice + flat shading + espuma nas bordas), na paleta do kit. Nada de plano azul liso.
3. **HUD editorial serifado** (Remotion/DOM por cima, como no No Sleep):
   - **Fontes** (OFL): `D:/pesquisa_nichos/acidentes_fb/blender_batedor/prontos/fontes/` (Playfair Display / Fraunces).
   - **Topo central:** "ETAPA 1 / 3" em versalete espaçado, com 3 pontos (o ativo em vermelho).
   - **Topo esquerdo, bloco em três níveis:**
     - A: "LECHO SECO · ARIZONA" / **"HORA 0"** / "TODO TRANQUILO";
     - B: "MEDIANOCHE" / **"HORA 1"** / "EL AGUA SUBE";
     - C: "AMANECE" / **"HORA 11"** / "SIGUE ARRIBA".
   - **Legenda** em serifa itálica negrito, branca, por frase, no terço de baixo e acima dos 18% inferiores:
     - A: "Estás en el lecho seco de un río, en el desierto de Arizona."
     - B: "Medianoche. El agua llega sin avisar."
     - C: "Once horas después, sigues agarrado al árbol."
   - **Rodapé discreto:** "RECONSTRUCCIÓN · BASADA EN HECHOS REALES".
   - **Nada de texto por cima do personagem.**
4. **No PC:** só compilar e checar tipos (`npx tsc --noEmit`), e preparar o pacote de render dos 3 stills (`npx remotion still`, ou render de 1 quadro por composição) no modelo do `tempe20/cena` (scripts de G4 que ele usou, `canal`/`rodar_job.py` em `D:/pesquisa_nichos/acidentes_fb/codigo/rodar_job.py`).
   - **NÃO renderize no PC.** Nada no C:, `TEMP=D:/tmp`.

## Fases
- **FASE A (agora):** montar tudo, compilar, deixar o comando de render na G4 pronto e PARAR. Responda com "PRONTO_PARA_G4", o comando exato e a lista de assets. NÃO ligue a G4.
- **FASE B (quando eu mandar mensagem dizendo que a G4-2 está ligada):**
  - Ambiente: `T2_G4=2 T2_DONO=reels_codigo`. Nunca rode `ligar` nem `desligar`.
  - Renderize os 3 stills e baixe para `tempe_polyfork/stills/`.
  - Monte `stills/folha_batedor.jpg`, 3 colunas × 2 linhas: em cima nossos A, B e C; embaixo 3 quadros do No Sleep, de `scenario_no_sleep/no_sleep.mp4` em 4 s, 12 s e 25 s.
  - Olhe a folha você mesmo, pequena, e corrija o que estiver claramente abaixo. No máximo 2 rodadas.
  - Responda com o caminho dos stills, da folha e um relatório curto: o que ficou bom, o que segue fraco e o tempo de G4.

## RODADA 2: acabamento com pacotes prontos (08/11, tarde)
- **Situação:** as rodadas r1–r12 com água e luz feitas à mão seguem abaixo do No Sleep.
- **Pacotes:** leia `LEVANTAMENTO_ACABAMENTO.md` e troque o feito à mão pelos prontos. Instale no projeto **sem tocar** o `node_modules` compartilhado (`D:\whatif_es\stack\node_modules`): o projeto ganha `node_modules` próprio, em D:.
  1. **Luz global:** `three-gpu-pathtracer@0.0.24` (peer `three>=0.180`), para os stills.
     - Acumule N amostras por quadro dentro de `delayRender`/`continueRender`. Comece com 256 e meça o tempo por quadro na G4. Isso dá luz rebatida real, sombra macia e profundidade de campo física.
     - **Plano B,** se o pathtracer não rodar headless: `AccumulativeShadows` + `RandomizedLight` + `ContactShadows` do drei 10.x, mais o n8ao.
  2. **Água:**
     - `Water2` do three (examples), com flowmap na direção do leito e cor de lama.
     - Se o pathtracer for adotado: material físico com `normalMap` rolando, transmissão 0, cor de lama e rugosidade ~0,3. A espuma vem de geometria/decal creme nas cristas, em V a jusante do tronco e na frente da água.
  3. **Céu:** o Sky do drei ou o HDRI atual (a Takram fica para depois).
- **O que se mantém:** os assets Polyfork, o HUD, a legenda, o rodapé, a direção (evento protagonista, homem anônimo de costas) e as câmeras do r12, que já estão boas no B.
- **Fluxo:**
  - FASE A: montar, compilar e parar com "PRONTO_PARA_G4".
  - FASE B: quando eu disser que a G4-2 está ligada, renderize até 6 stills de teste. Meça o tempo por quadro (amostras × segundos), confira cada um e atualize `stills/` e `folha_batedor.jpg`.
