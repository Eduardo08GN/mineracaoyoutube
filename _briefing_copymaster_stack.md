# Briefing: stack, batedor, Remotion e mineração de nichos (para o repo copymaster)

Escrito em 28/10/2026 pela sessão de produção de vídeo (Tracer3D/Eddie3D/Minerador), a pedido do Eduardo, para a base de conhecimento do copymaster.
Não contém segredos: chaves ficam só em `.env` (gitignored). Os caminhos locais são indicativos.

---

## 1. Visão geral: os pipelines que existem

| Pipeline | O que produz | Onde mora | Status |
|---|---|---|---|
| **Minerador** (`motor/` + `painel/`) | Acha nichos virais no YouTube e gera ângulos e títulos de remake com persona | este repo, raiz | produto com painel (WebView2 + FastAPI + React) |
| **Tracer3D 2.0** | Explicadores narrados de história militar com simulação 3D, mapas e pinturas de época (canal alemão Kriegsmomente) | `D:\tracer3d2` (código público em `tracer3d2/` no repo) | 7 vídeos entregues; o vídeo 6 viralizou |
| **Eddie3D** | "What If" em espanhol com mundo 3D | `eddie3d/` | vídeos entregues |
| **Headcast / avatar** | Talking-head com avatar (Google Vids Omni) mais B-roll, para canais de persona e VSL | `work/video/` | testado, em uso para VSL |

O ponto comum entre eles: **o Claude (Opus) é o maestro**. Ele decide roteiro, fatos, plano e aprovação de cada portão. Agentes Sonnet executam partes fechadas (cenas, dados, planos em JSON), e o código só executa. Todo o pesado (render, voz, música, alinhamento) roda numa **GPU G4 do Colab**; o PC local só orquestra.

---

## 2. O "batedor" (pesquisa de stack obrigatória antes de cada vídeo)

**O que é:** uma etapa fixa do pipeline, criada em 22/10/2026 a pedido do Eduardo. Depois de ler a referência e antes de qualquer agente modelar, inventaria os elementos que a stack **faz fraco** ou **nunca fez** e vasculha GitHub, npm, o fórum do three.js e bancos CC0 atrás de libs e assets "smart and cheap".

**Onde entra:** `leitura do original (10 fps + transcrição) → plano → BATEDOR → agentes de cena → stills → render`. É um portão: os agentes só começam depois do relatório `BATEDOR_<video>.md` aprovado pelo maestro.

**Critérios** (todos obrigatórios):
- **Licença comercial:** MIT, BSD, Apache, ISC, CC0 ou CC-BY com crédito. Nada NC ou ND, e nada GPL/AGPL embutido no bundle.
- **Grátis e offline:** roda na G4 sem chamar serviço externo.
- **Compatível com a stack travada:** three 0.180, R3F 9, Remotion 4. Cuidado com peer deps que puxam three novo.
- **Determinístico:** tudo é função do tempo do quadro, com semente fixa (o render é paralelo e por faixas).
- **Barato na GPU.**
- **Versão publicada há mais de 2 semanas.**

**Método:**
1. Prova rápida em pasta descartável, com teste de MD5 em dois renders.
2. **Wrapper próprio:** a lib nunca entra crua no código.
3. Registro em tabela: `Elemento | Hoje | Candidato | Licença/versão | Custo medido | Ganho | Decisão (Adotar/Testar/Fora)`.

**Regras aprendidas:**
- Nunca pular, mesmo com stack pronta. Fui corrigido duas vezes ao pular; com stack pronta, roda um batedor curto só dos elementos novos.
- O **batedor de dados** (mapas, fotos) é separado e **não substitui** o de stack.

---

## 3. Stack de vídeo (decisões e porquês)

### Núcleo
| Peça | Versão | Por quê |
|---|---|---|
| **Remotion** | 4.0.537 | Vídeo como código React. Determinístico, renderiza por faixas em paralelo, e cada cena é um componente com props em JSON |
| **three.js + @react-three/fiber + drei** | 0.180 / 9.8.2 / 10.7.9 | 3D dentro do Remotion. Versões travadas: libs novas muitas vezes exigem three ≥ 0.186 |
| **postprocessing + n8ao** | 6.39.5 | Bloom, AO, LUT e grão: a "camada de acabamento" |
| **Render na G4** | `--gl=angle-egl`, **um Chrome por faixa** | Várias abas WebGL num Chrome só dão "Shader Error VALIDATE_STATUS". Medido: 15 min de vídeo em ~12–20 min |

### Arquitetura do Tracer3D 2.0 (o que funcionou)
- **Kit de cenas parametrizadas:**
  - 4 famílias: `ui` (cartões 2D), `karten` (mapas), `welt` (3D: Flug, Modell, Bahn) e `epoca` (pinturas 2.5D).
  - O planejador escreve **JSON**, não código.
  - Uma batida custa ~450 tokens, contra milhões quando agentes escreviam código: corte de ~27% de tokens por vídeo.
- **Canal HTTP com a G4** (`canal.py`):
  - Usa a porta-proxy do Colab, sem células digitadas.
  - Comando ~0,2 s em vez de 1–2 min; "stills quentes" (Chrome aberto) a ~1 s por still.
- **Camada de acabamento em 3 níveis**, com custo medido:
  - `leve` (AgX, LUT de época, grão, vinheta, bloom): ≤ +4%;
  - `medio` (+ AO, névoa, céu HDRI com IBL, chão PBR): ~+3%;
  - `heroi` (+ soldados com esqueleto, árvores procedurais, fumaça em flipbook): +7–11%, em no máximo ~6 batidas por vídeo.
- **Regras de mistura de b-roll**, medidas automaticamente:
  - mapa ≤ 35%, 3D ≥ 25%, imagem de época ≥ 20%;
  - nunca mais de 3 batidas seguidas da mesma família;
  - cartões ≤ 40%, com no máximo 2 seguidos.
  - Nasceram de feedback do Eduardo ("poucos b-rolls", "pouco dinâmico").

### Libs e repos "smart" adotados (o que cada um faz)
| Lib / asset | Licença | Uso |
|---|---|---|
| **Depth Anything V2 Small** (Hugging Face) | Apache-2.0 | Mapa de profundidade de pinturas e fotos → **paralaxe 2.5D** (cena `Gemaelde`). ~1 s por imagem no CPU. Foi a maior subida de qualidade do vídeo 7. As versões Base e Large são **NC**: fora |
| **@dgreenheck/ez-tree** | MIT | Árvores procedurais com semente e vento por `update(t)` |
| **@three.ez/instanced-mesh** | MIT | Multidões grandes com LOD e culling: 150 mil instâncias em 2 draw calls |
| Multidão com marcha no vertex shader (nosso) | — | 12 mil soldados em 3 draw calls. Galope de cavalo pela mesma técnica |
| **three-pinata, three-bvh-csg** | MIT | Fratura e corte (bunkers, concreto) |
| **takram atmosphere** | MIT | Céu e atmosfera físicos |
| **Poly Haven / ambientCG** | CC0 | HDRI de céu, texturas PBR (lama, grama, pedra, neve), papel |
| **Quaternius** | CC0 | Humanos com esqueleto e animações |
| **Unity Labs flipbooks / JangaFX VDB** | CC0 | Fumaça, fogo, explosão em sequência de imagens |
| **Copernicus DEM GLO-30, EOX Sentinel-2 cloudless 2017, OSM, Wikidata, OpenHistoricalMap** | livres (com atribuição) | Terreno real, satélite, rios, estradas, fronteiras históricas |
| **Wikimedia Commons, Paris Musées, Rijksmuseum, LoC** | PD/CC0 | Pinturas e fotos de época, conferidas uma a uma pela API |
| Fontes Old Standard TT e UnifrakturMaguntia | SIL OFL | Tipografia de época |

### Recusados (e por quê)
- **DepthFlow:** AGPL. **Wav2Lip:** só pesquisa (NC).
- **three-vat:** exige three ≥ 0.186.
- **Cesium ion, Google 3D Tiles, Google Earth Studio, EOX 2018+:** não comerciais.
- **Código do Shadertoy:** CC BY-NC-SA por padrão. Só entender a técnica e reimplementar.

### Áudio e voz
| Ferramenta | Uso | Nota |
|---|---|---|
| **Gemini TTS (AI Studio)** | Narração (alemão e espanhol) | Automatizado por Playwright. **Armadilha:** "Palavra:" no início da frase vira rótulo de falante e o TTS pula o trecho |
| **stable-ts / faster-whisper (G4)** | Alinhamento por palavra | O WER por capítulo é o portão de qualidade. O Whisper pula trechos em áudio longo: conferir em pedaços de 30 s antes de regerar |
| **ACE-Step (G4)** | Trilha por capítulo, a partir de prompt de texto | |
| **MOSS (G4)** | Efeitos sonoros | Posicionados por regras (regex na fala), sem LLM |
| **Mixagem ffmpeg** | Mix final | −14 LUFS, pico −1 dBFS |
| **Avatar (VSL e headcast)** | Google Vids Omni com a boca nativa nos takes; TTS só nos trechos narrados | Timbre: clone MiniMax ou conversão OpenVoice v2 |
| **Lip-sync aberto** | LatentSync 1.6 (Apache), InfiniteTalk (Apache), MuseTalk (MIT) | Candidatos na G4 para dispensar ferramentas pagas como o DreamFace. A provar com A/B |

---

## 4. Mineração de nichos no YouTube

### Ferramentas e scripts
- **`motor/youtube.py`:** cliente da YouTube Data API v3 com cache diário por consulta e rodízio de chaves.
  - Custo: busca = 100 unidades, vídeos e canais = 1 por lote de 50.
  - Uso com 3 chaves ≈ 30 mil unidades por dia; cada tema custa ~200.
- **`motor/garimpo.py` + `motor/score.py`** (Minerador, canais de persona):
  - Busca virais antigos por semente (anteriores a 2022) e mede o outlier.
  - Checa se alguém já refez com a persona e calcula a **fome** (demanda ÷ oferta).
  - Pede ao Claude títulos e ângulos de remake.
  - Replica em francês e alemão.
- **`D:\kriegschronik\radar_v2\`** (canais de guerra):
  - `radar_grafo.py`: ~110 temas em 10 domínios, mesma busca em inglês (US) e alemão (DE), últimos 36 meses.
  - `radar_analise.py`: filtros de limpeza.
  - `radar_prussia.py`: recorte do canal.
  - `vetor_prussia.py`: qual **termo do título** puxa views.

### Métricas
| Métrica | Fórmula / escala | Para quê |
|---|---|---|
| **Score Minerador** (0–100) | views 25% (100 mil → 30 mi) · outlier 15% (views ÷ inscritos, 1x → 50x, piso de 1.000 inscritos) · demanda 20% (views/ano, evergreen) · lacuna 20% (remakes com a persona: 0 = 1; 3+ = 0,1) · encaixe 20% (nota do Claude 0–10) · fator de saturação (clones novos da persona em 6 meses) | Nichos de persona |
| **Buraco EN × DE** | Mediana do top 10 em inglês ÷ mediana do top 10 em alemão, mais outliers e encaixe no formato (0–2) | Achar demanda provada em inglês sem oferta no idioma-alvo. Ex.: "Every Day with Army Sizes" com 1,17 mi em EN e zero em DE virou o vídeo 6, que viralizou |
| **Lift de termo do título** | Mediana de views ÷ inscritos com o termo, dividida pela mediana sem o termo | Escolher palavras do título. No nicho prussiano em DE: número grande 2,5x, "Schlacht" 1,9x, "Preußen" 1,2x; "1866" 0,56x; "Kaiser/Reich" 0,37x |

### Filtros que evitam falso positivo (aprendidos na marra)
- O título precisa conter um termo central do tema. Canais de entretenimento ficam fora: MrBeast aparecia em "nuclear bunker" e gameplay em "D-Day".
- A busca com `relevanceLanguage=de` devolve vídeos em inglês. Oferta alemã = só títulos com **palavras** alemãs. Trema não basta: "Battle of Königgrätz" é inglês.
- Comparar sem acentos.
- Nicho histórico tem cauda longa: janela de 5 anos.
- **Um vídeo por micronicho.** Só repete se viralizar, e aí aprofunda o mesmo vetor (vídeo 6 viral → vídeo 7 sobre Sedan).

---

## 5. Lições dos pipelines de YouTube (contexto, NÃO regras do copymaster)
> **Ratificação (28/10/2026, Eduardo):** o copymaster é agente de **copy direct response** (VSL low ticket, Facebook, RMBC) e **não trabalha com YouTube**.
> As lições abaixo descrevem como os canais de YouTube funcionam; não são instruções para copy. Itens 1–5 (título, miniatura, teste A/B do YouTube, créditos, b-roll) são específicos de YouTube.
> O que pode servir de inspiração geral: escopo pequeno de agente com plano B barato (6), todo número com fonte (7) e o ritual de pesquisa com critérios explícitos do batedor (seção 2).
1. **O vetor de viralização está no título.** O público reconhece o nicho por 1–2 palavras-âncora ("Preußen" + "Frankreich"). Junte um número grande e um verbo de vitória.
2. **Teste A/B do YouTube = pares fixos título + miniatura**, sem cruzar. Cada miniatura é feita para o seu título e entregue numerada (`titulo1_thumb1`...).
3. **Miniaturas de guerra:**
   - A: quadro da simulação + número grande;
   - B e C: rosto fictício da época (Flow/Nano Banana) com gancho ou número.
   - Fonte Anton e paleta amarelo/branco/vermelho.
4. **Créditos e licenças só na descrição**, nunca na imagem, e sem selo "SIMULATION".
5. **Variedade de família de b-roll vale mais que número de cortes.** O vídeo com "poucos b-rolls" tinha o mesmo ritmo de corte da referência, mas 59% era o mesmo mapa.
6. **Escopo de agente pequeno:** um agente com 15 cenas 3D variadas falhou em 13. Teto de ~6, e sempre com fallback barato (pintura 2.5D).
7. **Fatos:**
   - Todo número com fonte no dossiê; fontes divergentes viram faixa.
   - Atrocidade só com fonte institucional.
   - A descrição só cita fontes do dossiê.
8. **Infra:**
   - Desligar a GPU quando ociosa e conferir que desligou.
   - Nada no disco C: (temporários no D:).
   - No Windows, `TaskStop` não mata o python filho: usar `taskkill /T /F` e trava de processo único.
9. **Repo público:** sem chaves, e-mails, IDs de perfil de navegador nem links de notebook. O sincronizador do repo filtra isso e não é publicado.

## 6. Onde ler mais
- `tracer3d2/ARQUITETURA.md`, `tracer3d2/BADPATHS.md` (sintoma → causa → regra de cada armadilha), `tracer3d2/ACABAMENTO.md`, `tracer3d2/REFERENCIA_TRACER_PROJECT.md`
- `docs/whatif-es/BATEDOR.md` (rotina do batedor)
- `README.md` e `ARQUITETURA.md` da raiz (Minerador), `motor/score.py` (fórmula do score)
