# Radar What If EN × ES pela API (05/11/2026)

**Coleta:**
- 239 buscas: 48 termos EN e 36 ES, por views em 120 dias e de todos os tempos, mais ordem por data em ES e regiões MX/ES/AR/CO/US.
- Mais 10 termos genéricos (frente sem tema).
- Resultado: 7.828 vídeos e 4.734 canais.
- Os scripts e dados ficam em `D:/tmp/radar_whatif/`: `coleta.py`, `analise.py`, `canais_fundo.py`, `dub.py` e `RELATORIO_bruto.txt`.

**Limites da coleta:**
- a busca da API devolve no máximo ~50 por termo;
- a classificação por tema é por regex no título (tem ruído);
- o Início do YouTube não foi lido: o Chrome pessoal do Eduardo só com o pedido dele.

## 1. O que viralizou em EN (120 dias, formato longo)

O formato longo What If **explodiu em outubro**: 151 vídeos coletados com mais de 20 mil views, contra 54 em setembro. Ele tem três subformatos.

| Subformato | Exemplos (views/dia) | Quem faz |
|---|---|---|
| **A. Escalonado "…and Couldn't Stop"** (o mundo ou você mudando sem parar) | Time Sped Up 91 mil/d (Minute Zero, 22 mil insc), Immortal Snail 122 mil/d (Hour Seven, 7,5 mil), Kept Getting Nicer 100 mil/d (All Answers, 8 mil), Earth Spun Faster 80 mil/d (What If Sim, 5,1 mil), Every Step Twice as Big 2,4 mi de views (AFTER THE DOOR, 4,4 mil), Population Kept Growing 617 mil (Δ Delta, 3 mil), Sun Moved Closer 511 mil (What If Lab, **1,3 mil insc**), Colder 441 mil (Venuedepth, 3,3 mil), Sea Kept Rising Until One Country Left 233 mil (Map Tally, **656 insc**) | Dezenas de canais minúsculos. O top 10 de todos os tempos tem mediana de **10,5 mi** |
| **B. "What If You Could…"** (superpoder pessoal) | See Everyone's IQ 196 mil/d (ConChaser, **20 dias de canal**), Reaction Time 10x 159 mil/d (Ifverse), Saved Your School 234 mil/d (Jeremy Bearimy, 26 dias) | narrativa 2D/IA |
| **C. "We Simulated / Mapped"** (desastre ou guerra com dado real) | Apophis 266 mil/d (Tracer), Russia Nuke 115 mil/d (Hindcast, 15 dias), Steel Dossier (6 dias, 1,8 mi) | Metade é geopolítica (Irã/Rússia), **fora da nossa pauta** |

## 2. Espanhol: demanda, oferta e estágio da corrida

| Subformato | Oferta ES hoje | Estágio da corrida em ES | Dublagem EN → ES |
|---|---|---|---|
| **A. Escalonado** | **Quase zero.** 17 vídeos longos em toda a coleta. Os recentes têm 0–63 mil views (o melhor é "tu dinero creciera x10 cada día", Noah_Ketalsi). Os primeiros 5–6 canais minúsculos (Inercia, Qué Passaria Si, EL BRYAN, Datazo, Dr. Teo Quasar) **começaram nesta semana**, com 0–11 views | **Linha de largada** | **Não dublado:** What If Sim, Minute Zero ×2, AFTER THE DOOR, Hour Seven e All Answers só têm áudio EN |
| B. Superpoder pessoal | Corrida em andamento. Giro Imposible (24 dias, **mediana 154 mil**), Primer Nivel (1 vídeo, **1,25 mi** em 3 dias), Noah_Ketalsi, Versión Extrema, Stupid Balloon, Whatiffy: 6 clones em ~3 semanas | Meio da corrida; satura em ~6 semanas (padrão medido em 30/10) | Ifverse e Iflord **já dublam em ES** |
| C. Simulado com dado real | MAGNITUD (27 dias, mediana 4 mil, hit de 508 mil "Sol desapareciera"), chilenómetro (nível do mar com relevo real, 219 mil), Estación Cosmos, Amberfield (cópia do Apophis, 183 mil). **Ninguém consolidou** | Começo da corrida, sem dono | Tracer e Hindcast: só EN |
| Shorts ES | Saturado: Mateo Ferruz (2,1 mi insc), 100+ canais por tema | Tarde | — |

**Prova de demanda ES para longos:**
- "¿Qué pasaría si nunca dejaras de crecer?" (XpressTV): 1,9 mi;
- "placas tectónicas dejaran de moverse para siempre": 1,16 mi;
- Popocatépetl (Xataka México): 265 mil em 13 dias;
- nível do mar no Cone Sul (chilenómetro): 219 mil;
- os superpoderes de outubro: 1,25 mi e mediana de 154 mil.

## 3. Vetor recomendado para o ES

**Vetor principal: o escalonado "¿Qué pasaría si [X] y no pudiera parar?" em simulação 3D, com lugares hispânicos.**

Por quê:
- em EN, é o formato de maior teto (mediana do top 10: 10,5 mi) e faz canal de mil inscritos chegar a 300 mil–2 mi;
- em ES, a oferta é nula e os originais não são dublados;
- a corrida ES começa agora: os primeiros entrantes apareceram entre 02 e 05/11;
- é exatamente o que o pipeline Fab + simulação + G4 faz melhor (batedor 07);
- já temos 6 vídeos ES desse molde produzidos em outubro (`D:/whatif_es/*/entrega`).

**Ordem de variáveis** (prova EN × adaptação hispânica × força do 3D, sem política):
1. **El mar sube hasta que solo queda un país de Latinoamérica.** É a Map Tally (656 insc, 233 mil) com rivalidade entre países, o gancho mais forte de comentário em ES. O chilenómetro provou a demanda ES do nível do mar.
2. **El tiempo se acelera y no puede parar.** Minute Zero fez 2,1 mi. Já temos o vídeo 05 em ES.
3. **La Tierra gira más rápido.** What If Sim fez 1,57 mi. Temos o vídeo 01 e o batedor 07 no pipeline novo.
4. **Cada paso te hace el doble de grande.** AFTER THE DOOR fez 2,4 mi com 4,4 mil inscritos.
5. **El Sol se acerca y no puede parar.** What If Lab fez 511 mil com 1,3 mil inscritos.
6. **El frío (o el calor) no para:** da Patagônia ao Caribe. Venuedepth fez 441 mil e Polyverse 425 mil.
7. **La población crece sin parar.** Δ Delta fez 617 mil.

**Vetor secundário:** desastre natural simulado com dado real, voltado ao mundo hispânico (Popocatépetl, supervulcão, megaterremoto no Chile, tsunami no Pacífico). A demanda existe e ninguém consolidou. Nada de guerra nuclear entre países (política).

**Não priorizar:**
- **superpoder pessoal:** a corrida já vai no meio, com dublagem EN → ES, e não usa a nossa força 3D;
- **Shorts ES:** saturados. Servem só como cortes do longo.

**Título:** espelhar 1:1 o viral EN ("¿Qué pasaría si el tiempo se acelerara y no pudiera parar?"), com o lugar hispânico na miniatura.
**Janela:** o padrão medido é o ES copiar o EN em ~1 mês. O EN estourou entre 10 e 25/10, então a janela ES é **novembro**.
