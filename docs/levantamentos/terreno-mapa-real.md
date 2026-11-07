# Terreno com mapa histórico real sobre relevo real (07/11/2026)

Pesquisa apenas, nada instalado, G4 não usada. Portão 1 do `CLAUDE.md`: a hipótese "drapear carta de época sobre DEM" **é viável e tem peça pronta**.

## Achado principal
O **IGN serve a "Carte d'état-major" 1:40.000 (levantamentos 1825-1866) como WMTS aberto**, na Géoplateforme:

- endpoint `https://data.geopf.fr/wmts`, camada `GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40` (também `ETATMAJOR10`), TileMatrixSet `PM_6_15` (zoom 6 a 15), JPEG;
- licença: **Licence Ouverte 2.0** (uso comercial livre, crédito ao IGN). Fonte: data.gouv.fr, dataset "SCAN Etat-Major 40k";
- cobre a França metropolitana da época (bbox 41,2-51,3 N): **Metz, Mars-la-Tour, Gravelotte e Sedan** (Ardenas) entram;
- é a carta que o exército francês usava em 1870, então é autêntica ao evento, e floresta (verde), estradas, vilas e cercas já vêm desenhadas à época;
- **testei 1 tile** (z14, perto de Metz, 200 OK, 12 KB, 256 px): floresta verde-acinzentada, caminhos, ferrovia, vilas em papel creme. Combina com o tema creme sem pós-processo.

Relevo: **AWS Terrain Tiles (terrarium)** em `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png` (testado, 200 OK, 88 KB). No espaço europeu a origem é o EU-DEM/Copernicus. Atribuição exigida: "Europe terrain data produced using Copernicus data and information funded by the European Union - EU-DEM layers" (docs do joerd). Alternativa mais fina: Copernicus GLO-30, licença livre ao público, crédito "Produced using Copernicus WorldDEM-30 © DLR e.V." (lido só em resumo de busca; conferir o PDF da licença, que tem cláusula de isenção de responsabilidade). Para a França há ainda RGE ALTI 1/5 m do IGN, Licence Ouverte.

## Ranking das 3 melhores rotas

### 1. `3d-tiles-renderer` (NASA-AMMOS) com TerrariumMeshPlugin + ImageOverlayPlugin + WMTS/XYZ
- **O que é:** biblioteca three.js (2,5 mil estrelas, Apache-2.0, último push hoje). Pelo código da pasta `src/three/plugins/images`: `TerrariumMeshPlugin` e `TerrainRGBMeshPlugin` (malha de relevo a partir de tiles de DEM), `ImageOverlayPlugin`, fontes `WMTSImageSource`, `XYZImageSource`, `TMSImageSource`, `WMSImageSource`, `GeoJSONImageSource`, `MVTImageSource`, `PMTilesImageSource`. O terrarium e a carta antiga entram **sem escrever shader de malha**.
- **Licença:** Apache-2.0 (comercial ok).
- **Horas:** 6-10 h para o still de teste (montar cena, LOD, exagero vertical 1,5-2x, névoa creme, câmera oblíqua); mais 3-4 h para rota animada e rótulos no Remotion.
- **Por que melhora:** a textura inteira vem do mapa 1870 (floresta, vila, rio, estrada), no lugar das manchas procedurais. Roda no mesmo three/R3F do K18, com Kuwahara/contorno que já existem. Controlo total de câmera, rota 3D e rótulos.
- **Riscos (não verificados):** combinação do plugin de terrarium com overlay WMTS num mesmo tileset (ver exemplos do repo); espera de tiles no render headless (usar o evento de fim de carga + `delayRender` do Remotion); **pré-baixar os tiles da área** e servir local, para não depender da rede/limites do IGN na G4.

### 2. MapLibre GL JS 3D terrain (raster-dem terrarium + raster état-major + hillshade + sky)
- **O que é:** 12 mil estrelas, BSD-3, muito ativo. Fonte `raster-dem` com `encoding: "terrarium"` (sem o encoding certo vira ruído), `terrain`, camada `hillshade`, `sky` (v5), `line` GeoJSON para rota, `symbol` para rótulos, texto com fonte serifa em glyphs próprios.
- **Horas:** 3-5 h para o still (menos código de todas as rotas); 6-8 h se virar take animado (render quadro a quadro com `jumpTo` e espera de `idle` em Chromium headless).
- **Por que melhora:** é a rota mais curta até uma imagem de época precisa, com hillshade grátis.
- **Limites:** estilo "mapa inclinado" (câmera presa a pitch máximo, sem controle livre), integração mais pesada com 3D-herói e pós-processo three; é de novo "mapa 3D", o que o Eduardo já criticou (memória 03/11: mapa 3D conta como mapa). Bom para still de batedor e para tomadas aéreas curtas.

### 3. Blender: BlenderGIS + DEM + textura do mapa + Cycles (Kuwahara opcional)
- **O que é:** BlenderGIS (9,6 mil estrelas, GPL-3, último push 12/2025) importa DEM e baixa basemap por tile (a fonte TMS/WMTS é configurável, daria para apontar para a état-major). Render Cycles na G4, nó Kuwahara nativo do Blender 4.2.
- **Licença:** o addon é GPL-3, mas isso vale para o addon, não para as imagens renderizadas.
- **Horas:** 4-6 h para o still; cada take de câmera custa render de GPU.
- **Por que melhora:** sombra, oclusão e profundidade de campo reais; é a que mais "pinta" o terreno.
- **Limites:** fora do fluxo Remotion/three; a rota animada e os rótulos têm de ser feitos à parte (composição); exige o fluxo de GPU. Melhor como etapa de acabamento para takes cinematográficos de ~30 % do vídeo.

### Descartados ou secundários
- **geo-three** (MIT, 963 estrelas, push 04/2026): provedor customizado simples (`fetchTile(zoom,x,y)`), altura por CPU ou deslocamento no vertex shader. Serve, mas a rota 1 faz o mesmo com mais manutenção. Os provedores de DEM prontos pedem chave (Mapbox, Bing).
- **three-geo** (MIT, 1,4 mil, push 02/2025): exige token Mapbox para DEM e satélite, só imagem de satélite. **Não serve.**
- **three-tile** (399 estrelas, push 08/2026): fonte DEM ArcGIS, licença não confirmada. Pequeno demais.
- **@takram/three-geospatial** (MIT, 1,8 mil, push 05/2026): pacotes `atmosphere` e `clouds` em beta, `effects` e `core` em alfa. Não traz terreno. Vale **só como extra** de perspectiva aérea/céu se a névoa creme não bastar.
- **deck.gl TerrainLayer** (MIT, 14,7 mil): é biblioteca de mapa com câmera de mapa. Sem vantagem sobre MapLibre.
- **Cesium:** o CesiumJS é Apache-2.0, mas o ion exige conta e tem termos próprios; com DEM/ortho públicos não é necessário. Sem ganho.

## Recomendação: UMA rota para o still de teste de Metz/Mars-la-Tour
**Rota 1 (`3d-tiles-renderer`, terrarium + overlay WMTS da état-major).** Ela troca só a textura e a geometria do chão, no stack three/R3F que já temos. Fica fora a Rota 2 para evitar um segundo motor de render. Plano do still:
1. Pré-baixar tiles da área (bbox de Mars-la-Tour/Gravelotte/Metz): état-major z13-z15 + terrarium z11-z13, em cache local.
2. Cena: malha de relevo (exagero 1,5x), textura = carta, névoa creme, câmera oblíqua.
3. Comparar lado a lado com o terreno procedural atual (Portão 3).
4. Se o brilho da carta destoar do creme, corrigir levemente a curva de cor; a carta já tem paleta quente.

**Fallback de 1 hora:** o MapLibre com as mesmas duas fontes para confirmar se a carta "pega" visualmente, antes de investir.

## Fontes de mapa de 1870 com licença

| Fonte | Região | Datação | Licença / situação | Veredito |
|---|---|---|---|---|
| **IGN SCAN État-major 40k (WMTS Géoplateforme)** | Metz, Mars-la-Tour, Sedan (França da época) | 1825-1866, atualizações até 1889 | **Licence Ouverte 2.0**, crédito ao IGN | **Usar.** Tile testado |
| IGN SCAN État-major 10k (`ETATMAJOR10`) | mesma | minutas 1:10.000 | idem | Opcional, mais detalhe, conferir cobertura |
| Wikimedia Commons, categoria "Karte des Deutschen Reiches" (1.486 arquivos) | Alemanha imperial, inclui folha 568 Metz | série 1:100.000 **começa em 1893**, folha Metz com adendos até 1893 | domínio público por data, mas conferir cada arquivo | Anacrônico (23 anos depois), só como reforço. Não georreferenciado, exige warp |
| David Rumsey | "Karte des Deutschen Reiches 1893" (674 folhas) e outras | 1893 | Stanford indica **CC BY-NC-SA 3.0**. O site define "comercial" como venda de reproduções, mas dá e-mail para permissão comercial. **Ambíguo.** | **Não usar em vídeo monetizado sem permissão escrita** (carto@davidrumsey.com). Crédito: "David Rumsey Map Collection, David Rumsey Map Center, Stanford Libraries" |
| Mapire / Arcanum (Levantamentos Militares dos Habsburgos) | Boêmia (Königgrätz) | 2º levantamento 1836-52 | **Termos comerciais não encontrados**; Arcanum vende acesso | Só com consulta aos termos ou aos arquivos |
| CENIA (República Checa): "II. vojenské mapování" WMTS | Boêmia, Morávia (Königgrätz) | 1836-1852 | Licença do serviço **não confirmada** (ČÚZK passou a publicar em CC BY 4.0 desde 11/2023, mas isso não cobre o serviço da CENIA automaticamente) | Boa pista para o K18; confirmar no registro `micka.cenia.cz` |
| Allmaps (georreferência aberta, CC0) | vários | | georreferenciamento CC0, a imagem segue a licença do acervo | Útil para alinhar mapas do Commons/Gallica, renderiza no navegador sem tiles prontos |
| Gallica/BnF e Deutsche Fotothek | cartas francesas e alemãs de 1870 | | domínio público no geral, termos de reuso da BnF a conferir | Não verificado nesta rodada. Faltam folhas já georreferenciadas |

Lacunas desta pesquisa: não encontrei carta prussiana de 1870 georreferenciada com licença clara (o atlas do Estado-Maior de Moltke não foi verificado); licença do GLO-30 só por resumo; compatibilidade do plugin terrarium com overlay WMTS não testada.

## Fontes
- IGN SCAN Etat-Major 40k (Licence Ouverte 2.0): https://www.data.gouv.fr/datasets/scan-etat-major-r-40k-1
- Capabilities WMTS da Géoplateforme: https://data.geopf.fr/wmts?SERVICE=WMTS&REQUEST=GetCapabilities
- AWS Terrain Tiles / atribuição: https://registry.opendata.aws/terrain-tiles/ e https://github.com/tilezen/joerd/blob/master/docs/attribution.md
- 3DTilesRendererJS: https://github.com/NASA-AMMOS/3DTilesRendererJS (pasta `src/three/plugins/images`)
- geo-three: https://github.com/tentone/geo-three ; three-geo: https://github.com/w3reality/three-geo ; three-tile: https://github.com/sxguojf/three-tile ; three-geospatial: https://github.com/takram-design-engineering/three-geospatial ; BlenderGIS: https://github.com/domlysz/BlenderGIS
- Rumsey: https://davidrumsey.com/about e https://purl.stanford.edu/xh235dd9059
- Karte des Deutschen Reiches 1893 (Rumsey): https://www.davidrumsey.com/blog/2011/4/10/karte-des-deutschen-reiches-1893
- Commons: https://commons.wikimedia.org/wiki/Category:Karte_des_Deutschen_Reiches
- Licença Copernicus WorldDEM-30: https://documentation.dataspace.copernicus.eu/APIs/SentinelHub/Data/DEM/resources/license/License-COPDEM-30.pdf
- Allmaps: https://allmaps.org/

## Batedor executado (07/11/2026): rota escolhida e custo para o Remotion
Pasta: `D:/kriegschronik/batedor_mapa_real/` (`baixar_tiles.py`, `index.html`, `tirar_still.py`, `still_marslatour.png`). Rodou no PC (Chromium headless, sem G4). Total do batedor: cerca de 1 h.

**Rota escolhida: three.js NATIVO**, sem biblioteca de terreno. `PlaneGeometry` 512x512 segmentos (262 mil vértices), altura do terrarium decodificada em JS (`R*256+G+B/256-32768`), suavizada por média 3x3 duas vezes (tira os degraus do EU-DEM), exagero vertical 5x, `computeVertexNormals()`, `MeshStandardMaterial({ map: carta })`, `DirectionalLight` baixa (cerca de 22 graus) com `PCFSoftShadowMap` 4096, `Fog` creme, céu = `scene.background` creme. Deslocamento feito na CPU em vez de `displacementMap`, porque `displacementMap` não recalcula normais nem projeta sombra correta sem `customDepthMaterial`. Por quê não `3d-tiles-renderer`/geo-three/THREE.Terrain: para uma área fixa de 12,8 km o mosaico pré-baixado dispensa LOD, plugins e carregamento assíncrono de tiles; a rota 1 do ranking só compensa quando o take cobrir áreas grandes ou voo contínuo. GitHub (`gh search repos "three.js terrain heightmap texture drape"`) não trouxe nada acima de 7 estrelas; os candidatos úteis já estavam na lista acima.

**Dados:** carta état-major z14, 8x8 tiles (2048 px) cobrindo o mesmo quadrado que 4x4 tiles z13 (lat 49,067-49,182; lon 5,845-6,021); relevo = 3x3 terrarium z12 recortados para 512 px (181 a 331 m). Créditos: IGN (Licence Ouverte 2.0) e "Europe terrain data produced using Copernicus data and information funded by the European Union - EU-DEM layers".

**Linhas de código (medir com `wc -l`):** `index.html` 91 linhas (cena, relevo, rota, rótulo, câmera), `baixar_tiles.py` 45, `tirar_still.py` 20. Núcleo do terreno (decodificação + malha + material + luz): ~35 linhas.

**Horas para virar componente do Remotion: 3 a 4 h.** (a) `<TerrenoMapaReal bbox rota câmera />` em R3F com `useMemo` para a malha: 1 h; (b) pré-baixar os tiles por batalha para `public/` (script já pronto, parametrizar o centro) e carregar com `useDelayRender`/`delayRender` até a textura e o relevo chegarem: 1 h; (c) câmera por keyframes (`interpolate` sobre o frame), rota com `drawRange` progressivo, rótulos com serifa itálica: 1 a 1,5 h; (d) teste de render 1920x1080 e comparação com o terreno procedural: 0,5 h.

**Armadilha no PC:** o `chromium_headless_shell-1228` e o `chromium-1228` do Playwright falham com "Invalid file descriptor to ICU data" (sem `icudtl.dat`); usar `executable_path` do `chromium-1223/chrome-win64/chrome.exe` com `--use-angle=swiftshader --enable-unsafe-swiftshader`. TEMP no D:.

### v2 (07/11/2026): linguagem de cinema + miniaturas
`D:/kriegschronik/batedor_mapa_real/` : `baixar_tiles_v2.py` (área 4x, 25,6 km, carta 4096 px, relevo 1024 px), `index2.html?shot=wide|close`, `tirar_still2.py` -> `still_v2_wide.png`, `still_v2_close.png`. Borda dissolvida por máscara radial no `onBeforeCompile` (smoothstep 70-96 u) + névoa linear; FOV 20-24, câmera a 21-24 graus; DOF de 48 taps lido do depth texture, vinheta e grão de papel em um passe de shader; rótulos em HTML/CSS (nítidos, fora do DOF). Plano fechado: 8 cavaleiros prussianos e 4 canhões com `InstancedMesh`, procedurais (nas pastas pedidas só havia fuzis e figura Quaternius; busca ampla achou canhão pronto em D:/kriegschronik/tracer3d_14b_moltke_refacao/v1/public/maquete/krupp1880/scene.gltf e batedor_tmp/gewehr/assets/sketchfab/british_field_cannon_1815...; cavalo não existe). Portão 1: modelos procedurais de mesa de guerra; trocar por GLB Fab/Sketchfab CC0 se Eduardo achar tosco.
