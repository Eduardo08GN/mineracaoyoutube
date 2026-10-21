# Auditoria de fidelidade: Vídeo 1, "Earth Spun Faster" (original EN × produzido ES)

Li as 4 folhas gerais e as 30 densas, junto com `capitulos.md`, `graficos.png`, os dois JSON de som e o `roteiro.ts`. Para checar posição de HUD, legenda e modelos, ampliei 40 quadros com recortes salvos só no scratchpad. Nenhum arquivo do projeto foi alterado.

## Problemas que aparecem no vídeo inteiro

Estes problemas se repetem em vários capítulos. Explico cada um aqui uma vez só; nos capítulos, apenas cito.

**G1. Transições de capítulo (ALTA).**
- **O que o original faz:** passa de um capítulo para o outro com uma fusão cruzada de cerca de 0,6 s, por exemplo de 0:29.0 a 0:29.8, de 1:00.1 a 1:00.8 e de 1:33.2 a 1:33.8. Isso se repete em 2:02, 2:33, 3:00, 3:58, 5:18, 5:47, 6:16 e 6:45.
- **O que o produzido faz:** em todas as trocas há um mergulho para o preto de 0,1 a 0,3 s seguido de corte seco. Em 0:04 há fade-in desde o escuro, quando o original corta direto.
- **Corte a mais:** em 4:53 (sempeso para paredão) o original segue no mesmo plano contínuo, e o produzido muda de câmera.
- **Correção:** usar `<TransitionSeries>` do Remotion com `fade()` de 18 quadros (0,6 s) ou duas `<Sequence>` sobrepostas com opacidade interpolada. Cada capítulo renderiza 0,6 s a mais, o que custa pouco. Juntar sempeso e paredão em um único plano de câmera.

**G2. Ciclo dia e noite piscando (ALTA, com risco de fotossensibilidade).**
- **Original:** o período visual é constante, em torno de 3,6 s, com crepúsculo roxo, nascer do sol laranja e o sol estourando a lente à direita. Exemplos: 3:06.0 a 3:06.6 é noite, 3:06.8 a 3:07.1 é o nascer; noites em 3:09.7, 3:13.2 e 3:16.7.
- **Produzido:** a troca é seca, de um quadro para o outro (em 2:59.7 é dia, em 2:59.8 é noite; em 3:05.0 é noite, em 3:05.1 é dia). O período encolhe junto com a duração do dia: cerca de 1,8 s em 3:04, 0,2 a 0,5 s em 3:23.5–3:24.0 e 0,1 a 0,3 s em 4:21–4:22.
- **Efeito nas métricas:** o medidor contou isso como cortes. São 20, 33, 32 e 37 cortes nos capítulos cidade, leve, fonte e sempeso, contra 0, 15, 10 e 2 no original. Também explica as oscilações quadradas de luz no `graficos.png`.
- **Correção:** desacoplar o sol da física e usar `fase = t / 3.6 s`. Interpolar a cor do céu e a intensidade da luz hemisférica e direcional com `smoothstep` da elevação do sol, com uma rampa laranja/rosa entre −5° e +8°. Pôr um sprite de sol com halo no nascer. Na prática, o período nunca deve ficar abaixo de 3 s.

**G3. Personagens e modelos (ALTA nos planos próximos).**
- **Pessoas:** no produzido parecem blocos estilo Minecraft, com cabeça cúbica grande e corpo de caixas, e aparecem enormes em primeiro plano em praia, leve e santamonica. No original são low-poly com proporção humana, pequenas e numerosas.
- **Correção das pessoas:** cápsula com esfera e cabeça a cerca de 1/7 da altura, escala menor, e câmera mantendo pelo menos uns 6 m do figurante mais próximo.

**G4. Cor e atmosfera (MÉDIA).**
- **Saturação:** o produzido tem saturação média de 151 contra 85 no original. Nos capítulos de espaço vai de 211 a 239 contra 26 a 120: o fundo é azul-marinho e a Terra fica azul profundo.
- **Céu:** o original tem névoa, céu de estratocúmulos e areia acinzentada. O produzido tem céu azul chapado com nuvens de desenho e areia bege quente.
- **Densidade de detalhe:** em média 10,5% no produzido contra 14,5% no original.
- **Correção:** `scene.fog = FogExp2` em torno de 0.004 nas cenas de costa; tirar cerca de 25% de saturação no pós (filtro CSS `saturate(.75)` no `<AbsoluteFill>` da cena 3D é o mais barato); fundo espacial preto neutro (#050506) com uma fumaça sutil no canto inferior esquerdo, como no original.

**G5. Estilo da HUD e das legendas (MÉDIA).**
- **Legendas:** o original usa serifa itálica sobre uma caixa escura desfocada. O produzido usa serifa reta, mais encorpada, sem a caixa.
- **HUD:** no original fica sobre uma vinheta escura radial no canto superior esquerdo; no produzido não há vinheta, e em céu claro a HUD perde contraste (0:12, 1:02).
- **Correção:** fonte itálica; `text-shadow: 0 0 24px rgba(0,0,0,.65)` ou um `div` com `backdrop-filter: blur` e fundo rgba(0,0,0,.35); um gradiente radial preto a 45% atrás da HUD.

---

## Por capítulo

### intro (0:00–0:04)
- **Cinematografia (MÉDIA):** o original mostra a Terra já achatada, clara e esbranquiçada, grande no quadro, pousada no disco de escombros. O produzido mostra uma Terra redonda, azul escura, menor e mais baixa no quadro. Métricas: luz 22 contra 38, saturação 180 contra 51, composição 0,65.
- **Ações:** a legenda "En 7 minutos…" entra em 0:00.6, no tempo certo.
- **Correção:** reaproveitar o estado da cena "anel" em 6:00 (Terra com `scale.y` 0.75 e disco grande) com a câmera do original, cerca de 20% mais perto.
- **Som (BAIXA):** produzido 5,6 dB mais baixo, de −30 contra −24.5 dB.

### orla (0:04–0:29)
- **Cinematografia (ALTA):** o original é uma aérea a uns 15–20 m, inclinada para baixo, com palmeiras grandes em primeiro plano, a **praça redonda com chafariz azul e jato d'água** no centro-esquerda, carros brancos e vermelhos embaixo à esquerda e mar no terço superior com névoa. O produzido usa câmera a 34 m e lente mais aberta, sem chafariz, com centenas de palmeiras minúsculas em diagonal, uma estrada com carros coloridos e um **gramado verde** no canto inferior direito. Composição 0,14.
- **Montagem (MÉDIA):** em 0:04 o original corta seco e o produzido faz fade-in desde o escuro de 0:04.0 a 0:04.3.
- **HUD e legendas (MÉDIA):**
  - O título "What If…" entra em 0:04.4, centrado a cerca de 45% da altura, sobre uma caixa escura. "¿Qué pasaría…" só entra em **0:05.6**, menor, a cerca de 58% da altura e sem caixa.
  - O relógio adianta: em 0:12 marca 23 h 59 contra 24 h 00, e em 0:24–0:28 fica de 5 a 6 min à frente.
- **Acabamento:** mar ciano saturado no produzido; o original é azul acinzentado com névoa.
- **Som (MÉDIA):** o original tem burburinho de gente com ondas e "Waterfall", que é o chafariz. O produzido tem trânsito e vento ("Vehicle") e não tem água de chafariz.
- **Correção:**
  - Criar a praça com chafariz (um cilindro raso e o emissor de partículas de "fonte"). Ela é o marco que volta em cidade, sempeso e paredão.
  - Câmera em torno de [-12, 18, 30] com FOV 45 e palmeiras próximas.
  - Trocar o gramado por calçada e estacionamento cinza.
  - Título em 0:04.4, `top: 45%`.
  - Ambiente sonoro de multidão com ondas e chafariz.

### praia (0:29–0:60)
- **Cinematografia (ALTA):** o original fica na areia a cerca de 1,7 m, olhando o mar, com a **torre de salva-vidas listrada** no centro, guarda-sóis rosa e lilás e sombras de palmeira no chão (a palmeira fica fora do quadro). O produzido fica no calçadão a 3,6 m, com um tronco de palmeira cortando o quadro à direita, poste, banco e bonecos de bloco grandes. Não tem a torre. Composição 0,05.
- **Ações (ALTA, o desvio mais visível da primeira metade):** no original o mar sobe e engole a praia. Em 0:40 a água chega perto, em 0:48 alaga onde as pessoas estão, e em 0:56 a câmera fica sobre a água com a torre meio submersa e objetos boiando ("The beach is gone."). No produzido a água avança só alguns metros: em 0:58 o calçadão está seco, com gente andando, e a legenda diz "La playa desapareció" sobre uma praia que continua lá.
- **Correção:**
  - Animar `ocean.position.y` de 0 a cerca de +2,5 m entre 0:40 e 0:56 com easeIn, e pôr a câmera na areia a 1,7 m, uns 25 m mais perto da linha d'água.
  - Torre de salva-vidas: caixas empilhadas com textura listrada.
  - Objetos boiando: um bob senoidal em y com a mesma altura do plano d'água.
- **Som (MÉDIA):** no original o ambiente some entre 0:54 e 0:58 (de −18 para −28 dB) e fica só a música antes do corte. No produzido o ruído de água segue constante a −14 dB. Fazer um fade-out do ambiente de 4 s antes da troca.

### oregon (1:00–1:33)
- **Cinematografia (MÉDIA):**
  - **Câmera:** o original é mais alto, uns 8–10 m, inclinado para baixo, com a estrada em diagonal no primeiro plano.
  - **Casa e rocha:** a casa fica no terço esquerdo e a Haystack Rock é um **domo arredondado** cinza. No produzido a casa está à direita, a rocha é um **pico anguloso low-poly** com uma nuvem presa no topo, e a estrada fica quase horizontal sobre gramado.
- **Ações (MÉDIA):** no original o mar recua e expõe o leito cinza e molhado; em 1:20–1:32 não se vê mais água. No produzido continua uma faixa ciana no horizonte até 1:32 e a areia é bege, então o "leito exposto" não aparece.
- **Acabamento:** céu nublado e enevoado no original, azul chapado no produzido. Saturação 88 contra 44.
- **Som (MÉDIA):** o original tem vento ("Vehicle" com 0,39) e quase nenhuma música. O produzido tem música dominante (0,39) e fica de 5 a 7 dB mais alto.
- **Correção:**
  - Rocha: esfera com `scale(1, 0.9, 0.8)` e deslocamento por ruído; tirar a nuvem do topo.
  - Leito marinho: plano cinza úmido aparecendo conforme o mar se afasta (`ocean.position.z` recua).
  - Céu nublado com névoa.
  - Câmera em y≈9 inclinada uns 15° para baixo.
  - Áudio: ambiente de vento e música −6 dB.

### espaco1 (1:33–2:02)
- **Cinematografia (MÉDIA):** no original a Terra ocupa cerca de 82% da altura do quadro; no produzido, cerca de 57% (uns 30% menor). Composição 0,37.
- **Ações (MÉDIA):** em 1:44–1:58 o original mostra claramente o **cinturão de oceano no equador** e os polos secos, com terra cinza e uma linha de costa nítida em 1:56. No produzido a Austrália e a Ásia aparecem normais, com só uma faixa fraca.
- **Acabamento:** no original há reflexo especular do sol no oceano, aro de atmosfera e luzes de cidade no lado noturno. O produzido é mais escuro (luz 8 contra 17) e mais azul (saturação 239 contra 89).
- **HUD (BAIXA a MÉDIA):** a curva do relógio diverge até cerca de 31 min (1:40: 15 h 32 contra 15 h 01).
- **Som (MÉDIA):** o produzido fica 8 a 12 dB mais alto (−16 contra −25 a −30 dB).
- **Correção:**
  - Câmera cerca de 30% mais perto.
  - Shader de máscara de oceano por latitude (cobre quando |lat|<X e descobre os polos), com X crescendo no tempo.
  - Sprite de brilho especular e anel de atmosfera (esfera 1,02× com fresnel aditivo).
  - Relógio: copiar os valores do original de 2 em 2 s para uma tabela e interpolar.

### terremoto (2:02–2:33)
- **Cinematografia (MÉDIA):** o original muda o enquadramento em relação a 1:02: fica mais alto, com a estrada e três pessoas andando no primeiro plano, e a câmera desliza para a direita e para baixo (a rocha vai de x≈0,58 em 2:14 para x≈0,33 em 2:30). O produzido repete o plano de 1:02 com tremor forte (movimento 0,86 contra 0,56) e sem deslocamento.
- **Ações (ALTA):** no original a casa desaba em 2:12 e solta uma **nuvem de poeira volumosa** que se espalha para a esquerda sobre a estrada até cerca de 2:22, deixando entulho vermelho achatado com sombra. No produzido sai pouca poeira (névoa bege no chão) e o entulho parece uma "linguiça" de bolhas laranja quase flutuando. Não há pessoas na estrada.
- **Som (ALTA):** o original começa o ronco (ruído grave) já em 2:02–2:04 e cai para −22 a −26 dB em 2:30–2:32. O produzido fica quase em silêncio em 2:04–2:06 (−24 a −34 dB), e de 2:14 a 2:30 o classificador ouve "Shofar", "Civil defense siren" e "Siren", isto é, um som **tonal de sirene**. O nível fica em −9 dB até 2:32.
- **Correção:**
  - Poeira: 30 billboards com textura suave, escala crescendo e deriva em x por cerca de 10 s.
  - Entulho: caixas achatadas com `castShadow`.
  - Câmera: trilho para a direita e para baixo.
  - Áudio: ruído marrom passa-baixa (sem tom) de 2:02 a 2:30 com decaimento.

### cidade (2:33–3:00)
- **Cinematografia (MÉDIA):** o original é uma aérea olhando a costa de cima, quase sem horizonte em 2:40, com avenida, postes acesos, a praça do chafariz (2:48–2:52) e ondas na areia. O produzido usa câmera a 150 m olhando para longe, com uma grade densa de caixas cinza iguais (com textura de janela) ocupando 55% do quadro e mar liso em degradê. Não tem avenida nem postes.
- **Ações e montagem:** o ciclo dia e noite tem o problema G2. O produzido marca 20 falsos cortes.
- **Acabamento (MÉDIA):** prédios todos da mesma altura e sem janelas acesas à noite.
- **Correção:**
  - Variação de altura entre 0,5× e 2×.
  - Janelas emissivas ligadas a `1 − sol`.
  - Fileira de postes (pontos de luz instanciados) ao longo do calçadão.
  - Câmera a cerca de 90 m inclinada uns 55° para baixo.

### leve (3:00–3:29)
- **Cinematografia (MÉDIA):** o original fica num calçadão elevado (4–6 m) olhando o mar, com o horizonte a 1/3, palmeiras e muita gente, e um chafariz pequeno à esquerda que só aparece à noite. O produzido fica a 2,5 m, com piso no primeiro plano, horizonte a uns 45% e um **chafariz branco gigante** à direita dominando o quadro. Composição 0,23.
- **Ações:** no produzido um boneco azul pula no centro (3:15–3:28), o que até ilustra a legenda. O principal desvio aqui é o G2: de 3:23 a 3:24 pisca a cada 0,2–0,5 s.
- **Som (MÉDIA):** o produzido coloca vozes de gente em 3:18–3:28 que o original não tem e fica de 4 a 8 dB mais alto em 3:04–3:08.

### santamonica (3:29–3:58)
- **Cinematografia (MÉDIA a ALTA):**
  - **Píer:** no original é um tabuleiro simples de madeira com guarda-corpo e postes, com a roda-gigante ao fundo (3:44), quase sem gente e areia acinzentada.
  - **Câmera:** faz pan para a esquerda (−0,27) e recua (zoom −0,041).
  - **Rolagem:** é moderada, uns 8–12° em 3:56.
  - **No produzido:** o píer tem **telhado**, como um pavilhão. Há cabana colorida, roda-gigante grudada no início do píer, lixeira laranja e muita gente. A câmera aproxima (+0,039) sem pan, e a rolagem chega a uns 25–30° (0,44 rad no roteiro), aparentemente no **sentido contrário** (o horizonte sobe para a direita).
- **Correção:**
  - Tirar o telhado do píer e pôr a roda-gigante na ponta.
  - Rolagem com no máximo 0,18 rad. Conferir o sinal.
  - Alvo da câmera de x −14 para cerca de −24 (pan) e posição recuando cerca de 4 m.
  - Reduzir a multidão.

### fonte (3:58–4:23)
- **Cinematografia:** nos dois a câmera fica baixa e inclina para cima. O original ainda aproxima (zoom 0,086 contra 0,010).
- **Acabamento (ALTA):** o original tem um **leque de 6 a 8 jatos verticais separados** que sobem até sair do quadro, com a multidão de braços erguidos embaixo. O produzido tem **um cone central único** que vira "árvore" ou "nuvem de algodão" de partículas redondas.
- **Ações e montagem:** problema G2. De 4:21 a 4:22 pisca a cada 0,1–0,3 s.
- **Som (BAIXA):** o produzido tem "chuva" contínua; o original, só pontos de "Pour".
- **Correção:**
  - 7 emissores enfileirados.
  - Partículas como sprites esticados na direção da velocidade (streaks).
  - Aproximação de 10% da câmera ao longo do capítulo.

### sempeso (4:23–4:53)
- **Cinematografia (ALTA):** o original volta exatamente à aérea da praça do chafariz, agora com um jato altíssimo. O produzido usa a aérea da orla sem praça (composição 0,05).
- **Ações (MÉDIA):** o produzido enche o céu de **objetos coloridos flutuando já em 4:26**. No original praticamente nada flutua antes de cerca de 4:58.
- **Montagem:** problema G2. O original tem nascer do sol longo com estouro de luz em 4:27–4:28.3; o produzido pisca a 0,5–1 s.
- **Correção:** a mesma câmera da orla corrigida e o jato alto, com detritos só a partir de 4:58.

### paredao (4:53–5:18)
- **Montagem (ALTA):** o produzido corta e mergulha para o preto em 4:53, quando o original é contínuo.
- **Cinematografia (ALTA):** o original mantém a aérea sobre a praça e, a partir de 5:12, a câmera é engolida (luz azulada de dentro da água). O produzido fica na areia com palmeiras em primeiro plano e movimento brusco (pico de 3,5 px por quadro em 5:05–5:10).
- **Ações e acabamento (ALTA):**
  - **Muralha:** no original é uma muralha d'água enorme, com espuma e névoa volumosa, que se curva e avança (5:04–5:12). No produzido é um **plano ciano chapado** subindo, sem volume nem espuma.
  - **Objetos perto da câmera:** caixas sem textura (cinza em 5:00, vermelha em 5:06, verdes em 5:12.9–5:13.6, pretas em 5:12) passam junto à lente, e uma delas **cobre a HUD** em 5:12. Ainda há confete demais.
- **Som (MÉDIA):** o produzido põe "Eruption" e "Explosion" em 4:58–5:00, antes da hora. O rugido (pink noise) do original começa em 5:02. Em 5:14 o original cai bruscamente para −27 dB (abafado, debaixo d'água) e o produzido segue a −11 dB.
- **Correção:**
  - Muralha: plano curvo alto com alpha em degradê vertical, textura de ruído rolando e 20 billboards de névoa na crista.
  - Câmera da sempeso contínua.
  - Distância mínima de 8 m entre detritos e câmera; nada passa no retângulo da HUD; caixas com material.
  - Áudio: tirar a explosão; rugido a partir de 5:02; filtro passa-baixa com −15 dB em 5:14.

### achata (5:18–5:47)
- **Cinematografia (MÉDIA):** no original a Terra é grande, está bem iluminada e fica à esquerda do centro. No produzido é menor, escura e fica à direita. Luz 8 contra 25.
- **Ações (ALTA):** no original os **escombros começam a se soltar do equador em 5:26** e, em 5:34, já formam um cinturão grosso. O planeta fica visivelmente achatado, com os polos sem oceano. No produzido não há anel até cerca de 5:50 e a Terra continua esférica.
- **Correção:**
  - `earth.scale.y` de 1 para 0,75 entre 5:18 e 6:00.
  - Emissor de detritos instanciado no plano equatorial a partir de 5:24, com raio e quantidade crescentes.
  - Luz direcional 2× mais forte.
  - Câmera cerca de 25% mais perto.

### anel (5:47–6:16)
- **Montagem:** em 5:47 o original faz uma fusão para um plano bem mais aberto. O produzido mergulha para o preto e quase não muda.
- **Acabamento (ALTA):** o disco de escombros do original tem 4× o diâmetro da Terra e enche o terço inferior do quadro. O do produzido tem cerca de 1,5×, é fino e só surge em 5:52. Densidade de detalhe 5,3% contra 22,5%, paleta 0,26.
- **Correção:** raio do disco entre 3,5 e 4 R, cerca de 6–8 mil instâncias (InstancedMesh), câmera a uns 20° acima do plano e Terra centralizada a uns 45% do quadro.

### crosta (6:16–6:45)
- **Montagem e ações (MÉDIA):** em 6:16.2–6:16.8 o original funde direto para a bola derretida. O produzido mergulha para o preto e vai avermelhando aos poucos até 6:22.
- **Acabamento (MÉDIA):** no original a bola derretida é **creme ou amarelo-claro com manchas marrons**, achatada, sobre um disco marrom-alaranjado enorme. No produzido é **laranja saturado**, depois com rachaduras de lava (6:32–6:44), sobre um disco cinza-bege pequeno. Saturação 221 contra 120.
- **Correção:** textura creme (#f0d79c) com ruído marrom e emissivo moderado; troca do material por fusão; disco do mesmo tamanho do de "anel" e tingido de marrom.
- **Som (MÉDIA):** o produzido fica 8 a 11 dB mais alto em 6:32–6:44.

### lua (6:45–7:15)
- **Cinematografia e composição (ALTA):** no original a Lua é grande no primeiro plano esquerdo, cortada pela borda e meio iluminada. A Terra é pequena, ao longe e no centro, um elipsoide achatado com o disco de perfil **simétrico dos dois lados**, e a câmera recua devagar (em 7:12 a Lua já está menor e mais à direita). No produzido a Lua fica no centro-direita e a **Terra aparece colada na borda da Lua**, meio escondida atrás dela, com o disco saindo só para a direita, como cauda de cometa. A câmera fica parada. Paleta 0,18.
- **HUD (MÉDIA):** de 7:12 em diante o original mostra "1 min"; o produzido mostra "60 s", "54 s", "52 s".
- **Correção:**
  - Lua em torno de [−3,5, 0, 2] (perto da câmera) e Terra em [1,5, 0,2, −8].
  - Disco: um anel inteiro visto de perfil.
  - Recuo de 10% nos últimos 10 s.
  - Relógio: `ceil` em minutos quando faltar menos de 60 s.

### fim (7:15–7:37)
- **Montagem e HUD (MÉDIA):**
  - **"You started on a 24-hour day":** no original aparece de corte em 7:15.0, com fonte grande, a 45% da altura. No produzido fica preto até 7:15.4 e o texto vem em fade (pronto em 7:15.7), com fonte cerca de 70% do tamanho e mais baixo.
  - **"¿Algo de esto es real?":** o original põe o título a 25% da altura, o parágrafo entra em fade em torno de 7:21–7:23 e a chamada final é branca em negrito ("Which what if…"). O produzido põe o título a 40%, menor, mostra tudo ao mesmo tempo já em 7:20 e faz a chamada em versalete dourado.
  - **"Ahora mira…":** no original fica a cerca de 20% da altura e aparece em 7:28. No produzido fica a 50%, menor, e ainda está em fade em 7:28. A linha de inscrição no original é azulada; no produzido, cinza.
- **Som (ALTA):** o original tem **silêncio absoluto** em 7:14.5–7:17 (−56 e −101 dB) e o cartão final é muito baixo (−37 dB em média). O produzido mantém a música a −24 dB (13 dB mais alto) e perde a pausa dramática.
- **Correção:** cortes secos; os `top` e tamanhos de fonte do original; parágrafo com atraso de 1,5 s; mutar a música de 7:14.5 a 7:17; −12 dB no fim.

---

## Resumo do som (JSON)
- **Correlação de volume:** 0,39, baixa.
- **Música:** está presente nos dois na maior parte do tempo (161 amostras em comum). O problema está nas camadas de ambiente e efeitos:
  - **Faltam no produzido:** água e chafariz na orla, vento em Oregon, ronco de terremoto sem tom, a queda brusca de som em 5:14 e o silêncio em 7:15.
  - **Sobram no produzido:** trânsito na orla, vozes em 3:18–3:28, sirene em 2:14–2:30 e explosão em 4:58.
- **Níveis:** o produzido é sistematicamente mais alto em espaço, crosta e fim (+4 a +13 dB) e mais baixo na intro (−5,6 dB).
- **Correção barata:** uma tabela de "camadas de ambiente" por capítulo no `roteiro.ts` (arquivo, ganho em dB e fade de entrada e saída), mixada com `<Audio volume={…}>` do Remotion.

---

## Os 10 desvios mais graves (em ordem)
1. **Dia e noite piscando** (G2), de 2:33 a 4:53. Trocas secas de um quadro e período que cai até 0,1–0,3 s (3:23, 4:21). Gera 120 falsos cortes e risco de fotossensibilidade.
2. **A praia não alaga** (0:44–0:59). O evento central do capítulo não acontece e a legenda "La playa desapareció" contradiz a imagem.
3. **Faltam o achatamento e o anel de escombros** (5:18–6:16, e também a intro). O anel aparece atrasado em uns 25 s e com 1/3 do tamanho; Terra pequena, escura e esférica.
4. **Paredão:** plano chapado em vez de uma muralha com névoa, caixas sem textura junto à lente (uma cobre a HUD em 5:12) e troca de câmera em 4:53 onde o original é contínuo.
5. **Orla e sempeso sem a praça do chafariz:** câmera alta e aberta demais, com gramado verde (0:04–0:29 e 4:23–4:53). É o marco visual recorrente do vídeo.
6. **Lua:** a Terra aparece colada atrás da Lua, com o disco de um lado só, e a câmera fica parada (6:45–7:15).
7. **Oregon e terremoto:** a rocha é um pico em vez de domo, o céu é azul de desenho, o leito marinho não fica exposto, a poeira do desabamento é pequena e o entulho flutua (1:00–2:33).
8. **Modelos toscos:** pessoas de bloco em primeiro plano, píer com telhado e rolagem exagerada e invertida em Santa Mônica, chafariz de cone único em vez de 7 jatos (0:29–4:23).
9. **Transições:** mergulho para o preto em vez de fusão de 0,6 s em todas as 15 trocas, e título atrasado 1,2 s e mal posicionado em 0:04.
10. **Som:** ronco do terremoto tonal e atrasado, explosão antes da hora em 4:58, silêncio de 7:15 ausente, Oregon com música no lugar do vento, e espaço e fim 8 a 13 dB mais altos.

## Nota de fidelidade (0–10)

| Dimensão | Nota | Motivo principal |
|---|---|---|
| Cinematografia | **4** | Altura e distância de câmera diferentes em quase todas as cenas de costa (composição média 0,36); planeta pequeno no espaço; rolagem e pan errados em Santa Mônica |
| Montagem | **5** | Capítulos com os tempos certos e legendas sincronizadas, mas transições erradas, um corte a mais em 4:53 e o "corte" estroboscópico do dia e noite |
| Roteiro / ações | **4** | Alagamento, anel, achatamento, leito exposto e muralha ausentes ou fracos; detritos flutuando cedo demais |
| Acabamento | **3,5** | Supersaturado, sem névoa, modelos de bloco, partículas em bolha, caixas sem material, detalhe 10,5% contra 14,5% |
| HUD / legendas | **7** | Conteúdo e tempos corretos; faltam itálico, caixa escura e vinheta; curva do relógio diverge até 31 min; "60 s" no lugar de "1 min"; cartão final mal posicionado |
| Som | **5** | Música certa na maior parte; camadas de ambiente e efeitos trocadas ou ausentes; níveis fora (correlação 0,39) |

**Ordem sugerida de correção:** G2 (dia e noite), depois G1 (fusões), alagamento, anel e achatamento, e por fim a praça do chafariz. Estas cinco mudanças são de parâmetro e animação, sem modelagem nova, e resolvem a maior parte dos desvios ALTA.
