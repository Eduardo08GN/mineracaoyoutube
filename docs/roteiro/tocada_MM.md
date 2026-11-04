# Tocada do Manual do Mundo (Iberê Thenório): 7 vídeos

*Análise de 04/11/2026. Base: legendas automáticas pt-orig em `leg/` (lidas inteiras), métricas de `metricas_35.json` e contagens regex próprias. Citações no formato `ID@mm` (mm = marcador de minuto da legenda, ou seja, o trecho está entre mm:00 e mm:59). Ortografia das citações limpa; erros de transcrição não corrigidos no conteúdo. Objetivo: extrair a condução do roteiro para explicadores narrados faceless (ES/DE), não o conteúdo.*

## 0. Corpus

| ID | Título (resumido) | Views | Min | Tipo |
|---|---|---:|---:|---|
| ZsR-2zkEwCM | Usina nuclear de Angra #Boravê | 8,6 mi | 27,2 | Visita: sistema/fluxo |
| vOuuZJ5d4Ks | Como funciona uma plataforma de petróleo #Boravê | 7,6 mi | 23,4 | Visita patrocinada (Petrobras) |
| aFb2Dx7OsHA | Como é feita a latinha de alumínio #Boravê | 9,2 mi | 19,8 | Visita: linha de produção (legenda muito ruim, sem pontuação) |
| 9r8qXlkFYaw | Como funciona o encontro das águas #Boravê | 5,9 mi | 10,9 | Fenômeno natural, com testes |
| alzphVrX3dU | O caminho mais rápido não é o que parece | 7,0 mi | 15,3 | Experimento (braquistócrona), em dupla |
| Nm5J_9FYU4o | Como é feito o tablet e o chip #Boravê | 4,7 mi | 17,3 | Visita patrocinada (Multilaser) |
| yIOe49fkMCY | O segredo para atravessar o oceano antes do GPS | 0,75 mi | 21,4 | Instrumento (sextante), estúdio, merchan de filme |

**Contagens por minuto** (regex sobre a legenda inteira):

| | Angra | Plataf. | Latinha | Águas | Braquist. | Tablet | Oceano |
|---|---:|---:|---:|---:|---:|---:|---:|
| Palavras/min | 189 | 166 | 177 | 179 | 151 | 188 | 187 |
| Perguntas (?)/min | 0,85 | 0,90 | n/d* | 1,47 | 2,42 | 0,69 | 1,17 |
| "mas / só que / o problema / o detalhe"/min | 0,77 | 1,28 | 1,16 | 1,38 | 1,63 | 1,33 | 0,93 |
| "isso aqui / aqui"/min | 5,1 | 2,9 | 2,0 | 2,7 | 2,0 | 3,1 | 2,8 |
| "a gente"/min | 2,1 | 2,3 | 1,1 | 2,0 | 2,3 | 2,4 | 1,5 |
| "você(s)"/min | 2,2 | 1,4 | 1,4 | 2,0 | 0,7 | 1,9 | 4,1 |
| "eu"/min | 0,6 | 1,0 | 0,5 | 1,2 | 1,2 | 1,0 | 2,0 |
| Números/min (métrica do lote) | 1,8 | 2,1 | 1,2 | 1,9 | 0,1 | 1,6 | 1,7 |

\* A legenda da latinha não tem pontuação.

**Correções à `ANALISE.md` (feita com 3 vídeos):**
- "Patrocínio antes dos 3 min" **não** é padrão do Manual. Só o Oceano tem inserção longa (livro + filme, ~1:40 entre 01:00 e 02:40). A Plataforma tem 1 frase (~5 s, em 02:55); o Tablet tem ~35 s de apresentação da empresa (00:25–01:00). Angra, Latinha, Águas e Braquistócrona não têm nada. No Boravê, o patrocínio é a própria visita, e o texto não para para vender.
- O ritmo não fica sempre em 187–195 ppm: vai de 151 (Braquistócrona, em diálogo) a 189.
- O pronome dominante é **"a gente"** (1,1–2,4/min), não "eu". O "você" varia muito: 0,7/min no diálogo da Braquistócrona e 4,1/min no Oceano.
- Recapitulação formal é rara. Só o Oceano faz "Resumindo" (yIOe49fkMCY@16). O padrão é o **retorno curto** ao que já foi mostrado ("lembra que eu falei…").

---

## 1. Gancho (0–60 s)

**Padrão A: missão + "Bora ver?" em até 5 s (4/7).** O tema chega como missão, não como pergunta.
- "a gente veio aqui pro meio do mar pra mostrar… como funciona uma plataforma" (vOuuZJ5d4Ks@00)
- "Hoje você vai ver com a gente como é feito o tablet. Bora ver." (Nm5J_9FYU4o@00)
- Idem em aFb2Dx7OsHA@00 e 9r8qXlkFYaw@00.

**Padrão B: quebra de expectativa ou fato escondido no 1º minuto (7/7).** É ela que transforma a missão em curiosidade.
- "imaginando que você ia estar na China… não, tem tablet sendo fabricado no Brasil" (Nm5J_9FYU4o@00)
- "É meio óbvio que é uma reta, né? Iberê, nem sempre é assim." (alzphVrX3dU@00)
- "esses dois rios têm cores completamente diferentes. E quando eles se encontram, não se misturam" (9r8qXlkFYaw@01)
- "Por que que escolheram Angra dos Reis, esse paraíso aqui…?" (ZsR-2zkEwCM@00)
- Oceano: o remador cruzou o Atlântico "sem GPS" (yIOe49fkMCY@00). Latinha: "você não vai perceber… mas a fabricação… dividida em duas partes" (aFb2Dx7OsHA@00). Plataforma: "chegar lá não é nada simples" (vOuuZJ5d4Ks@00).

**Tempo até a pergunta central:**

| Vídeo | Tema dito | Pergunta/paradoxo central | Mecânica |
|---|---|---|---|
| Plataforma | ~5 s | ~25 s ("não é nada simples") | missão + jornada |
| Latinha | ~5 s | ~10 s (duas partes, duas fábricas) | missão + mapa do percurso |
| Águas | ~3 s | ~65 s (não se misturam) | missão + geografia + paradoxo |
| Braquistócrona | 0 s | 0–5 s | pergunta + resposta óbvia negada |
| Tablet | ~3 s | ~10 s (feito no Brasil) | missão + quebra de expectativa |
| Oceano | ~25 s | ~30 s ("sem GPS") + objeto na mão | mini-história → virada → objeto → promessa |
| Angra | ~5 s (lugar) | ~45 s ("por que Angra?") | cena no local + datas + pergunta |

**Mediana:** tema em ~5 s; pergunta ou paradoxo central em ~25 s (de 0 a 65 s; 7/7 antes de 1:10).

**Objeto ou cena apontada desde o 1º minuto (7/7):** "esse prédio que tem um cilindro com uma abóboda" (ZsR-2zkEwCM@00); "usando esse instrumento aqui. O nome disso é sextante" (yIOe49fkMCY@00); a placa de silício na mão (Nm5J_9FYU4o@01).

**Anúncio cedo:** 3/7 têm alguma inserção comercial antes dos 3 min, e só uma passa de 1 min (Oceano, ~1:40, costurada à história do Amyr Klink). Ver a correção acima.

## 2. Promessa

**Promessa concreta em ≤ 60 s (7/7).** O verbo é sempre "mostrar / ver / entender", seguido do objeto exato.
- "fica até o fim, porque hoje você vai entender de uma vez por todas" (yIOe49fkMCY@00)
- "vamos ver de perto… se eles não se misturam mesmo" (9r8qXlkFYaw@01). Aqui a promessa é um teste.

**Promessa de inventário ou rota (4/7).** Diz o que vem e em que ordem.
- "o chip do tablet mesmo, o processador, o cartãozinho de memória… tudo isso hoje" (Nm5J_9FYU4o@00)
- "primeiro para o Amazonas e depois para Minas Gerais" (aFb2Dx7OsHA@00). Também em ZsR-2zkEwCM@00 (Angra 1, 2 e 3) e vOuuZJ5d4Ks@00–02 (rota de avião, helicóptero, quarentena).

**Promessa adiada dentro do texto (3/7):** "é muito importante usar água do mar… você vai entender daqui a pouco" (ZsR-2zkEwCM@01).

**Resposta entregue logo, com o "porquê" guardado (1/7, mas instrutivo):** "a rampa vencedora é a da curva braquistócrona" (alzphVrX3dU@00). O spoiler não mata a curiosidade, porque o ganho prometido é entender **por que** a curva vence.

## 3. Arquitetura e ritmo

### Dois esqueletos
**Visita (Angra, Plataforma, Latinha, Tablet): seguir o material (4/4).** Matéria-prima → etapa 1 → … → teste de qualidade → produto final → onde ele vai parar. Angra segue a água e o vapor; a Plataforma, o óleo; a Latinha, o alumínio; o Tablet, o silício. O espaço da visita obedece à ordem do processo, não à da planta.

**Fenômeno (Águas, Braquistócrona, Oceano): pergunta → hipótese/palpite → teste → explicação → complicação → segunda volta.**

### Blocos (exemplos)
- **Angra (27 min):** local + por que Angra (0–1) → esquema do ciclo inteiro no desenho (1–3:30) → contenção, reator e combustível (3:30–5:30) → física da fissão, freio e boro (5:30–9) → água pura (9–10) → eclusa (10–11) → turbina, gerador e transformadores (11–16) → água do mar e condensador (16–18) → proteção radiológica e diesel (18–21) → lixo e rejeitos (21–24) → sala de controle e **simulação do desligamento** (24–27).
- **Plataforma (23 min):** jornada (0–2:30) → o que é um FPSO (2:30–3:30) → caminho do óleo (3:30–9) → tocar o petróleo (8:30–9:30) → transferência ao navio (9:30–11:30) → sala de controle e "botão vermelho" (11:30–13:30) → **falso final** → vida a bordo (14–21:30) → despedida da série (22–23).
- **Oceano (21 min):** história e objeto (0–1) → livro/filme (1–2:40) → o problema: a bússola não basta (2:40–3:30) → pré-requisito, coordenadas (3:30–6) → princípio em 1 frase (6–7) → como o sextante mede, com demonstração (7:30–10:30) → círculo + almanaque (11–13) → relógio e longitude (13–16) → resumo (16:40) → **"é muito pior"** (17–19:30) → prova + utilidade + retorno ao filme (19:30–21).

**Durações típicas:** de 3 a 7 macroblocos por vídeo, de **2 a 5 min** cada. Dentro deles, microetapas de **20 a 60 s**, cada uma com um objeto apontado. Os vídeos curtos (Águas, 11 min) usam blocos de 1 a 2 min.

### Viradas: segunda volta guardada para o último terço (7/7)
- "Galera, é isso aí… não, não, peraí, peraí" (vOuuZJ5d4Ks@13): falso final que abre meia hora de vida a bordo.
- "Parece fácil, mas é complicado… Só que é muito pior do que isso" (yIOe49fkMCY@17)
- "Mas não acabou ainda não. Tem uma última surpresa." (alzphVrX3dU@10)
- "Você acha que a missão tá cumprida? Não." (Nm5J_9FYU4o@16)
- Nos outros três: o teste do copo contradiz o rio (9r8qXlkFYaw@08); "o resto da lata são adendos… vamos ver se é assim mesmo" (aFb2Dx7OsHA@10); o desligamento do reator guardado para o fim (ZsR-2zkEwCM@25).

### A pergunta como dobradiça entre blocos (6/7; a Latinha, sem pontuação, usa "vamos ver")
- "Mas de onde é que vem a energia pra tudo isso?" (vOuuZJ5d4Ks@17)
- "E o que que acontece exatamente aqui dentro? Por que que o urânio esquenta tanto?" (ZsR-2zkEwCM@05)
- Também em Nm5J_9FYU4o@07 (como achar uma rachadura?), yIOe49fkMCY@15 (como saber se é meio-dia?), 9r8qXlkFYaw@08 e alzphVrX3dU@04.

### Frequência de re-ganchos
- Pontos de interrogação: 0,7 a 2,4 por minuto (mediana 0,9).
- Lacunas **reais** (uma pergunta aberta antes da resposta, um "mas" que vira o esperado, uma surpresa anunciada), contadas à mão em Angra (~17 em 27 min), Oceano (~12 em 21) e Tablet (~10 em 17): **~0,6 por minuto, uma a cada 60–100 s**.
- Na Braquistócrona, cada corrida com aposta é um re-gancho: ~1 a cada 1,5 min, com mais de 2 perguntas por minuto.
- As viradas maiores (troca de bloco, com uma frase de transição) chegam a cada 3–5 min.

## 4. Como explica um mecanismo

**Mapa antes do território (5/7).** Antes do detalhe, vem o desenho do sistema inteiro ou o pré-requisito.
- "Antes de qualquer coisa, vamos entender como funciona a usina. E ela é bem simples" (ZsR-2zkEwCM@01): o ciclo completo no esquema, em 2,5 min, antes de entrar em qualquer prédio.
- "Antes de aprender como… funciona esse negócio, vamos entender como… se localiza no mapa" (yIOe49fkMCY@03)
- Também em aFb2Dx7OsHA@00 (duas partes), Nm5J_9FYU4o@01 ("vamos começar vendo a fabricação do chip") e 9r8qXlkFYaw@00 (geografia).

**Microordem de cada peça (6/7): aponta → para que serve (o problema que evita) → número → curiosidade.**
- "Não vira vapor porque aqui tem um pressurizador que mantém a pressão muito alta" (ZsR-2zkEwCM@01)
- "o corte é feito na água… deionizada para não ter nenhuma energia elétrica" (Nm5J_9FYU4o@02)
- Também em vOuuZJ5d4Ks@05 (químicos "evitam" a "pasta parecida com maionese") e vOuuZJ5d4Ks@07 (gás inerte "garante que não aconteça um incêndio").
- A função quase sempre é dita como **risco evitado** ("pra não…", "senão…"), e é isso que dá tensão a um processo industrial.

**Por quê antes de como, nos fenômenos (3/3 fenômenos):** "Primeira coisa, por que que os dois rios têm cores tão diferentes?" (9r8qXlkFYaw@02).

**Princípio em uma frase, depois o detalhe (4/7):**
- "Ele mede o ângulo do sol em relação ao horizonte." (yIOe49fkMCY@06)
- "em vez de gerar calor queimando o diesel, você gera calor por fissão nuclear" (ZsR-2zkEwCM@01)

**Analogia doméstica (7/7), ~1 a cada 1–2 min:**
- "É mais ou menos como se você esfregasse o canudinho no cabelo" (vOuuZJ5d4Ks@06)
- "se você anda de esteira na academia, você sabe que 1 km/h é lento demais" (9r8qXlkFYaw@08)
- Também: turbina como catavento e gerador como alternador de carro (ZsR-2zkEwCM@02, @13); a curva que dá mais aceleração como "pisando no acelerador de um carro" (alzphVrX3dU@02); máquina de costura com fio de ouro e silkscreen (Nm5J_9FYU4o@03, @09).

**Termo técnico: nome → tradução → função (7/7):**
- "Braquistócrono vem do grego braquistos, mais curto, cronos, tempo." (alzphVrX3dU@00)
- "SMT… ou traduzindo de um jeito mais fácil… colocar os chips na placa" (Nm5J_9FYU4o@08)
- Também FPSO (vOuuZJ5d4Ks@03), trip (ZsR-2zkEwCM@12) e Kelvin-Helmholtz (9r8qXlkFYaw@09).

**Número traduzido para o cotidiano (6/7; a Braquistócrona quase não usa números):**
- "uma pastilha dessa… equivale aproximadamente a 22 caminhões de óleo diesel" (ZsR-2zkEwCM@05)
- "316 m de comprimento, 46 a mais do que o Titanic" (vOuuZJ5d4Ks@02)
- Também 4.680 caminhões-pipa (vOuuZJ5d4Ks@07), "10 vezes a cidade de Piedade" (vOuuZJ5d4Ks@18) e 7.000 km = São Paulo–Miami (yIOe49fkMCY@01).

**Antecipar a inferência do espectador (7/7).** É o tique mais constante do Iberê.
- "Você deve ter imaginado que a casca disso aqui não é uma coisa fininha" (ZsR-2zkEwCM@04)
- "Você deve imaginar que não é uma pessoa com um serrote na mão" (Nm5J_9FYU4o@02)
- Também em 9r8qXlkFYaw@03, yIOe49fkMCY@02 ("Talvez você… está pensando"), vOuuZJ5d4Ks@07 e alzphVrX3dU@01.

**Mito ou expectativa corrigidos (7/7):**
- "Existem algumas pessoas que acham que aquilo protege contra radiação, não é isso não" (ZsR-2zkEwCM@19)
- "Eu achava que era uma proteção mecânica… mas não é" (Nm5J_9FYU4o@12)
- Também em vOuuZJ5d4Ks@08, aFb2Dx7OsHA@19, yIOe49fkMCY@02 e 9r8qXlkFYaw@08.

**Demonstração ou teste com o corpo ou com um objeto (7/7):** a mão na água do condensador (ZsR-2zkEwCM@18); o petróleo no béquer (vOuuZJ5d4Ks@08); o termômetro e o copo com corante (9r8qXlkFYaw@04, @07); a miniatura com a luz (yIOe49fkMCY@10); as bolinhas de solda na mão (Nm5J_9FYU4o@05). **Palpite antes do teste** aparece em 3/7: "Eu chuto que a diferença deve ser de uns dois graus" (9r8qXlkFYaw@04); todas as corridas da Braquistócrona.

**O texto aponta para a imagem (7/7):** "isso aqui / aqui" de 2 a 5 vezes por minuto e "olha / ó" de 0,5 a 0,9 por minuto em 5/7. A frase nomeia o que está na tela no mesmo instante:
- "aqui tá o reator… tá vendo que existe um quadrado cinza em volta deles?" (ZsR-2zkEwCM@03)
- "Agora olha o tamanho desses furinhos" (Nm5J_9FYU4o@09)

**Retorno ao que já foi mostrado (7/7):**
- "Lembra que eu falei que algumas barras conseguem parar o reator? Estão aqui." (ZsR-2zkEwCM@26)
- "a temperatura que o óleo tá saindo daquele poço que a gente viu" (vOuuZJ5d4Ks@11)

## 5. Voz e persona

- **"A gente" como câmera coletiva (7/7):** o espectador está dentro da visita. "A gente conseguiu entrar, está aqui na turbina principal" (ZsR-2zkEwCM@12).
- **Espanto declarado (7/7):** "Caramba, olha só que doido." (ZsR-2zkEwCM@12); "Cara do céu, isso tem fácil uns 6 m" (vOuuZJ5d4Ks@10); "eu fiquei de queixo caído" (yIOe49fkMCY@01). O espanto marca para o espectador onde está o ponto importante.
- **Narrador falível (7/7):** admite erro, palpite errado ou que não sabe. "Isso aqui eu não sei." (Nm5J_9FYU4o@11); "o pessoal do barco tá falando que meu termômetro tá errado" (9r8qXlkFYaw@04); "Eu acho que eu perdi, né?" (alzphVrX3dU@04). A autoridade vem do teste, não da pose.
- **Humor bobo e curto, ≤ 10 s (6/7):** "perigo de trip… o perigo de alguém sair viajando aqui dentro" (ZsR-2zkEwCM@12); "vou fazer uma aliança usando o meu chip de memória" (Nm5J_9FYU4o@04). Nunca atrasa a explicação.
- **2ª pessoa no gancho e no fechamento:** "você" sobe no começo e no fim. O meio é "a gente".

## 6. Tempo narrativo

- **Contadores ordinais (7/7):** "primeira etapa… em seguida… última etapa". "O gás ainda precisa passar por três etapas. A primeira delas é a compressão" (vOuuZJ5d4Ks@05); "O primeiro passo vai ser passar uma película" (Nm5J_9FYU4o@01). "Última coisa" e "última surpresa" (9r8qXlkFYaw@09, alzphVrX3dU@10) avisam que o vídeo está acabando sem que o espectador saia.
- **Ordem do processo = ordem do roteiro (4/4 visitas):** nunca volta no fluxo, exceto para fazer o retorno a algo já mostrado.
- **Tempo do processo dito em número:** "isso tudo acontece [em] meio segundo… vinte e oito copos… por segundo" (aFb2Dx7OsHA@12); "o processo todo leva quatro ou cinco minutos" (Nm5J_9FYU4o@12).
- **Contagem regressiva no clímax (2/7):** "Um, dois, três e foi." (alzphVrX3dU@01 e em cada corrida); o desligamento em ZsR-2zkEwCM@26.
- **Cronologia histórica, só quando o tema pede (3/7):** Galileu → Bernoulli 1696 → Newton → Euler/Lagrange (alzphVrX3dU@05–11); 1984 e os mapas de 1500 (yIOe49fkMCY@00, @20); as datas das obras de Angra.

## 7. Fechamento

- **Fecha até 1 min depois do último ganho (7/7).** Não há recapitulação longa. Angra termina no próprio clímax: "eu não fiz o curso de dois anos e meio" (ZsR-2zkEwCM@27).
- **O ganho dito em 2ª pessoa e ligado ao cotidiano (4/7):**
  - "se você estiver assistindo esse vídeo num tablet, você sabe por tudo que ele passou" (Nm5J_9FYU4o@17)
  - "você vai saber exatamente para que que serve isso aqui" (yIOe49fkMCY@21)
  - Também a caça aos encontros das águas no Google Maps (9r8qXlkFYaw@10) e a lata que sai aberta da fábrica (aFb2Dx7OsHA@19).
- **Uma lição de uma linha (3/7):** "nem sempre compensa. Essa é a lição de hoje." (alzphVrX3dU@04); "Três palavras novas pra você colocar no seu vocabulário" (alzphVrX3dU@12).
- **Bônus depois do ganho principal (5/7):** a cicloide completa (alzphVrX3dU@12–14); a vida a bordo (vOuuZJ5d4Ks@14); os tipos de água (9r8qXlkFYaw@09); a lata personalizada (aFb2Dx7OsHA@18); o desligamento do reator (ZsR-2zkEwCM@25).
- **Chamada para outro vídeo (3/7):** "a gente fez uma experiência muito legal mostrando a distorção do espaço-tempo" (alzphVrX3dU@15). O pedido de joinha é curto e às vezes vem no meio, como piada (vOuuZJ5d4Ks@09, @13).

---

## 8. Cinco regras para copiar a tocada

1. **Missão em 5 s, paradoxo em 30 s.** Diga o que vamos ver ("Hoje vamos ver como X") e, em seguida, quebre a expectativa: "mas não é como você pensa", "fez isso sem…", "não se misturam". *Sustentação: missão ≤ 5 s em 5/7; paradoxo ou quebra de expectativa no 1º minuto em 7/7; mediana de ~25 s até a pergunta central.* Em reconstrução de acidente: "Hoje vamos reconstruir o voo X, segundo a segundo. Ele tinha três sistemas de segurança, e caiu mesmo assim."

2. **Mapa antes do território, depois seguir o fluxo.** Mostre o sistema inteiro num esquema de 1 a 2 min, ou o pré-requisito, e só depois percorra peça por peça, **na ordem do fluxo** (material, energia ou tempo), com ordinais ("primeiro… em seguida… por último"). *Sustentação: mapa antes do detalhe em 5/7; seguir o material em 4/4 visitas; ordinais em 7/7.* Em reconstrução, o fluxo é a cadeia de eventos. Não volte no tempo, só faça o retorno a algo já mostrado.

3. **Cada peça na microordem aponta → para que serve (o risco que evita) → número traduzido → analogia de casa.** "Isto aqui é X. Ele existe para não acontecer Y. Ele aguenta Z, que equivale a [coisa do cotidiano]. Funciona como [objeto doméstico]." *Sustentação: função como risco evitado em 6/7; número traduzido em 6/7; analogia em 7/7, ~1 a cada 1–2 min; dêitica "isso aqui" de 2 a 5 por minuto em 7/7.* Num explicador de acidente, o "risco que evita" já prepara a falha.

4. **Uma lacuna a cada 60–90 s, e a pergunta como dobradiça entre blocos.** Termine o bloco com a pergunta que o espectador faria ("Mas de onde vem a energia?"). Antecipe a inferência dele ("você deve ter imaginado que…") e corrija pelo menos dois mitos por vídeo ("muita gente acha X; não é"). *Sustentação: transição-pergunta em 6/7; antecipação em 7/7; mito corrigido em 7/7; ~0,6 lacuna real por minuto; viradas a cada 3–5 min.*

5. **Segunda volta no último terço e saída rápida.** Quando tudo parecer explicado, reabra: "Parece simples. Na prática é muito pior", "falta uma última surpresa", ou um teste que contradiz o esperado. Feche no máximo 1 min depois do último ganho, dizendo em 2ª pessoa o que o espectador agora sabe e onde vai reconhecer isso. *Sustentação: segunda volta em 7/7; bônus depois do ganho em 5/7; ganho ligado ao cotidiano em 4/7; nenhuma recapitulação longa.*

**Tom que acompanha as cinco regras:** narrar na 1ª do plural ("vamos ver", "a gente"), dizer o espanto e admitir o palpite errado (7/7), com humor de 1 linha. Num canal faceless, o narrador pode "achar" e "errar o palpite" sem ter rosto.

## 9. O que não copiar

- **Jornada e bastidor da visita** (viagem, quarentena, "o chefão me autorizou", "meu editor vai dar zoom"): vOuuZJ5d4Ks@00–02, Nm5J_9FYU4o@05, 9r8qXlkFYaw@02. Só funciona porque o acesso é o prêmio e o apresentador é conhecido.
- **Prova sensorial em 1ª pessoa** (a mão na água, o cheiro do petróleo, as bolinhas na mão). Sem corpo em cena, troque por um instrumento na imagem (termômetro, escala, contador) que mostre o mesmo dado.
- **Entrevista com o funcionário e diálogo com o colega** (a dupla Iberê–Pena, o gerente da plataforma). Depende de rosto e de química. Em faceless, use no máximo uma citação curta de fonte ou de relatório.
- **Os vídeos antigos do canal como pré-requisito** ("você já deve ter visto em outros vídeos do Manual do Mundo", ZsR-2zkEwCM@13; o submarino, a gaiola de Faraday). Exige acervo e fã. Quando tivermos acervo, vale como card, não como explicação.
- **Terminar no clímax sem fechamento** (Angra) e **joinha como piada no meio**. Funciona com público fiel; num canal novo, perde o pedido de inscrição e o encaminhamento.
- **Patrocínio costurado à história** (filme do Amyr, Petrobras como série). Só é tolerado com a marca do canal; em canal novo, corta a retenção.
- **A atribuição de marca no fecho** ("lembrar que foi no Manual do Mundo que você aprendeu", yIOe49fkMCY@21) e o bordão "Bora ver?". São marca registrada dele; crie a nossa.
- **Ritmo de improviso** (189 ppm, frase solta, repetição). Com voz de TTS, esse ritmo vira atropelo. Mantenha a estrutura e use frases mais curtas, com pausa.
