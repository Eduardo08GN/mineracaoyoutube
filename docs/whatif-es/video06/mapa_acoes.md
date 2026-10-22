# Mapa de ações — "What If Earth Spun Slower and Couldn't Stop?" (What If Sim)

Original: 6:52 (412,0 s), 30 fps, 1920x1080. Visual low-poly com céu e água realistas (Unreal/three-like), pessoas em forma de cápsula colorida. Não há POV fixo: cada capítulo é um lugar diferente (praia do equador, Cannon Beach, Times Square, Terra do espaço, Golden Gate, Santa Monica, calçadão da cidade), ligados por fusões de 0,6 s. O HUD do canto superior esquerdo corre o vídeo todo.

- Mapa completo: `D:\whatif_es\06_spun_slower\mapa_acoes.json` (414 itens: 225 de HUD, 65 legendas, 61 de ambiente, 26 de câmera, 23 de transição, 7 de objeto, 7 de pessoa).
- HUD a cada 2 s: `D:\whatif_es\06_spun_slower\hud.json` (206 leituras; OCR rapidocr no recorte 1080p, valores estranhos conferidos à mão).
- Legendas limpas: `D:\whatif_es\06_spun_slower\legendas_en_corrigidas.json` (65 linhas, incluindo cold open, título e telas finais).
- Folhas de contato: `D:\whatif_es\06_spun_slower\teste\mapa\` (s05_* a cada 0,5 s no vídeo todo; d01, d02, d02b, d05 a 0,1–0,25 s nos trechos críticos; tr1/tr2 com todas as fusões a 0,1 s; sb1/sb2 com a faixa de legenda a 0,2 s; h1–h3 e fmt128 com as trocas de formato do número; end com as telas finais; sky com o trecho do céu).

Precisão: os movimentos de câmera foram medidos por correlação de fase/fluxo óptico nos q10 (px por 2 s num quadro de 480 px; dx positivo = a imagem anda para a direita = pan para a esquerda). Os cortes e as fusões foram lidos a 0,1 s. As legendas, a 0,2 s (crops 5 fps da faixa de legenda, com fade de ~0,2 s). As trocas de linha do HUD, a 0,2 s.

## HUD (vale para o vídeo todo)
- **Posição.** Canto superior esquerdo, alinhado em x≈92 px (1080p). Some no cold open (0–4,1) e nas telas finais (390,1–412). Entra em fade de 0,2 s em 4,1–4,3.
- **Linhas.**
  1. Rótulo pequeno, em versalete espaçado: `ONE DAY LASTS`.
  2. Número grande em serifa: a duração do dia.
  3. `THE GROUND AT THE EQUATOR: <n> MPH` (branco, sans espaçada). Depois de 311,6 aparece `<n> MPH BACKWARDS`.
  4. Local (cinza): THE EQUATOR → CANNON BEACH, OREGON (60,1) → NEW YORK (74,1) → EARTH (103,5) → SAN FRANCISCO (132,5) → SANTA MONICA (159,1) → EARTH (217,5) → THE EQUATOR (244,5) → EARTH (300,5) → THE EQUATOR (329,5). A linha some por ~0,2 s e volta a cada troca de cena. A troca acontece 0,1–0,3 s ANTES da fusão de imagem em 60,0 / 74,0 / 159,0, e durante a fusão nas demais. Também pisca, sem trocar de texto, em 188,0 e 271,1.
  5. Comparação em laranja: FASTER THAN SOUND → AN AIRLINER (74,2) → A BULLET TRAIN (107,6) → A CAR ON THE HIGHWAY (160,0) → A BICYCLE (188,8) → WALKING PACE (225,0) → THE SUN HAS STOPPED IN THE SKY (257,8) → THE SUN RISES IN THE WEST (286,2, até o fim). As cinco primeiras começam com "THE EQUATOR MOVES FASTER THAN …".
- **Formatos do número ONE DAY LASTS.**

| Trecho (s) | Formato | Exemplo |
|---|---|---|
| 4,1–11 | relógio parado | 24 h 00 m |
| ~11–128,4 | horas e minutos subindo (cada vez mais rápido) | 24 h 08 m (12 s) … 71 h 51 m (128,4) |
| 128,5–178,1 | dias com 1 decimal | 3.0 days … 9.9 days |
| 178,2–213,1 | dias inteiros | 10 days … 60 days |
| 213,2–245,5 | meses inteiros | 2 months … 11 months |
| 245,6–257,7 | anos | 1 year, 1.2 years … 2.0 years |
| 257,8–286,1 | palavra | FOREVER |
| 286,2–~294 | anos descendo | 2.0 years → 1.3 years |
| ~294–311,9 | 1 year parado (Terra parada, 0 MPH de ~300 a 311,5) | 1 year |
| 312,0–317,7 | meses descendo | 11 months … 2 months |
| 317,8–334,7 | dias inteiros descendo (pula de 2 months para 58 days) | 58 days … 10 days |
| 334,8–345,3 | dias com decimal | 9.8 days … 3.0 days |
| 345,4–390,1 | horas e minutos descendo | 71 h 46 m … 24 h 00 m (388,0) → 23 h 5x m |

- **Velocidade no equador (mph).** 1,037 (até 11) → 949 (30) → 829 (60) → 766 (74) → 650 (102) → 333 (130) → 199 (160) → 72 (188) → 19 (214) → 6.2 (244) → 4.2 (258) → 1.4 (286) → 0 (300–311) → 0.1 BACKWARDS (311,6) → 54 BACKWARDS (330) → 365 (346) → 595 (364) → 933 (380) → 1,033 BACKWARDS (388). A velocidade bate com a física: o dia solar mostrado é coerente com o período sideral calculado a partir da velocidade, inclusive o "FOREVER" (rotação de 1 ano) e o "1 year" com 0 MPH.
- Leituras completas: `hud.json`.

## Capítulos

| # | Início–fim (s) | Mundo / cena |
|---|---|---|
| 1 | 0,0–4,1 | Cold open: calçadão da cidade no equador ao amanhecer, legenda "In 6 minutes, the Sun rises in the west." (flash-forward de ~345 s), sem HUD |
| 2 | 4,1–29,9 | Praia do equador vista da varanda (fonte, palmeiras, mar), título, 4 ciclos dia/noite cada vez mais longos |
| 3 | 29,9–60,9 | Praia no nível da areia (posto de salva-vidas, guarda-sóis): o mar recua e o leito seca |
| 4 | 60,9–74,9 | Cannon Beach, Oregon (casa de tijolo, Haystack Rock): a água sobe e uma muralha se forma no mar |
| 5 | 74,9–103,9 | Times Square: a parede de água chega pela avenida (corte em 97,8) e passa por cima como um teto |
| 6 | 103,9–132,9 | Terra do espaço (Américas): a rotação desacelera e um cinturão de terra surge no equador |
| 7 | 132,9–159,9 | Golden Gate: o estreito seca e a ponte fica em terra |
| 8 | 159,9–188,9 | Santa Monica de dia (píer com roda-gigante): a tarde não acaba |
| 9 | 188,9–217,9 | Santa Monica à noite: noite de semanas, tudo congela |
| 10 | 217,9–244,9 | Terra do espaço (Índico): um lado assa, o outro congela |
| 11 | 244,9–271,7 | Equador sem mar: tilt para o céu, o Sol para (FOREVER) |
| 12 | 271,7–300,9 | Equador: o Sol volta a andar para trás e se põe no leste |
| 13 | 300,9–329,9 | Terra do espaço (Atlântico): parada, depois girando ao contrário |
| 14 | 329,9–357,0 | Calçadão da cidade (o lugar do cold open): noite → o Sol nasce no oeste |
| 15 | 357,0–390,1 | Equador: a onda gigante volta e cobre tudo; teto de água |
| 16 | 390,1–412,0 | Telas finais: "You started on a 24-hour day." / "Is any of this real?" / "Now watch what happens if Earth spun faster." |

## Linha do tempo por capítulo

### 1 · Cold open (0–4,1)
- 0,0–4,1: calçadão à beira-mar com prédios brancos escalonados de telhado marrom. O céu é lilás e o Sol baixo brilha entre os carros no centro. Postes acesos. Dezenas de pedestres-cápsula andam em velocidade normal, e passam carros (branco, vermelho, amarelo).
- Uma palmeira no 1º plano corta o canto superior esquerdo.
- **Câmera:** no calçadão, a ~2 m de altura, olhando os prédios (oeste). Faz um travelling lateral lento para a DIREITA (a palmeira vai de ~13% para ~4% da largura).
- 0,5–4,1: legenda "In 6 minutes, the Sun rises in the west.", no terço superior, centralizada. É a única legenda fora da base.
- 4,1: **corte seco** para a praia. O cold open repete o plano de ~345–347 s.

### 2 · Praia do equador (4,1–29,9)
- **Câmera:** alta, a ~15–20 m, numa varanda de prédio, olhando o mar (leste) levemente para baixo. No canto inferior esquerdo aparecem o canto do terraço e um carro escuro. Deriva contínua lenta, com pan para a esquerda e tilt para cima (4–6 px/2 s). Sem cortes.
- **Cena:** praça com fonte circular azul (jato branco), palmeiras, areia, mar turquesa e horizonte a ~40% da altura. Uma multidão em time-lapse anda rápido.
- 4,1–4,3: entra o HUD (24 h 00 m / 1,037 MPH / THE EQUATOR / FASTER THAN SOUND).
- 4,4–6,9: título "What If Earth Spun Slower / and Couldn't Stop?" em duas linhas, no centro, com pílula escura.
- Ciclos de dia e noite (o Sol sempre nasce à DIREITA, sobre o mar):

| Dia | Pôr do sol | Noite | Nascer do sol |
|---|---|---|---|
| 1: 4,1–5,4 | 5,4–6,1 | 6,1–6,9 | 7,0–7,3 |
| 2: 7,3–9,2 | 9,3–9,9 | 9,9–10,8 | 10,9–11,2 |
| 3: 11,2–13,2 | 13,3–14,1 | 14,1–15,2 | 15,2–15,6 |
| 4: 15,6–18,3 | 18,4–19,4 | 19,4–21,1 | 21,1–21,6 |
| 5: dia longo, 21,6–27 | entardecer lento 27–29,3 | — | — |

  - À noite, a fonte e os postes ficam iluminados.
- O número do HUD começa a subir em ~11 s.
- 29,3–29,9: **fusão** para a areia.

### 3 · O mar recua (29,9–60,9)
- **Câmera:** na areia, a ~2 m, olhando o mar. Plano único.
  - 29,9–46: pan contínuo para a ESQUERDA com push-in leve (+2 a +5% de escala a cada 2 s).
  - 46–60,9: pan mais lento, sem zoom.
- **Cena:** guarda-sóis (rosa, magenta, branco), toalhas, posto de salva-vidas listrado (amarelo, verde e rosa) sobre palafitas, sombra grande de palmeira no canto inferior esquerdo. Banhistas em time-lapse.
- 36–44: a arrebentação se afasta e aparece areia molhada escura.
- 44–48: o mar vira uma faixa fina no horizonte.
- 48–60: leito seco escuro, com objetos e barcos encalhados. A luz de fim de tarde cai entre 52 e 60.
- 60,3–60,9: **fusão**.

### 4 · Cannon Beach, Oregon (60,9–74,9)
- **Cena:** estrada com faixa amarela no 1º plano, com 2–3 pedestres caminhando. Depois, grama e praia larga. Na areia, uma casa de tijolo de telhado vermelho e, ao fundo, o Haystack Rock (domo cinza com topo verde). Céu de nuvens fofas.
- **Câmera:** a ~3 m, na beira da estrada.
  - 60,9–68: pan para a ESQUERDA + push-in (+4 a +6% a cada 2 s).
  - 68–74,9: pan para a DIREITA + pull-back (−4 a −7%). Por volta de 70,5 isso revela um pinheiro e um poste à direita da casa.
- 64–73,5: a arrebentação avança pela areia em direção à casa.
- 70–74,3: uma linha longa e alta de onda se forma no horizonte.
- 74,3–74,9: **fusão**.

### 5 · Times Square (74,9–103,9)
- **Plano A, 74,9–97,8.** A câmera está no topo da escadaria vermelha do TKTS, a ~4 m, olhando a avenida para o norte. Prédios low-poly cobertos de telões (THE SHOW, OPEN 24H, TICKETS, TONIGHT, COMING SOON), táxis amarelos, pedestres.
  - 74,9–80: leve pan para a direita.
  - 80–88: tilt para CIMA. A escada vermelha sai pela base.
  - 88–97,8: dutch angle crescente (~10–15°), tilt para cima e zoom-out (−7 a −8% a cada 2 s em 92–96).
  - 90,5–92: uma faixa azul-petróleo aparece no fim da avenida.
  - 92–96,5: a parede de água sobe entre os prédios.
  - 96,5–97,7: espuma e spray tomam o quadro.
- 97,8: **corte seco**.
- **Plano B, 97,8–103,9.** Grande-angular baixa, a ~1 m, na faixa de pedestres. Os prédios convergem e o céu virou um teto de água azul-petróleo, com estrias correndo para o ponto de fuga. Os pedestres continuam atravessando. Tilt lento para cima, com leve roll.
- 103,3–103,9: **fusão**.

### 6 · Terra, Américas (103,9–132,9)
- **Cena:** globo a ~60% da largura, com o lado noturno à esquerda (luzes de cidades), um reflexo do Sol, estrelas fracas e um halo/anel fino atrás.
- **Câmera:** fixa, com uma leve aproximação (incerta).
- A superfície gira da esquerda para a direita e desacelera (de ~22 para ~2 px/2 s).
- 110–117: surge uma faixa bege no Pacífico, ao longo do equador.
- 117–132,9: a faixa vira um cinturão contínuo em volta do planeta.
- 128,5: o número passa de "71 h 51 m" para "3.0 days".
- 132,3–132,9: **fusão**.

### 7 · Golden Gate (132,9–159,9)
- **Cena:** mirante de concreto com guarda-corpo preto. A torre vermelha aparece cortada no alto, o tabuleiro e os cabos cruzam o topo, e os morros verdes de Marin ficam à direita.
- **Câmera:** pan lento para a ESQUERDA + push-in leve.
- 133–146: a água baixa e surgem bancos de areia.
- 146–153: o leito vira areia bege.
- 153–159,9: a base da torre fica em terra seca.
- 159,3–159,9: **fusão**.

### 8 · Santa Monica de dia (159,9–188,9)
- **Cena:** o píer com a roda-gigante no alto à esquerda, praia com palmeiras e calçadão com postes. A luz de tarde fica parada, e as sombras giram muito devagar.
- **Câmera:** elevada, a ~6 m, olhando o mar. Pan contínuo para a DIREITA (−10 a −19 px/2 s) com leve pull-back. O píer sai do quadro em ~186.
- 178,2: o número passa de "9.9 days" para "10 days".
- 188,3–188,9: **fusão**.

### 9 · Santa Monica à noite (188,9–217,9)
- **Cena:** a roda-gigante e o píer, iluminados, ficam no centro-alto. Céu com estrelas, postes laranja, areia azulada.
- **Câmera:** pan lento para a DIREITA. A roda vai do centro para a esquerda.
- 196–217,9: a geada embranquece a areia e o calçadão.
- 213,2: o número passa de "60 days" para "2 months".
- 217,3–217,9: **fusão**.

### 10 · Terra, Índico (217,9–244,9)
- **Cena:** Índia, África e Arábia. O terço esquerdo está em noite, com luzes. Os oceanos recuaram e o fundo do mar aparece bege em volta dos continentes.
- **Câmera:** parada. A rotação é imperceptível.
- 244,3–244,9: **fusão**.

### 11 · O Sol para (244,9–271,7)
- **Cena:** a varanda da abertura, agora sem mar, com o leito seco até o horizonte.
- 245,6: o número chega a "1 year".
- **Câmera:**
  - 244,9–252: TILT forte para CIMA (+20 a +55 px/2 s) com pan para a direita, até o céu.
  - 252–264: continua subindo devagar.
  - 264–271,1: TILT para BAIXO até o horizonte.
- **Céu:** azul profundo, com cirros em faixas diagonais.
- 257,5: o Sol entra pelo topo e fica parado no alto.
- 257,8: o número vira FOREVER e a comparação vira THE SUN HAS STOPPED IN THE SKY.
- 271,1–271,7: **fusão**.

### 12 · O Sol se põe no leste (271,7–300,9)
- **Câmera:** na varanda, com a fonte à esquerda.
  - 271,7–282: pan para a DIREITA com tilt para cima.
  - 282–300,9: pan para a direita com leve tilt para baixo.
- 286,2: o número volta a "2.0 years" e a comparação vira THE SUN RISES IN THE WEST.
- 286–300,3: o Sol reaparece no alto e desce até o horizonte, com um reflexo crescente no leito molhado. O clarão dourado vai de 296 a 300.
- 300,3–300,9: **fusão**.

### 13 · Terra parada e ao contrário (300,9–329,9)
- **Cena:** a América do Sul e o cinturão equatorial bege.
- 300,9–312: o globo não gira. HUD em 0 MPH e "1 year".
- 312–318: começa a girar para trás (a superfície anda da direita para a esquerda).
- 318–329,9: a rotação acelera e a África entra pela direita.
- 317,8: o número pula de "2 months" para "58 days".
- **Câmera:** fixa.
- 329,3–329,9: **fusão**.

### 14 · O Sol nasce no oeste (329,9–357,0)
- **Cena:** o calçadão do cold open, à noite. Janelas acesas, estrelas, carros e ônibus na avenida, pedestres na praça.
- 340–345: aurora lilás.
- 345–356,5: o Sol nasce entre os prédios, no centro-esquerda.
- **Câmera:** travelling/pan lento para a DIREITA. A palmeira sai do quadro em ~352 e a fonte entra pela direita em ~351.
- 334,8: o número passa a decimal ("9.8 days").
- 345,4: o número passa a "71 h 46 m".
- 356,5–357,0: **fusão**.

### 15 · A onda volta (357,0–390,1)
- **Cena:** a varanda com a fonte, sobre o leito seco.
- **Câmera:**
  - 357–364: tilt lento para cima com push-in.
  - 364–372: quase parada.
  - 372–383,3: tilt para cima e zoom-out, acompanhando a onda.
- 365,5–368: uma linha fina de água aparece no horizonte.
- 368–376: a parede de água cresce, com crista de espuma.
- 376–381: a onda ocupa a metade de cima.
- 381–383,3: o spray azul-petróleo cobre o quadro.
- 383,3–383,4: **corte**, com 1 quadro escuro.
- 383,4–390,1: o mesmo enquadramento, sob um teto de água azul-escuro com estrias irradiando do horizonte. O mar voltou ao horizonte. A câmera faz tilt para cima.
- 388,0: o número passa por 24 h 00 m e continua caindo (23 h 58 m).
- 390,1: **corte seco** para a tela final. O HUD some.

### 16 · Telas finais (390,1–412,0)
- Fundo azul-marinho quase preto (~#080b10) e texto centralizado em serifa.
- 390,1–393,6: "You started on a 24-hour day."
- 393,8–394,3: fade-in de "Is any of this real?".
- 395,0–396,8: as 4 linhas do parágrafo (sans, cinza-claro) aparecem uma a uma.
- 397,5: entra "Which what if should we do next? Tell us in the comments."
- 401,5–401,8: fade-out.
- 402,3–402,8: fade-in de "Now watch what happens / if Earth spun faster." e, abaixo, "SUBSCRIBE FOR MORE WHAT IFS" em versalete azul-claro. Ficam até 412,0.

## Efeitos-herói (precisam de render dedicado)
1. **Time-lapse de dia e noite com os dias alongando** (4,1–29,3): céu, iluminação da fonte e dos postes, nascer do Sol à direita sobre o mar e sombras girando.
2. **O mar recuando na praia** (36–60): a linha d'água se afasta até o horizonte, o leito molhado escurece e seca, e ficam objetos encalhados.
3. **A água subindo em Cannon Beach e a muralha no horizonte** (64–74,3).
4. **A parede de água em Times Square** (90,5–97,7), com dutch angle e whiteout de espuma, e o **teto de água com estrias** (97,8–103,9).
5. **A Terra desacelerando, com o oceano migrando para os polos e o cinturão continental no equador** (103,9–132,9). Mesmo globo em 217,9–244,9 (lado dia/noite) e 300,9–329,9 (parada e girando ao contrário).
6. **O estreito da Golden Gate secando** (133–159).
7. **Santa Monica congelando sob a noite longa** (196–217,9): geada progressiva.
8. **Céu com o Sol parado** (252–268), com tilt para cima e para baixo, e **o Sol se pondo no leste** (286–300,3), com reflexo no leito.
9. **O Sol nascendo no oeste entre os prédios** (340–356,5). Também serve ao cold open.
10. **A onda gigante voltando ao equador** (365,5–383,3) e o **teto de água irradiante** (383,4–390,1).

## Trechos em que o próprio original é calmo
- 4,1–29,3: câmera quase parada. O movimento vem do time-lapse e do HUD.
- 46–60: pan lento sobre o leito seco.
- 103,9–132,9: o globo só gira devagar. O cinturão cresce lentamente.
- 153–159: a ponte em terra seca, praticamente estática.
- 165–188: Santa Monica com pan lento e luz parada.
- 217,9–244,9: globo totalmente parado (o mais calmo do vídeo; só o HUD e as luzes).
- 252–264: só céu e nuvens.
- 300,9–312: Terra parada, com 0 MPH.
- 390,1–412: telas finais.

Nesses trechos é o HUD (número, mph e trocas de linha) que mantém o movimento na tela.

## Incertezas
- 0,0–4,1: o cold open é um flash-forward de ~345–347. A coincidência é de enquadramento e luz, não foi confirmada quadro a quadro.
- 48–60: o que são exatamente os objetos escuros no leito (barcos, pedras, animais).
- 70–74,3: a "coisa crescendo no mar" foi lida como uma linha de onda/espuma no horizonte. É sutil.
- 103,9–132,9: a leve aproximação medida (escala +1 a +3%) pode ser só efeito da rotação. O anel fino atrás do globo pode ser um halo de atmosfera.
- 196–217,9: as estrelas cadentes ou riscos no céu noturno de Santa Monica não foram confirmados.
- 271,1–271,7: parece uma fusão entre o tilt para baixo e a varanda, mas pode ser um movimento contínuo com troca de posição.
- 383,3: o quadro escuro entre a onda e o teto de água pode ser um flash de 1 quadro intencional.
- 395–398: o tempo exato de entrada de cada linha do parágrafo final (±0,2 s).
- Comparação "A CAR ON THE HIGHWAY": a linha passa da borda do recorte. O texto foi confirmado num quadro 1080p em 170 s.
