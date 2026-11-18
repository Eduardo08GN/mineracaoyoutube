# Descoberta sem vocabulário — o que a API mostra quando não perguntamos pelo nosso nicho (01/11/2026)

Pedido do Eduardo: "a pesquisa pela API pode estar afunilada e enviesada na origem". O desenho da varredura passou antes pela crítica do minerador (6 vieses corrigidos).

## Método
- **Fonte principal: busca SEM palavra** (`search.list` sem `q`). Os mais vistos de 30 dias por idioma/país (en-US, en-GB, es-MX, es-ES, es-AR, es-CO), longos e médios, 4 páginas por fatia, mais 6 categorias.
- **Controle:** charts mostPopular.
- **Comparação:** 40 moldes estruturais de título em EN/ES, que ainda são vocabulário nosso.
- **Volume:** 6.853 vídeos (891 shorts, separados), lives excluídas. 729 canais candidatos (longo ≥ 100 mil e canal ≤ 365 dias ou views/inscritos ≥ 20), todos medidos pelos últimos 50 uploads. **Consistente** = mediana dos longos ≥ 50 mil ou ≥ 40% acima de 50 mil.
- **Anúncio fora:** quem tem mediana de likes/views < 0,3% sai.
- **Filtro de produção:** não cortou nada; foi lido só no fim.
- **Arquivos:**
  - `coleta.json`, `canais_consistencia.json`, `filtrado.txt` (lista completa por idioma);
  - `RELATORIO_bruto.md`;
  - `oferta_formatos.txt` (oferta ES dos formatos achados).
- **Cota:** ~23 mil unidades.

## O que apareceu e as nossas buscas nunca acharam

### 1. Documentário longo de desastre natural, "A TRAGÉDIA DE <lugar>": gigante em PT e EN, vazio em ES
- **Um Documentário (PT, canal de 204 dias, 115 mil inscritos):** mediana dos longos de **607 mil**, com 94% dos vídeos acima de 50 mil. Formato: "A TRAGÉDIA DE <lugar>: <o fenômeno> que <fez algo> em <tempo> | Documentário completo", com 52–69 min.
  - Miyako (tsunami): **5,59 mi**;
  - **Yungay (Peru, 1970)**: **5,30 mi**;
  - Peraliya (trem soterrado pelo tsunami): 3,65 mi;
  - Aceh: 2,28 mi;
  - Vajont: 852 mil;
  - Zelândia: 374 mil;
  - Messina: 200 mil;
  - Saint-Pierre: 136 mil.
  - Ele intercala "Terra pré-histórica / primeiros humanos": 1,6 mi e 1,4 mi.
- **Clones em PT:** Sessão Documentário (Vajont 501 mil).
- **Em EN:** Arthur Revives the Past (THE LISBON TRAGEDY 3,31 mi), Astraway (Pompeia 10,9 mi), TRUE HORIZONS.
- **Reconstrução com IA em PT:** "Tom Reconstitui os Fatos" (tsunami de 2004, 3,16 mi) e "Patriota Em Foco" (Japão 2011, 2,63 mi).
- **Em ES, a busca "la tragedia de … tsunami documental completo" devolve os vídeos em PT e EN.** O que existe em ES:
  - Armero (VESTIGIUM 682 mil, DE AQUI NACE 511 mil);
  - Vajont com IA (Nick Historia Renacida, 462 mil);
  - Bajo la Corteza (35 mil).
  - **Não há canal ES fazendo esse formato com regularidade**, e Yungay, que é peruano, fez 5,3 mi em português.

### 2. Desastre natural QUENTE explicado: o maior hit do The Last Day não é What If
- O "Nepal's 2026 Disaster Explained: The Glacier That Wiped Out a Valley" fez **5,13 mi** (EN).
- Em ES, o Astrovía (traduzindo o título) fez **709 mil**, e o Venezuela al día 816 mil.
- No mesmo canal, os What If ficam entre 23 mil e 1,9 mi, de forma irregular.
- Nos canais ES de ciência, o padrão se repete: Coordenada Crítica (19 dias) faz **604 mil** com o Súper El Niño (notícia científica quente), mas só **11 mil** com o hipotético "El terremoto de 1811 puede repetirse — esto es lo que pasaría".
- **Isso confirma a leitura do Eduardo sobre o What If:** em ES, o hipotético perde para a notícia natural explicada.

### 3. Engenharia de lugares hispânicos reais: novo e forte em ES
- **Sapiens Explica:** "¿Qué hay debajo de la Ciudad de México? (y por qué se hunde)" fez 890 mil; a Torre Latinoamericana, 908 mil.
- **CONSTRUCTUM:** "Por qué un terremoto TIRA un edificio y deja el de al lado INTACTO", 1,22 mi.
- É física implícita com lugar real, exatamente o nosso kit (corte 3D, terreno, colapso).
- **Ricos Sin Suelo (canal de 23 dias):** "El mar se traga los condominios de $200 millones de Colima — y nadie puede detenerlo" fez 955 mil, Tijuana 850 mil e Cartagena 614 mil. **Já tem 5 clones em 3 semanas** (Lujo en Ruinas, Lujo Colapsado, Ricos Sin Tierra…). A corrida está na fase de clones, então é tarde para esse molde.
- **"La máquina más grande del mundo" em ES** (Prodigios de Ingeniería, Ingeniería Monumental, Proezas Aéreas e Mente Mecánica, todos com 43 a 365 dias): também lotado.

### 4. Investigação de desastre pouco conhecido (EN), cadência mensal
- **Fathom:** 13 vídeos, mediana de 149 mil.
  - "The Tiny Capsule That Caused Brazil's Chernobyl" (Goiânia): 957 mil;
  - "How a Disused Medical Device Contaminated Thousands of Homes": 1,21 mi.
- Não achamos equivalente em ES.

### 5. Análise de acidente aéreo já existe em ES (concorrência para avião)
- **Piloto Informe** (358 dias): mediana de 66 mil, com hits de 330 mil, 262 mil (Flow La Movie) e 232 mil. Título sensacionalista "¡El Piloto que…!"; cobre notícia.

### 6. Fora do nosso escopo, mas é sinal para outros canais
- **Tática militar em 3D/mapa (EN):** Moon Pulse (736 mil de mediana, 170 dias), Terrain Walk (27 dias, 105 mil: "How 9 Tanks Beat 50 in a Sandstorm"), Battle Analysis (3D breakdown). → **Kriegsmomente**.
- **"Remember <caso>? This Is What Actually Happened To Her"** (DOCU., REMEMORY, canais de 12–59 dias, 250–400 mil): true crime, fora pela regra do Eduardo.
- **História econômica animada da América Latina, em EN:** Fortune of Nations, Ziro History (29–32 dias): "Why Did the US Get Rich But Latin America Never Did?".

## O que isso muda na direção do Segundo a Segundo (proposta para a revisão)
1. **What If sai, como o Eduardo disse.** Em ES, o hipotético perde para a notícia natural explicada (Coordenada Crítica: 11 mil × 604 mil).
2. **Desastre natural com física sobe para o centro**, em duas formas:
   - **quente:** "<desastre> explicado: <o mecanismo>", 1–7 dias depois do evento (Nepal: 5,1 mi EN, 709 mil ES);
   - **evergreen:** "La tragedia de <lugar>: <el fenómeno> que <hizo X> en <tiempo>", que é o buraco ES mais claro da varredura. Yungay, Armero, Vajont, Valparaíso 1906 e Lisboa 1755 provam milhões em PT e EN.
3. **Engenharia/física de lugares hispânicos reais** ("¿por qué se hunde/no se cae?") entra como evergreen barato com o nosso kit, antes que lote (hoje tem 2–3 canais).
4. **O que NÃO fazer:** "más grande del mundo" e o molde do Ricos Sin Suelo, os dois já em fase de clones.

## Vieses que ainda restam (para o minerador atacar)
- **A busca sem `q`, ordenada por views, favorece hits já grandes** e vídeos de até 30 dias. Um formato que está nascendo agora com 20–50 mil não entra.
- **O `relevanceLanguage` vaza.** Muito hindi, coreano e PT veio na fatia EN/ES. Reclassifiquei o idioma pelo título, por heurística de palavras.
- **O domínio sai por palavras do título**, e muita coisa ficou "?".
- **O filtro de anúncio (likes < 0,3%)** pode ter cortado canal legítimo de engajamento baixo, como os de mega-máquinas.
- **Não olhamos FR, DE e IT,** nem o PT de propósito. O PT apareceu por vazamento e se mostrou o mercado mais quente de reconstrução de desastre.
- **Produção:** o formato documentário tem 50–69 min, contra os 10–14 dos nossos vídeos. É preciso medir se cabe em 2 h; o mais provável é que não caiba nesse tamanho.

## Adendo (iii): consistência dos canais de engenharia de lugar
Taxa de hit = % dos últimos 10 longos com 100 mil ou mais. Fonte: `engenharia_lugar.txt`; 64 buscas ES de 180 dias, 156 canais com hit no molde.

- **A engenharia de lugar pura é irregular.**
  - Sapiens Explica: 30% de hit, mediana de 82 mil (3 hits em 10, como o minerador previu).
  - Mazzal ("Debajo de Medellín hay un río enterrado"): 33%, mediana de 17 mil.
  - Cota de Riesgo (canal de 76 dias, "Miami se hunde", 537 mil): 40%.
  - Leitura: hipótese fraca como perna fixa; serve só como tema avulso.
- **O que é consistente: evento real + física explicada.**
  - **Ingeniería España** (481 dias, 228 mil inscritos): **100% de hit, mediana de 281 mil**. Ex.: "11 DE SEPTIEMBRE: la física detrás del COLAPSO de las TORRES GEMELAS".
  - **Lore De Polvo** (444 dias, 28,7 mil inscritos): **90% de hit, mediana de 319 mil**. Ex.: "VALDIVIA 1960: El Terremoto Más Fuerte de la Historia" (782 mil). É desastre natural documental em ES, com regularidade.
  - **El Mecanismo:** "¿Por qué el terremoto de Panamá no fue igual de grave que los de Colombia y Venezuela?" (751 mil, 11/10). É sismo quente explicado.
  - KiwiKowai (Sampoong, 186 mil): colapso explicado.
- **2026 é o ano do terremoto hispânico.**
  - Os eventos: Venezuela (jun), Colômbia 7,4 (ago), Peru 7,2 (ago) e Panamá (out).
  - Na busca, dominam a cobertura e os vlogs: SEVENRO 6,4 mi, Federico Millan 3,8 mi, Ey Graffe 3,5 mi, Zazza 2,8 mi.
  - Os vídeos explicativos são poucos: El Mecanismo 751 mil, El Robot de Platón ("¿Se viene un súper terremoto?") 2,7 mi, BBC Mundo 633 mil e Bobicraft (explicado em Minecraft) 768 mil.
  - **Isso corrige o meu backtest (sismo com 0,3/mês no Noticias Ilustradas):** em 2026 foram ~4 mega-sismos hispânicos em 5 meses. O kit de sismo em 1º, como o minerador defendeu, está certo.
