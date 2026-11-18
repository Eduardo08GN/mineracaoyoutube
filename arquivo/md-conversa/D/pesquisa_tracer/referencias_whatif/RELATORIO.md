# Engenharia reversa: What If + simulação e Reconstructed (01/11/2026)

**Pedido:** do Eduardo, via a sessão de suporte.

**Canais:** Tracer Project, Hindcast, Every Strike, Doomsday Math e Reconstructed (atualização da análise de 29/10).

**Método:**
- inventário completo pela API (`uploads.json`, `uploads.py`);
- legendas de 6 vídeos por canal (hits e fracassos);
- leitura a 20 fps de 3–4 vídeos por canal (`ler20.py`, mais `cortes2.py` no Doomsday, onde a animação contínua engana o detector);
- folhas de contato e miniaturas.

Detalhe por canal em `<canal>/CANAL.md`; medidas em `medidas.json` (por canal) e `<canal>/medidas.json`. Transcrições e vídeos ficam só na máquina.

**Limites:**
- sem Studio (CTR, retenção, fonte de tráfego), então toda explicação de hit × fracasso é **hipótese**;
- a classificação visual é por amostragem manual (±5–6 pontos);
- vídeos com 1 dia de idade não contam como fracasso.

---

## 1. Números

| Canal | Criado | Inscr. | Longos | Mediana longos | Concentração | Insc./view |
|---|---|---:|---:|---:|---|---:|
| Tracer Project | 05/10 | 3,3 mil | 32 | 648 | Apophis = **98,3%** das views (5,38 mi); Cascadia 68 mil; o resto ≤ 7,2 mil | 0,06% |
| Hindcast | 21/10 | 2,9 mil | 2 | 862 mil | nuke Ucrânia 1,56 mi; Irã 160 mil | — |
| Every Strike | 23/08 (1º vídeo 26/10) | 1,4 mil | 4 | 51 mil | Irã 146 mil; MOAB 3 mil | — |
| Doomsday Math | 10/10 | 971 | 9 (+30 shorts) | 2,8 mil | Cascadia 200 mil, asteroide dinos 165 mil, Apophis 58 mil; os outros 6 entre 89 e 6,7 mil | 0,23% |
| Reconstructed | 03/10 | 21,5 mil | 15 | 82 mil | flydubai 3,28 mi, Six Flags 1,08 mi; 6 de 6 hits = máquina de marca pública + gente dentro + salvaguarda que falhou | — |

**Os shorts falham em todos os canais:**
- Doomsday: os 30 shorts ficam todos abaixo de 2 mil;
- Reconstructed: abaixo de 8 mil;
- Tracer e Every Strike: abaixo de 2 mil.

## 2. O achado central: tema e título decidem; a produção é constante

- **Doomsday Math é um experimento limpo.** Os 9 longos têm o mesmo molde (HUD, voz, miniatura, 6–10 min, CTA). Mesmo assim, as views por dia vão de 89 a 27 mil, uma diferença de 300×.
- **Every Strike repete o padrão:** mesmo título e mesmo molde, com 146 mil num vídeo e 3 mil no outro.
- **O que separa os hits (hipótese, consistente nos 4 canais):**
  1. **Ameaça real nomeada, com lugar e momento.**
     - Hits: "Cascadia… Hit Tonight", "Dinosaur-Killer Asteroid Hit Today", "Apophis" (data real 13/04/2029), "Russia… Nuke".
     - Fracassos: temas abstratos (Terra parada, buraco negro, gelo derretido) ou genéricos ("a tsunami hit the West Coast").
  2. **Medo pessoal e escala humana.** A pergunta é "e se eu estiver lá?". O número da miniatura é humano ("31 MINUTES", "TOKYO 41.7 MILLION", "12 MINUTES TO EXTINCTION"), não da máquina ("1,000 SIMULATIONS").
  3. **Promessa entregue cedo.** Nos fracassos do Tracer, o mapa prometido só chega aos 7:29 (nuclear) ou aos 14:03 (Doomsday Glacier), e o tsunami gasta 24% do tempo em Sumatra 2004 antes da costa oeste (8:28).
  4. **Tema já saturado não decola.** O Yellowstone do Doomsday tinha tudo e fez 2,8 mil.
- **A carona no viral é real.** No Tracer, as views por dia caem com a distância do Apophis: 6.850, 1.206, 385, 252, 95. O Cascadia saiu 6 dias depois. Isso é correlação.
- **Publicar demais divide a distribuição.**
  - A semana de 5 longos do Reconstructed (19–25/10) concentrou 4 dos 5 fracassos dele.
  - O fracasso do Every Strike saiu 1 dia depois do hit dele.
  - Hipótese.

## 3. Roteiro (molde comum)

| Elemento | Medido |
|---|---|
| Gancho, 10–30 s | Hora exata e lugar, ou um número-âncora de tempo ("12 minutes", "31 minutes") repetido até o fecho. Abertura pelo fim (flash-forward) no hit de 1,56 mi |
| Declaração | Aos ~30 s, "simulação, números reais" (Hindcast, Every Strike, Doomsday) |
| Espinha | Relógio T+ / "SIMULATION TIME T+" no HUD. No Hindcast ele entra depois de 3:30–5:30 de contexto. No Doomsday, o cenário-herói tem 76–192 s de T+ |
| Atos (Doomsday) | Gancho → objeto → a conta → cenário-herói T+ → agregado das N corridas (~70 s; as 10.000 simulações são reais, mas ocupam só 11–12%) → consequência em pessoas → "Could it happen?" → CTA |
| Números | 4,2–9,6 por minuto na fala. Os hits do Doomsday ficam em 8,1–9,2; o Reconstructed novo em 7,8–8,3. Fonte curta na fala, autor-ano em rodapé na tela, 5–9 fontes na descrição |
| Ritmo da fala | 121–175 wpm (Tracer 121–133, Doomsday 134–151, Reconstructed 131–146, Every Strike 166–175) |
| Fecho | "the honest part" (Tracer), "nada disso aconteceu" + fatos reais + 3–4 "portas que impedem" (Hindcast/Every Strike), anel sem CTA de inscrição (Reconstructed) |
| Voz | TTS masculina grave (F0 ~120–165 Hz). O roteiro tem cadência de LLM |

## 4. Visual e ritmo

| Canal | Cortes/min · plano | Mapa/globo | 3D | UI/texto | Foto real | Rosto | Câmera |
|---|---|---:|---:|---:|---:|---:|---|
| Doomsday | 1 corte a cada 9–14 s | 39–71% | 3–37% | 25–34% | 0 | 0 | parada em 54–66% dos segundos |
| Hindcast/Every Strike | 4,5–5,2 telas/min | dominante | baixo (Hindcast tem 3D autoral) | alto | Hindcast 0%, Every Strike ~38% | 0 | motion graphics; fracasso com 80% de quadros parados |
| Tracer | voo contínuo (poucos cortes duros) | dominante | médio | HUD | 16–36% (era 4% no Apophis), com selo de fonte | 0 | em movimento |
| Reconstructed | 9,6–12,3 cortes/min · mediana 4,45–4,9 s | ≤ 35% | **63–65%** (Binance 47%) | cartões novos | aumentou (Air India mostra sobrevivente) | 0 | em movimento |
| **Nós (Angrois)** | **15,4/min · 3,9 s** | 8% | **69%** | 23% | 0 | 0 | sempre em movimento |

- **Nenhum deles tem 3D de acabamento comparável ao nosso,** fora o Reconstructed.
- **Paleta:** escura (azul-marinho/preto) com laranja/vermelho de perigo e HUD em fonte mono.
- **Miniaturas dos hits:** 2–3 palavras gigantes + 1 número humano + 1 elemento, legíveis a 120 px. A ilustração lotada sem texto fracassou.

## 5. Produção (dedução)

- **Pilha:** todos parecem código.
  - Remotion/React com three.js e SVG, sem Google Earth Studio nem Cesium. Bugs de layout de código aparecem no Every Strike.
  - No Doomsday, Python simula de verdade (REBOUND, Okada, águas rasas, GHS-POP, AWS Terrain).
  - Dados abertos (NASA Blue Marble, OSM, AWS Terrain).
- **Ritmo e equipe:** ~1 dia por vídeo, provavelmente 1 pessoa com agentes de IA.
  - Every Strike: 4 longos em 5 dias.
  - Tracer: 3 longos em 2 dias.
  - Reconstructed: ~3,5 longos e 2,8 shorts por semana, notícia em < 15 h (Spain).
- **Reaproveitamento:** blocos de roteiro, cartões ("THE MATH", régua de Hiroshima, painel de portas) e banco de fatos. Hindcast e Every Strike usam até a mesma hora "3:47".
- **A nossa pilha é a mesma família** (Remotion + three.js + TTS + agentes), com 1–2 h por vídeo.

## 6. O Reconstructed no nosso caso (Spain, 28/10)

- O LZB aparece em 1 frase e 1 cartão. O ASFA não é nomeado nenhuma vez.
- A conta não fecha: 25 km em 16 min dá ≈ 94 km/h, mas o cartão diz "≈200 km/h".
- A fonte é quase só "o ministro diz", sem Adif, Renfe ou CIAF.
- A dublagem automática em ES tem a legenda 16% menor e lê "L-Z-B" letra por letra.
- **Para nós:** precisão, fontes locais e ES nativo são o diferencial que dá para medir.

## 7. O que levar para o Segundo a Segundo

**Copiar:**
- título com ameaça ou evento nomeado + lugar + momento;
- gancho com hora/lugar e um número-âncora de tempo repetido;
- relógio T+ no HUD;
- declarar "simulación con datos reales" aos 30 s (no hipotético);
- entregar a promessa grande até ~3 min;
- ~8 números/min com fonte curta, e fontes completas na descrição;
- fecho honesto ("nada de esto ha pasado… todavía") com 3 portas de prevenção e uma pergunta;
- miniatura de 2–3 palavras + 1 número humano.

**Evitar:**
- tema abstrato, título genérico, promessa atrasada;
- tema saturado (Yellowstone; Chernóbil em ES);
- shorts como alavanca;
- publicar demais na mesma semana;
- dizer "10.000 simulações" sem rodar.

**Onde somos melhores:**
- 3D de acabamento com câmera sempre em movimento (eles ficam parados em mapa/UI 54–66% do tempo);
- ES nativo com fonte local (contra a dublagem);
- física implícita.

**Onde somos piores:**
- n = 1, sem série nem cadência;
- publicação manual;
- kit faltando para sismo, água e colapso.
