# Levantamento de prontos: takes de MAPA (Kriegsmomente, tema creme) em three.js r186 + GSAP

04/11/2026. Passo 0 do `docs/BATEDOR.md`. Nada foi construído nem instalado; clones rasos só para leitura em `D:/tmp/lev_mapas/`.
Buscas: cerca de 130 `gh search repos`, 6 `gh search code` (SKILL.md), 30 `npm search`, 18 buscas na YouTube API e 7 legendas lidas.

**Não repetido aqui:** a seção C de `docs/levantamentos/2026-11-03_repos_stack_3d.md` (perfect-arrows, flubber, milsymbol, orbat-mapper, relievo, srtm-stylesheets, Natural Earth, MapStage, historical-basemaps). Aqui eles só aparecem quando mudam de papel na stack three.js.
**O que já temos:**
- kit `karten` do Tracer3D (Remotion/SVG, `tracer3d_03_douaumont/v1/src/kit/karten/API.md`): pfeil, front, lineal, zahl, datum, zeitleiste, symbol;
- `k16_seekrieg/.../mapa.js` (three.js, escuro, plano chapado): Line2, rótulos em sprite de canvas **sem colisão**, seta reta, sem relevo;
- fronteiras: `tracer3d_06_1870/geo/grenzen_1870.geojson` e `batedor_tmp/k11d` (1866).

## Os 3 melhores (topo)
1. **THREE.MeshLine v2** (spite): largura que varia ao longo da linha (cauda afinando), `visibility` para o desenho progressivo e tracejado. Serve como corpo de seta e frente, com o GSAP animando um único número.
2. **@ateliercartographie/label-placer** (Sciences Po): colocação de rótulos **determinística e "sticky" entre quadros**, com obstáculos (setas, costa, unidades) e linhas de chamada. Ataca direto o problema dos "rótulos sobrepostos".
3. **kaolti/monolith-terrain** (three.js puro): receita de shader `onBeforeCompile` com hipsometria, curvas de nível por `fwidth` (finas e uma grossa a cada 5) e DEM. É a base do "relevo legível" no plano 2.5D.

## Tabela de candidatos
| Nome | Link | Licença | ★ / atualiz. | Headless? | O que resolve |
|---|---|---|---|---|---|
| THREE.MeshLine 2.0.0 | github.com/spite/THREE.MeshLine | MIT | 2.346 / 2026-10 | sim (three ≥ r155) | seta e frente com afinamento, `visibility` (cresce), dash animável |
| troika-three-text 0.53 | github.com/protectwise/troika | MIT | 1.985 / 2026-11 | sim (SDF; esperar `sync()` antes do quadro) | rótulos nítidos com fonte própria (serifa itálica), contorno/halo, `curveRadius` |
| label-placer 0.5.0 | github.com/AtelierCartographie/label-placer | ISC | npm nov/26 (0 ★, novo) | sim, sem dependências | anti-sobreposição, prioridades, obstáculos, leader lines, posições estáveis |
| labelgun 6.1 | github.com/Geovation/labelgun | MIT (npm) | 115 / 2021 | sim | alternativa simples: esconder rótulo de menor prioridade |
| labella.js | github.com/twitter/labella.js | Apache-2.0 | 3.867 / 2023 | sim | rótulos da linha do tempo/data sem sobreposição |
| polylabel | npm `polylabel` (Mapbox) | ISC | estável | sim | ponto ótimo para o nome do território dentro do polígono |
| monolith-terrain | github.com/kaolti/monolith-terrain | MIT | 105 / 2026-07 | sim (three puro) | shader de curvas, hipsometria e grade; grão e DOF (pmndrs/postprocessing) |
| @zaes/tactical-graphics 4.7 | github.com/zaes-code/tactical-graphics | MIT | 12 / 2026-11 | sim (função pura → GeoJSON) | **seta militar "axis of advance"** com cauda, phase lines, boundaries, range fans |
| @orbat-mapper/control-measures 0.40 | npm (repo orbat-mapper) | MIT | nov/26 | sim | mesmas graphics táticas; alternativa ao anterior |
| milsymbol 3.0.5 | github.com/spatialillusions/milsymbol | MIT | 821 / 2026-11 | sim (SVG → canvas → textura) | ícones de unidade e escalão (já levantado; aqui vira textura three) |
| perfect-freehand 1.2.3 | github.com/steveruizok/perfect-freehand | MIT | npm 2026-02 | sim | contorno de traço "pincel" com início e fim afinando (polígono → `ShapeGeometry`) |
| flubber | github.com/veltman/flubber | MIT | 6.944 | sim | morph de frente/território A→B |
| three-geojson | github.com/gkjohnson/three-geojson | MIT | 240 / 2026-09 | sim | GeoJSON → linhas e malhas planas ou extrudadas no three |
| Turf (`bezierSpline`, `lineSliceAlong`, `buffer`) | turfjs.org | MIT | 10,5 mil | sim | curva da seta, corte progressivo, "water lines" (buffers da costa) |
| hachure-fill | github.com/pshihn/hachure-fill | MIT | 29 / 2026-04 | sim | hachura vetorial (zona ocupada, mata) |
| Hachures (QGIS) | github.com/pinakographos/Hachures | GPL-3 (só ferramenta) | 46 / 2025-04 | offline | **hachuras de relevo estilo séc. XIX** (a gramática dos mapas de estado-maior de 1870) |
| sketchy-hachures | github.com/awoodruff/sketchy-hachures | MIT | 34 / 2018 | canvas | o mesmo em JS (menos fiel) |
| GDAL `gdaldem hillshade -multidirectional` + `gdal_contour` | gdal.org + srtm-stylesheets (CC0) | MIT/X | estável | offline | hillshade e curvas assados do Copernicus GLO-30 |
| relievo (Blender, método Huffman) | github.com/LuisSevillano/relievo | GPL-3 | 5 / 2026-05 | Blender `-b` na G4 | hillshade-herói com sombra real |
| ambientCG Paper001–006 | ambientcg.com | CC0 | — | textura | papel creme (multiply), preso ao mapa |
| Natural Earth (rios com `scalerank`, costa) | naturalearthdata.com | domínio público | — | dados | rios com espessura por ordem, costa |
| MapStage | github.com/hopechen067/MapStage | MIT (código) | 508 / 2026-10 | sim (`seek(t)`, `jumpTo` + idle, `render.mjs`) | **motor + skill de mapa histórico "pergaminho"** pronto, mas em MapLibre; basemap padrão EOX vetado |
| maplibre-contour | github.com/onthegomap/maplibre-contour | BSD-3 | npm 2026-09 | se rota MapLibre | curvas do DEM em runtime |
| three-geo / geo-three / map33.js | w3reality / tentone / blaze33 | MIT | 1.423 / 962 / 504 | — | ⛔ tiles em runtime (three-geo exige token Mapbox; map33 parado em 2023). Assar é melhor |
| @navaramap/three (maplibre/navara) | github.com/maplibre/navara | NOASSERTION | 401 / 2026-11 | — | ⛔ globo GIS Rust/WASM, pesado demais para take de campanha |
| maplibre-gl-video-export | github.com/bjperson/maplibre-gl-video-export | NOASSERTION | 44 | não (tempo real) | ⛔ licença indefinida e não é quadro a quadro |

## Skills de agente: existe "skill de mapa" pronta?
**Sim, mas nenhuma em three.js.**
- **MapStage** (`mapstage/SKILL.md`, MIT): a única skill de **mapa histórico para vídeo**, com stills que já têm o look buscado (papel, curvas, relevo 2.5D, seta, cartão de data). Ver `MapStage/showcases/long-march-ep14/still-03-terrain.jpg`. As regras embutidas valem ouro mesmo fora do MapLibre:
  - um movimento de câmera com propósito por frase, que chega e para, com push lento de 6–7% e +3° de inclinação;
  - enquadramento calculado do conjunto de lugares dentro de uma área segura;
  - rótulo em 3 estados (normal, ativo, apagado): apaga pela cor, nunca pela opacidade, e nunca some;
  - por tela: ≤ 1 rota principal, ≤ 2 reações e ≤ 2 placas de unidade;
  - "mapa sem graça se resolve com troca de plano, não com mais exagero de relevo".
  - **Desligar:** compliance chinês e basemap EOX/satélite.
- **maplibre/maplibre-agent-skills** (oficial da comunidade, MIT): `maplibre-cartography` (halo, hierarquia, ordem de camadas), `maplibre-terrain-rendering`, `maplibre-fonts-glyphs`. Servem como leitura de princípios.
- Menores: `iart-ai/map-animation-skills` (estilo Vox: Google Earth Studio → After Effects ou GeoJSON/SVG, baixo valor); `aansh-video/skills/watercolor-map` (Remotion + d3-geo com `feTurbulence`, ideia de "lavado"); `ashishkaloge/map-design` (pôster SVG).
- Já instaladas: `remotion-maps` (Remotion), threejs-skills e Threejs-Awesome-Graphics (three genérico, sem mapa).

## Recomendação de STACK (three.js puro, base assada offline e animação determinística em `render(t)`)
1. **Base "atlas creme" assada (G4/Python):**
   - relevo: Copernicus DEM → `gdaldem hillshade -multidirectional` + `gdal_contour` (receitas srtm-stylesheets), ou relievo/Huffman na G4 para o plano-herói;
   - linhas: costa e rios do Natural Earth/OSM;
   - fronteiras: `grenzen_1870.geojson` / historical-basemaps 1880;
   - opcional: hachuras de relevo (QGIS Hachures) para o estilo de mapa de estado-maior.

   Tudo vira PNG e GeoJSON. **Por quê:** zero rede no render, determinismo total e a mesma rota do K16 (`prep_dados.py`).
2. **Shader do plano (técnica monolith-terrain):**
   - papel ambientCG em multiply;
   - hillshade em sépia (não cinza) a 30–45%;
   - curvas de tinta finas;
   - hipsometria quase imperceptível;
   - deslocamento leve do DEM para o 2.5D.

   **Por quê:** relevo legível sem custo e preso ao mapa.
3. **Setas e frentes:**
   - curva: Turf `bezierSpline`, cortada por `lineSliceAlong(t)`;
   - corpo: **THREE.MeshLine** (`widthCallback` afinando na cauda, `visibility = t`), com uma cabeça única posicionada pela tangente;
   - variante militar: polígono da **@zaes/tactical-graphics** (`MainAxisOfAdvance`) → `ShapeGeometry`;
   - frente: **flubber**/reamostragem entre estados.
4. **Unidades: milsymbol** → canvas → textura em plano deitado no mapa, recolorida a tinta por exército, com o tamanho codificando o escalão.
5. **Rótulos:** **troika-three-text** (fonte de época do design system) + **label-placer** rodando por quadro em espaço de tela, com `sticky` e obstáculos = setas, unidades e costa; **polylabel** para nomes de região; **labella** na régua de datas.

Mais a skill **MapStage** como manual de regras (câmera, limites por tela, estados de rótulo). **Alternativa B (batedor A/B):** rodar o próprio MapStage com basemap `paper`/`atlas` sem satélite e DEM Mapterhorn (CC-BY) para comparar stills; se ganhar, o take de mapa sai como passe separado.

## O que ainda é à mão (e por que nenhum pronto cobre)
- **Seta de documentário completa:**
  - o que é: corpo afinando, cabeça única, contorno de tinta mais escuro, "levantada" do papel com sombra suave deslocada, crescendo por GSAP;
  - o que existe: as peças (MeshLine, tactical-graphics, Turf);
  - o que falta: o componente em three. Nenhum repo entrega a seta 2.5D com sombra.
- **Frente/território com borda viva:**
  - o que é: máscara/SDF em espaço do mapa com ruído preso ao mapa (não à tela), feather e faixa interna colorida na fronteira ("Grenzkolorit" dos atlas do séc. XIX);
  - o que existe: flubber só interpola a forma;
  - o que falta: o look, que é shader nosso.
- **Adaptador label-placer ↔ three:**
  - o que é: projetar as âncoras para pixels, rodar o placer e devolver as posições ao troika (~100 linhas);
  - por que à mão: o placer é agnóstico e só traz adaptadores para Plot, Mapshaper e MapLibre.
- **"Water lines"** (linhas concêntricas na costa, de mapa antigo): Turf `buffer` em 3–5 anéis com opacidade decrescente. Receita de 20 linhas, sem pacote.
- **Símbolo de 1870:**
  - o que é: o mapa de estado-maior usava bloco retangular cheio (preto = prussiano, outra cor = inimigo), não a moldura NATO;
  - o que existe: milsymbol dá o escalão, mas é padrão moderno;
  - o que falta: adaptar o desenho. Decidir no batedor.
- **Pipeline de assar:** script GDAL curto. As receitas estão prontas, o script não.

## Técnica de "look" extraída dos tutoriais (legendas lidas)
- **Quem faz o quê** (a0RfM0lOnew, Thomas White, 303 mil):
  - Kings and Generals, Epic History e History Marche = Photoshop + After Effects, com mapa pintado por designer a cada vídeo;
  - base NASA "Whole World Land and Oceans" ou Natural Earth I (sem mancha urbana moderna);
  - **mar em cor chapada** para o rótulo ler.
- **Mapa de batalha estilo Epic History** (jdYvn6ZiCpM):
  - morros = traço preto borrado (gaussian) em baixa opacidade, um hillshade falso;
  - mata e campos = textura de foto com máscara de feather a 50–60%;
  - vilas = mancha cinza borrada + telhados com sombra de distância 0 e suave;
  - estradas = traço borrado;
  - rio = cor sólida com sombra interna.
  - **Lição:** camadas de textura com feather, não vetor duro.
- **Frente que se move** (GOc7np11Tio, Boone Loves Video, 101 mil):
  - rig de 3 camadas: dois polígonos inteiros (cor de cada lado) e **uma** matte animada, usada normal num e invertida no outro, para não somar cores;
  - **turbulent displace aplicado na matte raster** (gruda no mapa no zoom, não "ferve"), mask feather ~25;
  - mapa base dessaturado (tint) e polígonos em modo de mistura Color;
  - matte parentada ao mapa.
  - **Em three:** SDF/máscara em UV do mapa + ruído em coordenada de mundo.
- **Setas** (rmITTGwVENo):
  - trim path ~4 s;
  - 2 vértices bezier bastam;
  - câmera "animate view along feature" com keyframes de zoom, rumo e inclinação;
  - **3D falso:** duplicar a seta como sombra (distância 0, só sombra, suave) e levantar a seta no Z, para ela flutuar sobre o papel.
- **9 elementos** (HYGYcfF-Sz8):
  - largura da seta = tamanho da força;
  - ícones do mesmo designer, para coerência;
  - revelar país por matte com repeater e turbulent displace (borda de tinta);
  - mattes de "ink spill" (tinta escorrendo);
  - **hachura diagonal animada** para zona ocupada, que dá movimento secundário com a câmera parada;
  - aglomerados de tropas por repeater;
  - "radio waves" como localizador.
- **Simplicidade** (lvC8FGJUpKk, EmperorTigerstar): só os rios e cidades necessários; detalhe demais em movimento distrai. Um estado por data.
- **Receita creme para nós:**
  - camadas: papel (multiply) → hillshade sépia → curvas finas → mar chapado claro com costa a tinta e water lines → território em Color/multiply com borda ruidosa presa ao mapa → hachura animada na zona ocupada → setas levantadas com sombra → blocos de unidade → rótulos;
  - tipografia: rótulos de água e região em itálico espaçado, cidades em versalete;
  - câmera: drift/dolly contínuo, nunca > 4 s parado;
  - acabamento: grão leve.

## Próximo passo
Batedor curto em stills (2–6): **A** = stack three.js acima no plano Sedan/Metz; **B** = MapStage `paper`, lado a lado com um quadro de Epic History e outro de Kings and Generals. Decidir por elemento. Instalação local dos pacotes MIT só no projeto do batedor.
