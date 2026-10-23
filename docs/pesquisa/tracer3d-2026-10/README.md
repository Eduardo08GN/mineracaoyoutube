# Pesquisa que originou o Tracer3D — 22–23/10/2026

Duas partes: (1) engenharia reversa do canal **Tracer Project** a partir da leitura óptica a 10 fps e do áudio de um vídeo viral;
(2) radar da YouTube Data API no "nó" de temas desse canal, em inglês, espanhol e português, para achar títulos virais e buracos.
O pipeline que nasceu daqui está em [`../../../tracer3d/`](../../../tracer3d/).

Arquivos: [`radar_tracer.py`](radar_tracer.py) (o script), [`radar_videos.csv`](radar_videos.csv) (2.211 vídeos com tema, idioma,
views, canal, outlier e links), [`temas_limpos.json`](temas_limpos.json) (demanda × oferta por tema e idioma, só títulos do tema).

---

## 1. Engenharia reversa do Tracer Project

Vídeo lido: [What If Asteroid Apophis Hit Earth? Scientists Mapped Where It Lands](https://youtu.be/0iBYMwGDin0) — 13:28,
3,3 M views em uma semana, canal [Tracer Project](https://www.youtube.com/channel/UC0Lr__HsSMj0_h0jNqKvKBA) criado em 5/10/2026
(~2.400 inscritos; 27 vídeos nos primeiros 17 dias — produção muito automatizada).

Método: `analisar.py` do Eddie3D (8.084 quadros a 10 fps, folhas de contato, recortes 1:1 em 1080p, OCR), legendas automáticas
(transcrição só local — não publicada aqui por ser texto de terceiro), PANNs a cada 2 s, loudness, cortes por diferença de quadros,
e os créditos que o próprio canal publica na descrição.

### O que o vídeo é
- **Estrutura**: abertura dramática (cidade à noite, "uma nova estrela no céu"), aviso "SIMULATION — nothing in it is made up",
  história real (descoberta em 2004, probabilidade subindo), **"THE MATH"** em 3 passos (massa, velocidade, energia em megatons),
  corredor de impacto real (exercício de defesa planetária de 2021), entrada na atmosfera, impacto segundo a segundo,
  "how far away are you?" (raios de efeito sobre o mapa), 3 cenários (tsunami no Atlântico Norte, Alpes, Istambul), consequências,
  e "a verdade" (a passagem real e segura em 13/04/2029). 13 capítulos.
- **Narração** em 100% do tempo (~1.780 palavras, ~132 palavras/min), voz sintética (declarada; o classificador marca
  "speech synthesizer"). **Música** como cama em ~79% (YouTube Audio Library), **poucos efeitos** nos impactos (síntese própria +
  Freesound CC0). −17,5 LUFS.
- **Créditos declarados**: Terra NASA Blue/Black Marble; relevo e batimetria AWS Terrain Tiles (Mapzen: SRTM, GMTED2010, ETOPO1);
  mapas Natural Earth; prédios e ruas de Istambul do OpenStreetMap (BBBike); tempos do tsunami por cálculo próprio
  (velocidade de onda em água rasa sobre batimetria real); equações de Collins, Melosh & Marcus (2005, "Impact Earth!").

### Stack provável

| Camada | Evidência | Ferramenta provável |
|---|---|---|
| Roteiro | números com fonte, capítulos, descrição com fontes e créditos no mesmo estilo dos nossos | LLM com pesquisa + física em código |
| Voz | narração contínua, voz sintética | TTS comercial; a voz dita o tempo das cenas |
| 3D | globo com atmosfera; asteroide de malha procedural; terreno de dados com névoa; nuvem de cogumelo suave (sem detalhe fino); ponte de linhas de luz com reflexo de estria vertical | WebGL em tempo real (three.js), quadro a quadro — muito provavelmente Remotion; tudo shader e dados, sem modelagem |
| Mapas | fundo escuro, fronteiras, círculos de efeito, tsunami se espalhando, ruas do OSM | dados tratados em Python; SVG/canvas (estilo D3) na mesma composição |
| Cartões "THE MATH" | fórmulas tipografadas, gráficos de barra, contadores, selos CSS, grade | HTML/CSS + KaTeX |
| Som | cama musical constante, efeitos raros | biblioteca grátis + síntese |

### Por que é barato e rende muito
1. A **voz carrega o vídeo**: 13 min de narração = tempo de exibição alto e vários intervalos de anúncio; a imagem pode ser calma.
2. **Moldes reaproveitados** (globo, cartão, mapa, terreno, nuvem): troca só o dado → mais de 1 vídeo por dia.
3. **Dado real é o espetáculo** (batimetria, OSM, equações na tela) → credibilidade sem arte cara.
4. Custo por vídeo ≈ TTS + assinatura de agente de código + energia.

## 2. Radar do nó do Tracer (YouTube Data API, 23/10/2026)

20 temas × 3 idiomas (mesma busca em inglês/EUA, espanhol/México, português/Brasil), vídeos dos **últimos 12 meses** ordenados
por views → **2.211 vídeos de 1.519 canais** (~6.100 unidades de cota). A busca por palavra-chave traz ruído (LEGO, Roblox, música,
desenho): a tabela abaixo conta **só vídeos longos (≥ 4 min) cujo título é do tema**, no idioma da busca.

### Demanda (inglês) × oferta (espanhol)

| Tema | Inglês | Espanhol | Português | EN/ES |
|---|---|---|---|---|
| **E se os humanos desaparecessem / colapso** | 17,4 M | 0,2 M | 0,9 M | **~84×** |
| **E se o Sol…** | 18,0 M | 0,9 M | 1,1 M | **~19×** |
| **Erupção de vulcão (cidade)** | 24,5 M | 1,6 M | 0,02 M | **~16×** |
| **Simulação de impacto de asteroide** | 16,9 M | 1,2 M | ~0 | **~15×** |
| **Barragem / enchente** | 3,5 M | 0,2 M | 0 | ~15× |
| **Supervulcão (Yellowstone…)** | 20,2 M | 1,8 M | 1,2 M | **~11×** |
| **Bomba nuclear em cidade** | 29,8 M | 3,5 M | 0,5 M | **~8×** |
| **E se um asteroide atingisse a Terra** | 17,6 M | 2,2 M | 0,2 M | **~8×** |
| Tsunami | 23,7 M | 4,2 M | 4,3 M | ~6× |
| Megatsunami | 16,1 M | 3,7 M | 0 | ~4× |
| Tempestade solar | 1,9 M | 0,4 M | 1,6 M | ~4× |
| Lua | 16,6 M | 13,3 M | 4,9 M | 1,2× (servido) |
| Buraco negro | 12,8 M | 11,3 M | 4,8 M | 1,1× (servido) |
| Acidente reconstruído em 3D | 3,6 M | 3,7 M | 0,3 M | 1,0× (servido) |
| Terremoto | 9,1 M | 10,9 M | 1,1 M | 0,8× (servido) |
| Furacão, clima/calor, "cientistas simularam" | 2–4 M | ~0 | ~0–1 M | demanda pequena na amostra |

**Leitura**: o buraco em espanhol está nas **catástrofes simuladas com dados**: humanos sumindo/colapso, o Sol, vulcão e supervulcão,
impacto de asteroide, bomba nuclear em cidade, tsunami. Lua, buraco negro, terremoto e reconstruções 3D já têm oferta em espanhol.
Em **português** quase tudo do núcleo (impacto, megatsunami, barragem, vulcão em cidade, clima) está **vazio**.

### Títulos que mostram o formato (inglês, longos)
- *What If Asteroid Apophis Hit Earth? Scientists Mapped Where It Lands* — Tracer Project, 3,4 M (canal de 2.400 inscritos: outlier 1.420×)
- *This Is What Would Take Over the Earth If Humans Vanished* — Astrum Earth, 4,0 M
- *How Much Of America Would Survive A Super Eruption At Yellowstone?* — Spark, 2,4 M (50 min)
- *What If a Black Hole Entered Our Solar System? (Simulation)* — Stargaze, 4,6 M
- *Why The Deadliest Tsunami Was 10× Bigger Than Predicted* — Deep Science with Mark Watts, 4,5 M (outlier 102×)
- *Most DESTRUCTIVE EXPLOSIONS Ever — Size COMPARISON* — RED SIDE, 3,9 M
- *The Wild Story of the Teton Dam Failure* — Practical Engineering, 1,2 M

### Outliers (views ≥ 20× inscritos, ≥ 500 mil, longos) — sinal de tema que puxa sozinho
Tracer Project (Apophis, 1.420×), "Megatsunami que engoliu a Califórnia" (412×, curta com VFX de IA), erupção submarina filmada
(400×), **"Assim foi o tsunami de 2004 — reconstrução"** em português (268×, 3,2 M), "Lava engole a cidade — CGI" (262×),
"E se todos os humanos desaparecessem agora?" (252×), "Por dentro do simulador de desastres da China" (194×),
"YELLOWSTONE: el volcán que puede acabar con la Humanidad" em espanhol (78×). Lista completa no CSV (coluna `outlier`).

### Ressalvas
Amostra da busca (50 por consulta), não censo. A coluna de idioma do vídeo às vezes vem vazia (contado como do idioma da busca).
Música/jogos/desenhos foram filtrados por palavra; algum ruído pode restar. Cota gasta: ~6.100 unidades.
