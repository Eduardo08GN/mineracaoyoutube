# Referência AiTelly: stack, direção, roteiro e operação (leitura de 03/11/2026)

**Para que serve:** memória de longo prazo do estudo do AiTelly, o canal de "como funciona" militar e técnico em 3D que o Eduardo apontou como referência de qualidade de animação. Cada número vem de medição própria; cada afirmação sobre a stack vem dos vídeos de bastidores do próprio canal (seção 3). O que for inferência está marcado.

**Material lido:**
- **10 vídeos mais recentes do canal principal** (02/09 a 02/11/2026), lidos a 24 fps:
  - cortes, câmera (correlação de fase e zoom log-polar), imagem congelada, tela escura;
  - luz e cor (luminância, saturação, colorfulness, detalhe);
  - takes por correlação (64×36, z-score);
  - folhas de 1 quadro/s e 12 quadros nítidos por vídeo;
  - legenda automática em inglês, limpa.
- **Vídeos de bastidores do próprio canal:**
  - "100K Subscribers in 5 months: How we produce our Animation in Blender & Adobe Aftereffects" (01/2023);
  - "How We Make Animations & launched 2 YouTube Channels" (05/2026);
  - "Behind the Scene – A7V German Tank #Blender" (01/2022).
- **Dublagem brasileira do Learjet:** "Caso Learjet: O Que Fez Este Jato Cair Como um Míssil?", lida a 24 fps com legenda.
- **API do YouTube:** estatísticas dos canais e dos vídeos, descrições.

---

## 1. Resumo em 10 linhas
1. **Stack confirmada pelo próprio canal:** **Blender (EEVEE)** → **OpenEXR** → **After Effects** (composição) → **Premiere Pro** (edição). Não é three.js nem Unreal.
2. **Render barato de propósito:**
   - EEVEE com raytracing desligado, Simplify ligado e poucas amostras;
   - "1 minuto de animação por hora de render numa placa de vídeo barata de 5 anos" (GTX 1660, ~US$ 200).
3. **Equipe:** **7 animadores + 1 roteirista**. "Um vídeo de 10 minutos do zero em 12 horas", ~1 vídeo por semana.
4. **Pesquisa e roteiro com IA:** o vídeo de bastidores mostra o **claude.ai** na pesquisa. Também mostra um Google Docs com o roteiro **dividido por blocos cronometrados** e **pranchas ilustradas geradas por IA** como storyboard para os animadores.
5. **A qualidade vem do objeto que abre** (corte, vista explodida, raio X, peças coloridas por subsistema), da **câmera sempre andando** (5% de câmera parada) e de **~17 takes distintos por minuto**, quase sem repetição (4,5%).
6. **Gráficos dentro do 3D:**
   - rótulos com linha de chamada;
   - telas de radar e MFD dentro da cabine;
   - vista do sensor (FLIR) com retícula;
   - trilhas tracejadas, setas e grades de "palco".
7. **Roteiro:** gancho "This is how X works" + mecanismo em 1 frase nos primeiros 10 s + "But…?" + **estágios numerados** com "Notice how…" + cenário humano ("Picture a dogfight…"). ~145 palavras/min, **~2 números falados por minuto**.
8. **Pauta:** evento geopolítico quente explicado em 3D. Os maiores virais (6 a 9,6 mi) são eventos (Shahed, Abrams, captura do presidente venezuelano, ataque ao Irã); os "como funciona" atemporais sustentam 200–500 mil.
9. **Escala:**
   - rede de canais: principal 2,03 mi de inscritos e 390 mi de views; Brasil 131 mil; Español 20,6 mil; Farsi 5 mil + 1 mil;
   - 2 canais novos em 2026 (NodMap, mistérios da ciência; LocRot, engenharia);
   - patrocínio em quase todo vídeo.
10. **Para nós:** o que faz a diferença **não é o motor**. Quase tudo cabe no three.js (seção 8). O custo real deles é **modelar o interior do objeto**, e isso é ofício, não render.

---

## 2. O canal em números
| Canal | Criado | Inscritos | Vídeos | Views totais |
|---|---|---|---|---|
| AiTelly (principal, EN) | 2022 | 2.030.000 | 379 | 390.156.930 |
| Aitelly Brasil (dublagem PT) | 2022 | 131.000 | 242 | 18.339.277 |
| Aitelly Español | 06/2025 | 20.600 | 130 | 2.620.261 |
| Aitellyfarsi / Aitelly Farsi | 10/2025 e 03/2026 | 4.960 / 961 | 84 / 22 | 360.731 / 51.937 |
| NodMap / LocRot | 2026 | (novos) | — | — |

**Os 10 vídeos lidos** (views na data da leitura):
| # | Vídeo | Publicado | Duração | Views |
|---|---|---|---|---|
| 1 | How Learjet 60 Florida Crash? Explained in Detail | 02/11 | 8:55 | 126 mil em ~22 h |
| 2 | US Space Force Weapons Explained? | 31/10 | 12:50 | 34 mil |
| 3 | MOAB Explained: How the Mother of All Bombs Works | 26/10 | 14:26 | 85 mil |
| 4 | Inside the New F-15 EX Fighter Jet? | 18/10 | 18:23 | 171 mil |
| 5 | How the Biggest Nuclear Torpedo Actually Works \| Poseidon | 10/10 | 13:05 | 311 mil |
| 6 | How Modern Torpedoes Actually Work \| Mk-48 | 02/10 | 11:50 | 353 mil |
| 7 | How the Gatling Gun Actually Works? | 26/09 | 11:59 | 510 mil |
| 8 | How Does the C-RAM Actually Know What to Shoot? | 19/09 | 13:40 | 308 mil |
| 9 | How the Tomahawk Cruise Missile Actually Works | 11/09 | 13:20 | 319 mil |
| 10 | Can the Patriot System Actually Intercept Hypersonic Missiles? | 05/09 | 8:49 | 197 mil |

**Maiores virais da história do canal** (busca na API, amostra):

| Vídeo | Views |
|---|---|
| How US Captured The Venezuelan President? (01/2026) | 9,6 mi |
| How to Drive and Fire Tanks, Abrams (2023) | 7,1 mi |
| Kamikaze drone Iran Shahed 136 (2022) | 6,4 mi |
| How Ukraine FPV drones Truck Attack Happened? (2025) | 4,7 mi |
| How Hamas Makes Rockets (2023) | 4,4 mi |
| Surviving Iran: F-15 Rescue (2026) | 4,4 mi |
| Operation Epic Fury (2026) | 4,3 mi |

O padrão é **evento quente explicado em 3D**.

---

## 3. A stack (confirmada pelos bastidores)
### 3.1 O que o próprio canal mostra e diz
**Bastidores de 2023** ("How we produce our Animation in Blender & Adobe Aftereffects"):
- **Passos da descrição:** 1 baixar o Blender · 2 modelagem · 3 texturização · 4 rigging · 5 animação · 6 render · 7 After Effects (composição) · 8 Premiere (edição).
- **Na tela:**
  - modelagem por caixa sobre **imagens de referência/planta** no viewport;
  - texturização no editor de nós;
  - rig da esteira do tanque;
  - **saída em sequência PNG RGBA** (8 bits, compressão 15%) no Blender 3.3.1;
  - no After Effects, o tanque renderizado com alfa sobre fundo e os rótulos de texto;
  - corte final no Premiere.

**Bastidores de 2026** ("How We Make Animations & launched 2 YouTube Channels"), em fala transcrita:
- "começamos há 3 anos com dois animadores; hoje somos oito";
- "uma equipe de **sete animadores e um roteirista**";
- "como criamos um vídeo de **10 minutos do zero em só 12 horas**";
- "o processo sempre começa com **pesquisa**, depois escrevemos o **roteiro**; quando ele fecha, vai para a **modelagem 3D**";
- "ajustamos o Blender para **renderizar 1 minuto de animação em uma hora**, numa placa de vídeo barata de 5 anos" (na tela: **GTX 1660, US$ 200**);
- "renderizamos em **OpenEXR em vez de PNG ou Targa** para controlar o tamanho dos arquivos e a velocidade";
- "depois, composição no **After Effects** e, por fim, edição no **Premiere Pro**".

**Na tela** (quadros ampliados):
- **Render Engine: EEVEE**, com:
  - poucas amostras (viewport ~32, render ~16–25);
  - temporal reprojection;
  - sombras ligadas;
  - **Raytracing desligado**;
  - **Simplify ligado**;
  - motion blur e DOF disponíveis.
- **Compositor do Blender com nó Glare** (bloom) antes da saída.
- Saída **OpenEXR**, com a lista de codecs aberta.
- Cena com coleções nomeadas por objeto (F-18 Super Hornet, oceano, sol, porta-aviões).
- **Graph Editor** (curvas F) ajustando o easing da animação.
- Blocagem rápida: cidade e personagens de baixa complexidade, depois o refinamento.
- **Pesquisa:** navegador no **claude.ai**, numa conversa de pesquisa sobre o tema do vídeo. A barra de favoritos tem ChatGPT, Perplexity, Gemini, Google Docs/Drive, Acrobat e um site de modelos 3D.
- **Roteiro:** Google Docs com abas por bloco cronometrado ("Gancho 21 s", "Cenário 1…", "… 43 segundos") e **pranchas ilustradas no estilo desenho a lápis, geradas por IA**, como storyboard. O animador recebe o texto e a imagem de referência de cada bloco.

**Bastidores de 2022 (A7V):** After Effects compondo "Tank [0001-0200].png" e "Area [0001-0200].png", ou seja, cada elemento em sequência própria com alfa, composto depois.

### 3.2 A cadeia completa
| Etapa | Ferramenta | Como |
|---|---|---|
| Pesquisa | claude.ai / ChatGPT / Perplexity / Google | conversa de pesquisa por tema |
| Roteiro | Google Docs | blocos cronometrados + prancha ilustrada por IA para cada bloco |
| Modelagem | Blender | por caixa sobre planta/foto de referência; modelos próprios, reaproveitados entre vídeos; site de modelos nos favoritos (inferência: base comprada ou baixada e refeita) |
| Textura | Blender (nós) | cores chapadas e saturadas por subsistema; logotipo do canal como decalque no objeto |
| Rig e animação | Blender (Graph Editor) | peças separadas com pivô próprio; easing ajustado na curva |
| Render | **Blender EEVEE** | poucas amostras, sem raytracing, Simplify; **~1 min de vídeo por hora** numa GTX 1660 |
| Saída | **OpenEXR** (antes PNG RGBA) | elementos em camadas com alfa |
| Composição | Blender (Glare) + **After Effects** | bloom, texto, rótulos com linha de chamada, telas de interface, correção de cor |
| Edição | **Premiere Pro** | corte, música, efeitos sonoros, legenda |
| Narração | (não mostrado) | ~145 palavras/min, ritmo uniforme; provável voz sintética no inglês (inferência) |
| Dublagem | canais por idioma | PT, ES, Farsi; mesmo vídeo, narração trocada |

**Por que é rápido e barato:**
1. **EEVEE** (rasterização) em vez de Cycles: ~2,5 s por quadro numa placa de entrada.
2. **Estilo de cor chapada**, que não precisa de luz física cara.
3. **Biblioteca própria** de modelos e cenários, reaproveitados com outro ângulo e outra ação.
4. **Equipe em paralelo** (7 animadores em blocos diferentes do mesmo roteiro).
5. **Composição separada**: mudar texto, cor ou brilho não exige renderizar de novo.

---

## 4. Medições dos 10 vídeos (24 fps)
| # | Cortes/min | Plano mediano (s) | Takes distintos | Takes/min | Repetição | Câmera parada | Congelado | Tela escura* | Colorfulness | Palavras/min | Números falados/min | Perguntas |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 Learjet | 6,0 | 3,5 | 123 | 13,8 | 9,6% | 17,6% | 0,1% | 10,9% | 18,2 | 134 | **9,9** (notícia) | 6 |
| 2 Space Force | 8,1 | 4,2 | 243 | 18,9 | 4,7% | 9,1% | 0,3% | 53,6% (espaço) | 25,6 | 146 | 1,6 | 9 |
| 3 MOAB | 6,3 | 5,2 | 244 | 16,9 | 3,0% | 7,2% | 0,2% | 21,8% | 29,8 | 154 | 2,0 | 7 |
| 4 F-15EX | 10,5 | 3,7 | 315 | 17,2 | 5,2% | 6,0% | 0,3% | 18,0% | 26,8 | 151 | 2,6 | 9 |
| 5 Poseidon | 6,8 | 5,0 | 212 | 16,2 | 7,1% | 4,0% | 0,3% | 41,6% (mar profundo) | 33,3 | 145 | 1,0 | 13 |
| 6 Mk-48 | 7,0 | 5,0 | 207 | 17,5 | 4,3% | 3,0% | 0,2% | 49,0% (mar profundo) | 31,6 | 142 | 1,3 | 4 |
| 7 Gatling | 8,8 | 3,3 | 195 | 16,3 | 6,1% | 4,0% | 0,3% | 21,6% | 27,9 | 147 | 2,2 | 5 |
| 8 C-RAM | 10,5 | 3,4 | 244 | 17,9 | 3,8% | 4,4% | 0,1% | 22,2% | 30,8 | 143 | 2,0 | 8 |
| 9 Tomahawk | 7,1 | 5,2 | 227 | 17,0 | 2,8% | 3,7% | 0,1% | 25,2% | 29,7 | 145 | 1,1 | 5 |
| 10 Patriot | 9,0 | 4,4 | 135 | 15,3 | 4,2% | 7,4% | 0,3% | 12,2% | 30,3 | (sem legenda) | — | — |
| **Mediana** | **7,6** | **4,3** | **220** | **16,9** | **4,5%** | **5,2%** | **0,2%** | 22% | **29,8** | **145** | **1,8** | 6,5 |

\* "Tela escura" é a fração de amostras com luminância mediana < 12. Nos vídeos de espaço e mar profundo é o **fundo escuro do estilo**, não tela preta vazia (o congelado fica em 0,1–0,3%). A exceção é a dublagem brasileira do Learjet: 47 s de **tela preta de verdade** com a narração rodando (falha de edição da versão PT).

**Leitura:**
- **Takes por minuto (~17) maior que cortes por minuto (~7,6)**: o take muda **dentro do plano**, pela câmera que voa e pelas peças que se movem e se abrem. O corte não é a fonte do ritmo.
- **Câmera parada em 5%**: nunca há quadro parado (congelado ≈ 0).
- **Cor:** colorfulness ~30 contra 8–18 dos nossos batedores e do Reconstructed. É estilo saturado, de "brinquedo técnico".
- **Fala:** ~145 palavras/min e ~2 números falados por minuto, dentro do checklist agregador (≤ 4). Só o Learjet, que é notícia, sobe para ~10.

**Comparação direta:**
| Medida | AiTelly (mediana) | Reconstructed (Learjet) | Short Ponto de Decisão | Nossa Learjet parte 2 |
|---|---|---|---|---|
| Takes distintos/min | **16,9** | 12,3 | 1,6 | ~8 (8 clipes) |
| Repetição | 4,5% | 3% | 0% | 56% |
| Câmera parada | **5,2%** | n/m | 23,9% | 60,6% |
| Cartão separado do 3D | raro (telas de interface ficam dentro da cena) | 22% | 0% | 21% |

---

## 5. A gramática visual (catálogo pelas folhas)
### 5.1 O objeto que abre
1. **Corte (cutaway):** a casca some ou fica transparente e o mecanismo aparece:
   - reator e engrenagens do Poseidon;
   - motor do F-15EX em corte com as pás;
   - interior da MOAB;
   - radome do C-RAM com o painel do radar em vermelho.
2. **Vista explodida:** as peças se afastam no eixo e voltam ("INTERCONNECT BOARD", com os fios saindo da placa; o satélite desmontado em módulos).
3. **Raio X / holograma:** casca em arame ou vidro e o interior colorido (o F-15 em arame dourado com "GUN" marcando o canhão, o radome do C-RAM em arame).
4. **Estágios do mecanismo em loop:** o ciclo do Gatling (alimentar, travar, disparar, extrair, ejetar) mostrado peça a peça e depois "acelerado" ("Let's speed up a bit, and this is the result").

### 5.2 Cor que explica
- **Uma cor por subsistema**, saturada e chapada: corpo verde, interior laranja ou vermelho, estrutura ciano, núcleo vermelho brilhante.
- **Logotipo do canal como decalque** no próprio objeto (marca d'água orgânica, difícil de recortar).
- Sem fotorrealismo: material limpo, com leve sujeira em alguns metais.

### 5.3 Dois tipos de cenário
- **Palco explicativo:** o objeto isolado, onde nada compete com ele:
  - chão escuro de estúdio com cavalete;
  - céu azul liso;
  - **planta técnica azul com grade e cruzes**;
  - grade preta com pontos;
  - grade holográfica verde;
  - túnel de grade azul.
- **Mundo:** contexto e ação, com volumetria (poeira, fumaça, nuvem, raios de sol embaixo d'água). Exemplos:
  - deserto com poeira;
  - mar com céu de nuvens;
  - fundo do mar com algas e raios de luz;
  - espaço com a Terra;
  - cabine e hangar.
- O vídeo alterna os dois: **o palco explica, o mundo contextualiza**.

### 5.4 Gráficos dentro da cena
- **Rótulo com linha de chamada** preso ao objeto ("CONTROL SECTION", "SUPPRESS THE SIGNAL", "UNDERGROUND BUNKER"), em fonte condensada clara.
- **Telas de interface dentro da cabine:** radar do F-15 com alcances e alvos, MFD com horizonte artificial, console do operador do C-RAM.
- **Vista do sensor:** imagem do pod de mira (FLIR) com retícula, "TRK 014", "NARROW", "GBU-38 JDAM".
- **Radar desenhado** em volta do projétil (anéis e varredura), ondas de sinal saindo da antena, cavitação com anéis de sonar em volta do torpedo.
- **Trajetórias:** linhas tracejadas, rastro de projétil, setas amarelas grossas no espaço 3D.
- **Comparação de escala:** Poseidon ao lado do Mk-48, com as bandeiras dos países.
- **Tipografia grande no espaço** ("12:50 PM", "PER HOUR 800 MILES", letras digitadas uma a uma).

### 5.5 Ponto de vista humano
- **Primeira pessoa:** a luva do piloto no manche, a mão do soldado no joystick do console.
- **Personagens estilizados com rig:** pilotos, passageiro, operadores. Âncora humana sem vítima real.

### 5.6 Câmera e efeitos
- Câmera **sempre andando** (5% parada): voos em volta do objeto, aproximação contínua, travelling ao lado do projétil, câmera presa ao objeto em movimento.
- Efeitos de render: motion blur, poeira e fumaça volumétricas, rastro, clarão de disparo, paraquedas, nuvens.
- Bloom (Glare) nos emissivos, para o "brilho de holograma".

---

## 6. O roteiro
### 6.1 A fórmula do gancho (5 dos 10 vídeos abrem assim)
**Estrutura:** "This is how [X] works." → 1 frase de mecanismo concreto → "But [problema / escalada]…" → pergunta.

**Exemplos:**
- *"This is the modern Gatling gun. It's ingeniously designed so that ammunition is continuously fed through a tracked loop… But the US military needed to cram this monster into a fighter jet. Picture a high-stakes dogfight…"*
- *"This is how a modern nuclear monster torpedo works. Inside the belly of this weapon is a literal nuclear reactor. It pulls in water, converts it into high-pressure steam…"*
- *"This is how the mother of all bombs works. It is a weapon so monstrously huge you can't just drop it… But how does it steer if it doesn't have thrusters?"*

**O que o gancho faz:**
- o **objeto aparecendo por dentro nos primeiros 10 s**;
- **o mecanismo em 1 frase**;
- **a escalada** com "But…";
- uma **cena humana de alto risco** ("Picture a dogfight protecting Air Force One").

### 6.2 O miolo
1. **"Why exactly do you need X?"**: o porquê antes do como (a camada zero do checklist agregador).
2. **"But how does…?"** e depois os **estágios numerados**: "It all begins with the first stage…", "The second stage is…", "Here comes the third stage…".
3. **Frase dêitica** que aponta para o 3D: "Notice how the entire six-barrel cluster rotates…". A fala manda o olho para a peça que se move.
4. **Componentes com o nome do manual**: "drum exit cover assembly", "element chute", "feed unit". Dá autoridade sem número.
5. **"Let's speed up a bit, and this is the result."**: do mecanismo lento ao resultado em tempo real.
6. **A contrapergunta:** "But why do modern fighter jets still need a Gatling gun when they carry advanced missiles?", e a resposta com o cenário humano.
7. **Frase de credibilidade de produção:** "We make every video from scratch in Blender." É marca e defesa contra cópia.

### 6.3 O que o roteiro não faz
- Fala ao espectador ("you") só ~0,8 vez por minuto; o tom é de narrador de documentário.
- Analogias do cotidiano são poucas (~1,5 por vídeo); a explicação é **visual**, não verbal.
- No vídeo de notícia (Learjet) os números disparam (~10/min) e aparecem erros: "13 kg de combustível" na dublagem PT, "Mach 1" tirado de velocidade no solo.

---

## 7. Operação e negócio
- **Ritmo:** ~1 vídeo por semana no principal, de 9 a 18 min.
- **Patrocínio quase sempre:**
  - plataforma de investimentos, com cartão próprio no meio do vídeo;
  - VPN;
  - remoção de dados pessoais;
  - jogo de guerra.
- **Brasil:**
  - afiliado de réplicas em miniatura ("Gostou de nossos modelos 3D?");
  - antecipação de FGTS;
  - "cafezinho".
- **Dublagem como multiplicador:** o mesmo vídeo em PT, ES e Farsi. Mas a dublagem rende uma fração: o Learjet fez 126 mil em ~22 h em inglês e ~5,3 mil no primeiro dia em PT. **A dublagem PT do Learjet tinha 47 s de tela preta** e erros de número, sinal de pós-produção apressada.
- **Novos canais da mesma equipe** (NodMap, mistérios da ciência; LocRot, engenharia): a habilidade e a biblioteca viram plataforma para nichos vizinhos.
- **Propriedade intelectual:** as descrições avisam que **tradução ou edição não oficial é violação** e que já acionaram advogados contra canais grandes que copiaram. **Nunca reaproveitar, recortar ou dublar material deles.** Usamos só como referência de método.

---

## 8. O que levar para os nossos canais (e onde cabe na nossa stack)
O princípio de produção (`docs/principio-producao-multidimensional.md`) já diz que a compreensão é o produto e que o acabamento é o 4º investimento. O AiTelly mostra como uma equipe pequena entrega isso com custo controlado.

| Técnica deles | Como fazemos no nosso motor (three.js / Remotion) | Custo |
|---|---|---|
| Corte (cutaway) | `material.clippingPlanes` (nativo do three.js) com tampa colorida no plano de corte | baixo, se o modelo tiver interior |
| Vista explodida | peças do glTF como nós separados; animar o deslocamento no eixo com easing | baixo, se o modelo tiver peças separadas |
| Raio X / holograma | casca com material Fresnel transparente ou arame + interior emissivo + bloom | baixo |
| Cor por subsistema | `MeshToonMaterial` com 2–3 tons, uma cor por subsistema (ver `docs/acabamento-threejs.md` §3.1) | baixo |
| Palco explicativo | presets de cena: planta técnica com grade, chão de estúdio escuro, céu liso, grade holográfica | baixo |
| Rótulo com linha de chamada | projetar o ponto 3D na tela e desenhar a linha e o texto no Remotion (já fazemos no painel vivo) | baixo |
| Tela de interface dentro da cena | componente React como textura na tela da cabine ou no console | médio |
| Vista do sensor (FLIR) | passe com cor monocromática + retícula e textos no Remotion | baixo |
| Comparação de escala com bandeiras | dois modelos lado a lado num palco, na escala certa | baixo |
| Primeira pessoa / personagem | base Quaternius com rig já usada no `Tropa` | médio |
| Estágios do mecanismo + "acelerar" | animação por tempo: ciclo lento com rótulos, depois `t × N` | baixo |
| Câmera sempre andando, ~17 takes/min | gerador de ângulos com take único por frase (já planejado) | baixo |

**O custo real é o modelo com interior:**
- O kit tem objetos fechados e simples.
- Corte e vista explodida exigem **peças internas separadas**.
- Regra prática: **1–2 modelos explicativos por vídeo**, com interior, valem mais que dez cascas fechadas.

Exemplos:
- **DE:** culatra do Krupp abrindo; rodas e bielas da locomotiva; o telégrafo por dentro;
- **ES:** a cauda do avião com o estabilizador e o compensador; o motor em corte.

**O que copiar do processo:**
1. **Roteiro em blocos cronometrados**, cada um com **uma prancha de referência visual** para quem monta a cena. Combina com o plano de batidas declarando as dimensões de cada take.
2. **Biblioteca própria** reaproveitada como modelo (nunca como take).
3. **Composição separada do render** quando o 3D for caro: texto, rótulo e cor na camada do Remotion, não no 3D.
4. **"Notice how…" ligado à peça que se move**: é a frase dêitica do checklist (item 15).

**O que não copiar:**
- números sem conferir no vídeo de notícia;
- dublagem apressada (tela preta, número errado);
- inserção comercial no meio do gancho;
- qualquer material deles (proteção de PI declarada).

---

## 9. Perguntas em aberto
- A narração em inglês é voz sintética ou humana? O ritmo uniforme de ~145 palavras/min sugere sintética; não confirmado.
- De onde vêm os modelos-base (compra, download, do zero)? O canal diz "from scratch" e os favoritos têm um site de modelos.
- Retenção e CTR não são públicos. A comparação entre a dublagem PT e o original EN sugere que a língua original e a janela pesam mais que o 3D.

*Dados brutos (medições por vídeo, folhas, transcrições) ficam na pasta de pesquisa local do projeto, fora do repositório.*
