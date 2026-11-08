# Stack dos vídeos de reconstrução aérea 3D e dos shorts estilo Zack D Films — o que o YouTube diz

Pesquisa de 03/11/2026. Foram 24 buscas na YouTube Data API, 28 transcrições lidas e as descrições/About dos concorrentes.
Transcrições em `D:/tmp/stackpesq/subs_txt/`; descrições brutas em `D:/tmp/stackpesq/desc_concorrentes*.txt` e `desc_tutoriais.txt`.
Notação de evidência: `videoId @ MM` = minuto da transcrição; `videoId (desc)` = descrição do vídeo.

> **Nota técnica (ferramenta de legenda):** o `legenda.py` (cliente `web_safari` + cookies) só baixava legenda manual. As legendas automáticas exigem PO Token e, sem ele, voltavam como SEM_LEGENDA (25 de 27 falharam). Criei o `D:/tmp/stackpesq/legenda_ios.py`, com cliente `ios`, sem cookies e com `--ignore-no-formats-error`. Ele baixou 25 de 30. Ficaram sem legenda: sjqtYcC8ovs, Xa6gjVfIpQo, Ci9Xc-VPc04 e Jmcg5ZSU8a8. Desses, só li a descrição.

---

## (a) Vídeos lidos

### Tipo 1 — reconstrução aérea / documentário 3D

| id | canal | views | o que ensina |
|---|---|---:|---|
| kiJrjKiQqSw | FxForge | 223 mil | Making-of de uma queda de avião no Blender: floresta, destruição, névoa volumétrica e pós no editor |
| 8MNTP1k3pcA | FxForge | 160 mil | Tutorial de fratura de avião: cell fracture + explode modifier + rigid body constraints |
| g7cug4F5Tg4 | OnlyRJ | 64 mil | Avião de linha voando sobre nuvens em 6 passos: modelo, rig com empty, HDRI de céu, nuvens volumétricas e render no Cycles |
| 2VSd7Ydvw44 | MLT Studios | 324 mil | Formação de F-35 em 1 dia: nuvem como imagem de fundo (não volumétrica), tremor de voo e Camera Shakify |
| Xa6gjVfIpQo (desc) | MLT Studios | 8 mil | Pacote "Aerial Skies": HDRIs tirados acima das nuvens + node SkyParallax + rig de avião em Geometry Nodes |
| GlsRBIGOd4o (desc) | Julien Herbey | 122 mil | Avião + nuvens volumétricas no Cycles X: configurações de render |
| 6_vwVjODhog | adrien_ltn | 96 mil | Nuvens procedurais em Geometry Nodes (Cloud Creator), otimização de render de volume e rastro de avião |
| 7AxV43UAW1w | MLT Studios | 31 mil | Rastro de fumaça sem simulação (partículas + shader) |
| eug3NGpmv-0 | ArchyViz | 90 mil | Baixar a cidade fotogramétrica do Google em glTF (programa externo) → Blender |
| hrDW0Gh0tx4 | ARBES | 210 mil | Google Maps 3D → Blender via RenderDoc + MapsModelsImporter, com aviso de licença |
| cz2a-oNZbvw | Matt Linkert | 27 mil | Cesium for Unreal + Google Photorealistic 3D Tiles; nuvem e névoa no UE5 |
| Yq1Y2FWj5aQ | Nico Linde | 136 mil | Céu fotorreal no Unreal com HDRI Backdrop (Poly Haven) |
| GsojLuJpe_0 | Johnny Harris | 1,55 mi | Como ele faz os mapas: After Effects + GEOlayers + Mapbox Studio + Natural Earth |
| WqJa957IHXM | Flat Pack FX | 113 mil | Rota 3D no GEOlayers: mapa escuro com tint, linha com gradiente e glow, trim paths |
| smvs2fkFdLs | MapMotion Studio | 40 mil | Rota KML no Google Earth Studio + revelação da linha no After Effects |
| sjqtYcC8ovs (desc) | 76 Ground School Chick | 1 mil | ADS-B → caminho 3D no Google Earth, citando reconstrução de acidente |
| oKUiq7ogeUc | Brooker Films | 187 mil | Waveform reativo ao áudio no After Effects (Audio Spectrum) |
| nTIHdadpbQU (desc) | ApexaPro | 2 mil | Short sobre o Learjet: lista nos créditos a stack procedural no Blender a partir de ADS-B |

### Tipo 2 — explicador estilo Zack D Films / Blender com IA

| id | canal | views | o que ensina |
|---|---|---:|---|
| GiIuE5Qxylo | Rozz | 961 mil | Estimativa de custo de um short do Zack D (Blender/Unreal, equipe). É boato, sem fonte |
| aCzbfDGmgzg | Odin Lee | 482 mil | Making-of do 1º curta oficial do Zack D, feito no Blender: mocap, equipe e render farm |
| dbPMO3-r8mY | Zyck Wealth | 176 mil | Short Zack D do zero no Blender: cubo com grid azul, Mixamo, câmera com trava no alvo, luz, Eevee |
| PJ4_a_cCjmQ | osasart | 3 mil | O fundo azul do Zack D: cubo com bevel + gradiente no compositor; samples e resolução |
| syqiCCGltDw | osasart | 5 mil | O "contorno brilhante" de destaque (Layer Weight + Emission animado) |
| W4AEyFEar4I | Architecture Topics | 28 mil | Animação de vista explodida |
| cF-lHVv09a4 | 5 Minutes Blender | 18 mil | Revelar o interior com shader transparente controlado por um Empty (corte/raio-X) |
| 2cdiRopMoeQ | ReachMora | 713 mil | Rota 100% IA: ChatGPT → Nano Banana → ElevenLabs → Grok → CapCut |
| zn1vtOmzvtA | Mahmut Kasimoglu | 84 mil | Rota IA: GPT treinado em roteiros do Zack D, quadro inicial e final, ElevenLabs v3 com SFX |
| q4IlJA0mC_I | Isa does AI | 25 mil | Rota IA: bloco de "style lock" (fundo ciano em gradiente) + Seedance 2.5 em 30 s num prompt só |
| YQBO5de575Y | Building Aeon | 58 mil | Instalação do MCP oficial do Blender com Claude Desktop, Codex e Gemini CLI |
| 4q848NbVQQQ | Styliz 3D | 4 mil | Claude + Blender MCP: testes de cena, Geometry Nodes e animação (walk cycle falhou) |
| r7H60u0kHRA | Max Novak | 382 mil | Claude + blender-mcp (ahujasid): agente que monta assets prontos via metadados; limites |
| 86kBIu5_2kM | Jacksons AI | 5 mil | Claude Code + plugin de skills que gera animação em Remotion + three.js a partir de um PDF de estilo |
| Ci9Xc-VPc04 (desc) | Code Bear | 80 mil | Claude Code + Blender MCP: cena low-poly a partir de imagem de referência |

---

## (b) A stack por tipo de vídeo, segundo as fontes

### 1. Reconstrução aérea (estilo Reconstructed / Fault Lines / WIDER / 3DCrash)

#### 1.1 Avião (modelo e material)
- **Fonte do modelo:**
  - Sketchfab: 8MNTP1k3pcA @01; FxForge kiJrjKiQqSw @02. O Reconstructed também usa (seção c).
  - CGTrader com filtro "free", em .blend/.obj/.fbx; dar crédito ao autor (g7cug4F5Tg4 @01–02).
  - Modelo gratuito de F-35 sem detalhe para close; o MLT adicionou detalhe só onde a câmera chega (2VSd7Ydvw44 @00, @06–07).
- **Limpeza do modelo de loja:**
  - Alt+P "clear parent keep transform" e apagar os empties: g7cug4F5Tg4 @02–03; 8MNTP1k3pcA @01.
  - Apagar o trem de pouso (em voo ele fica recolhido) e fechar o buraco com merge by distance + F (g7cug4F5Tg4 @04–05).
  - Parentear tudo a um Empty que carrega a animação (g7cug4F5Tg4 @05).
- **Material metálico:**
  - Roughness 0,1 na fuselagem e nas asas (g7cug4F5Tg4 @06).
  - Roughness controlado por color ramp, porque o metal saiu brilhante demais (2VSd7Ydvw44 @03).
  - Grunge map no roughness do vidro (2VSd7Ydvw44 @06).
  - Nenhuma fonte ensinou pintura (livery) ou metal de avião comercial em detalhe (ver d).

#### 1.2 Movimento e câmera
- **Escala de velocidade:** a 575 mph o jato andaria 1.285 m em 5 s e fica rápido demais na tela. O tutor usa ~20 m em 5 s, mais 9° de rolagem lenta (g7cug4F5Tg4 @06–08).
- **Fans dos motores:** rotação com keyframe + extrapolação linear (Shift+E) (g7cug4F5Tg4 @08–09).
- **Câmera:** lente 20–25 mm, keyframes de início e fim com movimento por WASD (g7cug4F5Tg4 @09–10).
- **"Câmera colada na fuselagem":** nenhum tutorial de aviação mostrou. O mais próximo:
  - Camera Shakify (add-on do Ian Hubert) + modificador Noise nas F-curves dos jatos (2VSd7Ydvw44 @11);
  - constraint Track To travando a câmera no objeto (dbPMO3-r8mY @37–38).
- **Rig pronto de voo:** o pacote Aerial Skies traz rig em Geometry Nodes para banking/jitter/flutuação e o node "SkyParallax", que finge o deslocamento do céu de fundo (Xa6gjVfIpQo, desc).

#### 1.3 Céu e mar de nuvens (o ponto mais caro)
- **Rota A — só HDRI (rápida):**
  - HDRI de céu "puro", sem chão, do Poly Haven ou do "HD aerial sky" da ProductionCrate (EXR 3K); Mapping + Texture Coordinate para girar (g7cug4F5Tg4 @10–12).
  - O pacote Aerial Skies tem HDRIs tirados acima das nuvens, até 16K, em .exr/.hdr (Xa6gjVfIpQo, desc).
- **Rota B — foto de nuvem como fundo (MLT, 324 mil views):**
  - Desistiu das nuvens volumetric: pouco realistas e render "dramaticamente" mais lento.
  - No lugar: imagem de nuvens no fundo + esfera gigante com shader de emissão usando a mesma imagem (ilumina o avião) + plano escuro fora de quadro para escurecer a barriga do avião (truque do Ian Hubert) + sun lamp (2VSd7Ydvw44 @02).
  - Fundo estendido no Photoshop e upscale por IA (2VSd7Ydvw44 @09, @11).
- **Rota C — nuvens volumétricas reais:**
  - Cubos com Principled Volume e node setup do CGMatter (noise 4D com W animado para a nuvem se mexer) + sol forte 10 (g7cug4F5Tg4 @12–20).
  - Render: Cycles na GPU, 300 samples, OIDN, noise threshold 0,1, light paths 4/4/4, volume 1, transparent 8, total 12, motion blur, persistent data, saída em PNG (g7cug4F5Tg4 @21–22).
  - Cloud Creator (Geometry Nodes; versão grátis e Pro no Gumroad) converte qualquer malha em nuvem. O autor descarta VDB de Houdini/EmberGen por ser inflexível (6_vwVjODhog @00–02).
  - Otimização: culling por câmera (6_vwVjODhog @09) e max steps de volume entre 10 e 25 (@12).
  - "90% luz, 10% shader": a luz vem do HDRI, de HDRI Haven/Poly Haven (6_vwVjODhog @12–13).
  - Renderizar as nuvens em camada separada, a cada 2 a 10 frames, interpolar no Flowframes e exportar passes de volume direct/indirect em EXR (6_vwVjODhog @15–16).
  - Referência de custo: Cycles X a 1.024 samples com OptiX leva ~3 min por frame em 2K numa RTX 3090; composição no AE (GlsRBIGOd4o, desc).
- **Rastro de condensação:** pontos espalhados em Geometry Nodes com simulation zone → Cloud Creator (6_vwVjODhog @10).

#### 1.4 Cidade fotogramétrica + fumaça
- **Google 3D direto no Blender:**
  - Programa avulso "Google Earth decoder" (com o fix publicado no flightsim.to): seleciona a área e o LOD, exporta glTF, import no Blender, "find missing files" para as texturas. Para LOD alto, dividir em 9 tiles e alinhar à mão (eug3NGpmv-0 @00–04, desc).
  - Rota antiga: RenderDoc 1.26 + add-on MapsModelsImporter capturando o Google Maps 3D (hrDW0Gh0tx4 @00–03).
  - O próprio tutor alerta: o uso comercial é discutido, "use para referência" (hrDW0Gh0tx4 @03).
- **Google 3D no Unreal:**
  - Cesium for Unreal + Google Map Tiles API (exige cartão no Google Cloud) (cz2a-oNZbvw @01–03).
  - Georeference por lat/long (@04); cache de tiles maior, ~4 GB, e frustum culling desligado (@05–06).
  - Volumetric clouds + exponential height fog (@06); Cesium Sun Sky com data e hora reais (@07); cartographic polygon para recortar a área (@07–08).
- **Céu fotorreal no UE5:** plugin HDRI Backdrop com céus puros do Poly Haven ou da 2GAcademy, skylight do backdrop, directional light alinhada ao sol do HDRI e cor da névoa amostrada do céu (Yq1Y2FWj5aQ @00–03).
- **Fumaça e destroços:**
  - Rastro sem simulação: curva Bezier com Follow Path, bake action com visual keying, partículas de icosfera que crescem via textura de tamanho, Brownian baixo, material volume scatter ou diffuse+emission (7AxV43UAW1w @00–04).
  - Névoa: um cubo gigante com volume de densidade muito baixa (kiJrjKiQqSw @06).
  - Destruição: remesh → cell fracture (~250 peças) → rigid body com "connect / chain by distance" breakable (threshold 15) → knife project em grade → quick explode, com peças parenteadas por script (8MNTP1k3pcA @02–07; kiJrjKiQqSw @02–03).
  - O FxForge diz que o ChatGPT escreveu o script de parentesco (kiJrjKiQqSw @03).
  - Impacto no chão: Dynamic Paint deformando o terreno + partículas de detrito (kiJrjKiQqSw @03–04).
  - Vegetação reagindo: proxy low-poly com cloth + surface deform (kiJrjKiQqSw @04–05).
  - Nenhuma fonte ensinou uma pluma de fumaça em escala de cidade.
- **Pós:** render em sequência PNG (pausável) e grading/aberração cromática fora do Blender, no AE ou HitFilm (kiJrjKiQqSw @06).

#### 1.5 Mapas de satélite escuros com rota
- **After Effects + GEOlayers (~US$ 200):** é o padrão Vox/Johnny Harris (GsojLuJpe_0 @01, @12).
  - Estilo próprio no Mapbox Studio, grátis para uso não comercial (@14).
  - Contornos de país do Natural Earth pelo hub de dados (@21).
  - Keyframes de lat/long/zoom/bearing/pitch.
- **Mapa escuro com rota:**
  - GEOlayers "connect features" traça a rota por estrada (WqJa957IHXM @02).
  - Tint escurece o mapa sem afetar a linha; gradient ramp + glow duplicado na linha (@03–04).
  - Trim paths revela a linha (@05); keyframes em continuous bezier (@06).
- **Rota grátis:**
  - Estilizar o KML no Google Earth Pro (cor e espessura) (smvs2fkFdLs @00).
  - Importar como overlay no Google Earth Studio e fazer dois cloud renders, com e sem a linha (@01–02).
  - No AE: máscara que avança para revelar a linha, ou difference matte para isolar a linha e pôr glow (@03–06).
- **ADS-B → 3D:** a 76 Ground School Chick importa os dados de voo no Google Earth para reconstrução de acidente (sjqtYcC8ovs, desc; sem transcrição).

#### 1.6 Áudio do ATC com waveform
- AE: efeito Audio Spectrum (ou Audio Waveform) num sólido preto (oKUiq7ogeUc @01–05).
  - Audio layer = a faixa; frequency bands 200; maximum height ~500; thickness 5; softness 0.
  - Display digital ou analog lines; o path pode seguir uma máscara.
- **Transcrição karaokê sincronizada: nenhuma fonte.** O WIDER mostra o ATC só como texto transcrito, sem tocar o áudio (seção c).

### 2. Explicador estilo Zack D Films

#### 2.1 O que se sabe do próprio Zack D
- O primeiro curta oficial foi feito no **Blender** (aCzbfDGmgzg @00–06):
  - mocap por IA do próprio animador ("3D Kit") para atuar cada cena e as expressões faciais (@01);
  - personagens de um designer, limpeza de mocap por outro animador (@01–03);
  - cenários em 1 a 3 dias cada (@03);
  - render em GPU farm com até 15× RTX 5090 (@04);
  - narração da equipe do Zack D; pós "só glows e distorções simples" (@06).
- Boato sem fonte (GiIuE5Qxylo @00): Blender + Unreal, ~US$ 500 em assets/plugins, ~US$ 2.000 de equipe e ~US$ 500 de render, cerca de US$ 3.000 por short.

#### 2.2 Rota Blender (replicando o visual)
- **Fundo "estúdio azul":**
  - Cubo-cenário com bevel de 4 segmentos e material "blueprint" do add-on **BlenderKit** (PJ4_a_cCjmQ @00).
  - O gradiente azul do fundo entra pelo compositor: film transparent + Alpha Over de uma imagem de gradiente + Hue/Sat (@02–04).
  - Variante: textura de grade azul no cubo com UV escalado (dbPMO3-r8mY @03–07).
- **Render:** 50 samples com limite de 3 s por frame; 1080×1920 a 200% (PJ4_a_cCjmQ @05–06).
  - Eevee em 1080×1920, 30 fps; 150 frames levaram 3 a 4 h (dbPMO3-r8mY @31–32, @49).
- **Personagens:** Mixamo, com rig e animação prontos; props em FBX; constraint Child Of para a arma ou a bala seguir a mão (dbPMO3-r8mY @08–09 e seguintes).
- **Câmera:** Track To travada no objeto em movimento, o efeito "lock-on" (dbPMO3-r8mY @37–38).
- **Luz:** area light alta + spots com blend alto, Track To nas luzes e luzes de contorno laterais (dbPMO3-r8mY @44–48).
- **Grama:** hair particles, 50 a 100 mil (dbPMO3-r8mY @42–43).
- **Contorno brilhante de destaque:** Layer Weight (Facing) → Color Ramp → mistura Principled com Emission verde, vermelho ou azul; animar o fator do Mix (syqiCCGltDw @00–04).
- **Corte e raio-X:** Mix com Transparent BSDF dirigido pela posição de um Empty (Texture Coordinate Object → Separate XYZ ou Gradient Texture easing/quadratic sphere); no Eevee, alpha clip (cF-lHVv09a4 @00–03).
- **Vista explodida:** separar por partes soltas, convert to mesh, origin to geometry, pivot no 3D cursor só com locations, escalar para espalhar e pôr keyframe (W4AEyFEar4I @00–01).

#### 2.3 Rota 100% IA (sem 3D)
É a mais vista nos tutoriais.
- **ReachMora (713 mil)** (2cdiRopMoeQ @02–05):
  - ChatGPT gera ideias e roteiro e reescreve a transcrição de um viral;
  - Nano Banana gera as imagens (9:16 via imagem de referência);
  - ElevenLabs faz a voz; Grok Imagine faz imagem→vídeo; CapCut monta.
- **Mahmut Kasimoglu** (zn1vtOmzvtA @01–05):
  - GPT customizado com títulos e transcrições de 10 vídeos do Zack D;
  - Nano Banana Pro no OpenArt, com quadro inicial e final por cena para guiar o vídeo;
  - ElevenLabs v3 para voz e SFX; montagem no Filmora.
- **Isa does AI** (q4IlJA0mC_I @01–03 e depois):
  - "Style lock" escrito uma vez só: render 3D estilizado, superfície levemente plástica, sombra suave, "not photorealistic, not cartoon, no outlines", fundo em gradiente radial ciano→azul-claro, sem chão nem horizonte, sem texto.
  - Imagens no GPT Image 2.
  - Escolher temas de um objeto mecânico só: sem multidão, rosto ou biologia, que são o ponto fraco dos modelos de vídeo.
  - Seedance 2.5 gera 30 s de uma vez com 6 imagens de referência, 1080p e áudio nativo.

#### 2.4 Blender guiado por LLM (Claude + MCP)
- **Duas opções:**
  - **MCP oficial do Blender** (blender.org/lab/mcp-server, Blender 5.1+). Instalação: add-on arrastado duas vezes, clonar o repositório, rodar com `uv` (pode faltar `docutils`) e configurar Claude Desktop, Codex ou Gemini CLI (YQBO5de575Y @00–04, desc). Também aparece no Claude como conector "Blender" (4q848NbVQQQ @03–04).
  - **blender-mcp do ahujasid (GitHub):** addon.py + config do Claude Desktop + `uv` (r7H60u0kHRA @00, @12–14).
- **Onde funciona:**
  - Ler a cena e fazer mudanças em lote, por exemplo um modificador em centenas de objetos (4q848NbVQQQ @05–08).
  - Animação em Geometry Nodes (onda) em 3 a 4 min (4q848NbVQQQ @06–07).
  - Renomear objetos e escrever plugins pequenos sob demanda, como um seletor de HDRI e luz (r7H60u0kHRA @05–07, @09–10).
  - O uso que o Max Novak defende (382 mil views): montar **assets e materiais prontos** guiado por metadados JSON gravados nos objetos, trocando só cor e ramp (r7H60u0kHRA @00–04, @07–08).
- **Onde falha:**
  - Modelar do zero vira primitivas (r7H60u0kHRA @14–15; YQBO5de575Y @05: "mostly basic geometry").
  - Animação de personagem: o walk cycle num rig Mixamo dobrou as pernas ao contrário (4q848NbVQQQ @10–11).
  - LLM local (Qwen) estoura o contexto em 2 ou 3 mensagens (YQBO5de575Y @05–06).
  - O MCP só fala com o primeiro Blender aberto (4q848NbVQQQ @09).
- **Alternativa por código, sem Blender:** Claude Code + plugin de skills que lê um PDF de estilo, instala Remotion + three.js, faz um smoke test, um "style lock test" comparado lado a lado com a referência e fichas de personagem antes de produzir (86kBIu5_2kM @01–05).

---

## (c) O que os concorrentes creditam

Nenhum dos quatro diz que software 3D usa.

**Reconstructed** (r0GEWIvgeDc, desc; 22,8 mil inscritos)
- **Créditos:**
  - Áudio: LiveATC.net (Miami Center).
  - **Modelo 3D:** "Bombardier Learjet 45" do Sketchfab, de *rammgraffic*, CC BY 4.0, **"recoloured and animated"**. É um Learjet 45 usado no lugar do 60.
  - **Satélite:** Sentinel-2 cloudless (EOX IT Services, CC BY 4.0).
  - Chão: USGS NAIP. Mapa: OpenStreetMap (ODbL). Foto: Wikimedia Commons.
  - Radar: NOAA NEXRAD via College of DuPage NEXLAB.
  - Trilha do voo: Flightradar24.
  - Manchetes: PBS/AP, NBC, WPTV etc.
- **Operação:**
  - Página de fontes no próprio site (reconstructed.app/sources/...).
  - Cerca de 1 a 2 uploads por dia sobre qualquer notícia (avião, trem, hack, tiroteio, enchente), cada pauta em duas versões: longa e "(3D)" (playlist de uploads).
  - Rede de canais (reconstructed.tv) e bônus para membros.
  - O ritmo e a variedade sugerem uma pipeline muito automatizada, mas isso é inferência, não fato declarado.

**WIDER** (M8MB-1In6Ik, g7aFuI_KLME, kifV4XQwuNY, desc; 1,2 mil inscritos)
- **Dados:**
  - ADS-B de **airplanes.live + adsb.lol**, duas redes independentes cruzadas.
  - Descida calculada por eles a partir dos pontos de altitude GPS, declarado na tela.
  - O ATC (LiveATC) aparece **"as transcribed text, not played"**.
  - Clima: NOAA AWC (SIGMET/METAR) e sondagem de altitude.
- **Mapas:** OpenStreetMap, **Esri World Imagery**, Natural Earth; elevação NASA SRTM/USGS.
- **Som:** Freesound (CC0/CC BY) + **Sonniss GDC 2024**. Música: YouTube Audio Library.
- Afirmam que "All 3D scenes and motion graphics were made for this film".
- Tem um bloco longo de ressalvas jurídicas: reconstrução ilustrativa, sem acusação.

**Fault Lines Official** (dcfldWqanJc, _peYDAe_PQI, About; 7 mil inscritos)
- Não credita nada. Diz apenas "public ATC audio, flight-tracking data reported by the media" e "the flight path is illustrative".
- O About descreve "isometric blueprints, animated diagrams and cinematic visuals".
- Faz duas versões por evento, mais compilações.

**3DCrash** (kS3nDH76vkE, 4D_ezbB_Lyw, E6QGjnyibeg, desc; 31,7 mil inscritos)
- Música Soundridemusic (sem copyright).
- **Credita clipes de outros animadores do YouTube:** aircrashanimations, MPCFlights, AeroReelFX, AviFX2000, AndrewPrisma3D, mayday_disasterTH, Washington Post.
- Tem disclaimer de "clips sourced from across the internet". Ou seja, é em boa parte uma **compilação de animação de terceiros + narração**, não uma pipeline 3D própria.

**Pequenos concorrentes no mesmo evento:**
- **ApexaPro** (nTIHdadpbQU, desc):
  - "3D path, generic jet and animation made by apexapro (**procedural, Blender**) from public ADS-B data".
  - Arquivos ADS-B do Flightradar24; fontes Inter e Anton (OFL); "sound generated by code"; voz **ElevenLabs**.
- **Ready To Be Surprised** (F86vjXb8qFQ, 117 mil): dados do ADS-B Exchange + BizJet Journal; avião e cenário "illustrative".

---

## (d) Lacunas — o que nenhuma fonte cobriu

1. **ADS-B/CSV → keyframes no Blender ou Unreal.** Ninguém mostrou o passo a passo. O mais perto: o ApexaPro diz que faz isso de forma procedural no Blender, e um vídeo sem legenda faz via Google Earth/KML.
2. **Câmera de perseguição colada na fuselagem**, sobre o mar de nuvens. Não há tutorial específico; só Track To, Child Of e Camera Shakify espalhados.
3. **HUD mínimo de altitude/razão de descida** sincronizado aos dados. Nenhuma fonte.
4. **Transcrição tipo karaokê do ATC** sincronizada à waveform. Nenhuma fonte; o WIDER evita tocar o áudio.
5. **Pluma de fumaça em escala de cidade** sobre a cidade fotogramétrica. Só apareceu rastro de partícula; a menção a VDB do EmberGen veio sem tutorial.
6. **Satélite escurecido** (Sentinel-2 ou Esri em "modo noturno"). Só o tint do GEOlayers.
7. **Que software os concorrentes usam** (Blender, Unreal, three.js/Cesium, After Effects?). Nenhum dos quatro declara.
8. **Pipeline real do Zack D nos shorts comuns.** Não há making-of de primeira mão; só o curta longo (Blender) e um boato de custo.
9. **Licença** das Google 3D Tiles no Blender para uso comercial. Só o alerta do ARBES; ninguém tratou das regras de atribuição da Map Tiles API nem do Google Earth Studio.
10. **Livery e metal de avião comercial** em close. Nada além de roughness baixo e grunge.
11. **Unreal para documentário aéreo.** Nenhum making-of de canal do gênero; só Cesium e céu genéricos.
