# Levantamento de prontos e de método: mapas de batalha e esquemas do K18 (Königgrätz 1866, Kriegsmomente)

06/11/2026. Passo 0 do `docs/BATEDOR.md`, com as três frentes: método, código e assets (Fab e GitHub autônomos). Nada foi construído e nada foi instalado na stack travada (Remotion 4.0.537, three 0.180, R3F 9.8.2, drei 10.7.9). As provas ficaram em `D:/tmp/levant_k18/`.

**O pedido do Eduardo:** os mapas e esquemas anteriores eram "muito amadores e engessados".

**Não repetido aqui:** `D:/tmp/repo_base/docs/levantamentos/mapas-threejs-2026-11-04.md` (MeshLine, troika, label-placer, monolith-terrain, tactical-graphics, milsymbol, perfect-freehand, flubber, Turf, hachure-fill, GDAL, MapStage) e a seção C de `2026-11-03_repos_stack_3d.md`. Aqui eles só voltam quando mudam de versão ou de papel.

**O que já temos em casa e se reaproveita como dado e código (não como take):**
- o mapa atlas creme `producao3d/k17/karte_film.js`;
- o kit `karten`;
- do K09 (`D:/kriegschronik/tracer3d_09_koeniggraetz/`):
  - o pacote de terreno `koeniggraetz` (GLO-30, 28 × 28 km, mais o recorte fino `k9_kern`);
  - `orte_koeniggraetz.geojson`, com 27 lugares com o nome de 1866;
  - a máscara do Swiepwald;
  - a frente austro-saxônica com dentes e as setas das 3 armadas (`k9_armeen.tsx`);
  - `Heer` e `Tropa` com as barretinas de 1866.

**O que foi feito:**

| Frente | Trabalho |
|---|---|
| Método | 20 buscas no YouTube, 13 legendas lidas, descrições de 8 canais, 2 vídeos-referência baixados com folha de quadros |
| Código | ~120 buscas `gh`/npm e 6 provas em Node/Chrome |
| Sketchfab | 60 consultas na API, com filtro CC0 e CC-BY |
| Fab | 32 consultas, só grátis e só listagem: nada foi adicionado à biblioteca e nenhuma licença foi aceita |
| Wikimedia Commons | mapas de época |

---

## Os 3 melhores (topo)

### 1. O próprio levantamento prussiano de agosto de 1866 como pele do relevo
**Plan des Schlachtfeldes von Königgrätz**, 1:25.000, *"aufgenommen und gezeichnet im August 1866 durch Hammer"*, fotolitografia Gebr. Burchard.
- **Licença e formato:** Wikimedia Commons, **CC0**. São 4 quadrantes (NW, NE, SW, SE) de 5070 × 6321 px cada, com as **coordenadas na legenda** (o NW cobre E 15°37'26"–15°43'54", N 50°15'10"–50°19'53").
- **Por que é a peça certa:** é literalmente o design system creme, em papel de 1866:
  - hachuras e curvas de relevo a tinta;
  - mata em pontilhado oliva;
  - aldeias em amarelo;
  - Bistritz e estradas a traço;
  - nomes em serifa itálica.
- **Como usar:**
  - georreferenciar (GDAL, 4 cantos conhecidos) e **drapear sobre o DEM GLO-30**, no lugar de uma base inventada;
  - a nossa tinta (setas, frentes, unidades, rótulos) se escreve por cima;
  - nas bordas, o mapa se dissolve no papel ambientCG, como já faz o `karte_film.js`.
- **A Schlachtaufstellung do Brockhaus** (Commons, domínio público, 1357 × 2000) entra como **gramática de unidade de época**: retângulos cheios e pequenos, **azul = Prússia, vermelho = Áustria**, numerados, com o nome do corpo em itálico vermelho ("VI. K.", "IV. Korps").
- **Nenhum concorrente faz isso:**
  - o K&G e o HistoryMarche pintam um terreno genérico verde ou oliva;
  - a Real Time History usa MapTiler/OSM moderno.
- Provas: `D:/tmp/levant_k18/ref/commons/plan_nw_1000.jpg` e `brockhaus_crop.jpg`.

### 2. tegaki 1.1.0 (MIT): a serifa itálica que se escreve traço a traço
- **O que é:** `gkurt/tegaki`, 3.296 ★, push em 05/11/2026. Transforma qualquer fonte em escrita traço a traço, com pressão e pontas afinando.
- **Prova:**
  - gerei o pacote da **IM Fell English Italic** (OFL, a fonte do K17) com o gerador do repositório: 83 glifos com ö, ä, Ö e ß, em 36 s;
  - no chrome-headless-shell do Remotion, `pauseAnimations()` + `setCurrentTime(t)` deram **bytes idênticos para o mesmo t**;
  - a palavra "Königgrätz 3. Juli 1866" se escreve com o "gg" ligado de época. Ver `D:/tmp/levant_k18/code/prova_tegaki_fell_tempo.png`.
- **Cuidados no batedor:**
  - o ritmo padrão é lento (23 s para 22 letras): escalar o tempo;
  - dois SVGs na mesma página colidem nos ids de máscara (`tk-m0`): prefixar os ids;
  - o `TegakiRenderer` carrega a fonte de forma assíncrona: usar `delayRender`.

### 3. Seta de avanço: geometria do orbat 0.42, corpo de tinta do perfect-freehand e `meshline` (já na stack)
- **Geometria:** `@orbat-mapper/control-measures` **0.42.0** (MIT) traz `flow-arrow` e **`split-arrow`**, a seta que se divide e se reúne. É o desenho de "getrennt marschieren, vereint schlagen", as 3 armadas prussianas convergindo. Também traz `envelopment` e `encirclement`. A saída é GeoJSON idêntico a cada chamada (provado).
- **Corpo de tinta no three:** **perfect-freehand 1.2.3** → `ShapeGeometry`. Com t = 0,25 / 0,5 / 1 saem 41 / 57 / 88 triângulos, idênticos entre execuções (provado em three 0.180).
- **Fita fina e rastro:** `meshline` 3.3.1 (pmndrs), **que já vem com o drei** (`visibility = t`, `dashOffset`, `widthCallback`). Não precisa instalar o THREE.MeshLine do spite.
- **No Remotion, para esquemas:** copiar o `brush` e o `ink-arrow` do **Remocn** (MIT, 1.676 ★, commit `50927de` de 05/11/2026). São determinísticos: usam `useCurrentFrame` e hash, sem `Math.random`.

---

## A. Gramática visual das referências e o que faremos melhor

**Vídeos medidos (comparação direta, mesma batalha):**
- **wFHmmCpW1yY**, Kings and Generals, "Königgrätz 1866", 1,06 mi;
- **2iY1DrjsdEk**, HistoryMarche, Königgrätz pelo Dreyse, 2,27 mi.

As folhas de quadros (1 a cada 4 s) estão em `D:/tmp/levant_k18/ref/folha_<id>_NN.jpg`, com quadros soltos `quadro_*.jpg` e o par lado a lado `par_kg_hm.jpg`.

**Em alemão o nicho está fraco:** o melhor vídeo é o de Feldzüge & Feldherren (xoDDy3hEC4A), com 6,3 mil views e "Karten: eigene Animation". Seguem Schlachtanalyse (887) e Militär-Rückblick (738).

| | K&G | HistoryMarche |
|---|---|---|
| Duração | 1.014 s | 1.958 s |
| Bloco da batalha num mapa tático só | ~5,5 min | ~9 min |
| Meios segundos com mudança visível (batalha) | **16 %** (84 % parado) | 62 %, mas o movimento é decorativo (deriva, névoa, fumaça) |
| Unidades por tela | 40–60 | 80–120 |
| Rótulos por tela | ~30 fixos | ~20–30 |
| Fora do mapa | machinima do Total War | retratos e pinturas sobre o mapa, árvore de ordem de batalha |

**Créditos de ferramenta encontrados:**

| Canal | Ferramentas e créditos |
|---|---|
| K&G | Total War com mods (Malay Archer); arte de Nolan Karimov e Orkhan Julfa |
| Real Time History | "MapTiler/OSM & GEOlayers3", CRMA, Battlefield Design |
| Operations Room | figuras de cima de Grantovich (Patreon) |
| Epic History e K&G | Photoshop + After Effects (levantamento de 04/11) |
| Boone Loves Video | GEOlayers 3 + `historical-basemaps` + papel em Multiply |

**Tutoriais lidos:**
- Thomas White:
  - Cxkb__1-sqM: o desenho da unidade em dois tons, com borda, sombra interna e filete;
  - 19ijgNgU_BM: a unidade virada para a direção do movimento, com giro na retirada;
  - lgY_Hl9XtwA: perdas por erosão com ruído em vez de estilhaço.
- Boone Loves Video:
  - YxkQOXXR7AI: a frente feita de símbolos repetidos ao longo do caminho, perpendiculares a ele (mapa da Time, coleção Rumsey);
  - 5He7No8c7mQ: o matte de invasão com Turbulent Displace.
- SonduckFilm, ZGahTJcpwz8: o "Write On" de pincel no After Effects. É o nosso método de tinta.
- Explainer VFX, J-dkD2ioLv4: o estilo The Operations Room.

| Item | O que eles fazem | Falha visível | **Nós, no creme (superar)** |
|---|---|---|---|
| **Unidades** | K&G: retângulos de dois tons com listras da bandeira. HM: quadrados no padrão OTAN e pictogramas | Nem escalão nem efetivo; dezenas de fichas iguais, não se distingue um corpo de uma brigada | **Bloco de época do Brockhaus**: retângulo cheio a tinta, **azul-prussiano contra carmim austríaco** (saxões em carmim mais claro), escalão pelo tamanho e pelo traço (XX/III do milsymbol só como glifo), número do corpo em itálico. O efetivo aparece escrito só quando a fala o cita. **Perdas = hachura que esvazia o bloco**, nunca estilhaço |
| **Setas** | K&G: seta amarela enorme e translúcida, que entra por fusão. HM: setas brancas curvas | A largura não significa nada, não há relação com a hora e não fica rastro | A seta se escreve como pena e a ponta chega **na hora do relógio**. **Largura ∝ efetivo**. Rastro pontilhado que esmaece. `split-arrow` para os 3 exércitos. Sombra só de contato |
| **Frentes** | Uma fileira de retângulos que desliza em bloco | É uma frente "de peças": não deforma no relevo e o bolsão não aparece | **Curva a tinta com dentes perpendiculares** (método Time/Boone, já iniciado no `k9_armeen`), interpolada entre estados horários, colada ao relevo. A área perdida fica **hachurada na cor de quem tomou** (Swiepwald, Chlum) |
| **Terreno** | K&G: verde pintado, manchas de mata, vinheta pesada. HM: oliva com relevo pintado, rio que se acende | Turvo: a vinheta come 1/3 da tela e o relevo não lê altura (Chlum e Lipa parecem planos) | **O plano de 1866 drapeado no DEM real**, com relevo sépia e o Bistritz em azul aquarelado que se acende na fala. Sem vinheta: o limite é o papel |
| **Câmera** | K&G: quase parada. HM: deriva lenta e névoa | Morta (84 %), ou movimento decorativo que não segue a ação | **Dolly contínuo que segue a ponta da seta ativa**, com inclinação de 15–35° quando a altura importa (crista de Chlum). Corte só ao mudar de escala (estratégica → tática). Push de 6–7 % por frase (regra do MapStage) |
| **Tempo** | HM: "July 3rd 1866" num papel no canto. K&G: nada | **Nenhum dos dois tem relógio**, numa batalha decidida pela hora (chegada do II. Armee) | **Relógio de bolso a tinta + "3. Juli, 11.30 Uhr" escrito pelo tegaki + régua do dia que se enche de tinta.** "Stunde für Stunde" é a dimensão que falta a todos |
| **Anti-poluição** | 80–120 fichas mais balões (HM); ~30 rótulos sempre ligados (K&G) | Nada sai da tela | **≤ 3 elementos ativos em tinta cheia**; o resto a lápis sépia (30 %), apagado pela cor e não pela opacidade. Por tela: ≤ 1 rota principal, ≤ 2 reações e ≤ 2 placas de unidade (regras do MapStage). Rótulo de aldeia escrito quando citado; esmaece em ~4 s |
| **Tipografia** | K&G: Courier de máquina de escrever e Trajan. HM: placas brancas | Genérica e sem época | IM Fell itálica escrita pelo tegaki, com linha-guia fina terminada em ponto. Nomes de 1866 (Chlum, Sadowa, Swiepwald, Lipa, Cistowes) |
| **Ritmo** | K&G: estados de 15–40 s parados. HM: estado novo a cada 4–8 s, com ruído | Engessado ou poluído | **Um gesto de tinta por frase**, preso à palavra (JSON de marcadores, `docs/marcadores.md`). Nada parado mais de 4 s. Metas do plano: movimento ≥ 2,5 e ≤ 15 % parado |
| **Esquemas fora do mapa** | HM: árvore da ordem de batalha em pergaminho e balões de quadrinho. K&G: tabela "350.000" sobre machinima | Balões infantis, tabela parada | A **árvore de escalões cresce a tinta e desce para o mapa** (cada folha vira o bloco no terreno). **Dreyse × Lorenz em dois números lado a lado**, com gráfico a tinta dentro do take e o desenho técnico do fuzil tirado do modelo 3D. Citação real escrita em itálico, sem balão |

---

## B e C. Tabela por elemento

Legenda das decisões: **A** = adotar; **T** = testar no batedor; **F** = fora.

| Elemento | Opção pronta | Licença | Versão | Demo? | Determinístico? | Decisão |
|---|---|---|---|---|---|---|
| Base do campo de batalha | **Plan des Schlachtfeldes von Königgrätz 1866** (4 quadrantes) + GLO-30 do K09 | CC0 / Copernicus (crédito na descrição) | 1866 | still | sim (assado) | **A**: georreferenciar com GDAL e drapear |
| Base estratégica (Boêmia, 3 armadas) | `karte_film.js` (papel × hillshade × curvas × Grenzkolorit) + historical-basemaps 1866 | nosso / CC0 / MIT | — | K17 | sim | **A** (já provado) |
| Hachura de relevo onde o plano não cobre | **terra-ficta** (DingTom23, Python numpy + Pillow: hachura pela linha de queda, linhas d'água, rios afinando) | MIT | commit nov/26, 3 ★ | imagem | semente fixa | **T**: adaptar ao DEM real. Substitui o QGIS Hachures, que é GPL |
| Papel | ambientCG Paper001–006 (já usado) | CC0 | — | — | sim | **A**. `@paper-design/shaders` 0.0.82 (Apache) só se faltar. Fab "Parchment Paper" (Megascans) **F**: não precisa |
| Serifa itálica que se escreve | **tegaki** + pacote IM Fell gerado | MIT / OFL | 1.1.0 (harfbuzzjs 1.6.2) | sim | **sim (provado)** | **A** |
| Seta de avanço (geometria) | **@orbat-mapper/control-measures** (`flow-`, `split-arrow`) | MIT | **0.42.0** | sim | sim (provado) | **A**. `@zaes/tactical-graphics` 4.7.0 fica de alternativa |
| Corpo da seta e traço de tinta (three) | **perfect-freehand** → ShapeGeometry | MIT | 1.2.3 | sim | sim (provado) | **A** |
| Fita, rastro, frente fina (three) | `meshline` (pmndrs, já no drei) | MIT | 3.3.1 | sim | sim | **A**, sem instalar nada. THREE.MeshLine 2.0.0 só se faltar. `makio-meshline` 1.4.0 **F** (só WebGPU) |
| Seta e traço de pincel (Remotion) | **Remocn** `brush`, `ink-arrow`, `ink-underline`, `scribble-circle`, `paper-wobble` | MIT | commit `50927de` | sim | sim | **A**: copiar o código-fonte para o kit |
| Contorno e hachura de zona em SVG | **roughjs** com `seed` fixo | MIT | 4.6.6 | sim | **sim com seed (provado)**; sem seed varia | **A** |
| Frente/território que muda | flubber + Turf (`lineSliceAlong`, `bezierSpline`) | MIT | 0.4.2 / 7.4.0 | — | sim | **A** |
| Contorno deslocado da frente e do território | cavalier-contours-js (msurguy) | Apache-2.0 | sem npm, ago/26 | sim | sim | **T** (o `buffer` do Turf deforma) |
| Unidade (bloco de época) | milsymbol só para o glifo de escalão; o bloco é nosso, no padrão Brockhaus | MIT | 3.0.5 | sim | sim | **A** o glifo; o bloco é **à mão** |
| Formações (linha, coluna, quadrado) | ligne-de-bataille (batalhões napoleônicos em three) | MIT | sem npm, jul/26 | sim | simulação determinística | **T** como leitura de `figures.js`/`lines.js` |
| Rótulos sem colisão | label-placer + polylabel | ISC | 0.5.0 / 2.1.0 | — | sim (sticky) | **A** (já levantado) |
| Rótulo curvo (rio, crista) | SVG `<textPath>` na camada Remotion, com `startOffset` animável | nativo | — | — | sim | **A**. O troika 0.52.5 (preso pelo drei; **não subir para 0.53.1**) só curva em cilindro (issue #151) |
| Texto 3D no relevo | troika-three-text | MIT | 0.52.5 (na stack) | sim | sim (`sync()` antes do quadro) | **A** |
| Desenho técnico do fuzil e do canhão | **three-edge-projection** (gkjohnson): linhas visíveis do modelo → SVG → `evolvePath` | MIT | tag v0.0.11 (`cc3904df2b`), exige three ≥ 0.186 | sim | puro | **T fora da stack**: assar o SVG offline em pasta própria e animar no Remotion |
| Gravura ou hachura sobre 3D (lugares) | **spite/sketch** (`post-cross-hatch`, `post-technical`) → portar o GLSL para Effect | MIT (as texturas de papel dele, não) | out/26 | sim | shader puro | **T** |
| Gráfico a tinta (barras, linha, contador) | Remocn `animated-bar-chart`, `animated-line-chart`, `rolling-number` + roughjs (seed) | MIT | commit `50927de` | sim | sim | **A** como esqueleto, com o tema creme por cima |
| Gráficos "xkcd" | chart.xkcd 2.0.12, roughViz, rough-charts | MIT | — | sim | **não** (d3 em tempo real) | **F** |
| Linha-guia com ponto e cota | `@remotion/paths` (`evolvePath`, `getPointAtLength`), já na stack | MIT | 4.0.537 | — | sim | **A**. O componente (~40 linhas) é à mão; `leader-line` 1.0.8 **F** (DOM e tempo) |
| Animação de path | vivus 0.4.6, excalidraw-animate | MIT | — | sim | parcial | **F** (o `evolvePath` cobre) |
| Mapa vintage "pronto" | mapbox-gl-vintage-style (sem licença), Azgaar/nortantis (AGPL) | — | — | — | — | **F** (só leitura de paleta) |

### Assets 3D (lugares, gente e eureka)

O mapa é tinta, então os assets servem às cenas de lugar (Chlum, Swiepwald, Sadowa) e ao eureka Dreyse × Lorenz.

**Catálogo Fab que já temos** (`D:/whatif_es/assets/fab/catalogo.json`, 199 peças):
- só serve o **Low Poly Nature: Essentials** (Vertex Rage, Fab Standard): `OakAdultD`, `BirchTreeAdultA`, `PineVariantA*` e `GenericTree*` para o Swiepwald → **A**;
- não há soldado, canhão, cavalo, igreja nem aldeia de época.

**Sketchfab** (licença confirmada pelo filtro da API; tris = faces):

| Elemento | Asset (autor) | uid | Licença | Tris | Decisão |
|---|---|---|---|---|---|
| **Dreyse (eureka)** | Low-Poly Dreyse Needle Rifle (TastyTony) | f66e3be39c3d4dbd95325ac2783ac82e | CC-BY | 2,4 k | **A** para o esquema e o desenho técnico |
| Dreyse (close) | Dreyse needle gun, free download (Andywoodhead) | 205fd0da26154bd58cec1afde67381c2 | CC-BY | 29 k | **A** |
| **Lorenz (eureka)** | Lorenz Type 2 / AUSTRIAN LORENZ type 2 (_JooL_) | 243935176a42412184d37344c2dbd4e1 / 029901556ab74ba6a0c8d4a91f57d170 | CC-BY | 20 k | **A**. É o único Lorenz achado; conferir se é o M1854 |
| Infantaria prussiana | Prussian Infantry, Franco-Prussian war (Andywoodhead) | 6508a2c8ae074b9489fe1d7ef2566384 | CC-BY | 792 k | **T**: decimar para ≤ 20 k (Pickelhaube igual à de 1866) |
| Infantaria rigada | Infantry, rigged for UE4/5 (Andywoodhead) | 771050587ce248498178aee2c2f88f36 | CC-BY | 134 k | **T** (retexturizar como branco austríaco) |
| Artilheiro | Prussian Artillerist 1870-1871 (kmkrtchyan70) | edb57847136f4883ba1a9af2ebe56ae9 | CC-BY | 463 k | **T** (decimar) |
| Artilharia: guarnição | Artillery crew 1815, rigged (Andywoodhead) | 98747e8ba0e547eaba65136919734bf2 | CC-BY | 166 k | **T** |
| Canhão de bronze | Bronze cannon on a gun carriage (WirtualneMuzeaMalopolski) | f9038ced1a3e4873b403081a7601544f | **CC0** | 174 k | **T** contra o `bronze1815d` que já está no K09 |
| Canhão de campanha | 12 Pound Cannon (iedalton) | 2662865f331146c59129cd7901fa8db1 | CC-BY | 44 k | **T** |
| Armão | Limber of a gun-carriage (kmkrtchyan70) | 331c4d1c2ea3430fa05e856d363e9286 | CC-BY | 820 k | **T** (decimar) |
| Cavalo | Horse Rigged, Game Ready (abhayexe), animado | bc64f4ff7966474ca9bacd42fa73a754 | CC-BY | 2,9 k | **A** para multidão por instancing |
| Cavalaria | Hussar, rigged for UE4/5 (Andywoodhead) | aa5a353357974d2dbd4b18d34ec9a7bc | CC-BY | 61 k | **T** (hussardos austríacos em Langenhof) |
| Bosque | Low Poly Forest Tree Pack (99.Miles) | 5ff5a51e74324845a4e4905f182dfb2b | CC-BY | 3,7 k | **T** (o catálogo Fab já cobre) |
| Aldeia | Rural Brick House with Barn (Vitalii.Sandula) / simple low poly village buildings (jeebs) / European Buildings Asset Pack 1 (EddyNL) | 4708a315b2ff42d08c55c6f5d5ca7c21 / e38eae59fb714c9fa56e55f24298a566 / b35bb99dac624919b40fb3fdf59b438a | CC-BY | 4 k / 36 k / 19 k | **T** |
| Feno, campo | Haystack 1 (Frice) | a1bbf38e91b74b08aba7851a00917843 | CC-BY | 1,2 k | **A** |
| Relógio do HUD | Vintage pocket watch (adsky_pes), animado | 2e60626f61ba43e9b295ec27b4f56180 | CC-BY | 15 k | **T**. O relógio a tinta 2D é a primeira opção |

**Fab, só grátis e só listagem** (nada adicionado; a licença se confere em `fab.com/listings/<uid>` antes de trazer):

| Elemento | Listing (autor) | uid | Formato | Decisão |
|---|---|---|---|---|
| **Igreja de Chlum** | Church of st. Wenceslas (Hellz), igreja tcheca | 89d2f414-bd09-4f82-9baf-8dd056396a4b | obj | **T**: primeira opção, coerente com a Boêmia |
| Igreja (alternativa) | Historic wooden church (Zygomir) | 56f5478c-b4c8-4cfa-9c17-41a7e2778fc6 | fbx | T |
| Canhão de 1857 | M1857 12-pounder Napoleon Cannon (Super Foundry) | 2bee828e-e798-4c9e-8585-6675fc7e3b73 | fbx | T: canhão de bronze de antecarga, stand-in do M1863 austríaco. Nunca legendar "M 1863" |
| Canhão | Old Field Cannon (EldersCrawler) | bb0a90ee-45a8-47a8-9e65-44acdcdd4d22 | blender | T |
| Casa | XIX century village house porch (Zygomir) | ee3c097f-e66b-490b-953d-70b765d2fdd7 | obj | T |
| Casa | Free Medieval German Half-Timbered House, Low Poly (Raumgeist) | 19035e94-4705-4166-a3dc-fa4e264b62d1 | fbx | T |
| Cavalo | Stylized lowpoly HORSE (LucySail) | f59ac535-4432-4a38-802e-d951d3806456 | **glb** | T |
| Carroça | Ammunition transport wagon (Noovae) | 614d2c42-84f3-40fc-8abe-f754bb3f20df | fbx | T |
| Mata | Simple Lowpoly Nature Pack (Reckera) / Free Low Poly Forest (Pure Poly) | 5c6b2404-c67b-499b-9c98-c646e7767bb4 / c9fc83a1-bced-4c8c-b3be-bc71cc1bf9ac | glb / fbx | F (o catálogo já cobre) |
| Soldado | Low Poly Soldier, Free (ManNeko) | 26aad830-2645-4188-a4ef-f7a6c79633e7 | fbx | **F** (moderno). **Não há soldado do séc. XIX grátis no Fab.** Gente fica com o `Heer`/`Tropa` do K09 (Quaternius CC0) + Andywoodhead |

**Armadilhas dos assets:**
- os modelos Andywoodhead e kmkrtchyan70 vêm de impressão 3D (130–820 k faces): decimar com gltf-transform (`producao3d/fab/otimizar.mjs`);
- o Fab Standard proíbe redistribuir, então o arquivo bruto nunca vai ao repositório;
- os mapas da David Rumsey são CC BY-**NC**: **vetados** como imagem (servem só de método);
- o thumb da Wikimedia exige User-Agent e tamanho padrão (960 px), senão devolve erro.

---

## O que nenhum pronto cobre (à mão, e por quê)
1. **Bloco de unidade de 1866** (retângulo cheio, cor do exército, número do corpo, perda por hachura, InstancedMesh no 3D). Não existe símbolo do séc. XIX em nenhum repositório; o milsymbol é OTAN.
2. **Georreferenciamento e drapeado do plano de 1866** sobre o DEM. É um script GDAL de ~30 linhas (`gdal_translate -gcp` × 4 + `gdalwarp` para o eqc do pacote). Os cantos estão na legenda do mapa.
3. **Componente "linha-guia com ponto" e "cota"** sobre `@remotion/paths` (~40 linhas). Nenhuma lib funciona em render determinístico.
4. **Rótulo curvo no three** (derivar o material do troika com a curva numa DataTexture, ~60 linhas), se o `<textPath>` da camada SVG não bastar.
5. **Borda viva do território** (Grenzkolorit com ruído preso ao mapa) e o **adaptador label-placer ↔ troika**. Continuam como no levantamento de 04/11.
6. **Relógio de bolso a tinta + régua do dia.** É SVG nosso com o tegaki para os números.

## Instalação no projeto do batedor (nunca na stack travada)
```bash
# D:/kriegschronik/k18_koeniggraetz/batedor (TEMP=D:/tmp)
npm i tegaki@1.1.0 harfbuzzjs@1.6.2 roughjs@4.6.6 perfect-freehand@1.2.3 \
  @orbat-mapper/control-measures@0.42.0 milsymbol@3.0.5 @turf/turf@7.4.0 \
  flubber@0.4.2 polylabel@2.1.0 @ateliercartographie/label-placer@0.5.0
# já na stack, não instalar: meshline@3.3.1, troika-three-text@0.52.5, @remotion/paths@4.0.537
# Remocn: copiar brush/ink-arrow/ink-underline/scribble-circle/paper-wobble/animated-*-chart
#   do commit 50927de2714b45efb63688bdd0c910e6dc3947e7 (cópia em D:/tmp/levant_k18/code/remocn_src)
# pacote da IM Fell para o tegaki: D:/tmp/levant_k18/code/imfell_it/ (gerador: bun 1.4.4,
#   bun --conditions=tegaki@dev src/cli/index.ts generate --font-file <ttf> -c "<caracteres>")
# fora da stack, em pasta própria: three-edge-projection tag v0.0.11 + three>=0.186 (assar o SVG);
#   terra-ficta (git clone; python -I, numpy + Pillow)
```

## Próximo passo (batedor curto, 4–6 stills, lado a lado com `par_kg_hm.jpg`)
1. Plano de 1866 drapeado no DEM + 3 blocos Brockhaus + split-arrow das 3 armadas às 11.30 + relógio a tinta.
2. Close em Chlum com a frente de dentes, a hachura de perda e o rótulo tegaki com linha-guia.
3. Esquema Dreyse × Lorenz: desenho técnico (edge-projection) + dois números a tinta.
4. Árvore de escalões que desce ao mapa.

Medir na régua (movimento e % parado) e mandar ao Eduardo.

**Arquivos:**
- legendas: `D:/tmp/levant_k18/leg/`;
- buscas: `D:/tmp/levant_k18/busca/`;
- descrições: `D:/tmp/levant_k18/desc_*.txt`;
- Sketchfab: `D:/tmp/levant_k18/sketchfab/res*.json`;
- Fab: `D:/tmp/levant_k18/fab/res.json`;
- provas de código: `D:/tmp/levant_k18/code/prova_*.mjs`.
