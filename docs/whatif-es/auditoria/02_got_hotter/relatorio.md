# Auditoria de fidelidade do vídeo 2: "¿Qué pasaría si te calentaras cada vez más y no pudieras parar?"

Li as 4 folhas gerais e as 22 densas, `capitulos.md`, `graficos.png`, os dois JSON de som, `roteiro.ts`, `Video.tsx`, `Cena.tsx` e `mundo/calor.tsx`. Também extraí 34 quadros em resolução cheia do `comparativo.mp4`. Eles estão em `C:\Users\edlut\AppData\Local\Temp\claude\C--Users-edlut-mineracaoyoutube\269fb63e-6731-4a16-b780-bceeefcac449\scratchpad\q\`. Não editei nenhum arquivo do projeto.

## Diagnóstico geral (vale para vários capítulos)

| # | Problema | Evidência |
|---|---|---|
| G1 | **O original é quase um plano-sequência; o produzido corta a cada capítulo.** | Cortes detectados no original: 0:04.0, 3:50.4 (dissolve), 4:39.9 (dissolve) e o fim. No produzido são 20: 1:14, 1:24, 1:38, 1:46, 2:04, 2:26, 2:30, 2:58, 3:04, 3:52, 4:00, 4:40, 6:18 e outros. As trocas de mãos em 0:20, 0:32, 0:46 e 1:04 também são cortes secos (vistos nas folhas densas), embora o detector não os tenha pego. No original, as mãos **sobem e descem dentro do quadro** e a câmera inclina. Além disso, `Video.tsx` (`corte`) mergulha no preto quando muda o "mundo" (3:04, 3:52, 4:40, 6:18), e o original nunca faz isso. |
| G2 | **A câmera do produzido é quase estática.** | Movimento médio de 0,83 no original contra 0,30 px/quadro no produzido. O original tem panorâmicas lentas e chicotes (whip pans): 1:14.5–1:16 a cerca de 6 px/q e 2:24.5–2:26 a cerca de 8 px/q. |
| G3 | **Nos capítulos de mãos, o olhar está errado.** | No original, a câmera olha para baixo, para a areia (horizonte nos 5–10% de cima do quadro). No produzido, o horizonte fica no meio do quadro, com mar e píer. |
| G4 | **As mãos não brilham.** | No original, a partir de 1:23 as mãos ficam laranja-avermelhadas e emissivas, a partir de 1:30 amarelo-brancas com halo, e de 2:15 em diante viram uma bola branca de bloom. No produzido, ficam salmão e foscas. No modo `alto` (2:04–2:58) só se veem **duas varas pretas** que saem pelo topo do quadro, sem mão. |
| G5 | **Supersaturação.** | Saturação média de 74 no original contra 122 no produzido. Na praia são cerca de 52 contra 95; no espaço, 60–100 contra 206–213. O mar é ciano com listras brancas e a galáxia é cinza (aditivo estourado). |
| G6 | **Pessoas no estilo Minecraft.** | O original usa bonecos low-poly com cabeça redonda e proporção humana, em pouca quantidade: banhista deitado na toalha, gente caminhando, depois correndo em grupo. O produzido tem uma multidão de blocos parados perto da câmera. |
| G7 | **Fogo em forma de cone amarelo gigante.** | O original tem línguas laranja pequenas nas copas das palmeiras e nos objetos, fumaça escura e restos carbonizados pretos. O produzido usa "lâminas" amarelas chapadas, do tamanho de uma pessoa, em primeiro plano. |
| G8 | **Legendas e textos sem itálico.** | `Legenda` e `Centro` usam `fontFamily: ital`, mas falta `fontStyle: 'italic'`, então o navegador desenha em romano. No original são itálicas a legenda e a frase de abertura (a de 0:00); o título e o "You started…" são romanos. |
| G9 | **O som segue pouco o original.** | Correlação de volume de 0,44. A música encobre o ambiente. Faltam o "whoosh" de abertura, o crepitar do fogo, o chiado do vapor, os whooshes do clarão e o **silêncio de 7:16–7:19**. |

---

## Capítulo a capítulo

### intro (0:00–0:04)
1. **Cinematografia:** no original, a galáxia aparece oblíqua (~35°), perto e ocupando a largura do quadro, com leve aproximação. No produzido ela é vista de frente, pequena (~45% da largura) e centralizada. **ALTA.** Correção: na chave da câmera `intro`, usar algo como `[0, 6, 14]` e girar o grupo `Galaxia` para `[0.9, …, 0.25]`.
2. **Montagem:** os dois cortam em 0:04.0, mas o produzido mergulha no preto e o HUD entra em fade de 4.0 a 4.6. No original, a praia e o HUD aparecem acesos de imediato. **MÉDIA.** Correção: em `Video.tsx`, não aplicar `corte` quando `ant.id === 'intro'` e começar o fade do HUD em 3,95.
3. **Ações:** o ponto brilhante "você", à direita do núcleo, falta no produzido (`clarao = 0.06`, invisível). **MÉDIA.** Correção: `clarao` em torno de 0,25 e `posFlare` à direita e abaixo do núcleo, como no original.
4. **Acabamento:** no original, núcleo dourado, braços azulados e pontinhos laranja de poeira; no produzido, tudo branco-acinzentado. Luz 36 contra 16. **ALTA.** Correção: braços em `(0.55, 0.65, 1.0)`, núcleo em `(1, 0.8, 0.5)`, opacidade dos pontos em torno de 0,35 para não estourar no aditivo, mais ~3 mil pontos laranja nos braços.
5. **Texto:** no original, a frase está em itálico, grande, em torno de 53–62% da altura. No produzido está em romano, cerca de 30% menor e um pouco mais baixa. **MÉDIA.** Correção: `fontStyle: 'italic'`, `tam` em torno de 64.
6. **Som:** o original abre com um rugido de vento/whoosh a −15 dB; o produzido tem só música a −29 dB. **MÉDIA.** Correção: whoosh de abertura a −15 dB entre 0 e 4 s.

### praia1 (0:04–0:20)
1. **Cinematografia:** no original, a câmera está na altura dos olhos, longe da água, e a areia ocupa mais da metade de baixo. O píer e a roda-gigante ficam pequenos no terço esquerdo, com uma panorâmica lenta (pan −0,43). No produzido, a câmera está colada na linha d'água, o píer atravessa o quadro na diagonal, a roda-gigante é enorme no topo e a imagem é estática. Composição 0,24. **ALTA.** Correção: recuar `EU` uns 15 m da água (`EU[1]` maior), deslocar o alvo para o mar aberto e animar a guinada (yaw) em −6° ao longo do capítulo.
2. **Montagem:** um único plano nos dois. Sem divergência.
3. **Ações:** no original há pouca gente. Uma pessoa caminha em direção à câmera entre 0:04 e 0:10, há banhistas na água, um **banhista deitado na toalha azul** em primeiro plano à esquerda e um guarda-sol laranja à direita. No produzido, 8 a 10 bonecos de bloco andam perto da câmera, ninguém está deitado e a toalha é um retângulo azul vazio à direita. **ALTA.** Correção: reduzir para cerca de 1/3 das pessoas, nenhuma a menos de 8 m, e um boneco deitado sobre a toalha à esquerda.
4. **Acabamento:** o original tem nuvens grandes em toon, **sombras de nuvem passando na areia**, areia bege-acinzentada e mar cinza-esverdeado com reflexo. O produzido tem nuvens-pipoca pequenas, areia amarela uniforme e mar ciano com listras brancas. Saturação 52 contra 95. **ALTA.** Correção: filtro `saturate(.6)` no contêiner do canvas para a costa; um plano com textura de ruído escuro deslizando sobre a areia (sombras de nuvem, custo quase zero); listras de onda com metade da opacidade.
5. **HUD e legendas:** no original, o título "What If…" aparece em ~0:04.5–0:08, acima do centro e maior. No produzido fica de 5.2 a 10.5, **por cima da legenda "Santa Mónica…" (8.0–10.6)**. **MÉDIA.** Correção: `Centro a={4.5} b={7.9}`, com posição e tamanho iguais ao original. A linha "· Y SIGUE SUBIENDO" aparece desde 0:04; no original só entra quando a temperatura começa a subir (~0:11). **BAIXA.**
6. **Som:** o original tem ondas e burburinho de gente (água 0,45) a −22 dB. O produzido está a −15 dB, com vento ("vehicle") e música, e quase sem ondas. **MÉDIA.**

### maos1 (0:20–0:32)
1. **Cinematografia:** no original, a câmera desce para a areia (horizonte no topo), as mãos são grandes e balançam (movimento 0,97). No produzido, o horizonte fica no meio e as mãos estão paradas (0,44). **ALTA (G3).** Correção: alvo das chaves `maos` em torno de `P(-1,-2.5,-7)` (cerca de 30° para baixo) e um balanço senoidal de ±0,02 rad.
2. **Montagem:** no original não há corte. A câmera continua na praia até 0:21.3, **as mãos sobem para o quadro em 0:21.4–0:22.0** e descem em 0:31.0–0:31.9 enquanto a câmera volta para a praia. O produzido corta seco em 0:20.0 e em 0:32.0. **ALTA.** Correção: chaves de câmera contínuas entre capítulos (última chave do anterior igual à primeira do seguinte) e deslocamento vertical das mãos: `y = -0.6*(1-smooth(s+1.4, s+2.0, t))`, e o inverso no fim.
3. **Ações:** no original, uma pessoa de camisa laranja passa perto, pela direita, de 0:22 a 0:28. No produzido, um boneco passa ao fundo. **BAIXA.**
4. **Acabamento:** igual a G5 e G6.
5. **Legendas:** no tempo certo. Só o itálico (G8).
6. **Som:** o original tem ondas e música; o produzido, vento e vozes. **MÉDIA.**

### praia2 (0:32–0:46)
1. **Cinematografia:** o original faz uma panorâmica lenta para a direita (pan +0,26); o produzido fica parado (0,02). **MÉDIA.**
2. **Montagem:** no original, as mãos sobem em **0:45.0–0:45.6**; no produzido o corte é em 0:46.0. **MÉDIA.**
3. **Ações:** no original há um banhista deitado à esquerda e gente caminhando. No produzido há uma fila de bonecos em pé, um guarda-sol vermelho, e de 0:33 a 0:38 um boneco laranja vem até a câmera. **MÉDIA.**
4. **Acabamento:** G5 e G6.
5. **Legendas:** OK.
6. **Som:** o original tem música, gente e água; o produzido, vento. **MÉDIA.**

### maos2 (0:46–1:04)
1. **Cinematografia:** G3. **ALTA.**
2. **Montagem:** a entrada é corte seco (contra a subida das mãos em 0:45). Na saída, o original faz um **dissolve de 1:03.3 a 1:04.0** (as mãos ficam translúcidas sobre a praia); o produzido corta seco em 1:04.0. **MÉDIA.** Correção: fade de opacidade das mãos (`op`) de 1:03.3 a 1:04 junto com a inclinação da câmera para cima.
3. **Ações:** em ~0:50, no original, a toalha à esquerda queima com chamas laranja pequenas na areia à direita e alguém de amarelo passa correndo entre 0:56 e 0:58. No produzido, uma lâmina amarela **mais alta que os braços** sobe entre as mãos, na frente do mar. **ALTA (G7).** Correção: chamas com 1/3 do tamanho, cor `#ff8a1e` no topo e `#ffcc4d` na base, textura de línguas em vez de cone; a toalha fica preta (troca de cor) quando pega fogo.
4. **Acabamento:** G5.
5. **Legendas:** OK.
6. **Som:** o original tem ondas e música; o produzido, só música (0,83), sem crepitar. **MÉDIA.**

### praia3 (1:04–1:14)
1. **Cinematografia:** o original faz uma panorâmica esquerda de 1,58 px/q; o produzido, 0,30. **MÉDIA.**
2. **Montagem:** ver maos2.
3. **Ações:** no original, **pessoas correm em grupo pela beira d'água** (1:08–1:12), há focos pequenos de fogo espalhados, montes pretos carbonizados e fumaça. No produzido, as pessoas ficam paradas na água e há duas chamas gigantes em primeiro plano à direita. **ALTA.** Correção: ativar a fuga (`fugaT`) em ~1:06 (hoje está em 75,5 s), com bonecos correndo para a direita; e montes pretos (esferas achatadas `#1a1410`) onde havia toalhas e banhistas.
4. **Acabamento:** G5 e G7.
5. **Legendas:** OK.
6. **Som:** o original tem crepitar de fogo ("Rain") e água; o produzido, só música. **ALTA.** Correção: loop de crepitar de fogo a −20 dB a partir de 0:50, crescendo.

### hotel (1:14–1:24)
1. **Cinematografia:** no original, **um chicote para a esquerda de 1:14.5 a ~1:16 (pico de 6 px/q)** revela os hotéis. No produzido, corte seco e pan de +0,22. Composição 0,16. **ALTA.** Correção: o capítulo começa com a mesma direção de `praia3` e gira 70° para a esquerda em 1,5 s com `Easing.inOut`.
2. **Montagem:** corte seco no produzido; nenhum no original. **ALTA.**
3. **Ações:** no original, **as copas das palmeiras pegam fogo**, um guarda-sol queima e as pessoas correm para a direita. No produzido, as copas não queimam, o fogo está no chão (cones), há um banco e alguém sentado no muro. **ALTA.** Correção: as chamas das copas (`copas.t0`) começam em 72 s, mas não aparecem neste enquadramento; verificar o y e a escala, e tirar os focos de chão a menos de 20 m da câmera.
4. **Acabamento:** o original tem **hotéis baixos em laje horizontal, brancos, com ~10 andares**. O produzido tem arranha-céus de vidro azul com 30 andares ou mais e grades de janelas (detalhe 26,5% contra 14%). **ALTA.** Correção: `Costa` com prédios largos e baixos, cor `#e8e6e0`, faixas horizontais de varanda em vez de grade de janelas.
5. **Legendas:** OK.
6. **Som:** o original tem um **estrondo "thunder" em 1:16** (as palmeiras explodem em chamas), crepitar e gritos; o produzido tem música. **MÉDIA.**

### maos3 (1:24–1:38)
1. **Cinematografia:** G3. **ALTA.**
2. **Montagem:** no original, as mãos sobem em **1:23.4–1:24.0** ainda de frente para os hotéis e descem em ~1:36.5, com panorâmica para a direita até 1:37.6. No produzido, cortes secos em 1:24.0 e 1:38.0. **ALTA.**
3. **Ações:** a areia fica rosa a partir de 1:28 nos dois (OK). Mas a legenda "525 °C: tus manos empiezan a brillar al rojo" (1:25) passa **sem as mãos brilharem**. **ALTA (G4).** Correção: em `corCalor`, emissivo de `#ff3a10` (calor 0,3) a `#ffd27a` (0,6) a `#ffffff` (0,8), `emissiveIntensity` de 2 a 6, e o sprite aditivo da palma com escala 0,6–1,2 já a partir de calor 0,3.
4. **Acabamento:** no original, as mãos ficam amarelo-brancas com halo em 1:30; no produzido, salmão. Mar e píer ao fundo, que no original não aparecem. **ALTA.**
5. **Legendas:** OK.
6. **Som:** o original tem crepitar e água; o produzido, vozes, vento e música. **MÉDIA.**

### praia4 (1:38–1:46)
1. **Cinematografia:** o original faz pan para a direita de 1,57 px/q e aproxima (zoom +0,31); o produzido corta e mexe pouco. **MÉDIA.**
2. **Montagem:** corte seco. **MÉDIA.**
3. **Ações:** no original, areia em brasa, guarda-sol caído, montes carbonizados, palmeiras queimando. No produzido, o calçadão com dezenas de cones. **MÉDIA.**
4. **Acabamento:** detalhe 24,5% contra 10% (janelas e cones). **MÉDIA.**
5. **Legendas:** OK.
6. **Som:** o original tem música; o produzido, "chuva/vento". **BAIXA.**

### maos4 (1:46–2:04)
1. **Cinematografia:** G3. **ALTA.**
2. **Montagem:** no original, as mãos sobem em **1:47.4–1:48.0** (o produzido corta em 1:46.0, 1,4 s antes). A troca para a água no original já está completa em **2:03.0** (entre 2:02 e 2:03); no produzido acontece em 2:04.0, cerca de 1,5 s depois. **MÉDIA.** Correção: em `roteiro.ts`, `agua.s` em torno de 122,5 e manter a subida das mãos em ~107.
3. **Ações:** a legenda "Tus manos brillan más que el fuego" contradiz as mãos foscas do produzido. **ALTA.**
4. **Acabamento:** no original a areia vira laranja-dourada (aspecto de lava) por volta de 1:55; no produzido fica rosa, com o mar ciano no quadro. **MÉDIA.**
5. **Legendas:** OK.
6. **Som:** o original tem música e chuva/crepitar; o produzido, vento. **MÉDIA.**

### agua (2:04–2:26)
1. **Cinematografia:** no original, a câmera está baixa na beira d'água, olhando para o mar aberto, **sem píer**, com o horizonte no terço de cima. No produzido, o píer está à esquerda e o mar ocupa tudo. **MÉDIA.**
2. **Montagem:** ver a entrada em maos4. No fim, o original começa o chicote em ~2:24.5; o produzido corta em 2:26.0. **ALTA.**
3. **Ações:** no original, mãos brancas incandescentes no centro e vapor engrossando até um branco-sépia em 2:20–2:24. No produzido, **duas varas pretas atravessam o quadro, sem mãos**. **ALTA (G4).** Correção: no modo `alto` de `Maos`, `T = (±0.075, 0.12, -0.8)` para a palma ficar dentro do quadro, mais um sprite aditivo de 0,9–1,5 m sobre as palmas (o "sol" do original).
4. **Acabamento:** **paleta 0,04**. O original é creme e sépia; o produzido, ciano. A névoa é um degradê branco que desce do topo. **ALTA.** Correção: sobrepor uma cor `#f3e6cc` com mistura multiply/screen subindo de 2:08 a 2:22, `saturate(.45)`, e fazer a névoa vir do horizonte (degradê centrado em 40% de altura), não do topo.
5. **HUD:** em 2:15, a linha laranja do HUD fica ilegível sob a névoa. **MÉDIA.** Correção: em `Video.tsx`, desenhar a névoa **antes** da vinheta escura e aumentar o `textShadow` do painel.
6. **Som:** o original tem chiado d'água e vapor (2:16–2:18) e vento; o produzido, ruído de vento constante. **MÉDIA.** Correção: loop de chiado de vapor a −18 dB entre 2:04 e 2:58.

### olhar (2:26–2:30)
1. **Cinematografia:** no original, **chicote para a esquerda com borrão (pico de 7,8 px/q)** até a praia, com hotéis em chamas e o píer à direita. No produzido, píer de lado, céu azul limpo e pan lento. Composição 0,02. **ALTA.** Correção: começar o capítulo em 144,5 com a mesma direção de `agua` e girar 100° em 1,5 s; durante o pico, `filter: blur(3px)` horizontal no canvas (sem motion blur caro).
2. **Montagem:** corte seco em 2:26.0 e de novo em 2:30.0. **ALTA.**
3. **Ações:** no original, hotéis e palmeiras queimando, píer com focos, areia laranja e um monte carbonizado. No produzido, cones sobre areia rosa. **MÉDIA.**
4. **Acabamento:** céu fumacento no original contra azul de cartão-postal no produzido. **MÉDIA.**
5. **Legendas:** OK.
6. **Som:** o original tem água e música; o produzido, vento. **BAIXA.**

### pier (2:30–2:58)
1. **Cinematografia:** no original, olhar para baixo, para a areia junto ou sob o píer, com os pilares no topo do quadro. No produzido, o horizonte com o mar. **ALTA.**
2. **Montagem:** no original, **chamas tomam a tela inteira em 2:56.5–2:58**, que é a passagem para `chamas`. O produzido corta seco em 2:58. **ALTA.** Correção: sobreposição de chamas em tela cheia (plano com textura de fogo na frente da câmera) com opacidade de 0 a 1 entre 176,5 e 178.
3. **Ações:** **o píer não aparece em chamas** em 2:45, embora a legenda "El muelle está en llamas" esteja na tela (2:38–2:44.5). **ALTA.** Correção: os focos de `fogos.pier` em y=5,8 ficam fora do quadro; colocar também nos pilares, em y de 1 a 3. As mãos continuam como varas (G4). **ALTA.**
4. **Acabamento:** o original é quente, sépia, com bloom (luz 126); o produzido é claro e ciano (172). **ALTA.**
5. **Legendas:** OK.
6. **Som:** o original tem vento e chiado; o produzido, música. **MÉDIA.**

### chamas (2:58–3:04)
1. **Cinematografia:** recuo e subida parecidos nos dois (zoom −0,53 contra −0,65). Bom.
2. **Montagem:** no original, o plano sai do fogo em tela cheia; o produzido corta para uma terceira pessoa. **MÉDIA** (resolvida pela sobreposição de pier).
3. **Ações:** no original, uma coluna de chamas enorme e realista, mais alta que as palmeiras, com o calçadão à esquerda e o píer à direita. No produzido, uma bola de cones amarelos empilhados, pequena. **ALTA.** Correção: `BolaFogo` com raio cerca de 3 vezes maior, billboards de chama com textura e altura de ~25 m.
4. **Acabamento:** cones parecendo "cones de trânsito" na areia, mar ciano. **MÉDIA.**
5. **Legendas:** OK.
6. **Som:** o produzido tem explosões a −9 dB; o original, rugido de vento a −13. **BAIXA.**

### aereo (3:04–3:52)
1. **Cinematografia:** visão oblíqua da costa nos dois, mas no original a subida acelera no fim (corcova de ~1,8 px/q em 3:40–3:55); no produzido, 0,12. **MÉDIA.**
2. **Montagem:** **mergulho no preto em 3:04.0** onde o original é contínuo. No fim, o original sobe por dentro da fumaça até as nuvens (3:50.3–3:52); o produzido mergulha no preto em 3:52. **ALTA.** Correção: tirar o `corte` para a mudança praia→aereo; em 3:49–3:52, nuvens em sprite passando pela câmera, sem preto.
3. **Ações:** no original, **colunas de fumaça marrom no interior (3:28 em diante) e uma nuvem marrom gigante e volumosa (3:40–3:50)**. No produzido, um disco marrom borrado e chapado, que parece uma mancha. **ALTA.** Correção: fumaça com 20–40 esferas `MeshLambert` por pluma (cumulus barato) em vez de sprite.
4. **Acabamento:** no original, interior de **gramado verde com poucos hotéis com piscina no telhado**, estrada e oceano azul-marinho escuro. No produzido, um tapete de arranha-céus brancos ocupando metade do quadro e oceano azul vivo. Detalhe 22,5% contra 11,4%. **ALTA.** Correção: no modo aéreo, chão `#5e7a3a`, cerca de 15 blocos baixos com quadrado azul no topo, oceano `#1d3557`.
5. **HUD e legendas:** OK.
6. **Som:** o original tem rugido de vento a −14 dB e **cai para −24/−32 em 3:50**. O produzido é dominado por música e explosões e fica em −11. **MÉDIA.**

### nuvens (3:52–4:00)
1. **Cinematografia:** no original, bem alto sobre o oceano, entre cúmulos, com **céu e horizonte ocupando metade do quadro**, a serra de Oahu à esquerda e a costa com palmeiras embaixo à esquerda; a câmera desce e faz pan para a direita (1,54). No produzido, quase de cima sobre topos de prédios, sem céu e sem nuvens. Composição −0,01. **ALTA.** Correção: câmera `[0, 600, 900]` olhando para `[-200, 0, -400]` (horizonte visível), cerca de 30 sprites de cúmulo em y entre 150 e 250.
2. **Montagem:** preto em 3:52 e corte em 4:00. O original é contínuo até 4:00. **ALTA.**
3. **Ações:** faltam as nuvens e a descida. **ALTA.**
4. **Acabamento:** saturação 43 contra 129. **MÉDIA.**
5. **Legendas:** OK ("A 4.000 kilómetros" corresponde a 2.500 milhas).
6. **Som:** o original tem música baixa (−30); o produzido, −19. **BAIXA.**

### honolulu (4:00–4:40)
1. **Cinematografia:** no original, um voo baixo e estável pelo calçadão de Waikiki, olhando para a serra no fim da praia (zoom −0,06). No produzido, mais alto, puxado para o mar, com forte avanço (zoom +0,29). **MÉDIA.**
2. **Montagem:** o original faz um **crossfade para a Terra em 4:39.4–4:40.0**; o produzido mergulha no preto em 4:40.0. **MÉDIA.** Correção: um segundo `ThreeCanvas` só nesses 0,6 s com a Terra em opacidade crescente (custo desprezível).
3. **Ações:** no original, **nuvens de vapor sobem do mar fervendo junto à costa** (cada vez mais), fileiras de palmeiras queimam e sai fumaça das torres. No produzido, quase não há vapor. **MÉDIA.** Correção: `Vapor` ou cúmulos baixos ao longo da costa, crescendo de 4:05 a 4:35.
4. **Acabamento:** no original, a serra é rochosa e texturizada; no produzido, um cone verde liso (`DiamondHead`). As torres do original têm janelas acesas irregulares e quentes. Oceano supersaturado. **MÉDIA.**
5. **Legendas:** OK.
6. **Som:** o original é dinâmico, com rajadas de −17 a −31; o produzido, música plana a −20. **BAIXA.**

### terra (4:40–5:30)
1. **Cinematografia:** no original, a **Terra é enorme** (cerca de 110% da altura do quadro), à esquerda do centro. No produzido é pequena (~60%), no terço direito. **ALTA.** Correção: câmera em torno de `[0.55, 0.1, 2.3]` com alvo `[0.35, 0, 0]`.
2. **Montagem:** ver honolulu.
3. **Ações:** no original, **a América do Norte está no lado do dia** e embranquece em etapas: natural em 4:44, bege em 4:52, creme em 5:00, quase branca em 5:12, ainda com os contornos dos continentes. No produzido, **as Américas estão no lado da noite, com luzes de cidade**, o lado do dia é a África, e a Terra continua azul até ~5:04, enquanto a legenda diz "el lado de día de la Tierra ciega" e "Los océanos se evaporan". A partir de 5:16 vira um disco branco sem continentes. **ALTA.** Correção: ajustar `giro` (cerca de −1,9 + π) para que a longitude −118° fique de frente para a câmera e o sol; `branco` com `smooth(282, 312)`; manter uma mistura de 15% da textura.
4. **Acabamento:** saturação 60 contra 206. **ALTA.**
5. **Legendas:** OK no tempo.
6. **Som:** música nos dois. OK.

### lava (5:30–6:18)
1. **Cinematografia:** mesmo problema de escala e posição. **ALTA.**
2. **Montagem:** a viragem para lava em 5:30 casa nos dois; o encolhimento de 6:06 a 6:16 também. OK.
3. **Ações:** no original, uma esfera dourada e incandescente com ilhas de crosta escura e rachaduras brilhando. No produzido, placas de Voronoi marrons cobrindo metade, "mares" brancos, aspecto de ovo rachado. **MÉDIA.** Correção: crosta em ~25% da área, cor base `#ffb347` em vez de branco.
4. **Acabamento:** **um anel marrom-escuro em volta da esfera** (artefato da casca de atmosfera, visível em 5:50). Saturação 101 contra 213. **MÉDIA.** Correção: esconder a casca de atmosfera quando `lava > 0`.
5. **Legendas:** OK.
6. **Som:** o produzido acrescenta um ronco ("vehicle" 0,3) que o original não tem. **BAIXA.**

### galaxia (6:18–7:16)
1. **Cinematografia:** no original, aproximação lenta da câmera com inclinação até um ângulo rasante em ~7:00. No produzido, a aproximação é parecida, mas a galáxia continua quase de frente. **MÉDIA.**
2. **Montagem:** o original faz um **dissolve de 6:17.0 a 6:17.6**, e o ponto "você" continua como estrela dentro da galáxia. O produzido corta (com fade do preto) em 6:18 e o ponto some. **MÉDIA.** Correção: sem `corte` de espaco→galaxia e com o `flare` já aceso em 6:18.
3. **Ações:** no original, a estrela "você" fica **à direita do núcleo**, cresce em "Luego estallas" (6:26) e domina em 7:05. No produzido, uma mancha cinza fraca à esquerda do núcleo e, em 7:02–7:10, uma bola cinza borrada. **ALTA.** Correção: `posFlare` espelhado e cor `(1, 0.93, 0.8)`.
4. **Acabamento:** galáxia monocromática (G5, aditivo estourado), sem núcleo dourado nem poeira laranja. O clarão final: no original, branco puro rápido (7:15.5–7:16.8); no produzido, um lavado creme lento desde **7:11** (431 s), que acinzenta a galáxia por 4 s. **MÉDIA.** Correção: em `Video.tsx`, rampa do clarão `[434.8, 436.2]`, cor `#ffffff`.
5. **Legendas:** OK.
6. **Som:** no original, **whooshes em 6:26–6:30 (−12 dB, o clarão)**, em 6:38, 6:46 e 6:50, um estrondo em 7:14 e **silêncio total de 7:16 a 7:19 (−59/−103 dB)**. No produzido, música plana em torno de −20 e nenhum silêncio. **ALTA.** Correção: efeitos de whoosh nesses tempos e volume da música em 0 de 436 a 439,5.

### fim (7:16–7:39)
1. **Composição:** no original, branco, depois cinza e preto entre 7:17 e 7:19, com "You started at 98.6 °F." surgindo sobre o cinza-claro em 7:17.2. No produzido, creme e escuro entre 7:16.4 e 7:17.6, com "Empezaste a 37 °C." cerca de 40% menor e um pouco mais baixo. **MÉDIA.** Correção: `tam` em torno de 68, fundo descendo do branco para `#0b0d12` entre 437 e 439.
2. **"¿Algo de esto es real?":** no original, título no terço de cima, parágrafo de 4 linhas legível e o convite "Which what if… Tell us in the comments" em cinza-claro, que **entra depois (~7:26)**. No produzido, tudo centralizado e de uma vez em 7:20.7, parágrafo em letra minúscula (5 linhas, texto mais longo) e convite em laranja e caixa-alta. **MÉDIA.** Correção: `justifyContent: 'flex-start'`, `paddingTop` de 26%, corpo com 28px, convite com fade em 446.
3. **Cartão final (7:30):** no original, no terço de cima, maior, com "SUBSCRIBE…" em lilás-azulado. No produzido, centralizado-baixo, menor, com a linha em cinza. **BAIXA.**
4. **Som:** o original vai desaparecendo até −47 dB em 7:36; o produzido fica em −30. **BAIXA.**

---

## Os 10 desvios mais graves

1. **Mãos sem brilho e, de 2:04 a 2:58, sem mão nenhuma (só duas varas pretas)** (ALTA). Contradiz as legendas de 1:25, 1:47 e 2:24. Correção: emissivo por temperatura, sprite de bloom e `T.y` em torno de 0,12 no modo `alto`.
2. **Cortes e mergulhos no preto onde o original é plano-sequência** (ALTA). São 20 cortes contra 6; os piores são o preto em 3:04, 3:52, 4:40 e 6:18 e os cortes das mãos. Correção: chaves de câmera contínuas, mãos entrando e saindo por deslocamento, e eliminar o `corte` de `Video.tsx`.
3. **Terra: Américas no lado da noite, pequena e azul até 5:04** (ALTA). Contradiz "el lado de día ciega" e "Los océanos se evaporan".
4. **Pessoas estilo Minecraft e comportamento errado** (ALTA, 0:04–1:24). Ninguém deitado, ninguém correndo; multidão colada na câmera.
5. **Fogo em cones amarelos gigantes; copas das palmeiras e píer sem fogo** (ALTA). Píer sem fogo em 2:38–2:58, nada de chamas em tela cheia em 2:56.5, bola de fogo pequena em 2:58.
6. **Arquitetura errada** (ALTA). Arranha-céus de vidro em Santa Mónica (1:14–1:46) e tapete de torres na vista aérea, onde o original tem hotéis baixos e gramado. Fumaça vira um disco borrado (3:44–3:50).
7. **Olhar e movimento da câmera** (ALTA). Horizonte no meio do quadro nas mãos (o original olha a areia); sem os chicotes de 1:14.5 e 2:24.5; câmera quase parada (0,30 contra 0,83 px/q).
8. **Sem a subida pelas nuvens** (ALTA). Nuvens e Honolulu de 3:50 a 4:00 sem céu e sem cúmulos.
9. **Cor** (ALTA). Saturação 122 contra 74; mar ciano com listras brancas; paleta 0,04 em `agua`; galáxia cinza sem núcleo dourado nem estrela "você".
10. **Som** (MÉDIA/ALTA). Sem o whoosh de abertura (−29 contra −15 dB), sem crepitar e estrondo em 1:04–1:16, sem chiado de vapor, sem whooshes do clarão e **sem o silêncio de 7:16–7:19**. A música encobre o ambiente; correlação 0,44.

Ganhos rápidos fora do top 10: itálico nas legendas e na frase de abertura (`fontStyle: 'italic'`) e o título terminando em 7,9 s para não se sobrepor à legenda.

## Notas de fidelidade (0–10)

| Dimensão | Nota | Motivo |
|---|---|---|
| Cinematografia | **3,5** | Mundos e eixos certos, mas enquadramento, olhar das mãos, escala da Terra e da galáxia e movimento de câmera divergem. |
| Montagem | **3,0** | Plano-sequência virou 20 cortes e mergulhos no preto; as entradas das mãos estão de 0,6 a 1,5 s fora do tempo. |
| Roteiro/ações | **4,5** | A linha do tempo e as batidas casam (temperatura, troca para lava, encolhimento), mas faltam a fuga, os carbonizados, o fogo no píer e nas copas, as nuvens e o lado diurno da Terra. |
| Acabamento | **3,0** | Supersaturado, bonecos de bloco, fogo de cone, arranha-céus, fumaça chapada, galáxia cinza. |
| HUD/legendas | **7,0** | A estrutura do painel e o tempo das legendas são fiéis. Falham o itálico, o título por cima da legenda, o HUD ilegível sob a névoa e o layout das telas finais. |
| Som | **4,0** | O tipo de música está certo, mas falta quase todo o desenho de som e o silêncio final. |
