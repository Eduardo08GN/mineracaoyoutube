# Levantamento de prontos: repositórios, pacotes, add-ons e assets (03/11/2026)

Passo 0 do `docs/BATEDOR.md`. O objetivo é parar de reinventar a roda nos vídeos de **(A)** reconstrução de acidente aéreo (estilo Reconstructed), **(B)** explicador 3D estilo Zack D Films e **(C)** mapa militar animado.

**Como foi feito:**
- cerca de 180 buscas `gh search repos`, primeiro por frase e depois por termos separados;
- `gh search code` (padrões `useCurrentFrame` + MapLibre/TripsLayer/evolvePath, `createTikTokStyleCaptions`);
- leitura das listas awesome-blender, awesome-gis e awesome-mcp-servers;
- `npm view` e PyPI para licença e versão;
- web para termos de uso (Google, MapTiler, EOX, OpenSky, LiveATC, JangaFX, Blender Lab).

Estrelas e datas foram lidas hoje pela API do GitHub. "Atualiz." é o último push.

**Legenda de veredito:**
- **USAR:** pronto para entrar no batedor já.
- **TESTAR:** promissor; fazer batedor curto antes.
- **DESCARTAR:** fora, com o motivo.

**Marcas de licença:**
- ⚠️ exige atenção.
- ⛔ não comercial, ND ou termo incompatível com YouTube monetizado.

> **Já está no projeto** (`D:\tracer3d2\modelo\v1\package.json`): `@remotion/three`, `@remotion/paths`, `@remotion/captions`, `@remotion/noise`, `@react-three/drei`, `@react-three/postprocessing`, `postprocessing`, `@takram/three-atmosphere`, `@takram/three-geospatial`, `d3-geo`, `@dgreenheck/three-pinata`, `@dgreenheck/ez-tree`. Vários "prontos" abaixo **já estão instalados e subaproveitados**.

> **Achado-chave:** o próprio Remotion agora traz **skills oficiais de agente** em `remotion-dev/remotion/packages/skills/skills/`:
> - `remotion-maps`, com técnicas MapLibre, Mapbox, MapTiler, Cesium e static-map;
> - `remotion-captions`, `remotion-render`, `remotion-multimedia` e outras.
>
> A técnica MapLibre já resolve o determinismo do mapa no render: `interactive:false`, `fadeDuration:0`, `delayRender` até `idle`, `preserveDrawingBuffer`, `--gl=angle` e o aviso de "shimmer" com câmera móvel. **Ler antes de qualquer mapa em Remotion.**

---

## A) Reconstrução de acidente aéreo (Reconstructed)

### A1. Jato executivo metálico

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| Learjet 45 (rammgraffic, Sketchfab), já em uso | — | CC BY 4.0 | Modelo de jato executivo | three.js (GLB) e Blender | **USAR** (já aprovado) |
| [Learjet de Marco Fischer (Sketchfab)](https://sketchfab.com/3d-models/learjet-8100fa8c3fb942669f0e85ae7ef9b5bb) | — | CC BY | ~469 mil triângulos, mais detalhado | Blender (close); decimar para three.js | **TESTAR** em close metálico |
| Material metálico: Poly Haven / ambientCG (metal escovado, pintura) | — | CC0 | Texturas PBR | Ambos | **USAR** |
| `MeshPhysicalMaterial` (clearcoat) + HDRI Poly Haven | three.js nativo | MIT / CC0 | O "metálico" vem do HDRI refletido, não do modelo | three.js | **USAR**. O metal chapado vem da falta de ambiente refletido, não do modelo |
| Modelos FlightGear (aeronaves) | — | GPL-2 (por aeronave) | Aeronaves de simulador, formato AC3D | Blender (precisa de importador AC3D) | **DESCARTAR** por ora: conversão trabalhosa e GPL em asset é ambígua |
| 3D CAD Browser, RenderHub, CGTrader (Gulfstream, Citation) | — | Pago / royalty-free | Modelos realistas | Ambos | Só com o OK do Eduardo (compra) |

### A2. Céu e mar de nuvens volumétricas (chase cam por cima)

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| [`@takram/three-clouds`](https://github.com/takram-design-engineering/three-geospatial) (monorepo three-geospatial) | 1.756 / 2026-05 (npm 0.7.6) | MIT | Nuvens volumétricas raymarched com atmosfera física, camadas configuráveis, sombras de nuvem | three.js (atmosfera irmã já no projeto) | **USAR**. Substitui o shader à mão de `ceu.ts`. Testar o render headless na G4 (WebGL2, custo por quadro) |
| [Token-Gremlin/natural-disasters ("ABYSSAL")](https://github.com/Token-Gremlin/natural-disasters) | 299 / 2026-09 | MIT | Oceano FFT, nuvens volumétricas, chuva, raios e furacões 100% procedurais em three.js/GLSL (~400 KB) | three.js: fonte de shaders de tempestade e chuva | **TESTAR** como doador de código (chuva, raios, nuvem de tempestade) |
| [JangaFX Free VDBs (Cloud Pack, fumaças, explosões)](https://jangafx.com/software/embergen/download/free-vdb-animations/) | — | **CC0** | 10 nuvens VDB, plumas de fumaça, fogo, explosões, tornado | Blender (Cycles); Unreal via plugin VDB | **USAR** no Blender para close de nuvem e fumaça |
| [Disney WDAS Cloud dataset](https://disneyanimation.com/resources/clouds/) | — | CC BY-SA 3.0 ⚠️ (conferir `License_Cloud.pdf`) | Nuvem cúmulo VDB de referência de cinema | Blender | **TESTAR** só para hero shot. Exige crédito e share-alike sobre o asset |
| [Easy Clouds (extensions.blender.org)](https://extensions.blender.org/add-ons/easy-clouds/) | v2.2.0 / 2025-01 | GPL-3 | Nuvens procedurais (uma ou em camada), Cycles e EEVEE | Blender 4.2+ | **TESTAR**. O autor admite partes quebradas |
| [bgivenb/blender-cloud-generator](https://github.com/bgivenb/blender-cloud-generator) | 4 / 2026-09 | CC0 | Cúmulo, cumulonimbo e estrato estilizados, determinísticos | Blender | **TESTAR** (pequeno, mas CC0 e com cumulonimbo para tempestade) |
| [jaelpark/droplet-render](https://github.com/jaelpark/droplet-render) | 31 / 2017 | BSD-3 | Modelagem e render de nuvem volumétrica | Blender antigo | **DESCARTAR** (parado desde 2017) |
| `drei <Clouds>/<Cloud>` | 10.116 / 2026-10 | MIT | Nuvens de sprites (rápidas, "fofas") | three.js (já no projeto) | **DESCARTAR** para o mar de nuvens (é o visual "nuvem-bola" reprovado). Serve para fumaça distante |
| Poly Haven `kloofendal_*_puresky` | — | CC0 | HDRI de céu | Ambos | **USAR** (já em uso) |

### A3. Tempestade, chuva e raios

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| three.js `examples/jsm/geometries/LightningStrike.js` + exemplo `webgl_lightningstrike` | 117k / 2026-11 | MIT | Raio procedural ramificado e animável | three.js | **USAR** (nativo, zero dependência) |
| [SahilK-027/Lightning-VFX](https://github.com/SahilK-027/Lightning-VFX) | 46 / 2026-03 | MIT | Raio estilizado com faíscas e camera shake | three.js | **TESTAR** (estilo pronto) |
| Chuva do ABYSSAL (acima) | 299 | MIT | Chuva e rajadas em GPU | three.js | **TESTAR** |
| [SahilK-027/Elemental-Serenity](https://github.com/SahilK-027/Elemental-Serenity) | 267 / 2026-11 | MIT | Diorama com chuva e estações em shaders | three.js | Referência de shader |
| [FotisLax/Blender-Rain-Generator](https://github.com/FotisLax/Blender-Rain-Generator) | 2 / 2026-07 | MIT | Malhas de chuva | Blender | **DESCARTAR**. Partículas nativas e "rain streak" no compositor resolvem |
| Chuva na lente (gotas no vidro): [pailhead/rainDropletShader](https://github.com/pailhead/rainDropletShader) | 9 / 2020 | sem licença ⚠️ | Gotas no vidro | three.js | **DESCARTAR** (sem licença) |

### A4. Cidade real com pluma de fumaça

**Rota já decidida:** Copernicus/LiDAR + prédios OSM; Google e Cesium ion fora até decisão.

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| [vvoovv/blosm](https://github.com/vvoovv/blosm) (base grátis) | 2.148 / 2026-09 | GPL (código); dados OSM ODbL | Importa prédios e ruas OSM, terreno e (opcional) Google 3D Tiles | Blender headless (bpy) | **USAR** para prédios OSM e terreno. **Não** usar o modo Google 3D (termos) |
| [domlysz/BlenderGIS](https://github.com/domlysz/BlenderGIS) | 9.564 / 2025-12 | GPL-3 | DEM (SRTM), basemap georreferenciado, OSM, GeoTIFF | Blender | **USAR**, com DEM Copernicus/LiDAR e ortofoto nacional |
| [NASA-AMMOS/3DTilesRendererJS](https://github.com/NASA-AMMOS/3DTilesRendererJS) | 2.513 / 2026-11 | Apache-2.0 | Carrega 3D Tiles em three.js/r3f, com plugins de câmera e região | three.js | **TESTAR** com tiles **nossos** (ver lacunas) |
| [whidrubeld/three-map-terrain](https://github.com/whidrubeld/three-map-terrain) | 17 / 2026-10 | MIT | Terreno real a partir de tiles (elevação + imagem) mais prédios, ruas, água e árvores do OSM | three.js | **TESTAR** (novo, pequeno; poupa a conversão OSM→malha) |
| [tentone/geo-three](https://github.com/tentone/geo-three) | 962 / 2026-04 | MIT | Mapa em tiles com relevo em three.js | three.js | Alternativa ao anterior; **TESTAR** só se o anterior falhar |
| [eliemichel/MapsModelsImporter](https://github.com/eliemichel/MapsModelsImporter) | 2.820 / 2024 | GPL-3 | Captura 3D do Google Maps via RenderDoc | Blender | ⛔ **DESCARTAR** (viola os termos do Google) |
| [chenyingshu/google_3dtile_collection](https://github.com/chenyingshu/google_3dtile_collection), [CognitoBit/CesiumForBlender](https://github.com/CognitoBit/CesiumForBlender) | 37 e 5 | — / MIT | Google 3D Tiles e Cesium dentro do Blender | Blender | ⚠️ Pendente da decisão do Eduardo (ver Termos) |
| JangaFX Free VDBs: High-Res Smoke Plume, Industrial Chimney Smoke | — | **CC0** | Pluma de fumaça animada em VDB | Blender | **USAR** para fumaça do impacto em Blender |
| Mantaflow (nativo do Blender, Quick Smoke) | nativo | GPL | Simulação de fumaça | Blender na G4 | **USAR** quando a pluma precisa de vento ou direção |
| [three.quarks](https://github.com/Alchemist0823/three.quarks) | 1.165 / 2026-05 | MIT | Motor de VFX e partículas (fumaça, fogo, faíscas) com editor | three.js | **TESTAR** para fumaça e fogo em three.js |
| [three-nebula](https://github.com/creativelifeform/three-nebula) | 1.247 / 2026-10 | MIT | Partículas para three.js | three.js | Segunda opção ao three.quarks |
| Realistic Starter VFX Pack Vol 2 (Fab), já no projeto Unreal | — | Fab Personal | Fogo e fumaça Niagara | Unreal | **USAR** (já adquirido) |

### A5. Trajetória ADS-B (lat, lon, alt, tempo) → câmera e avião animados

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| **Dados:** [adsb.lol globe_history_2026](https://github.com/adsblol/globe_history_2026) | 67 / 2026-11 | **ODbL 1.0** | Traços diários de todas as aeronaves (JSON do readsb: lat, lon, alt, gs, track, vertical rate) | Python | **USAR** como fonte de trajetória com uso comercial (crédito na descrição) |
| [xoolive/traffic](https://github.com/xoolive/traffic) (PyPI 2.13) | 522 / 2026-10 | MIT | Lê, filtra, reamostra e suaviza trajetórias (filtros, Kalman, fases de voo), exporta CSV, KML e GeoJSON | Python no Windows (orquestração) | **USAR** para limpar e reamostrar o CSV antes de qualquer engine |
| [geospace-code/pymap3d](https://github.com/geospace-code/pymap3d) (PyPI 3.2.0) | 450 / 2026-06 | BSD-2 | lat/lon/alt → ENU/ECEF (metros locais) | Python, Blender | **USAR**. Conversão certa de geodésico para cena local |
| `@takram/three-geospatial` (`Ellipsoid`, `Geodetic`) | já no projeto | MIT | O mesmo em JS (ECEF ↔ geodésico) | three.js | **USAR** (já instalado) |
| [pehaka4-dot/Tacview-Flight-Path-Importer-for-Blender](https://github.com/pehaka4-dot/Tacview-Flight-Path-Importer-for-Blender) | 0 / 2026-04 | MIT | CSV (tempo, lat, lon, alt, roll, pitch, yaw) → objeto animado com quaternions, Bézier e curva NURBS do rastro | Blender headless | **TESTAR**. É exatamente a peça "CSV→animação"; basta adaptar as colunas do adsb.lol. Pequeno: ler o código antes |
| [imagiscope/EarthStudioTools](https://github.com/imagiscope/EarthStudioTools) | 196 / 2021 | sem licença clara ⚠️ | Importa rota KML e câmera do Google Earth Studio para o Blender | Blender | **DESCARTAR** (parado, licença indefinida, preso ao Earth Studio) |
| [hook-365/adsb-3d](https://github.com/hook-365/adsb-3d) | 55 / 2026-10 | MIT | Visualizador 3D de ADS-B com replay histórico, terreno e "smooth motion" | three.js (app web) | **TESTAR** como doador: suavização entre pontos e modo seguir |
| [jcolot/adsb-lol-globe-catmull-rom](https://github.com/jcolot/adsb-lol-globe-catmull-rom) | 2 / 2026-11 | sem licença ⚠️ | Pipeline adsb.lol → pernas suavizadas por Catmull-Rom → viewer THREE | Python + three.js | Referência de leitura apenas (sem licença) |
| `THREE.CatmullRomCurve3` + `drei <Trail>` / `MeshLine` | nativo / drei | MIT | Curva suave pelos pontos, rastro do avião, `getPointAt(t)` com `getTangentAt` para a chase cam | three.js | **USAR** (nativo) |
| [visgl/hubble.gl](https://github.com/visgl/hubble.gl) | 184 / 2026-10 | MIT | Keyframes de câmera e render em vídeo para deck.gl | deck.gl | **DESCARTAR** para nós: o Remotion já faz o papel de relógio |
| [WilliamAvHolmberg/cesium-flight-simulator](https://github.com/WilliamAvHolmberg/cesium-flight-simulator) | 435 / 2026-01 | sem licença ⚠️ | Simulador de voo em CesiumJS | — | **DESCARTAR** (sem licença; dados ion) |
| OpenSky Network (histórico via Trino, `pyopensky`) | — | ⛔ pesquisa não comercial; comercial só com contrato | Base histórica ADS-B | — | **DESCARTAR** para canal monetizado |
| FlightRadar24 / FlightAware (exportar KML/CSV) | — | ⛔ termos de uso pessoal | — | — | **DESCARTAR** como fonte publicada; usar só como referência visual |
| ADS-B Exchange | — | ⛔ licença comercial paga | — | — | **DESCARTAR** |

### A6. Mapas escuros de satélite com rotas animadas

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| **Skill oficial `remotion-maps` (técnica MapLibre)** | Remotion 70k / 2026-11 | docs (Remotion) | Receita determinística MapLibre + Turf no Remotion: rota que cresce, marcadores, câmera | Remotion | **USAR**. Ler antes de codar |
| [maplibre-gl-js](https://github.com/maplibre/maplibre-gl-js) (npm 6.16) | 12.006 / 2026-11 | BSD-3 | Mapa vetorial e raster em WebGL, sem chave | Remotion | **USAR** |
| [Turf.js](https://github.com/Turfjs/turf) (`greatCircle`, `lineSliceAlong`, `along`, `bezierSpline`) | 10.529 / 2026-10 | MIT | Geometria de rota (fatiar a linha por progresso) | Remotion | **USAR** |
| [OpenFreeMap](https://github.com/hyperknot/openfreemap) + [estilos](https://github.com/hyperknot/openfreemap-styles) (dark) | 6.344 / 2026-11 | código MIT/BSD; dados OSM ODbL | Tiles vetoriais grátis, sem chave, com estilo escuro | MapLibre | **USAR** para o mapa escuro vetorial (crédito OSM na descrição) |
| [protomaps/basemaps](https://github.com/protomaps/basemaps) + `pmtiles` | 770 / 2026-09 | BSD-3; dados ODbL | Basemap em arquivo único PMTiles com sabor "dark", offline na G4 | MapLibre | **USAR** para render offline e determinístico na G4 |
| Satélite **comercial-ok**: NASA Blue/Black Marble (domínio público); Copernicus Sentinel-2 (livre, com crédito); ortofoto nacional (PNOA CC BY 4.0, IGN Licence Ouverte, USGS NAIP domínio público) | — | PD / CC BY | Imagem de satélite | Raster no MapLibre (escurecer com `raster-brightness-max` e `raster-saturation`) ou textura no three.js | **USAR**. O "escuro" é gradação nossa |
| EOX Sentinel-2 cloudless | — | ⛔ 2018–2025 CC BY-NC-SA (2016 e 2017 são CC BY 4.0, conferido no WMTS da EOX em 03/11) | Mosaico global sem nuvem | — | Só as camadas **2016 e 2017**; o resto exige licença comercial |
| Esri World Imagery, CARTO Dark Matter, Stadia/Stamen | — | ⚠️ termos comerciais restritos ou pagos | Basemaps | — | **DESCARTAR** sem contrato |
| MapTiler (satélite e terreno; técnica `cesium` da skill) | — | ⚠️ plano Free não comercial; "Basic" ~US$ 25/mês para canais até 100 mil inscritos, com atribuição | Satélite e terreno de qualidade | Remotion/Cesium | Pendente de decisão do Eduardo (pago) |
| Mapbox ([remotion-dev/mapbox-example](https://github.com/remotion-dev/mapbox-example), 39) | — | ⚠️ SDK proprietário, token, termos | Globo e prédios 3D bonitos | Remotion | **DESCARTAR** por ora (custo e termos) |
| [alexfernandez803/animate-deck-gl](https://github.com/alexfernandez803/animate-deck-gl) | 11 / 2023 | MIT | Remotion + deck.gl (TripsLayer) | Remotion | Referência; **TESTAR** só se precisar de muitas rotas (TripsLayer) |
| [deck.gl](https://github.com/visgl/deck.gl) `TripsLayer`/`PathLayer`/`ArcLayer` | 14.730 / 2026-11 | MIT | Rotas animadas com rastro que esmaece; arcos | Remotion (camada sobre MapLibre) | **TESTAR** para rota com rastro esmaecendo |
| [vasturiano/three-globe](https://github.com/vasturiano/three-globe) | 1.650 / 2026-10 | MIT | Globo com arcos animados | three.js | **TESTAR** para a abertura "rota no globo" |

### A7. Áudio ATC: waveform + transcrição palavra a palavra (karaokê)

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| `@remotion/media-utils` (`visualizeAudio`, `useWindowedAudioData`, `getWaveformPortion`) | npm 4.0.540 | MIT | Amplitudes por quadro para desenhar a waveform | Remotion | **USAR** (oficial, determinístico) |
| `@remotion/captions` (`createTikTokStyleCaptions`) + skill `remotion-captions` | já no projeto | MIT | Agrupa palavras com tempo em páginas e destaca a palavra ativa | Remotion | **USAR** (já instalado) |
| [m-bain/whisperX](https://github.com/m-bain/whisperX) (PyPI 3.8.6) | 25.053 / 2026-10 | BSD-2 | ASR com timestamp por palavra (alinhamento wav2vec) | G4 (GPU) | **USAR** |
| [SYSTRAN/faster-whisper](https://github.com/SYSTRAN/faster-whisper) | 26.438 / 2026-11 | MIT | Whisper rápido com `word_timestamps=True` | G4 | **USAR** como base |
| [jianfch/stable-ts](https://github.com/jianfch/stable-ts) | 2.280 / **arquivado** | MIT | Timestamps estáveis e **alinhamento forçado** de texto conhecido | G4 | **TESTAR**. Útil quando há transcrição oficial (relatório NTSB/CIAIAC); repo arquivado |
| [MahmoudAshraf97/ctc-forced-aligner](https://github.com/MahmoudAshraf97/ctc-forced-aligner) | 572 / 2026-10 | BSD-2 | Alinha texto conhecido ao áudio | G4 | **TESTAR** (alternativa viva ao stable-ts) |
| [jacktol/whisper-medium.en-fine-tuned-for-ATC](https://huggingface.co/jacktol/whisper-medium.en-fine-tuned-for-ATC) | HF | MIT (pesos) ⚠️ dados ATCO2/UWB podem ser de pesquisa | Whisper ajustado para fraseologia ATC | G4 | **TESTAR**. Rádio ruidoso derruba o Whisper genérico |
| [bbc/audiowaveform](https://github.com/bbc/audiowaveform) | 2.171 / 2025-08 | GPL-3 (ferramenta) | Gera picos de waveform (JSON/PNG) por CLI | Pré-processo Python | Opcional; o `@remotion/media-utils` basta |
| [wavesurfer.js](https://github.com/katspaugh/wavesurfer.js) | 10.459 / 2026-11 | BSD-3 | Player de waveform interativo | — | **DESCARTAR** para render (é de tempo real) |
| [marcusstenbeck/remotion-audio-visualizers](https://github.com/marcusstenbeck/remotion-audio-visualizers) | 78 / 2022 | sem licença ⚠️ | Visualizadores para Remotion | Remotion | **DESCARTAR** (sem licença, parado) |
| [vshukla7/remotion-captions-themes](https://github.com/vshukla7/remotion-captions-themes), [neutral-Stage/remotion-captioneer](https://github.com/neutral-Stage/remotion-captioneer) | 11 e 19 / 2026 | MIT | Temas de karaokê para Remotion | Remotion | Referência de estilo; não precisa de dependência |
| **Fonte do áudio:** LiveATC | — | ⛔ "personal non-commercial"; pedir permissão por escrito | Arquivo ATC | — | ⚠️ Pedir permissão ou usar áudio publicado por órgão oficial (NTSB docket, domínio público nos EUA) |

### A8. HUD mínimo (altitude, razão de descida, contadores)

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| [JayaSaiKishanChapparam/altara](https://github.com/JayaSaiKishanChapparam/altara) (`@altara/aerospace` 0.1.6) | 78 / 2026-10 | MIT | Componentes React de PFD, altímetro, VSI, HSI e TCAS em canvas | Remotion (alimentar por `useCurrentFrame`, não por tempo real) | **TESTAR**. Útil como referência e talvez para o PFD; o Reconstructed usa HUD minimalista |
| `@remotion/layout-utils`, `@remotion/noise`, `interpolate` | já no projeto | MIT | Contadores numéricos e layout | Remotion | **USAR**. Odômetro de altitude é um `interpolate` sobre o CSV |
| [Remocn/remocn](https://github.com/Remocn/remocn) | 1.663 / 2026-11 | MIT | Registro estilo shadcn de animações, transições e cenas para Remotion | Remotion | **TESTAR** para cartões e contadores (copiar componente, sem dependência) |

---

## B) Explicador 3D estilo Zack D Films

### B1. Corte (cutaway, seção booleana) de mecanismos

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| Blender: modificador **Boolean** (Difference com caixa animada) + extensão oficial **Bool Tool** | nativo | GPL | Corte real com tampa sólida, animável (a caixa se move) | Blender headless | **USAR**. É o caminho padrão; não existe add-on grátis de "cutaway" melhor |
| Blender: corte por shader (Object Info / coordenada → Transparent + "capa" com backface emissivo) | nativo | — | Corte barato sem booleana | Blender | **USAR** para malhas pesadas |
| [gkjohnson/three-bvh-csg](https://github.com/gkjohnson/three-bvh-csg) | 957 / 2026-09 | MIT | CSG (booleana) rápido em three.js | three.js | **TESTAR** para corte real em three.js |
| three.js `webgl_clipping_stencil` (planos de corte com tampa por stencil) | nativo | MIT | Corte animado com face de corte preenchida | three.js | **USAR** (nativo, animável por quadro) |
| [dgreenheck/three-pinata](https://github.com/dgreenheck/three-pinata) | 452 / 2026-05 | (npm) | Fatiar e fraturar malhas | three.js (já no projeto) | **USAR** para "partir ao meio" |
| Shaders de cross-section da Unity (Dandarawy etc.) | 597 | BSD-3 | — | Unity | **DESCARTAR** (outra engine; só referência) |

### B2. Estúdio com fundo de grade

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| `drei <Grid infiniteGrid fadeDistance>` + `<ContactShadows>` + `<Environment preset="studio">` | já no projeto | MIT | Piso de grade infinito com esmaecimento e sombra de contato | three.js | **USAR** |
| [Chronos-Samples/three-infinite-grid](https://github.com/Chronos-Samples/three-infinite-grid) | 25 / 2026-03 | MIT | Grade infinita | three.js | **DESCARTAR** (o drei já cobre) |
| Blender: plano curvo (cyclorama) + textura de grade procedural (Brick/Checker) + HDRI de estúdio Poly Haven (CC0) | nativo / CC0 | — | Estúdio Zack D | Blender | **USAR** (montar uma vez como `.blend` base) |
| [Studio-Lighting-Pro (Mavorklith)](https://github.com/Mavorklith/Studio-Lighting-Pro-One-Click-Professional-Studios-for-Blender) | 1 / 2026-10 | GPL-3 | Estúdio em um clique | Blender | **DESCARTAR** (sem tração) |

### B3. Partículas e fogo

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| JangaFX Free VDBs (fogo, explosão, poeira) | — | CC0 | VDBs prontos | Blender | **USAR** |
| Mantaflow (fogo e fumaça) + Geometry Nodes Simulation Zone | nativo | GPL | Simulação | Blender na G4 | **USAR** |
| [rlguy/Blender-FLIP-Fluids](https://github.com/rlguy/Blender-FLIP-Fluids) | 1.974 / 2026-08 | GPL-3 (versão paga no Superhive) | Líquidos de alta qualidade | Blender | **TESTAR** só se aparecer líquido (a versão grátis é compilar do código) |
| three.quarks / three-nebula (ver A4) | 1.165 / 1.247 | MIT | Partículas three.js | three.js | **TESTAR** |

### B4. Blender dirigido por LLM (MCP, bpy)

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| [ahujasid/mcp-for-blender](https://github.com/ahujasid/blender-mcp) (antigo blender-mcp) | **33.156** / 2026-10 | MIT | MCP comunitário: Claude ↔ Blender aberto (executa código, Poly Haven, Sketchfab, Hyper3D) | Blender **com interface** no PC (porta 9876) | **TESTAR** só para autorar e prototipar o `.blend` no PC; **não** para a G4 |
| **Blender Lab MCP (oficial)**, [blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server) | v1.0 abr/2026, add-on 1.0.3 | GPL | MCP oficial: API Python, manual embutido, resumo de cena, screenshots | Blender 5.1+ com add-on | **TESTAR** (oficial; prefira-o ao comunitário). Conflita na porta 9876 com o comunitário |
| [sandraschi/blender-mcp](https://github.com/sandraschi/blender-mcp) | 63 / 2026-10 | MIT | MCP **headless** (FastMCP) | G4 sem tela | **TESTAR** se quisermos MCP na própria G4 |
| [HoldMyBeer-gg/blenderwright](https://github.com/HoldMyBeer-gg/blenderwright), [carlosh7/blender-mcp](https://github.com/carlosh7/blender-mcp), [dcc-mcp-blender](https://github.com/dcc-mcp/dcc-mcp-blender) | 185 / 17 / 59 | MIT | MCPs com centenas de ferramentas | Blender | **DESCARTAR**. Redundantes; mais ferramentas significa mais contexto gasto |
| [EL4CTEO/blender-skills](https://github.com/EL4CTEO/blender-skills) | 678 / 2026-10 | MIT | Agent Skills de Blender 5.2 para Claude Code (modelagem, UV, PBR, bake, rig) | Claude Code no PC | **TESTAR**. Skills cabem melhor no nosso fluxo (script → G4) do que MCP |
| [gd3kr/BlenderGPT](https://github.com/gd3kr/BlenderGPT) | 4.999 / 2024 | MIT | Prompt → bpy (OpenAI) | — | **DESCARTAR** (parado, preso à OpenAI) |
| [nutti/fake-bpy-module](https://github.com/nutti/fake-bpy-module) | 1.824 / 2026-11 | MIT | Stubs do bpy para autocompletar e checar tipos no Windows | PC | **USAR** (escrever bpy sem Blender local) |

> **Recomendação de arquitetura:** na G4 o padrão continua `blender -b arquivo.blend -P cena.py -- args` (Cycles OptiX). O MCP vale no **PC** para montar o `.blend` base de cada "kit" (estúdio, céu, avião). Depois, o script parametrizado roda sem tela na G4.

### B5. Render headless em VM Linux com GPU

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| `bpy` no PyPI (Blender como módulo, 5.2.3) | PyPI | GPL-3 | `import bpy` em Python puro, sem binário | G4 | **TESTAR**. Simplifica o Colab (pip em vez de baixar o tar do Blender). Conferir OptiX/CUDA no wheel |
| [yuki-koyama/blender-cli-rendering](https://github.com/yuki-koyama/blender-cli-rendering) | 830 / 2023 | GPL-3 | Scripts-modelo de render por CLI (luz, câmera, materiais, composição) | G4 | Referência de receitas; **TESTAR** como cola |
| [ptrvilya/blendify](https://github.com/ptrvilya/blendify) (PyPI 2.1.0) | 869 / 2025-09 | GPL-3 | API alto nível para cena e render headless | G4 | **DESCARTAR** (voltado a visão computacional) |
| [DLR-RM/BlenderProc](https://github.com/DLR-RM/BlenderProc) | 3.775 / 2026-01 | GPL-3 | Pipeline procedural headless | G4 | **DESCARTAR** (dados sintéticos, não cinema) |
| [nytimes/rd-blender-docker](https://github.com/nytimes/rd-blender-docker) | 460 / 2022 | Apache-2.0 | Contêineres de Blender headless | — | **DESCARTAR** (parado; o Colab não usa Docker) |
| [EatTheFuture/camera_shakify](https://github.com/EatTheFuture/camera_shakify) | 1.275 / 2026-02 | GPL | Tremor de câmera capturado de verdade | Blender | **USAR** na chase cam e no close do Zack D |

---

## C) Mapa militar e de estratégia para vídeos históricos

### C1. Setas animadas limpas (sem pontas sobrepostas)

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| `@remotion/paths` (`evolvePath`, `getPointAtLength`, `getTangentAtLength`) | já no projeto | MIT | Traçado progressivo do SVG; a ponta segue a tangente no fim do trecho | Remotion | **USAR**. A ponta é **um** `<path>` posicionado por `getPointAtLength(progresso)`, não um marker repetido |
| [steveruizok/perfect-arrows](https://github.com/steveruizok/perfect-arrows) | 2.849 / 2023 | MIT | Calcula curva e ângulo da ponta entre dois pontos, com `padStart`/`padEnd` que evitam colisão com o alvo | Remotion | **USAR** para setas ponto-a-ponto |
| [dragonman225/curved-arrows](https://github.com/dragonman225/curved-arrows) | 256 / 2024 | MIT | Setas em S entre caixas | Remotion | Alternativa; **TESTAR** |
| [perfect-freehand](https://www.npmjs.com/package/perfect-freehand) | npm 1.2.3 | MIT | Traço de espessura variável (seta "pincelada" de mapa de época) | Remotion | **TESTAR** para o corpo da seta com afinamento |
| Turf `bezierSpline` + `lineSliceAlong` | 10.529 | MIT | Seta em coordenadas geográficas (sobre o MapLibre) | Remotion | **USAR** quando a seta vive no mapa |
| [rough-notation](https://github.com/rough-stuff/rough-notation) | 9.729 | MIT | Anotações desenhadas à mão | Remotion | Opcional (círculos e sublinhados) |
| [leader-line](https://github.com/anseki/leader-line) | 3.243 | MIT | Linhas entre elementos DOM | — | **DESCARTAR** (depende de DOM e animação por tempo) |

### C2. Linhas de frente animadas (avanço e recuo)

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| [veltman/flubber](https://github.com/veltman/flubber) | 6.943 / 2022 | MIT | Interpola a forma A→B (polígono de território ou frente) suavemente | Remotion (SVG) ou textura | **USAR** (estável; parado porque está "pronto") |
| `d3-geo` (já no projeto) + Turf `buffer`/`union` | — | ISC/MIT | Projeção e operações de polígono | Remotion | **USAR** |
| [DBubnovskyi/FrontLineMap](https://github.com/DBubnovskyi/FrontLineMap) | 1 | other | Dados da frente na Ucrânia | — | **DESCARTAR** (tema fora) |

### C3. Blocos de unidade e símbolos

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| [spatialillusions/milsymbol](https://github.com/spatialillusions/milsymbol) (npm 3.0.5) | 820 / 2026-10 | MIT | Gera símbolos NATO APP-6 / MIL-STD-2525 em SVG (infantaria, cavalaria, artilharia, escalão) | Remotion (SVG inline) | **USAR**. Base dos blocos de unidade, estilizável (cor por exército) |
| [nwroyer/Python-Military-Symbols](https://github.com/nwroyer/Python-Military-Symbols) | 34 / 2026-10 | MIT | Mesmo, em Python (SVG) | Pré-processo Python | Alternativa |
| [orbat-mapper/orbat-mapper](https://github.com/orbat-mapper/orbat-mapper) | 176 / 2026-11 | MIT | App para recriar batalhas: ORBAT, unidades no mapa, **cenário com linha do tempo**, PMTiles offline | Editor no navegador → exportar GeoJSON e cenário para o Remotion | **TESTAR** como **editor de cenário** (posicionar unidades por data); renderizar no Remotion |

### C4. Relevo (mapa com terreno e sombreamento)

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| [LuisSevillano/relievo](https://github.com/LuisSevillano/relievo) | 5 / 2026-05 | GPL-3 | Bounding box → relevo sombreado no Blender, pronto para publicação, num comando | Blender headless na G4 | **TESTAR**. Faz o "mapa de relevo estilo Daniel Huffman" sem tocar no Blender |
| [nunderwood6/blender_prep](https://github.com/nunderwood6/blender_prep) | 57 / 2020 | sem licença ⚠️ | Prepara DEM para o Blender | — | Ler só como receita |
| [andrewharvey/srtm-stylesheets](https://github.com/andrewharvey/srtm-stylesheets) | 55 / 2026-09 | CC0 | Estilos `gdaldem` para hillshade | GDAL (Python) | **USAR** para hillshade 2D rápido |
| [kaolti/monolith-terrain](https://github.com/kaolti/monolith-terrain) | 105 / 2026-07 | MIT | Topo real em three.js com visual "carta USGS antiga" | three.js | **TESTAR** como referência de estilo vintage |
| MapLibre `hillshade` + `raster-dem` (Copernicus convertido em Terrain-RGB/PMTiles nosso) | — | BSD-3 | Relevo sombreado ao vivo no mapa 2D | Remotion | **USAR** (com DEM nosso, sem MapTiler) |
| Natural Earth ([natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)) + raster Shaded Relief | 2.271 | **domínio público** | Costas, rios, relevo sombreado global | Remotion e Blender | **USAR** |

### C5. Motor de mapa narrativo para vídeo histórico

| Item | Estrelas / atualiz. | Licença | O que faz | Encaixe | Veredito |
|---|---|---|---|---|---|
| [hopechen067/MapStage](https://github.com/hopechen067/MapStage) | **505** / 2026-10 | MIT | "Palco de mapa narrativo para vídeos históricos": MapLibre + skill de agente, basemap pergaminho, rotas que marcham, nomes que surgem, câmera que segue a narração, contrato `seek(t)`, captura de quadro e QA, `story.json` | Remotion (o `seek(t)` casa com `useCurrentFrame`) | **TESTAR primeiro** (maior impacto em C). Atenção: regras embutidas para plataforma chinesa (sem fronteiras, Taiwan…) a desligar ou ajustar |
| [aourednik/historical-basemaps](https://github.com/aourednik/historical-basemaps) | 868 / 2026-11 | GPL-3 ⚠️ (dados) | Fronteiras históricas georreferenciadas por ano (GeoJSON) | Remotion | **TESTAR**. Fronteiras de 1815, 1880 etc. A GPL em dado só exige manter aberto se redistribuirmos o dado; crédito na descrição |
| [mrlancelot/MapYoutubeVideos](https://github.com/mrlancelot/MapYoutubeVideos) | 3 / 2026-10 | sem licença | Scripts de Shorts de mapa histórico | — | **DESCARTAR** |
| kepler.gl | 12.078 | MIT | Análise geoespacial com exportação de vídeo | — | **DESCARTAR** (ferramenta de análise; sem controle de quadro) |
| BlenderGIS + Blosm (mapa 3D de batalha) | ver A4 | GPL | Terreno e casario reais | Blender / Unreal (já em uso no Kriegsmomente) | **USAR** (já é a rota do Kriegsmomente) |

---

## Termos pendentes (decisão do Eduardo): resumo

| Serviço | Situação para canal monetizado |
|---|---|
| **Google Photorealistic 3D Tiles** | ⛔ Vídeo só "promocional", até 30 s, rótulo "for promotional purposes only", logo Google e atribuição na tela, sem cache, sem derivar malhas. Inviável para os vídeos. |
| **Google Earth Studio** | ⚠️ Atribuição gravada no quadro, obrigatória. O FAQ diz que não há licença para uso comercial; as diretrizes de marca toleram YouTube educativo. Zona cinzenta: pedir permissão pelo formulário. |
| **Cesium ion** | ⛔ Logo na tela; plano grátis não comercial; Commercial US$ 149/mês (já decidido: não usar). |
| **MapTiler** | ⚠️ Free = não comercial. Plano de criador ~US$ 25/mês (até 100 mil inscritos), com atribuição. |
| **Mapbox** | ⚠️ Token e termos próprios; avaliar só se o Eduardo quiser pagar. |
| **EOX Sentinel-2 cloudless** | ⛔ 2018–2025 CC BY-NC-SA; as camadas 2016 e 2017 são CC BY 4.0 (WMTS da EOX, 03/11). |
| **OpenSky / ADS-B Exchange / FR24** | ⛔ Uso comercial exige contrato. Usar **adsb.lol (ODbL)**. |
| **LiveATC** | ⛔ Termos "personal non-commercial". Pedir permissão por escrito ou usar áudio oficial (NTSB). |
| **Remotion** | ⚠️ Grátis para indivíduo ou empresa com até 3 pessoas; acima disso, Company License. O Eduardo hoje se enquadra no grátis; rever se o time crescer. |

---

## Lacunas: o que **não** existe pronto (construir à mão, justificado)

1. **"ADS-B CSV → chase cam cinematográfica" fim a fim.** Existem as peças (`traffic` + `pymap3d` + Tacview importer + `CatmullRomCurve3`), mas nenhum repo entrega a câmera de documentário. Escrever um módulo `trajetoria.py` (limpar, reamostrar e converter para ENU, exportando JSON por quadro), consumido igualmente pelo Blender e pelo three.js.
2. **3D Tiles nossos** (fotogrametria e LiDAR nacional → 3D Tiles) para o `3DTilesRendererJS`: não há conversor pronto de ponta a ponta. Até lá: OSM + DEM (Blosm, BlenderGIS ou three-map-terrain).
3. **Seta militar de mapa** (corpo afinando + ponta única + contorno) como componente Remotion. Juntar `perfect-arrows`/Turf + `evolvePath` + `perfect-freehand`; não há componente pronto com esse visual.

---

## Stack pronta recomendada (12 itens, por impacto)

1. **Skill oficial `remotion-maps` + MapLibre + Turf** (BSD-3/MIT). Base de todos os mapas de A6 e C, com o determinismo de render já resolvido.
2. **`@takram/three-clouds`** (MIT). Mar de nuvens volumétrico; aposenta o shader feito à mão e a "nuvem-bola".
3. **adsb.lol `globe_history` (ODbL) + `traffic` + `pymap3d`** (MIT/BSD). Fonte de trajetória legal para uso comercial, mais limpeza e conversão ENU.
4. **MapStage** (MIT). Motor narrativo de mapa histórico com `seek(t)`; testar antes de construir qualquer coisa em C.
5. **milsymbol + flubber + perfect-arrows** (MIT). Blocos de unidade, frentes que se movem e setas sem ponta duplicada.
6. **JangaFX Free VDBs** (CC0). Pluma de fumaça, fogo, explosões e nuvens prontas para o Blender na G4.
7. **WhisperX / faster-whisper + `@remotion/captions` + `@remotion/media-utils`** (BSD/MIT). Karaokê ATC e waveform; testar o Whisper ajustado para ATC.
8. **OpenFreeMap / Protomaps PMTiles (dark) + satélite PD/CC BY** (NASA, Sentinel-2, ortofoto nacional). Mapa escuro sem chave e offline na G4.
9. **Blosm (base) + BlenderGIS** (GPL). Cidade OSM + DEM real no Blender (e no Unreal via exportação).
10. **Clipping com stencil do three.js + `three-bvh-csg` / Boolean do Blender**. Cutaway estilo Zack D sem add-on pago.
11. **Tacview Flight Path Importer** (MIT; adaptar) **+ Camera Shakify** (GPL). CSV → avião animado com atitude no Blender e câmera viva.
12. **Blender Lab MCP (oficial) ou `blender-skills` no PC + `bpy`/`-b -P` na G4**. LLM monta o `.blend` base; a G4 só renderiza.

Fora da lista, mas com batedor rápido valendo a pena: **ABYSSAL (natural-disasters)** para chuva e raio em three.js, **three.quarks** para partículas, **orbat-mapper** como editor de cenário, **relievo** para relevo sombreado e **altara** para PFD.

---

### Fontes principais (web)
- JangaFX Free VDBs (CC0): https://jangafx.com/software/embergen/download/free-vdb-animations/
- Disney WDAS Clouds: https://disneyanimation.com/resources/clouds/
- Easy Clouds: https://extensions.blender.org/add-ons/easy-clouds/
- Google Map Tiles API Policies: https://developers.google.com/maps/documentation/tile/policies
- Google Earth Studio FAQ e atribuição: https://www.google.com/earth/studio/faq/ e https://earth.google.com/studio/docs/attribution/
- MapTiler (termos e plano de vídeo): https://www.maptiler.com/cloud/terms/ e https://www.maptiler.com/cloud/geolayers
- EOX cloudless (licença): https://cloudless.eox.at/license-non-commercial e https://cloudless.eox.at/pricing
- adsb.lol dados históricos: https://www.adsb.lol/docs/open-data/historical/
- OpenSky (acesso histórico): https://traffic-viz.github.io/data_sources/opensky_db.html
- LiveATC (termos): https://liveatc.net/legal
- Remotion (licença): https://www.remotion.dev/docs/license
- Blender Lab MCP: https://www.blender.org/lab/mcp-server (comparativo: https://www.strayspark.studio/blog/official-blender-mcp-server-comparison-2026)
- Blosm (versões e Google): https://github.com/vvoovv/blosm/wiki/Documentation
- Whisper ATC: https://huggingface.co/jacktol/whisper-medium.en-fine-tuned-for-ATC
- Learjet Sketchfab: https://sketchfab.com/3d-models/learjet-8100fa8c3fb942669f0e85ae7ef9b5bb
