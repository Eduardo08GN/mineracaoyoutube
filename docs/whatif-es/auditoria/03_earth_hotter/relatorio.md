# Auditoria de fidelidade: vídeo 3, "¿Qué pasaría si la Tierra se calentara…?"

**Como medi:** li as 4 folhas gerais e as 13 densas. Também extraí uns 30 quadros em resolução cheia do `comparativo.mp4` para conferir detalhes, junto com `capitulos.md`, `graficos.png` e os dois JSON de som. Do lado produzido li `roteiro.ts`, `legendas.json`, `Video.tsx`, `Cena.tsx`, `Espaco.tsx` e `calor.tsx`, e confrontei com `ref/legendas_en.json`. Os quadros extraídos estão em `C:\Users\edlut\AppData\Local\Temp\claude\C--Users-edlut-mineracaoyoutube\269fb63e-6731-4a16-b780-bceeefcac449\scratchpad\f3\`. Não editei nenhum arquivo do projeto.

**Leitura geral:** o esqueleto está certo. Os capítulos começam nos mesmos tempos, as legendas batem com o original em ±0,5 s e o HUD está quase idêntico. O que denuncia que é outro vídeo:
- **Câmera:** o produzido se mexe só 36% do original (0,09 contra 0,25 px/quadro) e enquadra de outro jeito (composição média 0,38).
- **Cor:** saturação 125 contra 84. O produzido fica "praia de cartão-postal" quando o original fica cada vez mais sépia e enevoado.
- **Ações-chave que faltam:** a praia não esvazia direito, o lago não seca para revelar a rua com carros, a multidão de Honolulu continua viva a 200 °C, o mar de Santa Mónica não ferve, e a crosta derretida não evolui.
- **Montagem:** escurecimentos para o preto onde o original faz fusões, e quatro cortes que o original não tem.

---

## Capítulo `intro`: 0:00–0:04

**1. Cinematografia**
- **ALTA.** O original enquadra o planeta incandescente em close: ele ocupa cerca de 1,3× a altura do quadro e vaza em cima e embaixo. No produzido o planeta ocupa cerca de 0,65 da altura e flutua no preto. A luz média cai de 128 para 50.
  - Correção: em `roteiro.ts`, intro com câmera em `[0,0.1,1.75]` → `[0,0.1,1.85]`, um leve recuo como o original (zoom −0,024).

**2. Montagem**
- **MÉDIA.** No original, 0:04.0 é um corte seco e o HUD já entra cheio, mostrando "72°F" nesse quadro.
- No produzido, 0:04.0 tem um mergulho no preto (`corte`, 0,25 s, 90%) e o HUD sobe de opacidade entre 4,0 e 4,6.
  - Correção: em `Video.tsx`, não aplicar `corte` quando `ant.id==='intro'` e tirar o fade do `Painel`.

**3. Roteiro e ações**
- **MÉDIA.** O original mostra a superfície final: amarela, com ilhas de crosta marrom e rede de fissuras celular.
- O produzido mostra grandes lagos brancos e placas com linhas retas poligonais, que parecem uma triangulação. Ver a seção de lava.

**4. Acabamento**
- **MÉDIA.** O original tem bloom macio em volta do planeta.
- O produzido tem um anel marrom destacado, efeito "tigela": é o `halo` BackSide em `scale 1.06`.
  - Correção: `scale 1.025`, força menor, e coroa (sprite) maior e mais forte.

**5. HUD e legendas**
- **MÉDIA.** No original, "In 5 minutes, this is Earth." fica centralizado sobre o planeta, em itálico, com uma faixa escura difusa atrás.
- No produzido, "En 5 minutos, esta es la Tierra." sai em fonte reta, sem faixa, e metade do texto cai sobre o planeta branco, quase ilegível (0:00.5–0:03.9).
  - Correção: dar ao `Centro` a mesma faixa `radial-gradient` da legenda. Ver também o bug do itálico na seção global.

**6. Som**
- **ALTA.** O original tem estrondo e ronco de fogo (Explosion/Vehicle) a −16/−18 dB.
- O produzido tem só música baixa, a −29/−31 dB, uns 13 dB mais quieto.
  - Correção: uma camada de ronco grave de fogo de 0 a 4 s.

---

## Capítulo `sm1`: 0:04–0:24 e `sm2`: 0:24–1:00

**1. Cinematografia**
- **ALTA, o enquadramento.** O original é um plano de grua baixo, a uns 8–10 m, a partir da calçada. A rua com faixa amarela e a sombra das palmeiras ficam em primeiro plano, o calçadão no meio e o píer recuando à esquerda até a roda-gigante, centrada no horizonte. É lente média.
- O produzido é uma vista aérea alta, com câmera em y=34→27 olhando quase para baixo. Não há rua, o píer vai na diagonal para a direita e a roda-gigante fica enorme. A composição de sm1 dá correlação 0,00.
- **ALTA, o movimento.** No original é **um único plano contínuo de 0:04 a ~0:58**: avança e desce do calçadão para a areia (0:30), chega rente à areia (0:45) e vai até a beira d'água (0:50–0:58). Medidas: movimento 0,14→0,21 e zoom +0,03→+0,09.
- O produzido fica quase parado (0,08), **corta seco em 0:24.0** para outra câmera e depois anda pouco.
  - Correção: fundir sm1 e sm2 numa trajetória só de 4 a 58 s com 4 chaves, por exemplo `[0,[30,9,40],[−10,4,−40]]`, `[0.35,[20,6,20],…]`, `[0.65,[12,3,0],…]`, `[1,[8,2.5,−12],[−14,2,−80]]`, com y baixo e alvo no píer.
- **ALTA, oclusão.** No produzido, entre 0:24 e 0:44, as palmas de uma palmeira atravessam a câmera e cobrem de 30 a 50% do quadro (0:30, 0:40–0:44). Parece erro.
  - Correção: afastar a câmera das copas ou tirar as palmeiras de dentro do frustum próximo (por exemplo, esconder as que estiverem a menos de 6 m da câmera).

**2. Montagem**
- **ALTA.** O original não tem corte em 0:24 e passa para Las Vegas com uma **fusão de cerca de 0,6 s entre 0:58.2 e 0:58.8**.
- O produzido tem corte seco em 0:24.0 e, para Vegas, um escurecimento curto (0,25 s) em **1:00.0**, ou seja, 1,5 s atrasado em relação à fusão.
  - Correção: em `Video.tsx`, trocar o preto por uma fusão. É barato fazer de duas formas: renderizar os 0,6 s de sobreposição como dois `<ThreeCanvas>` com opacidade cruzada, ou exportar o último quadro do capítulo e dar fade sobre o seguinte. Antecipar a troca para 58,2 s.

**3. Roteiro e ações**
- **0:04–0:20:** as duas versões mostram multidão no calçadão e na areia. O original mostra pessoas andando em perspectiva baixa; o produzido mostra pontinhos vistos de cima. MÉDIA.
- **ALTA, a praia não esvazia.** No original, em 0:24–0:30 ("Everyone leaves the beach") as pessoas **correm** da areia para a rua, já com poucas na areia em 0:30. Em 0:40 a praia está vazia, só com guarda-sóis e toalhas abandonados, e em 0:45 não há ninguém nem na água.
- O produzido ainda tem gente andando em 0:30 e **banhistas na água em 0:45**.
  - Correção: em `Cena.tsx`, a fuga começa em 23 s mas é lenta. Acelerar `fugaT`, com corrida e velocidade cerca de 3×, e apagar os banhistas (`semBanhista` a partir de t>26) para zerar até 0:38.
- **MÉDIA, "The streets empty too" (0:34–0:38).** O original mostra o calçadão esvaziando; no produzido a rua nem está em quadro.

**4. Acabamento**
- **ALTA, cor.** O original é quente e enevoado: céu bege-acinzentado, mar calmo e espelhado refletindo nuvens, e a névoa cresce com a temperatura (0:45 já amarelada). Saturação 59–71.
- O produzido é turquesa saturado com céu azul de cúmulos de desenho, sem evolução. Saturação 123–131.
  - Correção: grade de cor por temperatura no Remotion, um `<AbsoluteFill>` com `mix-blend-mode: multiply`/`color` sépia, opacidade ligada a `t` (0,15 em 4 s → 0,45 em 58 s). Somar `fog` bege crescente e trocar o céu por gradiente pálido.
- **MÉDIA, mar.** O original tem água calma, espelhada, com uma ou duas linhas de espuma; o produzido tem água picada com muita espuma ciano.
  - Correção: `agit` mais baixo e reflexo (envMap do céu) mais alto em sm1/sm2.
- **MÉDIA, modelos.** No produzido as palmas parecem pente de linhas (fios visíveis de perto), a roda-gigante está grande demais no meio do píer, e o píer não tem postes e grades densas nem a plataforma do fim.
  - Correção: textura de folha com alpha nas palmas, roda-gigante com escala de cerca de 0,6 e no fim do píer.
- **BAIXA.** No produzido há detalhe menor (14,5% contra 20,8% em sm1) e não há a sombra das palmeiras na rua.

**5. HUD e legendas**
- **MÉDIA, título.** No original, "What if Earth kept getting hotter and couldn't stop?" fica de **~0:04.5 a ~0:06.8**.
- No produzido, o título fica de **5,2 a 10,5 s** (`Centro a=5.2 b=10.5`) e se sobrepõe à legenda "Las 3 de la tarde…" (7–10 s). Na tela aparecem dois textos ao mesmo tempo.
  - Correção: `b=7.0`.
- **BAIXA, linha secundária do HUD.** O original mostra só "22 °C" até a temperatura começar a subir (~0:09); "AND STILL RISING" aparece depois.
- O produzido mostra "72 °F · Y SIGUE SUBIENDO" desde 0:04.
  - Correção: só acrescentar "· Y SIGUE SUBIENDO" quando t>9.
- As legendas batem no tempo com o original (7–58 s).

**6. Som**
- **ALTA.** No original, de 0:04 a 0:30 a trilha é ondas/surf e multidão falando (gente 0,3–0,6), a −23/−26 dB, e a música só entra por volta de 0:32–0:38. Em 0:58 há som de "Pour" (água).
- O produzido tem música e ruído tipo vento/veículo desde 0:04, **sem vozes** (gente: 26 janelas no original contra 0 no produzido), com pouca água e ~10 dB mais alto (−11/−17).
  - Correção: camada de ambiência de praia (ondas e burburinho) de 4 a 30 s, sumindo com a multidão; atrasar a música para ~32 s; baixar o mix em cerca de 8 dB.

---

## Capítulo `vegas`: 1:00–1:58

**1. Cinematografia**
- **ALTA.** O original tem a câmera **rente à água** (~1–2 m), perto dos jatos das fontes. O lago reflete os prédios como espelho, os cassinos são grandes e próximos, e a torre de vidro escura fica no primeiro plano à direita. O movimento é um dolly lento e flutuante (0,28, zoom +0,076).
- O produzido tem câmera a 4–9 m, mirando o skyline a 340 m. Os prédios ficam pequenos numa faixa estreita, o mar ocupa metade do quadro, e o movimento é de 0,11.
  - Correção: câmera `[0,1.2,−150]` → `[20,1.5,−190]` com alvo a cerca de 120 m, e `fov 50`.

**2. Montagem**
- O produzido tem 2 cortes contra 1 do original. Detalhe da entrada na seção anterior.
- **MÉDIA, saída.** O original sai com **fusão em 1:57.3–1:57.8**; o produzido escurece em 1:58.0.

**3. Roteiro e ações**
- **MÉDIA, "The fountains shut down" (1:05–1:10).** No original os jatos altos e brancos, bem visíveis, baixam até 1:08. No produzido as fontes são minúsculas e quase não se percebe que apagaram.
  - Correção: aproximar a câmera e escalar os jatos ×3.
- **MÉDIA, vapor.** No original o vapor sépia já é denso na margem em **1:14–1:16**. No produzido não há vapor em 1:16, e ele aparece só em ~1:20 (`vapor=smooth(74,86)`).
  - Correção: `smooth(70,80)`.
- **ALTA, o lago seca.** No original, em **1:22.4** o espelho d'água some e revela chão escuro de asfalto/leito com marcas brancas. Em 1:30 aparecem **carros parados** no meio do vapor ("Car engines overheat. Traffic stops"), em 1:36 garrafas no chão, e a partir de 1:44 o vapor sépia engole a câmera.
- O produzido mantém o mar azul até ~1:34, depois um plano marrom liso, sem carros nem garrafas.
  - Correção: `seca=smooth(81,84)` para um corte rápido. No fundo do lago, plano com textura de asfalto com faixas, 8–10 caixas-carro escuras e uns 30 cilindros pequenos (garrafas) que achatam o `scale.y` entre 94 e 99 s.
- **ALTA, névoa total.** No original, de 1:40 a 1:56 a névoa ocupa o quadro inteiro, com luz que sobe até ~200. No produzido o vapor é só uma faixa branca no horizonte e o céu continua azul.
  - Correção: a partir de t>96, sprites de vapor na frente da câmera (reaproveitar `Vapor` de `calor.tsx`) e `fog` bege com `near` baixo.

**4. Acabamento**
- **ALTA.** O original é sépia, com a imagem lavada pelo vapor. O produzido tem céu azul saturado e vapor branco puro.
  - Correção: vapor `#e9d6b4` e a grade sépia ligada à temperatura.
- **ALTA, modelos.**
  - No produzido, a torre é um bloco **preto liso sem textura**, que parece textura faltando; no original é vidro escuro com janelas.
  - O produzido tem um pináculo cônico estranho.
  - Faltam a placa grande "CASINO" e a "LIVE".
  - Faltam as palmeiras na margem do lago.
  - Falta a roda-gigante High Roller à esquerda.
  - Correção: textura de janelas por canvas na torre preta, como nos outros prédios, e escalar as placas.
- **MÉDIA.** No produzido a água é oceano ondulado, não lago espelhado.
  - Correção: `agit` perto de 0 e reflexo alto.

**5. HUD e legendas**
- Tempos corretos: Vegas a 1:00, fontes a 1:05, 140 °F a 1:12, lago a 1:19, motores a 1:26, garrafas a 1:34, evaporando a 1:41, "Up here" a 1:48.
- **BAIXA.** Por causa do escurecimento, o HUD fica apagado em 1:00.0–1:00.2.

**6. Som**
- **ALTA.** No original há água das fontes (1:00–1:06), tráfego e motores (1:18–1:22, 1:28–1:32, 1:38, 1:44–1:46) e gente (1:56).
- O produzido tem **só música** do começo ao fim do capítulo.
  - Correção: loop de fonte de 60 a 68 s; ronco de motores e buzinas de 78 a 92 s; chiado de vapor de 74 a 118 s.

---

## Capítulos `havai1`: 1:58–2:22 e `havai2`: 2:22–2:56

**1. Cinematografia**
- **ALTA.** O original abre a ~60 m sobre as torres de Waikiki, olhando a costa, com o Diamond Head à esquerda ao fundo. Depois **sai sobre o oceano** (2:00–2:40), voando por cima dos tufos de vapor, e em 2:36–2:50 faz um **giro rápido de volta para a costa**: movimento de pico 1,4 px/quadro e pan +0,64. A volta mostra a fileira de torres, o Diamond Head como penhasco e o mar recuando (2:44–2:56).
- O produzido tem câmera colada nas fachadas, olhando para baixo ao longo da costa, quase parada (0,14–0,17), sem o voo sobre o mar e sem o giro.
  - Correção:
    - havai1 com câmera indo da costa para o mar, por exemplo `[0,[150,70,40],[−150,0,−200]]` → `[1,[60,55,−200],[−100,0,−420]]`.
    - havai2 com 3 chaves, terminando num giro para a costa: `[0.7,…]` e `[1,[40,45,−120],[−260,20,40]]`, com `ease` rápido no fim.

**2. Montagem**
- **MÉDIA, transições.** Na entrada, o original faz fusão em 1:57.3–1:57.8 e o produzido escurece em 1:58.0. Na saída, o original faz fusão em 2:56.4–2:56.8 e o produzido escurece em 2:56.0.
- **BAIXA.** Em 2:22 há um pequeno salto de posição de câmera entre havai1 e havai2, que o original não tem.
  - Correção: igualar a última chave de havai1 à primeira de havai2.

**3. Roteiro e ações**
- **ALTA.** No original a praia e a rua estão **vazias**. No produzido a praia está **lotada de gente e os carros circulam até 2:56**, com 200 °C no HUD. É incoerência gritante.
  - Causa: em `Cena.tsx`, `hono` não define `eu`/`fugaT`.
  - Correção: `props.fugaT=200; props.semCarros=true` (ou equivalente) para Honolulu.
- **ALTA, o oceano ferve.** No original, desde 1:58 há tufos de vapor sobre a água, que cobrem o mar até as nuvens (2:14–2:40). A água fica verde-acinzentada e agitada e a espuma recua (2:44–2:56).
- O produzido tem mar azul-royal limpo até ~2:14 e depois uma única "parede" branca de névoa à direita.
  - Correção: em `VaporMar`, `forca=smooth(118,135)`, tufos espalhados sobre toda a área visível (z até −800), cor `#efe2c8`, e mar com `agit` e cor dessaturada a partir de 128 s.
- **MÉDIA.** O original tem a linha d'água recuando e o fundo exposto (2:44–2:56); no produzido a costa é estática, com uma linha ciano brilhante, que parece artefato.

**4. Acabamento**
- **ALTA, Diamond Head.** No produzido é um cone verde liso, em `flatShading`, que parece flutuar sobre o mar à direita. No original é um penhasco rochoso, texturizado, no fim da praia, do lado da terra.
  - Correção: mover para o fim da faixa de areia, cor marrom-oliva com ruído de vértice, e não deixar sobre a água.
- **MÉDIA.** O original é dourado e quente, com saturação 54–55. O produzido sai azul (havai1 98) e branco-acinzentado (havai2 48).
- **MÉDIA.** No produzido as torres são brancas e cinzas sem variação; no original há variação de janelas acesas e sol rasante.

**5. HUD e legendas**
- Tempos e textos corretos, de 1:59 a 2:56.

**6. Som**
- **ALTA.** O original tem buzina de neblina, vento e água (2:02–2:12); **borbulhar/fervura** (2:16–2:20, 2:34–2:42: "Toilet flush", "Water", "Steam"); e vento forte (2:50–2:54).
- O produzido tem ruído rosa e ondas (2:00–2:20, que funcionam) e depois música com "vehicle" genérico, **sem fervura**.
  - Correção: loop de água fervendo e chiado de vapor de 2:08 a 2:56, crescendo.

---

## Capítulos `sm3`: 2:56–3:26, `sm4`: 3:26–3:44 e `sm5`: 3:44–3:58

**1. Cinematografia**
- **ALTA.** O original é **um único plano contínuo de 2:56.5 a 3:57**:
  - começa na altura da rua (~6 m), com a rua em primeiro plano (um carro azul passa em 3:10 e 3:20) e o calçadão, as palmeiras e o píer ao fundo;
  - sobe e gira para uma vista alta, inclinada e em ângulo holandês ao longo da praia (3:32);
  - termina sobre a areia, olhando o píer e o mar fervendo (3:44–3:57).
- O produzido tem a câmera no meio das copas: palmas cobrem as bordas do quadro em 2:58–3:26 e as copas atravessam a lente.
  - Correção: câmera de sm3 em `[0,6,30]` olhando `[−4,4,−30]`, com a rua à frente.

**2. Montagem**
- **ALTA.** O produzido tem cortes secos em **3:26.0 e 3:44.0** que o original não tem.
  - Correção: fundir sm3, sm4 e sm5 numa trajetória só de 176 a 238 s, com 5 chaves e rolagem de ~0,08 rad em torno de 3:32.
- **MÉDIA.** O original sai com **fusão longa de cerca de 1 s (3:57.0–3:58.0)**: o planeta aparece por cima da praia em brasa. O produzido escurece em 3:58.0.

**3. Roteiro e ações**
- **Mapa de ações do original:**
  - 2:56–3:00: vapor espesso atrás do píer, sobre o mar.
  - 3:01–3:10: papel e toalhas pegam fogo, com chamas pequenas na areia.
  - 3:13–3:16: as copas das palmeiras pegam fogo, com fumaça preta.
  - 3:20: todas as copas queimando e colunas de fumaça.
  - 3:22 em diante: copas carbonizadas em silhueta preta.
  - 3:25–3:35: o píer queima.
  - 3:44–3:57: mar escuro fervendo, areia com focos de fogo.
  - 3:52–3:57: a areia fica laranja-avermelhada, incandescente ("everything starts to glow red").
- **ALTA, o mar não ferve.** No produzido o mar fica **turquesa limpo, sem vapor, até 3:58** (ver 3:50).
  - Correção: `VaporMar forca` 0,6 → 1,0, tufos cobrindo o mar inteiro, e mar escurecido e dessaturado com `agit` alto.
- **ALTA, fogo.** No produzido, as chamas de chão (182–194 s) quase não se veem em 3:02–3:12. Nas copas (3:13–3:20) o fogo é um **cone amarelo chapado**, uma `PlaneGeometry` única por foco com forma triangular, e as copas continuam verdes por baixo.
  - Correção:
    - de 3 a 5 línguas por foco, com deslocamento, escala e fase diferentes e `AdditiveBlending`;
    - pontas vermelhas, base branco-amarelada e faíscas (`points` subindo);
    - copa ficando preta (`lerp` da cor da folha para `#1a1410` entre t0 e t0+4 s).
- **ALTA, ordem visual.** O original queima papel e toalhas antes (3:01) e palmeiras depois (3:13). No produzido o que se lê é só "cones amarelos" a partir de 3:16, porque o fogo de chão é pequeno demais para a câmera.
  - Correção: aumentar `s` de `fogos.chao` ×2 e aproximar a câmera da areia.
- **MÉDIA.** No produzido a praia continua cheia de guarda-sóis coloridos intactos; no original os guarda-sóis ficam esparsos e queimando.
- **MÉDIA.** No produzido a areia não brilha em vermelho em 3:52–3:57, porque `AreiaQuente` liga em 230–236 s mas a areia não está em quadro.
  - Correção: enquadrar a areia em sm5.
- **BAIXA.** Falta o carro azul que passa na rua (3:10, 3:20).

**4. Acabamento**
- **ALTA, fumaça.** No original são colunas cinza-escuras altas e volumosas desde 3:13. No produzido há borrões pretos pequenos no céu a partir de 3:28.
  - Correção: `Fumaca t0=193`, `escala` 9 → 18, `subida` 5 → 12, n=14.
- **MÉDIA.** O original é sépia com névoa e céu amarelado; o produzido mantém céu azul e cores de cartão-postal (sm5: saturação 118 contra 76).

**5. HUD e legendas**
- Tempos corretos, de 2:57 a 3:57.
- **BAIXA.** Com o escurecimento, o HUD some em 2:56.0–2:56.2.

**6. Som**
- **ALTA.** O original tem vento e estalos (2:56), água (2:58–3:14), **trovão/estrondo de fogo (3:08, 3:12, 3:16)**, **fritura/crepitar (3:28)**, rugido (3:34) e água/vento (3:44–3:54).
- O produzido tem quase só música. Os únicos sinais de fogo são fracos ("rain on surface" 0,1–0,25 em 3:02–3:08 e 3:34–3:46), sem o estrondo de 3:16.
  - Correção: crepitar em camada de 181 a 238 s, "whoosh" de ignição em 193 s (palmeiras) e 205 s (píer), ronco grave crescente.

---

## Capítulo `terra`: 3:58–4:50

**1. Cinematografia**
- **ALTA.** No original a Terra é **grande** (diâmetro ~1,15× a altura em 4:05, vazando em cima e embaixo) e faz um recuo lento: em 4:22 está menor, em 4:40 menor ainda. A luz da cena é 43.
- No produzido a Terra é pequena (~0,6× a altura), com leve aproximação. A luz é 18.
  - Correção: câmera `[0,0.1,1.9]` → `[0,0.1,2.6]`, um recuo.

**2. Montagem**
- **MÉDIA.** O produzido tem um **corte de salto em 4:50.0**: a câmera pula de z=3,1 para 3,6 e o planeta encolhe de repente (densa_11). O original é contínuo ali.
  - Correção: a primeira chave de `lava` igual à última de `terra`.

**3. Roteiro e ações**
- **ALTA.** No original a Terra já entra **seca** em 3:58: continentes bege e áridos, oceanos azul-escuros diminuindo, manchas pálidas. Em 4:22 os oceanos sumiram.
- No produzido ela entra **verde e azul viva**, como a Terra de hoje (saturação 223 contra 64), e só fica cinza por volta de 4:16.
  - Correção: em `Cena.tsx`, `seco=smooth(225,240)`, de modo que já entre em 0,8–1.
- **MÉDIA, "glows like a hot coal" (4:27–4:34).** No original a crosta escurece com rede de fissuras laranja-brilhantes largas e manchas acesas (4:34–4:48, luz 77). No produzido a bola fica marrom-ferrugem fosca com fissuras finas vermelhas (luz 55).
  - Correção: em `Espaco.tsx`, `rede` com `smoothstep(0.0,0.12,…)`, cor de fissura `vec3(1.8,1.0,0.35)` e mais 15–20% de manchas de magma.

**4. Acabamento**
- **MÉDIA.** O original tem o lado da noite à esquerda com borda avermelhada (calor) e uma névoa cinza tênue no canto inferior esquerdo. O produzido tem halo azul destacado, efeito de "anel duplo", e preto puro.
  - Correção: halo mais justo e uma textura de nebulosa a 10% de opacidade no fundo.

**5. HUD e legendas**
- Textos e tempos corretos ("LA TIERRA, AL DÍA SIGUIENTE"; legendas de 3:59 a 4:34).

**6. Som**
- **BAIXA.** Os dois têm música dominante. O original tem picos de vento e ronco (4:02, 4:30) e uma dinâmica de volume maior (−17 a −31 dB contra −15 a −22).

---

## Capítulo `lava`: 4:50–6:26

**1. Cinematografia**
- **MÉDIA.** O original faz dolly-in de 4:50 a 5:38, com o planeta crescendo até encher o quadro, e depois recua de 5:40 a 6:25 (0,75× a altura em 6:10, ~0,55× em 6:24). O produzido faz o mesmo desenho, mas menor em todas as fases.

**2. Montagem**
- **MÉDIA.** O original tem uma **fusão em 5:39.5** para um plano mais próximo e muito mais claro: a luz salta de 100 para 140 e a crosta quase toda derreteu. O produzido não tem essa virada.
  - Correção: dissolver de 339 a 340 s em `quente` (pular de 0,2 para 0,6) e somar +25% de exposição nesse instante.

**3. Roteiro e ações**
- **ALTA, derretimento progressivo.** No original a superfície é amarela, as ilhas de crosta marrom **vão encolhendo** de 4:56 a 6:24 e o planeta vai do laranja ao branco-amarelado.
- No produzido o desenho é **fixo de 4:56 a 6:24**: um continente marrom-ferrugem com linhas retas poligonais e lagos brancos estourados nas mesmas posições. Só a cor geral muda um pouco.
  - Correção: em `Espaco.tsx`, animar o limiar da `placa` com a temperatura, `smoothstep(0.5+uQ*0.25, 0.56+uQ*0.25, …)`, com `uQ` de 0 (290 s) a 1 (380 s). Magma base amarelo-laranja `vec3(1.4,0.9,0.35)` em vez de branco.
- **ALTA, aparência dos polígonos.** As fissuras `fenda`/`cel` saem em segmentos retos, com cara de malha triangulada.
  - Correção: deformar as coordenadas antes do `cel`, `cel(uv*k + fbm(uv*8.)*0.6)`, e engrossar o glow da fissura.
- **MÉDIA.** No original, "Now the rock itself starts to melt" (4:50) é uma virada visível: as fissuras se abrem em manchas brilhantes. No produzido a bola continua marrom-escura até ~4:54.
  - Correção: `lava=smooth(288,296)`, mais cedo e mais rápido.

**4. Acabamento**
- **MÉDIA.** O original tem bloom e coroa macios, luz até 140 e saturação 103. O produzido tem a borda em anel marrom ("tigela"), saturação 192 e luz até ~72.
  - Correção: coroa mais forte (`opacity` 0,55 → 0,9), halo mais justo e menos saturação na lava.

**5. HUD e legendas**
- Tempos corretos, de 4:50 a 6:24.
- **BAIXA.** No produzido o planeta continua na tela até 6:26.0. No original a tela final entra em **6:25.0**.
  - Correção: `fim.s=385`.

**6. Som**
- **ALTA.** O original tem, de 4:52 a 6:22, um **ronco grave contínuo** (Vehicle 0,4–0,75, a −11/−15 dB) por baixo da música, com "Scary music" em 6:08.
- O produzido tem música dominante com ronco esporádico (4:52–4:58, 5:04–5:10, 5:32).
  - Correção: drone grave de lava (rumble de 30–60 Hz, com ruído marrom filtrado) contínuo de 290 a 385 s, a −14 dB.

---

## Capítulo `fim`: 6:26–6:45

- **Montagem, MÉDIA.** As telas atrasam: no original "Is any of this real?" entra em 6:25.0 e o corpo em 6:26.4; no produzido o título entra em ~6:26.5. A segunda tela entra em ~6:33.5 no original e em 6:34.9 no produzido, que ainda está a meia opacidade em 6:35.
  - Correção: `Fim` com `op(t,385,393.4)` e `op(t,393.5,405)`, com fade de 0,3 s.
- **HUD e legendas, MÉDIA, posição.** No original os textos ficam alinhados em cima: o título da tela 1 a ~40% da altura e o da tela 2 ("Now watch…") no **terço superior** (~22%). No produzido tudo é centralizado na vertical.
  - Correção: `justifyContent:'flex-start'` com `paddingTop` de 190 px na tela 2 e de 400 px na tela 1.
- **HUD e legendas, MÉDIA, cores trocadas.** No original o CTA "SUBSCRIBE FOR MORE WHAT IFS" é **laranja** e a pergunta "Which what if…" da tela 1 é branca. No produzido o CTA é cinza 70% e a pergunta é laranja.
  - Correção: inverter.
- **Acabamento, BAIXA.** O fundo do original é preto quente (~#0e0b08); o do produzido é preto azulado (#0b0d12).
- **Som, BAIXA.** O produzido está ~8 dB mais alto (−23/−29 contra −32/−36).

---

## Problemas globais (pipeline)

1. **Legenda sem itálico.** Em `Video.tsx`, `serif('italic')` carrega a face itálica, mas o CSS usa só `fontFamily: ital`. Sem `fontStyle: 'italic'` o navegador desenha a face reta. Afeta todas as legendas e o texto da intro. MÉDIA, conserto de uma linha.
2. **Transição entre mundos** feita com mergulho no preto. O original faz corte seco em 0:04 e fusões de 0,5–1 s em 0:58, 1:57, 2:56, 3:57 e 5:39. MÉDIA a ALTA.
3. **Grade de cor que não evolui.** O original fica cada vez mais sépia e lavado com o calor; o produzido continua saturado. ALTA. Um overlay de cor ligado a `tempTxt(t)` resolve barato.
4. **Mix de som.** Música alta demais e falta de foley de eventos (multidão, fontes, motores, fervura, fogo, drone). ALTA. Correlação de volume 0,575.

---

## Os 10 desvios mais graves

| # | Tempo | Desvio | Correção barata |
|---|---|---|---|
| 1 | 0:04–0:58 | Câmera aérea, quase parada e com corte em 0:24, no lugar do plano de grua baixo e contínuo que desce do calçadão até a água; palmeira atravessando a lente (0:24–0:44) | Uma trajetória só de 4 a 58 s, com 4 chaves baixas; tirar as copas próximas |
| 2 | 1:58–2:56 | Honolulu com praia lotada e carros andando a 100–200 °C; sem o voo sobre o mar fervendo nem o giro de volta à costa | `fugaT=200` e sem carros; trajetória costa → mar → giro |
| 3 | 2:58–3:58 | Mar de Santa Mónica turquesa e limpo enquanto tudo queima; fogo em cones amarelos chapados; copas não carbonizam | VaporMar total e mar escuro; chamas com múltiplas línguas aditivas e faíscas; copa escurecendo |
| 4 | 1:16–1:56 | Vegas: o lago não seca para revelar asfalto, carros e garrafas; o vapor é uma faixa branca e não engole a câmera | `seca` rápido em 81–84 s; fundo com asfalto, caixas-carro e garrafas; sprites de vapor na frente da câmera |
| 5 | 4:56–6:24 | Lava estática, com polígonos retos e lagos brancos fixos, no lugar de crosta que encolhe progressivamente; falta a virada de 5:39.5 | Limiar da `placa` animado; `cel` com distorção; dissolver em `quente` em 339 s |
| 6 | 0:00–6:24 (espaço) | Planeta pequeno demais (~0,6× contra 1,2–1,3× a altura); Terra entra verde e azul em vez de seca; salto de câmera em 4:50 | Câmera a 1,75–2,6; `seco` antecipado; chaves contínuas entre `terra` e `lava` |
| 7 | Todo o vídeo | Cor saturada de cartão-postal (125 contra 84) sem a progressão sépia e névoa do calor | Overlay de grade e `fog` ligados à temperatura |
| 8 | 2:56, 3:26, 3:44 | Plano contínuo do original picotado em 3 trechos com escurecimento e cortes secos; fusões do original trocadas por preto em todas as mudanças de mundo | Fundir as câmeras de sm3/sm4/sm5; fusão cruzada em vez de `corte` |
| 9 | Todo o vídeo (som) | Sem multidão, fontes, motores, fervura, crepitar e drone de lava; intro 13 dB baixa; música ~10 dB alta nas cenas de praia | Camadas de foley por capítulo e música −8 dB |
| 10 | 0:00–0:11 e 6:25–6:45 | Texto da intro ilegível sobre o planeta e sem faixa; título que fica até 10,5 s em cima da legenda; legendas sem itálico; telas finais 1 s atrasadas, centralizadas e com cores trocadas | `fontStyle:'italic'`; título até 7 s; faixa no `Centro`; `Fim` em 385 s, alinhado em cima, CTA laranja |

## Nota de fidelidade (0–10)

| Dimensão | Nota | Por quê |
|---|---|---|
| Cinematografia | **3** | Altura, ângulo e tamanho do sujeito diferentes em quase todo capítulo; movimento a 36% do original; composição média 0,38 |
| Montagem | **4** | Tempos dos capítulos corretos, mas preto no lugar de fusões, 4 cortes a mais, a fusão de 5:39 faltando e telas finais atrasadas |
| Roteiro/ações | **4** | A sequência de beats existe, mas eventos centrais faltam ou se contradizem: praia, lago, carros, Honolulu viva, mar sem ferver, lava estática |
| Acabamento | **3** | Paleta oposta, modelos brutos (torre preta, Diamond Head, palmas de fios, fogo em cones), vapor branco, halo em anel |
| HUD/legendas | **7** | HUD quase idêntico e legendas sincronizadas em ±0,5 s; perdem pontos pelo itálico, pelo título sobreposto, pelo texto da intro e pelas telas finais |
| Som | **4** | Correlação de volume 0,58; só música onde o original tem paisagem sonora e eventos; níveis invertidos na intro e na praia |
