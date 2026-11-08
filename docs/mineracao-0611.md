# Mineração de 06/11/2026: Toonverso, notícia quente, nicho inusitado e o take Chernobyl

Registro de longo prazo do dia, feito a pedido do Eduardo. Os dados brutos ficam fora do repositório, em `D:/pesquisa_nichos/` (`toonverso_0611/`, `inusitado_0611/`, `radar_quente/`, `leitura_tesseract_chernobyl/`).

## 1. Nicho "caso real de sobrevivência animado" (semente: @Toonverso33, PT): REPROVADO
- **Leitura óptica** (3 longos e 3 reels): o Toonverso não usa imagem de IA no vídeo. As cenas são 3D low-poly por código (three.js do Claude); só as miniaturas são IA.
- **Espinha que vale aprender, sem copiar a execução:**
  - abrir no pior momento com um número;
  - flashback;
  - "guarde essa informação";
  - ciência para leigo;
  - contadores na tela;
  - final que lista as decisões que salvaram.
- **Medidas do Toonverso:** ~140 palavras/min, 7–8 cortes/min.
- **API EN×ES:** o EN está na 2ª onda, com um enxame de canais. O melhor entrante de 2026 (Atlas One) tem mediana de 29 mil. O ES está em enxurrada: mais de 30 clones com mediana de 100 a 3 mil, e a Tromelin tem 11 versões em espanhol em 45 dias. Medianas dos canais dedicados: EN 8,3 mil × ES 958. **Nenhuma história passou no portão.**
- **Lacunas que sobraram, só para teste:** Erasto Valdez (cenote, México, ago/2026; em espanhol só há a dublagem), Chris Lemons e Pisces III.

## 2. Notícia quente × caso real
- **Desastre quente contado pela pessoa ou pela polêmica estoura em ES.** No Learjet de 01/11:
  - NOTICIAS ILUSTRADAS: 925 mil;
  - TuBarco: 521 mil;
  - ARCHIVO CERO (canal de 6 dias): 204 mil com "Culparon a la PILOTO de 20 años… | La verdad del accidente de Florida".
- **Nosso canal confirma que só o quente entrega.**
  - Página FB: Learjet com 625 mil, 398 mil e 246 mil (um post por ângulo ou atualização); evergreen com 2 a 3 mil.
  - YouTube: Urda com 111 mil; o resto abaixo de 800.
- **Resgate sem audiência no YouTube:** Kiribati, 5 náufragos em 3 meses, ES ≤ 651.
- **Ferramenta nova:** `ferramentas/radar_noticias/` (ver `docs/radar-noticias-quentes.md`). Ela tem a detecção por Trends (Pesquisa do YouTube) por país, a calibração contra Urda e Learjet e a oferta pela API.

## 3. Nicho inusitado (viral recente nos EUA com lacuna em ES): parcial
- **Varredura neutra dia a dia nos EUA**, de 02/10 a 05/11: 498 buscas, 21 mil vídeos e 14 mil canais. Mais o mostPopular de 16 categorias e o Trends EUA.
- **Reprovados:** o ES copiou os moldes longos de outubro em 2 a 6 semanas.

  | Molde | Canais novos em 45 dias, EN | ES |
  |---|---|---|
  | "Every X Type Explained" | 13 | 13 |
  | "If X produces more than Y, why don't we eat it?" | 63 | 16 |
  | "How [profissão extrema] eat/sleep" | 70 | 16 |
  | "Why did humans start X?" | 32 | 44 |

- **Abertos em EN, 1ª onda (falta medir o ES e a dublagem):**
  - **S1, Shorts 3D em corte "How a [objeto banal] Becomes [feito épico]":** You Made It (03/2026, mediana de 3,0 mi; "Crate Becomes a Plane" 11 mi) e "Ditch Becomes a Trench" (21 mi).
  - **S2, Shorts 3D "Why [objeto antigo] Used to [esquisitice]":** Trial & Eureka (criado em 04/10/2026, mediana de 912 mil; "Vending Machines Used to Take Washers" 14 mi) e Ricks Clips (mediana de 2,75 mi).
- **Leitura:** a janela só fica aberta no formato caro (3D em corte), que os clones baratos não copiam. É o nosso forte.

## 4. O take Chernobyl (Opus 5.5 + Tesseract): o novo padrão de acabamento
- Leitura a 24 fps, quadro a quadro: `D:/pesquisa_nichos/leitura_tesseract_chernobyl/ANALISE.md`.
- **Números:** movimento 4,85 contra 1,64 do K18; quadros parados 1% contra 17% num trecho do K18; nenhum corte seco; 5 transições motivadas pela história (fumaça da explosão, fogo → ponto no mapa, nuvem radioativa, tilt casando molduras).
- **O que dá a qualidade:**
  1. foto de base fotorrealista;
  2. câmera contínua 2,5D (~2,4% de zoom/s);
  3. transição pelo elemento da história, não corte;
  4. grão, partículas, vinheta e cor (mais de 50% da mudança por quadro é detalhe fino);
  5. texto com profundidade, que a fumaça apaga, e número grande contando.
- **Tesseract** (Mirage): suíte local grátis para agentes (skills editor/motion/3d com path tracer). Comercial liberado abaixo de US$ 1 mi/ano de faturamento. Candidato a batedor contra a nossa stack.
- **Como fazemos:** imagem de base gerada na G4 (Qwen-Image ou FLUX, 8 versões por batida, upscale) + Depth Anything (parallax) + Wan 2.2 nas batidas de ação + camada fixa de acabamento no Remotion.

## 5. Decisões do Eduardo neste dia
- **Narração = Qwen3-TTS na G4** (Apache 2.0): voz fixa por canal, 3–4 tomadas por frase, QA com Whisper + UTMOS. Substitui o AI Studio. Voxtral TTS e Fish Speech estão vetados por licença não comercial.
- **Filtro de tema da mineração:** fora política, violência e guerra. Guerra só no molde instrucional e documental do Kriegsmomente.
- **Terreno 3D cru no K18** (não retroagir): todo vídeo com mundo 3D tem frente de acabamento (Fab/Megascans, GitHub three.js, G4). Ver `docs/BADPATHS.md` #1.
- **Distribuição de takes do Kriegsmomente a partir do K19:**

  | Tipo de take | Fatia | Batidas |
  |---|---|---|
  | Cinematográfico (molde Chernobyl, em colódio úmido ou pintura de época no tom creme) | ~30% | ~48 |
  | Mapa (com acabamento novo) | ~20% | ~32 |
  | 3D explicativo e eureka | ~22% | ~35 |
  | Esquema a tinta | ~13% | ~20 |
  | Época 2,5D com obra real | ~10% | ~16 |
  | Cartão | ≤ 5% | — |

  Camada fixa em tudo: câmera nunca parada mais de 4 s, transição motivada (fumaça de pólvora), grão, poeira e grade creme, texto com profundidade.
