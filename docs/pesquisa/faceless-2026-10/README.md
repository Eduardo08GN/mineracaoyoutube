# Mineração de canais faceless recentes e virais — 22/10/2026

Pesquisa feita com a YouTube Data API v3 para responder: **quais canais faceless (sem rosto, animação/simulação/narração) nasceram
há pouco tempo e já viralizam, quais são os mais próximos do nosso formato (What If ES, simulação 3D em espanhol) e onde há
"abismo" — muita demanda em inglês e quase nenhuma oferta em espanhol.**

Arquivos desta pasta:
- [`RANKING_FACELESS.csv`](RANKING_FACELESS.csv): os 897 canais novos e faceless (formato, criação, inscritos, vídeos, views/dia,
  nichos, idioma, vídeo mais visto nos últimos 90 dias com link).
- [`radar_faceless.py`](radar_faceless.py): o script (roda no projeto, em `work/`, usando o motor `motor/youtube.py`).

---

## 1. Método

| Item | Valor |
|---|---|
| Fonte | YouTube Data API v3 (`search.list`, `videos.list`, `channels.list`) pelo motor do projeto: cota contada por chave, busca cacheada no dia |
| Buscas | 101 consultas em inglês, espanhol e português, em 24 nichos faceless (lista no script) |
| Janela | vídeos publicados nos **últimos 90 dias** (desde 24/07/2026), ordenados por views, 50 por consulta |
| Resultado bruto | **4.374 vídeos virais de 2.762 canais** |
| Filtro "recente" | canal criado nos **últimos 12 meses** (desde 22/10/2025) → 905 canais |
| Fora | conteúdo infantil (`madeForKids`) e canais com rosto/pessoa real conferidos nas miniaturas → **897** |
| Formato | "longo" = tem vídeo viral de 4 min ou mais (**246 canais**); "shorts" = só vídeos curtos (**651**) |
| Métrica principal | **views/dia** = views totais do canal ÷ dias de vida (média desde a criação, não a velocidade atual) |
| Cota gasta | ~10.100 unidades (busca custa 100; estatísticas 1 por lote de 50) |

Ressalvas:
- A conferência visual (miniaturas) foi feita nos ~70 canais do topo da 1ª rodada. Na 2ª rodada há canais que provavelmente
  **não são faceless** (ex.: entrevistas, imagens reais, vlogs) — descartar ao usar.
- A busca do YouTube não é exaustiva: é uma amostra dos mais vistos por consulta. Nichos sem consulta em espanhol não têm a
  oferta em espanhol medida (ver seção 4).

## 2. Os achados mais fortes (canais novos, vídeo longo)

| Formato | Canal (criado) | Tração |
|---|---|---|
| Stickman explicando história | [**Ink Explainer**](https://www.youtube.com/channel/UCpgrEMx8diLrw7YNQ6r3uUw) (abr/2026) | 15,4 M views num vídeo, só 18 vídeos |
| "Quanto tempo você duraria em cada era pré-histórica" | [**Fossil**](https://www.youtube.com/channel/UCOf0CzjuS5rjLju4muJi7Gg) (mar/2026) | 11,9 M views, só 14 vídeos |
| Reconstrução 3D de acidente real | [**Reconstructed**](https://www.youtube.com/channel/UCdZhRs4wM7SgVXoP9WSW2yA) (3/out/2026) | 3,3 M views em 19 dias de canal |
| "What if" 3D de catástrofe | [**Tracer Project**](https://www.youtube.com/channel/UC0Lr__HsSMj0_h0jNqKvKBA) (5/out/2026) | 3,3 M views com 2.370 inscritos |
| "What if" 3D | [**The Last Day**](https://www.youtube.com/channel/UCN6XxorahzAiDNyRnI1of2g) (jul/2026) | 1,75 M ("e se a Lua caísse na Terra") |
| Simulação de física / satisfatório | [**Satisfying 2D Sims**](https://www.youtube.com/channel/UC2KI15ET6DGIw01qpPzAyjg) (jul), [**Automa**](https://www.youtube.com/channel/UCUPGu1WpDCjJTdswDHGv3jw) (nov/2025) | ~290 mil e ~235 mil views/dia |
| Sobrevivência stickman "Dia 1 → Dia 30" | [**Nobody Gets In**](https://www.youtube.com/channel/UCZDmrAO-bnBxU4_LiH40CjA) (1/out/2026) | 1,4 M num vídeo |
| Documentário de natureza feito com IA | [**GaiaDocs**](https://www.youtube.com/channel/UCe9imMhDp6Kn3dn75mzUUZw), [**Nature's Tether**](https://www.youtube.com/channel/UCpw_I21AoF3N6Dqm3LLY9bw) | 2,4 M e 5,6 M |
| Histórias 2D de aldeia feitas com IA (hindi/urdu/bengali) | StoryNook, [Dharmik Film](https://www.youtube.com/channel/UCe5DOpVj69Xqh-gUAd6DxPg), [Gomu Toons](https://www.youtube.com/channel/UCDmdlBZwQ0ad8aqDYQBes0w), ToonZik… | 2–8 M por vídeo — o maior bloco em volume |
| Drama narrado (Reddit/novela) | [**DramaMuse**](https://www.youtube.com/channel/UCMJu0JryoBwrKqROnZ2BK1w) (ago/2026) | ~370 mil views/dia |
| Bíblia animada | [**Bible Battle Arena**](https://www.youtube.com/channel/UCuFT2hq7gbGtyDcmiXJoFOA) (ago), [**Sabiduría 2**](https://www.youtube.com/channel/UC0_IZXGSaQ4KJ3U-Caq7uKA) (espanhol) | 4,3 M e 1 M |

Shorts dominam os maiores números absolutos (ex.: [AuraShorts](https://www.youtube.com/channel/UCUnbOxUiYjzRQpwMV6SAZLg), ~13,9 M views/dia), quase todos com vídeo gerado por IA.

### Melhores por nicho (canais novos com vídeo longo; views/dia desde a criação)

| Nicho | Canais | Destaques |
|---|---|---|
| POV animado | 24 | [yuva explainop](https://www.youtube.com/channel/UC3E1Of0wmOBRjhWMyRmrNKQ) (1,1 M/dia), [ToonVersMagic](https://www.youtube.com/channel/UCD-jCubygJ6N4Wadmc-aeAQ), [Nobody Gets In](https://www.youtube.com/channel/UCZDmrAO-bnBxU4_LiH40CjA) |
| Compilação / satisfatório | 7 | [Infinite Movies YT](https://www.youtube.com/channel/UCiTQSHXweqBHy7bwh1oG0sA), [Automa](https://www.youtube.com/channel/UCUPGu1WpDCjJTdswDHGv3jw), [Miniature Dollverse](https://www.youtube.com/channel/UCd3pbZwxfCevQc51O1GAXug) (6,8 M num vídeo) |
| What if / simulação | 8 | [Satisfying 2D Sims](https://www.youtube.com/channel/UC2KI15ET6DGIw01qpPzAyjg), [Tracer Project](https://www.youtube.com/channel/UC0Lr__HsSMj0_h0jNqKvKBA), [The Last Day](https://www.youtube.com/channel/UCN6XxorahzAiDNyRnI1of2g) |
| Reddit / narração | 4 | [DramaMuse](https://www.youtube.com/channel/UCMJu0JryoBwrKqROnZ2BK1w), [Titan Entertainment](https://www.youtube.com/channel/UCdRPsZ7XmMy7BvIpASPE5Nw) (7,3 M), [Aveline Drama](https://www.youtube.com/channel/UCjT1Io9biZDYNeuX-guHRiw) |
| 2D / stickman | 13 | [HINDI Story bubbles](https://www.youtube.com/channel/UC5Pd_6Ovyz68-PrAAe9UwyQ), [Gomu Toons](https://www.youtube.com/channel/UCDmdlBZwQ0ad8aqDYQBes0w), [ToonZik Bangla](https://www.youtube.com/channel/UCnRH4PColWCHJA7i_oEpAFg) |
| Histórias com IA | 15 | [StoryNook cartoon](https://www.youtube.com/channel/UC6aGDzd5ph2eYEroEJ2TO7A), [Hungry Tales](https://www.youtube.com/channel/UCLdTmTG2FgSRzoLMWaRDbHQ), [Dharmik Film](https://www.youtube.com/channel/UCe5DOpVj69Xqh-gUAd6DxPg) (8,3 M) |
| Ciência e espaço | 14 | [Reconstructed](https://www.youtube.com/channel/UCdZhRs4wM7SgVXoP9WSW2yA), [Miralex](https://www.youtube.com/channel/UCww4N8x1zKCAj_ChXaldaTA) (pt), [Mr. Earth](https://www.youtube.com/channel/UCDm69yrM5Ma9_NXLw1_yoFQ) |
| História animada | 19 | [Ambrose Discovery](https://www.youtube.com/channel/UCAVxoa11gRHcit9_onvTkMQ), [Ink Explainer](https://www.youtube.com/channel/UCpgrEMx8diLrw7YNQ6r3uUw), [AniHis Hindi](https://www.youtube.com/channel/UCvxKQMAJiWb3YUIKMVf44kQ) |
| Crime real | 20 | [Red File](https://www.youtube.com/channel/UCNpjH9MosivtBOa45Hbu39g) (15,5 M), [Discovery Investigación](https://www.youtube.com/channel/UCdZ6YGjlUuNPTBJqKgvbaqA) (es), [Testimonios](https://www.youtube.com/channel/UC4OtMvUugZmqI4LxIwZTHfA) (es) |
| Doc cinematográfico com IA | 17 | [VMR786](https://www.youtube.com/channel/UC8x_RtU11tdCxtC-588H8LA), [GaiaDocs](https://www.youtube.com/channel/UCe9imMhDp6Kn3dn75mzUUZw), [Jayansh Insight](https://www.youtube.com/channel/UCqXVm5DgKJ56G69e-YwEx2g) |
| Natureza / animais | 7 | [Steel Pulse Films](https://www.youtube.com/channel/UC8RoaTWP4J8H1_NDRjeOd9g), [Nature's Tether](https://www.youtube.com/channel/UCpw_I21AoF3N6Dqm3LLY9bw), [Animal Nature Matrix](https://www.youtube.com/channel/UCCTbP1lddK5jaesyEvTRbRQ) |
| Mapas e dados | 7 | [Geo Map Animations](https://www.youtube.com/channel/UCz6KO_6H1WU2GGB9JX39QGw), [Data Penguin](https://www.youtube.com/channel/UCv09moG9-_c1DafpwBHLV3Q), [ADM Football](https://www.youtube.com/channel/UC7CoZCFpZLUKyaAIkBf5_FA) |
| Finanças / negócios | 18 | [The Story Cafe](https://www.youtube.com/channel/UC1OQ3JjZU7vkzBmHw2dLF5A), [Ani Explainer Hindi](https://www.youtube.com/channel/UCFGjZVRPYVGfJzdOSrUzrdQ), [Money Bureau](https://www.youtube.com/channel/UCKVtBpONPhVWez_0X-yVCOw) |
| Bíblia / religião | 12 | [Sabiduría 2](https://www.youtube.com/channel/UC0_IZXGSaQ4KJ3U-Caq7uKA) (es), [Bible Battle Arena](https://www.youtube.com/channel/UCuFT2hq7gbGtyDcmiXJoFOA), [Biblia al Detalle](https://www.youtube.com/channel/UC6FKrzOiMJfAaWIOI6PfsSw) (es) |
| Sono / relaxamento | 21 | [Murph](https://www.youtube.com/channel/UCdPsd7GBKrHAYn0p-ojZ8Mw), [The Unseen Earth](https://www.youtube.com/channel/UC3BTP2FmssM9YAt2QIe6u4A), [Sleep On Physics](https://www.youtube.com/channel/UCuKoEFuLJL1Q8HUqXC70RjQ) |
| Mistério | 13 | [Chilling Scares Compilations](https://www.youtube.com/channel/UCgT7YSxevs9LFP9YkpUiZjQ), [FreeStream Movies](https://www.youtube.com/channel/UCV8sMLn3QmOhc3Y1PACHIoA) |
| Comparação de escala | 7 | [Underwater Earth 4K](https://www.youtube.com/channel/UCiK9ODIN1_AEte6eV7m7jZA), [PawFlow](https://www.youtube.com/channel/UCzPrKzDmLXrjznx5Nu_xT5Q), [BeyondTheGreen](https://www.youtube.com/channel/UCKjRbFbTtetc-bQ5sztC4aA) |
| Terror animado | 8 | [Kalbela Animation](https://www.youtube.com/channel/UC_tJHstGmcTOFetctjygmHQ), [Kesari Hindi Tales](https://www.youtube.com/channel/UCu-HUbxLoAgjlMWab1gmhuQ) |
| Motivação / filosofia | 7 | [El Café Estoico](https://www.youtube.com/channel/UC2v6b0LIbK3ZimTLraZcYLw) (es), [El Dragón Estoico](https://www.youtube.com/channel/UCFenPxdAZK4xiPaua1BLqVA) (es), [Stoic Quiet](https://www.youtube.com/channel/UCwAHJVo8UiYz1zXM4qABAqg) |

## 3. Os mais próximos do nosso formato (3D / what if / escala / espaço)

| Canal | Por que |
|---|---|
| [**Tracer Project**](https://www.youtube.com/channel/UC0Lr__HsSMj0_h0jNqKvKBA) (5/out/2026) | O mais parecido e o mais novo: "What if Apophis hit Earth?" em 3D, 3,3 M views, 2.370 inscritos |
| [**The Last Day**](https://www.youtube.com/channel/UCN6XxorahzAiDNyRnI1of2g) (jul/2026) | "E se a Lua caísse na Terra?", 1,75 M — catástrofe "what if" em 3D |
| [**Universe Dimensions**](https://www.youtube.com/channel/UC5kNK793CSXYHEpG-BAqWfQ) (2024) | "TON 618 a diferentes distâncias", 8 M — escala cósmica em 3D |
| [**[Astrum](https://www.youtube.com/channel/UC-9b7aDP6ZN0coj9-xFnrtw) Earth**](https://www.youtube.com/channel/UCWBtLCE-BnzZx3DneqDiXWQ), [**Mr. Earth**](https://www.youtube.com/channel/UCDm69yrM5Ma9_NXLw1_yoFQ) | "E se os humanos sumissem", "Um buraco negro engoliria o universo?" |
| [**ABISMO**](https://www.youtube.com/channel/UC5q902RpdLkzhzmm8kGvQXg) (abr/2026, **espanhol**) | "¿Cuánto se tarda en cruzar UN AÑO LUZ?" — 2,6 M num vídeo, 4,6 M em 90 dias, 46 mil inscritos. O concorrente direto mais próximo **em espanhol** e o único desse tipo encontrado |
| [**Minute Zero**](https://www.youtube.com/channel/UC6AYjWAC_CPRepkeDrFPeFA), [**What If Sim**](https://www.youtube.com/@WhatIfSim3D) | As referências que modelamos |

## 4. Onde há abismo (demanda em inglês × oferta em espanhol)

Views dos vídeos longos virais dos últimos 90 dias, **só nos nichos em que também houve busca em espanhol**:

| Nicho | Inglês | Espanhol | Diferença |
|---|---|---|---|
| **POV animado** | 172 M | 0,3 M | **~560×** |
| **2D / stickman** | 131 M | 1,3 M | **~100×** |
| **What if / simulação 3D** | 165 M | 3,2 M | **~50×** |
| **Documentário cinematográfico com IA** | 277 M | 5,6 M | **~50×** |
| **Natureza / animais com IA** | 125 M | 4,9 M | **~25×** |
| História animada | 145 M | 12 M | 12× |
| Crime real | 245 M | 25 M | 10× |
| Mistério | 83 M | 20 M | 4× |
| Ciência e espaço | 102 M | 37 M | 2,7× |
| Bíblia / religião | 56 M | 22 M | 2,5× |
| Terror animado | 25 M | 10 M | 2,5× |
| Motivação / filosofia | 8,5 M | 5,6 M | 1,5× |

Nichos **sem busca em espanhol** nesta rodada (oferta em espanhol não medida): top 10 / listas (379 M em inglês), Reddit /
narração (99 M), comparação de escala (85 M), sono (56 M), mapas (50 M), satisfatório (49 M), guerra (41 M), games animados (33 M),
finanças (17 M). Medir custa ~1.000 unidades.

**Leitura:** o abismo está nos formatos **3D e animados** — POV de sobrevivência, "what if"/simulação, stickman explicativo.
Em espanhol quase ninguém faz, e os poucos que fazem (ABISMO) crescem rápido. Crime, mistério, Bíblia e espaço "falado" já têm
concorrência em espanhol.

## 5. Recomendação para o What If ES

Tudo dentro da stack que já temos (Remotion + three.js + G4):
1. **"What if" 3D** — o núcleo do canal.
2. **"¿Cuánto durarías en…?"** — POV de sobrevivência em 3D por era/lugar (Fossil: 11,9 M com 14 vídeos).
3. **Reconstrução 3D de eventos reais** (Reconstructed: 3,3 M em 19 dias).
4. **Simulações satisfatórias / "Día 1 → Día 30"** como vídeos de apoio e cortes para Shorts/Reels.

## 6. Como repetir

```
cd C:\Users\edlut\mineracaoyoutube
python work\radar_faceless.py
```
As chaves ficam no `.env` (`YOUTUBE_API_KEYS=a,b,c`, fora do Git). Datas da janela (`DESDE`, `CANAL_DESDE`, `HOJE`) e a lista de
consultas (`CONSULTAS`: consulta, idioma, região, nicho) ficam no topo do script. Saída em `D:\whatif_es\pesquisa_faceless\`
(`bruto.json`, `ranking_canais_novos.csv`). As buscas do mesmo dia vêm do cache (custo zero).
