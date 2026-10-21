# Auditoria comparativa: original (What If Sim) × produzido (What If ES)

Data: 21/10/2026. Vídeos auditados: os 4 produzidos na madrugada.

| # | Original | Produzido |
|---|---|---|
| 1 | What If Earth Spun Faster and Couldn't Stop? | ¿Qué pasaría si la Tierra girara cada vez más rápido…? |
| 2 | What If You Got Hotter and Couldn't Stop? | ¿Qué pasaría si te calentaras cada vez más…? |
| 3 | What if Earth kept getting hotter and couldn't stop? | ¿Qué pasaría si la Tierra se calentara cada vez más…? |
| 4 | What If You Got Heavier and Couldn't Stop? | ¿Qué pasaría si pesaras cada vez más…? |

## Como foi feito

1. **Vídeo comparativo** de cada par: original à esquerda e produzido à direita, mesma linha do tempo, tempo marcado, áudio original no canal esquerdo e produzido no direito. Arquivos: `D:\whatif_es\auditoria\<vídeo>\comparativo.mp4`.
2. **Leitura óptica a 10 fps**, medida nos dois vídeos separadamente e quadro a quadro, com o painel e a legenda mascarados (`auditoria/medir.py`):
   - cortes (histograma de cor);
   - movimento de câmera (fluxo óptico Farneback): magnitude, pan, tilt, zoom e rolagem;
   - luz, saturação e colorido;
   - densidade de detalhe (bordas);
   - paleta (histograma de matiz);
   - semelhança de enquadramento.

   O resumo por capítulo está em `auditoria/<vídeo>/capitulos.md` e os gráficos em `graficos.png`.
3. **Leitura visual** das folhas de contato do comparativo: visão geral a cada 2 s (16 folhas) e 83 folhas densas a 10 fps (3 s em volta de cada troca de capítulo e de cada corte do original). Os quadros-chave foram conferidos em resolução cheia.
4. **Mapa de som**: classificador AudioSet (PANNs) a cada 2 s nos dois, comparado janela a janela (`som_resumo.json`, `som_comparado.json`).
5. Um relatório detalhado por vídeo, capítulo a capítulo, com tempos, gravidade e correção: `D:\whatif_es\auditoria\<vídeo>\relatorio.md`, com cópia em `docs/whatif-es/auditoria/`.

## Notas de fidelidade (0 a 10)

| Dimensão | V1 Spun Faster | V2 Got Hotter | V3 Earth Hotter | V4 Got Heavier | Média |
|---|---|---|---|---|---|
| Cinematografia | 4,0 | 3,5 | 3,0 | 4,0 | **3,6** |
| Montagem | 5,0 | 3,0 | 4,0 | 5,0 | **4,3** |
| Roteiro / ações | 4,0 | 4,5 | 4,0 | 4,5 | **4,3** |
| Acabamento | 3,5 | 3,0 | 3,0 | 3,0 | **3,1** |
| HUD / legendas | 7,0 | 7,0 | 7,0 | 7,0 | **7,0** |
| Som | 5,0 | 4,0 | 4,0 | 3,5 | **4,1** |
| **Média do vídeo** | **4,8** | **4,2** | **4,2** | **4,5** | **4,4** |

**O que está bom nos quatro:**
- **Tempo:** os capítulos começam onde começam no original.
- **Legendas:** batem em ±0,5 s.
- **Painel:** traz os mesmos números (em unidades métricas) e a sequência de acontecimentos existe.

**O que denuncia que é outro vídeo é como cada coisa é mostrada:**
- o acabamento;
- a câmera;
- as transições;
- eventos-chave que faltam ou se contradizem;
- o desenho de som.

## Medidas a 10 fps (vídeo inteiro)

| | V1 | V2 | V3 | V4 |
|---|---|---|---|---|
| Saturação média, original / produzido | 85 / 151 | 74 / 122 | 84 / 125 | 76 / 176 |
| Saturação nas cenas de espaço, O / P | 26–120 / 211–239 | 47–101 / 151–213 | 64–103 / 192–223 | 53–70 / 189–247 |
| Movimento de câmera, O / P (px/quadro) | 0,25 / 0,27 | **0,83 / 0,30** | **0,25 / 0,09** | **0,44 / 0,29** |
| Cortes detectados, O / P | 33 / 135* | 6 / 20 | 4 / 9 | 15 / 11 |
| Paleta (interseção de matiz, 1 = igual) | 0,64 | 0,56 | 0,39 | 0,62 |
| Composição (correlação de enquadramento) | 0,36 | 0,33 | 0,38 | 0,30 |
| Correlação de volume do áudio | 0,39 | 0,44 | 0,58 | 0,20 |

\* No V1, os "cortes" a mais são o ciclo dia/noite trocando de um quadro para o outro (efeito estroboscópico, ver P1).

## Padrões que se repetem nos 4 vídeos (causas na raiz)

### 1. Acabamento: o produzido parece "cartão-postal"; o original, fílmico (ALTA nos 4)
- **Cor e luz:** saturação 1,5 a 3,5 vezes maior. O original tem tons dessaturados, névoa atmosférica, bloom macio nos brilhos, luz lateral de fim de tarde e céu enevoado com nuvens grandes e macias. O produzido tem céu azul chapado, nuvens-pipoca, mar ciano listrado e luz de meio-dia.
- **Espaço:** o fundo do original é preto neutro com névoa de nebulosa sutil. O nosso é preto azulado e puro, com Terra pequena, escura e supersaturada.
- **Sem pós-processamento nenhum:** sem bloom, tone mapping fílmico, gradação, vinheta ou névoa por profundidade.

### 2. Câmera menos viva e enquadrada de outro jeito (ALTA nos V2, V3 e V4)
- O original se move de 1,5 a 2,8 vezes mais e tem panorâmicas lentas, chicotes (whip pans), gruas que descem e recuos.
- O original faz **planos contínuos** onde nós cortamos:
  - V3: 0:04–0:58 numa grua só; 2:56–3:57 num plano só;
  - V2: quase um plano-sequência, com as mãos subindo e descendo dentro do quadro;
  - V4: o mirante inclina até a vista vertical; Miami desce até o chão para o tsunami.
- Altura e ângulo diferentes: nossa câmera aérea onde o original é baixa (V3 Santa Mónica, V3 Las Vegas), na altura dos olhos onde o original olha a areia (V2 mãos).
- Planetas cerca de 30–50% menores no quadro (V1, V2, V3).

### 3. Transições (MÉDIA a ALTA nos 4)
- O original troca de mundo com **fusão de 0,2–1 s** ou corte seco.
- Nós mergulhamos no preto (0,25 s) em toda troca de mundo e cortamos secos onde o original é contínuo.

### 4. Eventos-chave que faltam ou contradizem a legenda (ALTA)

**V1**
- A praia não alaga ("La playa desapareció" sobre praia seca).
- Achatamento e anel de escombros atrasados e pequenos.
- Paredão chapado.
- Lua com a Terra colada atrás.

**V2**
- Mãos sem brilho e, de 2:04 a 2:58, só duas "varas" pretas.
- Terra com as Américas do lado da noite enquanto a legenda diz "el lado de día ciega".
- Píer sem fogo enquanto a legenda diz "El muelle está en llamas".
- Sem chamas em tela cheia nem subida pelas nuvens.

**V3**
- A praia não esvazia.
- O lago de Las Vegas não seca para revelar asfalto e carros.
- Honolulu cheia de gente e carros a 200 °C.
- O mar de Santa Mónica não ferve.
- A lava não evolui.

**V4**
- Sem o vidro estilhaçando.
- Sem a parede do tsunami engolindo a câmera.
- A Terra some antes de o disco se formar.
- Sem o colapso do Sol.
- Sem a sombra do buraco negro engolindo a tela no final.
- Sobram 7 galáxias voando, a Lua esticada como charuto e um fio de gás que o original não tem.

### 5. Modelos e efeitos brutos (ALTA)
- **Pessoas:** blocos estilo Minecraft, grandes e colados na câmera (o original tem bonecos low-poly com proporção humana, menores e em menor quantidade).
- **Fogo:** cones/lâminas amarelas chapadas (o original tem línguas laranja pequenas, fumaça escura, restos carbonizados).
- **Prédios:**
  - arranha-céus de vidro com grade de janelas uniforme onde o original tem hotéis baixos;
  - torre preta sem textura em Las Vegas;
  - Diamond Head como cone verde liso.
- **Partículas:** chafariz de cone único (o original tem 7 jatos), poeira e fumaça em borrões chapados.
- **Espaço:** galáxia de pontos brancos duros sem núcleo dourado; Sol como disco nítido; buraco negro em alvo laranja (ver seção própria).

### 6. Som (ALTA)
- Música contínua dominando, de 7 a 13 dB acima do original em vários trechos.
- Faltam as camadas de ambiente e efeitos que o original tem:
  - multidão, ondas e chafariz;
  - água em geral: das janelas em que o original tem água, 25–60% (V1–V3) e 100% (V4) não têm no nosso;
  - crepitar e estrondos de fogo;
  - fervura;
  - ronco de lava.
- Perdemos os **silêncios dramáticos**: V1 em 7:15, V2 em 7:16, V4 em 6:06.
- Sobram efeitos fora de hora: sirene tonal no terremoto do V1, explosão antecipada em 4:58 do V1.
- V4 tem uma falha de áudio em 2:54–2:57.

### 7. HUD e legendas (MÉDIA, conserto barato)
- **Bug:** as legendas e frases centrais saem **sem itálico**. A face itálica é carregada, mas falta `fontStyle: 'italic'` em `Legenda` e `Centro` no `Video.tsx`.
- O título fica até 10,5 s e se sobrepõe à legenda (no original sai por volta de 7 s).
- O texto da abertura fica ilegível sobre o planeta (V3, V4).
- O painel do V1 está adiantado alguns minutos em relação ao do original.
- V4: faltam as comparações piano, carro, elefante, jumbo e Torre Eiffel, e há um desvio do painel em 0:25–0:28.
- **Telas finais:** o original alinha em cima (deixa o terço de baixo livre para os cards do YouTube) e faz o CTA em laranja; nós centralizamos e invertemos as cores.

### 8. Estroboscópio do dia/noite (V1, ALTA, risco de fotossensibilidade)
No original, cada dia passa por pôr do sol laranja, crepúsculo, noite com luzes e amanhecer, com período visual em torno de 3,6 s. No nosso a luz troca de dia para noite de um quadro para o outro, com período que cai até 0,1–0,3 s (3:23, 4:21).

## Buraco negro: o que o original tem de fato

Conferi os quadros do original (0:01, 0:03, 2:45, 4:10, 5:40, 5:55, 5:58, 6:01). **O original não usa disco relativístico**: não há lente gravitacional, arco do disco dobrado por cima da sombra nem lado mais brilhante por Doppler. É um disco **estilizado**:
- **Planos médios:** miolo creme quase branco, ranhuras concêntricas finas e de baixo contraste (como vinil) e borda laranja macia.
- **Sombra:** esfera preta com a faixa do disco passando na frente.
- **Closes:** disco bege dessaturado com riscos escuros de movimento, sombra elíptica preta sobre o disco e **anel de fótons grosso com brilho macio**.

O nosso fica bruto por quatro motivos:
- paleta laranja estourada (saturação 190–250 contra 60–80);
- anel de fótons como traço fino e duro, sem brilho;
- falta a sombra elíptica sobre o disco;
- os discos têm 40–60% do tamanho do original.

Somam-se o clímax final (a sombra engolindo a tela) e a intro com avanço da câmera, que não existem no nosso.

**Duas rotas:**
- **Fidelidade ao original (recomendada, barata, de 2 a 4 h):**
  - recolorir o shader do disco (creme, depois laranja, com ranhuras finas de baixo contraste);
  - anel de fótons espesso com brilho;
  - sombra elíptica no plano do disco;
  - bloom no pós-processamento;
  - discos com o dobro do tamanho.
- **Acima do original, visual Interstellar (a imagem de referência):**
  - **opção de 2–4 h, "Gargantua falso":** um segundo anel virado para a câmera fazendo o papel do verso lenteado, mais um efeito de pós-processamento que entorta a imagem em volta do buraco;
  - **opção de ½–1 dia:** portar o shader de geodésica do [oseiskar/black-hole](https://github.com/oseiskar/black-hole) (licença MIT, Doppler e beaming prontos, cerca de 2–8 ms por quadro). Os shaders do Shadertoy não servem: a licença padrão é não comercial.

## Deficiências do stack e correções pela rota barata

Pesquisa feita em repositórios e bibliotecas, só com licença comercial. Os custos de GPU são estimativas para render offline.

| # | Deficiência | Correção barata | Esforço | Efeito |
|---|---|---|---|---|
| 1 | Sem pós-processamento: visual chapado e saturado | `EffectComposer` (já instalado: postprocessing 6.39 + @react-three/postprocessing 3.2): AgX tone mapping, Bloom mipmap (só o que passar de 1.0), LUT própria (gradada no DaVinci a partir de um quadro do original) ou HueSaturation, Vignette, N8AO (CC0/ISC) em `halfRes` sem `accumulate`. Nada temporal: sem TAA, sem `Noise` | 1 dia | Muda o visual dos 4 vídeos de uma vez |
| 2 | Sem névoa atmosférica | Efeito de neblina por profundidade e altura próprio (cerca de 50 linhas, vale também para os nossos ShaderMaterial), com cor ligada ao céu e à temperatura (sépia no V3) | ½ dia | Profundidade e "ar" do original |
| 3 | Cor que não evolui com a história | Gradação por capítulo/temperatura (uniform na LUT ou overlay `mix-blend`) | 2 h | V3 vai ficando sépia como o original |
| 4 | Fogo em cones | Shader de fogo toon (técnica GDQuest, código MIT): dois ruídos rolando com `frame/fps`, máscara em gota, 2–3 faixas de cor, núcleo aditivo. Faíscas com sprites do Kenney Particle Pack (CC0) em partículas sem estado | ½ dia | Fogo estilizado bonito |
| 5 | Nuvens, vapor e fumaça em sprites duros | `<Clouds>/<Cloud>` do drei (MIT) com `seed` fixo e `speed=0` (determinístico), textura procedural nossa. Fumaça e vapor com sprites Kenney Smoke (CC0) e *soft particles* (sem corte duro onde o sprite cruza a geometria) | ½ dia | Nuvens macias como as do original |
| 6 | Pessoas de bloco e mãos de caixa | Mãos: `generic-hand` do webxr-input-profiles (MIT, cerca de 94 KB, riggadas, posadas por quadro). Pessoas: Kenney / Quaternius (CC0 ou QAL, uso comercial ok), via `gltfjsx --transform` | 1 dia | Personagens e mãos com acabamento |
| 7 | Prédios e cenário genéricos | City Kits do Kenney (CC0, glTF) para hotéis baixos e cidade; Nature Kit para palmeiras e árvores | ½–1 dia | Cidade e orla críveis |
| 8 | Galáxia de pontos duros | `threejs-galaxy-shader` (MIT, determinístico com `u_time` nosso) ou pontos gaussianos com 2–3 cores, mais bloom | 30 min – ½ dia | Núcleo dourado e braços azulados |
| 9 | Terra sem atmosfera crível | Casca com brilho de fresnel na borda e camada de nuvens girando por quadro; depois, se valer, `glsl-atmosphere` (Unlicense) para o terminador alaranjado | 2 h – ½ dia | Terra como a do original |
| 10 | Mar ciano listrado | Melhorar o nosso shader: fresnel com a cor do céu, absorção por profundidade, espuma por ruído, brilho especular acima de 1.0 (para o bloom) | 2–3 h | Água espelhada e calma |
| 11 | Buraco negro | Ver a seção acima | 2–4 h | Clímax do V4 |
| 12 | Som só de música | Tabela de camadas de ambiente por capítulo no roteiro (arquivo, dB, fades), gerada com o MOSS como hoje, mas por evento; silêncios do original; música −6 a −10 dB nas cenas com ambiente | ½ dia por vídeo | Paisagem sonora do original |

**Cuidados encontrados na pesquisa:**
1. O `ThreeCanvas` do Remotion chama `advance(performance.now())`, então qualquer coisa que leia `clock` ou `delta` (o `<Stars>` do drei, `Sparkles`, `Float`, `Cloud` com `speed>0`, `Water2`, o `Noise` do postprocessing) varia entre renders. Tudo deve usar `frame/fps` e semente fixa (já fazemos; manter ao adotar bibliotecas).
2. Os shaders do Shadertoy têm licença padrão CC BY-NC-SA, que proíbe uso comercial.
3. Assets sem licença ou não comerciais, que **não usar**:
   - `cloud.png` do drei-assets (sem licença; hoje usamos em Nuvens e no vapor, então trocar por textura procedural);
   - `milkyway.jpg` dos repositórios de buraco negro (CC BY-NC);
   - texturas do PlanetPixelEmporium.

## Plano de correção priorizado

**P0. Consertos de uma linha a meia hora (todos os vídeos):**
1. `fontStyle: 'italic'` nas legendas e frases centrais.
2. Título até cerca de 7 s; texto de abertura com faixa escura atrás.
3. Telas finais alinhadas em cima, CTA laranja, silêncio onde o original silencia.
4. Trocar o mergulho no preto por fusão de 0,6 s (ou corte seco onde o original corta).
5. Ciclo dia/noite do V1: período visual fixo de cerca de 3,6 s com rampa de pôr do sol (fim do estroboscópio).
6. Trocar o `cloud.png` sem licença por textura nossa.

**P1. Pipeline (vale para todos os vídeos futuros):**
1. Pós-processamento fílmico + névoa por profundidade + gradação por capítulo.
2. Câmera:
   - chaves contínuas entre capítulos de um mesmo plano;
   - chicotes e gruas onde o original tem;
   - checar altura e ângulo contra a folha a 10 fps do original antes de renderizar.
3. Leitura de ações capítulo a capítulo como lista de verificação: cada legenda tem que estar acontecendo na tela.
4. Som por camadas de evento + automação de ganho por capítulo.
5. **Auditoria comparativa automática antes de entregar:** comparativo + `medir.py` + `comparar.py`. Alvos: saturação dentro de ±20% do original, movimento de câmera ±30%, paleta ≥ 0,6.

**P2. Assets (uma vez):** mãos glTF, pessoas e cidade do Kenney/Quaternius, fogo toon, nuvens do drei, galáxia, Terra com atmosfera, buraco negro.

**Estimativa:** com o P0 e o pós-processamento do P1, sem mexer em modelos, a nota média deve subir de cerca de 4,4 para cerca de 6,5. Com P1 e P2 completos, passa de 8.

## Arquivos

- Comparativos lado a lado: `D:\whatif_es\auditoria\<vídeo>\comparativo.mp4`.
- Por vídeo: `relatorio.md` (capítulo a capítulo), `capitulos.md` (métricas), `graficos.png`, `som_resumo.json`, `folhas/` (geral a cada 2 s e densas a 10 fps).
- Ferramentas: `D:\whatif_es\auditoria\comparativo.sh`, `medir.py`, `comparar.py`, `folhas.py`, `som.py`.
