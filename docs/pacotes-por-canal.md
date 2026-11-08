# Pacotes, bibliotecas e assets prontos por canal (mapa vivo)

Atualizado em 03/11/2026. Regra de origem: portão 1 do `CLAUDE.md` e passo 0 de `docs/BATEDOR.md`, **pronto antes de construir**.

**Legenda:**
- **Na biblioteca:** já adicionado à conta Epic/Fab do Eduardo.
- **No projeto:** baixado pelo Epic Launcher para o projeto vazio `D:\unreal3d\fab_projeto\FabPacotes`, de onde sobe para a G4.
- **Candidato:** levantado, ainda não adquirido.
- **Descartado:** avaliado e recusado (motivo ao lado).

> **Como um pacote do Fab chega à G4 (Linux, sem tela):**
> 1. Adicionar à biblioteca no fab.com, com o aceite de licença feito pelo Eduardo ou por mim com o OK dele.
> 2. No Epic Launcher do PC (instalado em `D:\Epic Games`, cache em `D:\EpicVault`): **Fab → My Library → "+" → Add to Project → FabPacotes**.
> 3. `python D:\unreal3d\quadros.py fab` sobe `FabPacotes\Content\*` para o projeto na G4.
>
> **Plugins** (como o Cesium) não usam "Add to Project": instalar a build Linux do release no GitHub direto na G4.

---

## Kriegsmomente (DE) — stack Unreal 5.8 na G4

**Direção de arte aprovada:** 3D estilizado ("fofo", referência Elapsed), com tom de guerra dado pela gradação madura, pela luz e pela câmera, não pelo asset. O realista (Megascans) foi recusado por ser realista demais. Pacotes pagos ficam fora por enquanto ("vamos de opções grátis").

| Elemento | Pacote | Licença / preço | Status | Uso |
|---|---|---|---|---|
| Vegetação estilizada | **Cozy Nature – Foliage Pack** (ATRV Studio) | Fab Standard, grátis | No projeto (39 MB) | Mapas de demonstração `Showcase` e `DemoMap`, vento, 21 malhas. Batedor de 02–03/11 |
| Árvores estilizadas | **FREE Stylized Forest Sample** (StyleHex Studio) | Fab Standard, grátis | No projeto (77 MB) | Mapas `World_Demo` e `Preview_Scene` |
| Terreno / chão | **MW Landscape Auto Material** (MAWI United) | Fab Standard, grátis | No projeto (702 MB) | Material automático de paisagem sobre relevo real (DEM) para mapas e campos de batalha |
| Fumaça, fogo, explosões | **Realistic Starter VFX Pack Vol 2** (FX Cat UA) | Fab, faixa **Personal grátis** (até US$ 100 mil/ano) | No projeto (111 MB) | Salvas de artilharia, pólvora, casas em chamas (Niagara, renderiza na G4) |
| Relevo real | **Copernicus DEM GLO-30** (ou DGM/IGN nacional) importado como Landscape + MW Landscape | Copernicus: uso comercial, crédito na descrição | Em uso (GLO-90 nos vídeos) | Gravelotte, Sedan, Boêmia. **Sem Cesium ion** (exige logo na tela) |
| Ferramenta de geo | **Cesium for Unreal** (plugin; `CesiumForUnreal-58-v2.31.0.zip` já inclui Linux) | Apache 2.0, sem crédito na tela | Na biblioteca | Só como carregador de dados **nossos** (Copernicus/DGM/IGN). **Sem dados do Cesium ion e sem Google Tiles** (rota decidida em 03/11) |
| Filtro "pintado" | **UnrealPostProcessingShaders** (GitHub UnrealVFX) | Apache-2.0, grátis | Candidato | Kuwahara (óleo). Opcional, para um toque de pintura de época |
| Soldados 1870 | Andy Woodhead: Prussian Infantry, French Infantry, Dreyse needle gun (Sketchfab) | CC BY 4.0, crédito na descrição | Em uso | Rig por transferência + animações Mixamo; Dreyse presa ao esqueleto |
| Animações | Mixamo (Adobe) | Uso comercial em vídeo | Em uso | Marcha, tiro, assalto, mortes |
| Céus | Poly Haven HDRIs | CC0 | Em uso | |
| Kit low-poly antigo | Quaternius Stylized Nature / Medieval Village | CC0 | **Substituir** | Visual "PS2" (flat-shaded); fica como reserva |
| PCG e cenários nativos | PCG Biome Core/Sample, City Sample (PCG), Electric Dreams | Grátis (Epic) | Candidato | Espalhamento procedural de vegetação; o Electric Dreams vale pela lógica, não pelo visual |

**Candidatos pagos (não adquiridos):**

| Pacote | Preço visto | Observação |
|---|---|---|
| Windvale: Stylized Meadow (Hivemind) | ~US$ 40 | Campo europeu com trigo, cercas e moinho; o mais próximo de 1870 no estilizado |
| Stylized Trees \| Oak Forest / Birch Forest (So Stylized) | US$ 24,99 cada | UE 5.2–5.8 |
| Medieval Farmstead Environment \| Rural Farm (Barrel Bark) | R$ 271,83 Personal | UE 5.6–5.8, projeto completo; tom sério |
| Brushify – Country Roads Pack | R$ 135,89 Personal | Estradas por spline e material automático de paisagem |

**Descartados:**
- Megascans e temperate Vegetation (Project Nature): realistas demais para o canal (decisão de 02/11).
- Voxel Biomes: Meadow: visual voxel.

---

## Segundo a Segundo (ES) — kit "maquete" (Remotion + three.js) e, a partir de agora, Unreal para as cenas pesadas

**Direção:** reconstrução no estilo Reconstructed, com o local real do acidente e a trajetória por cima. Design premium (paleta, céu, UI) e fim da maquete branca (`docs/segundo-a-segundo-stack.md`).

| Elemento | Pacote / biblioteca | Licença | Status | Uso |
|---|---|---|---|---|
| Cidade e relevo reais | **Relevo Copernicus/LiDAR nacional + prédios do OpenStreetMap** convertidos em modelo nosso; plugin Cesium só como carregador | Crédito só na descrição | **Rota escolhida (03/11)** | Local exato do acidente (ex.: Greenacres/Palm Beach), voo sobre o relevo real |
| Fogo e fumaça do impacto | Realistic Starter VFX Pack Vol 2 | Fab Personal grátis | No projeto | Cenas de impacto (plano médio/longo, com respeito) |
| Nuvens volumétricas (three.js) | **`@takram/three-clouds`** (+ `@takram/three-atmosphere`, já no projeto) | MIT | Candidato | Substitui o shader de nuvem feito à mão em 02/11 (`kit/maquete/ceu.ts`) |
| Céus de foto | Poly Haven `kloofendal_48d_partly_cloudy_puresky`, `kloofendal_overcast_puresky` (4K) | CC0 | Em uso no batedor Céu 2.0 | |
| Avião | Bombardier Learjet 45 (rammgraffic, Sketchfab) | CC BY 4.0 | Em uso | Reescalado para o 60 |
| Mapa de ruas | OpenStreetMap | ODbL, crédito na descrição | Em uso | Até o Cesium entrar |

**Rota de geo (decisão do Eduardo, 03/11/2026):**
- **Dados:** só dados públicos com crédito na descrição (Copernicus, IGN, DGM, OpenStreetMap).
- **Plugin Cesium:** apenas como ferramenta.

**Descartados:**
- **Cesium ion** (World Terrain, Bing, OSM Buildings): exige logo "Cesium ion" na tela. O plano grátis é não comercial; o Commercial custa US$ 149/mês e os vídeos teriam de sair do ar se a assinatura fosse cancelada. O plano Commercial chegou a ser assinado em 03/11, mas não é usado.
- **Google Photorealistic 3D Tiles:** só vídeo promocional de até 30 s, logo do Google na tela e proibição de cache.

Detalhes em `D:\unreal3d\LICENCA_CESIUM.md`.

---

### Takes explicativos do Kriegsmomente (decisão do Eduardo, 04/11/2026)
| Peça | Pronto | Licença | Uso |
|---|---|---|---|
| Conceito, texto, dado e linha do tempo | **Remotion Skills** (oficial, `remotion-dev/skills`, clonado em `D:/pesquisa_nichos/remotion_skills`), na gramática do vídeo de referência "The Machine That Learned" (leitura a 25 fps em `D:/pesquisa_nichos/leitura_otica/ref_remotion/`) | ver o repo | motion graphics em Remotion |
| Máquina e mecanismo (telégrafo, Dreyse, Krupp…) | **machine-skill** (`AirsupHQ/machine-skill`, clonado em `D:/pesquisa_nichos/machine_skill`), com shot/record NA G4 por `D:/pesquisa_nichos/machine_skill_g4/g4_machine.py` | MIT | HTML three.js com PBR, solver e explode/cutaway/x-ray + filme |
| GLB → componente React com peças nomeadas | **gltfjsx** (pmndrs) | MIT | animar peças de modelos prontos (Smithsonian/Sketchfab) dentro do Remotion com `@remotion/three` |
| Cena 3D em React | **React Three Fiber** + three.js (já em uso no Tracer3D) | MIT | — |
| Keyframes de câmera 3D | **Theatre.js** | Apache-2.0 (core) | só se for preciso ajustar uma câmera à mão; o padrão segue com keyframes em código, que são determinísticos |
| Upscale de imagem de época em baixa resolução | **Real-ESRGAN** (xinntao) | BSD-3 | NA G4, 4×, antes de entrar no vídeo (ex.: retrato de Abeken com 680 px) |
| Recorte de personagem de retrato ou gravura | **rembg** (danielgatis) | MIT | NA G4: o personagem recortado entra sobre o fundo do motion Remotion |
| Uniformizar a cor das imagens de época | **color-matcher** (hahnec) | GPL-3.0 (só ferramenta, a imagem sai livre) | NA G4: todas as imagens gradeadas para uma referência |
| Detecção de cortes | **PySceneDetect** | BSD-3 | régua e leitura ótica (no lugar do filtro scene do ffmpeg) |
| Câmera lenta / interpolação | **RIFE** | MIT | só se preciso (os filmes da machine-skill já saem quadro a quadro) |
| Fora do nosso uso | Auto-Editor, vid.stab, librosa (DE sem música), HyperFrames (padronizamos Remotion) | — | — |
| Máquina como prancha de gravura (reserva) | **Kalem / Levha** (leodavincs/kalem; clone em `D:/pesquisa_nichos/kalem`) | MIT | NA G4. Gravura sem Codex: SDXL + ControlNet NA G4 |
| **Máquina e objeto (PADRÃO do Kriegsmomente, Eduardo 04/11)** | **teardown** (elvarofficial/teardown, base whaleyxbt/claude-motion: captura quadro a quadro + som sincronizado) e machine-skill | MIT | vídeo de máquina moderna ou página interativa; lição: 1 imagem de referência por máquina, 1 entrada move tudo, gráfico que anda com a peça |

## Página FB ¿Qué Pasaría Si? 3D — reels de notícia (Remotion + R3F, modo barato)
Detalhes em `docs/canais/fb_que_pasaria_si/reels_noticia.md`.

| Elemento | Pacote | Licença / preço | Status | Uso |
|---|---|---|---|---|
| Kit-base de arte | **Polyfork** (polyfork.dev), kits `roadside-americana`, `frontier-town`, `campground-lake` | Grátis, uso comercial; GLB sem conta; `.mjs` com chave grátis (não redistribuir) | **Em uso** (batedor Tempe aprovado em 08/11) | Paleta e escala únicas por kit. Começar por `/api/kits` + `/api/assets/{id}/matching` |
| Receitas de acabamento three.js | **Threejs-Awesome-Graphics-Agent-Skills** (GitHub scottstts) | Ver LICENSE do repositório | Em uso | `threejs-water-optics` (rio, espuma), `threejs-precipitation-surfaces` (chuva, respingos), `threejs-exposure-color-grading` |
| Sombra suave | drei `AccumulativeShadows` / `RandomizedLight` / `ContactShadows` + `n8ao` | MIT / CC0 | **Padrão** ("modo barato") | Luz rebatida aproximada e sombra de contato |
| Luz global | `three-gpu-pathtracer@0.0.24` | MIT | **Fora** (decisão do Eduardo, 08/11) | Trava headless acima de 16 spp |
| Céu e nuvens | `@takram/three-atmosphere`, `@takram/three-clouds` | MIT | Candidato | Ainda não testado no formato |
| Fontes do HUD | Playfair Display / Playfair Display SC / Fraunces | OFL | Em uso | HUD editorial em etapas |
| Polyspoon (clone aberto do Polyfork) | GitHub DITlieD/polyspoon | Apache-2.0 | Fora | Só 14 famílias de modelos |

## Onde procurar (fontes além do Fab)

| Fonte | O que tem | Licença típica | Para quê |
|---|---|---|---|
| **Fab** (fab.com) | Pacotes da Unreal, Megascans, lojas antigas (UE Marketplace, ArtStation, Sketchfab Store) | Fab Standard (Personal/Professional) | Base dos cenários Unreal |
| **Sketchfab** | A maior vitrine de modelos 3D; muitos grátis baixáveis | CC-BY / CC0 (conferir cada um; NC/ND não servem) | Soldados, armas e objetos de época (os Woodhead vieram daqui) |
| **Museus no Sketchfab** (Royal Armouries, Musée de l'Armée, DHM, HGM Wien, IWM…) | Escaneamentos de peças reais do séc. XIX | Frequentemente CC-BY | Canhões, armas, capacetes e uniformes reais |
| **Smithsonian Open Access 3D** | Escaneamentos de acervo | CC0 | Objetos históricos |
| **Europeana** | Acervo de museus europeus (inclui 3D) | Varia por item | Referência e alguns modelos |
| **CGTrader / TurboSquid** | Grandes, quase tudo pago | Licença comercial da loja | Veículos, aviões e armas realistas (pagos: só com o OK do Eduardo) |
| **KitBash3D** | Kits premium de cenário (cidades, vilas) | Comercial, pago (às vezes grátis) | Cenários de nível cinema |
| **BlenderKit** | Biblioteca integrada ao Blender, com parte grátis | Própria (grátis/paga) | Modelos e materiais via Blender → Unreal |
| **Poly Haven / ambientCG** | HDRI, texturas PBR, modelos | CC0 | Céus e materiais (em uso) |
| **Kenney / Quaternius / Poly Pizza** | Low-poly | CC0 | Só reserva (visual "PS2") |
| **Mixamo** | Animações e personagens | Uso comercial em vídeo | Animações (em uso) |
| **ActorCore** (Reallusion) | Personagens e captura de movimento | Grátis/pago | Mais variedade de animação militar que o Mixamo |

**Levantamento em andamento:** armas, canhões e objetos de 1866–1871 nesses acervos (`D:\unreal3d\LEVANTAMENTO_ARMAS_1870.md`). Os aprovados entram na tabela do Kriegsmomente acima.

## Levantamento de 03/11/2026: código e método prontos (GitHub, npm, Blender, tutoriais)

Relatórios completos:
- `docs/levantamentos/2026-11-03_repos_stack_3d.md`: cerca de 180 buscas no GitHub, npm/PyPI, extensões do Blender e termos de uso.
- `docs/levantamentos/2026-11-03_youtube_tutoriais_stack_3d.md`: 28 legendas de tutoriais e os créditos dos concorrentes.

**Antes de construir qualquer peça, consultar estes:**

| Peça | Pronto | Licença | Onde roda |
|---|---|---|---|
| Mapas (todos) | skill oficial `remotion-maps` + MapLibre + Turf | BSD-3/MIT | Remotion |
| Setas, frentes e unidades | perfect-arrows + `@remotion/paths` (`evolvePath`), flubber, milsymbol | MIT | Remotion |
| Mapa histórico narrativo | MapStage (testar antes de construir) | MIT | Remotion/web |
| Mar de nuvens (web) | `@takram/three-clouds` | MIT | three.js |
| Nuvem, fumaça e fogo (Blender) | JangaFX Free VDBs; Mantaflow e céu Nishita nativos | CC0 / nativo | Blender na G4 |
| Rota de voo | adsb.lol `globe_history` + `traffic` + `pymap3d`; Tacview Flight Path Importer (adaptar) | ODbL / MIT | Python → Blender |
| Cidade real | Blosm (OSM) + BlenderGIS (DEM); LiDAR USGS 3DEP / ortofoto NAIP (EUA, domínio público) | GPL / PD | Blender na G4 |
| Corte (estilo Zack D) | Boolean do Blender; clipping com stencil + `three-bvh-csg` | nativo / MIT | Blender ou three.js |
| Câmera viva | Camera Shakify; `@remotion/motion-blur` | GPL / Remotion | Blender / Remotion |
| Blender por IA | Blender Lab MCP (oficial) no PC + `blender -b -P` na G4 | — | PC + G4 |

**Fontes vetadas para uso comercial:**
- Google Photorealistic 3D Tiles e Google Earth Studio;
- Cesium ion e o plano Free do MapTiler;
- EOX cloudless de 2018 a 2025 (2016 e 2017 são CC BY 4.0, conferido no WMTS da EOX);
- OpenSky, ADS-B Exchange e FR24;
- LiveATC. Áudio de ATC ou caixa-preta não se usa de qualquer forma: decisão do Eduardo em 03/11.

## Regras de uso
- **Créditos:** só na descrição, nunca na imagem, salvo se uma licença exigir atribuição na tela. Nesse caso, avaliar antes de usar.
- **Licença:** aceite na conta do Eduardo, sempre com o OK dele. Compra só com item e valor confirmados.
- **Arquivos:** nada no C: (cache do Launcher em `D:\EpicVault`, projeto em `D:\unreal3d\fab_projeto`).
- **Ao adotar um pacote:** começar do mapa de demonstração dele, renderizar com o render de cinema (Lumen convergido, amostras, pós) e comparar lado a lado com a referência (`docs/BATEDOR.md`).

## Segundo a Segundo / vídeos de avião: three.js no teardown (04/11/2026)
Rota aprovada pelo Eduardo: barata, simples e com boa qualidade (prova em `D:\reconstruccion\08_prova_teardown`). Avião construído por código, look harmônico do Reconstructed.
| Pacote | Licença | Onde | Uso |
|---|---|---|---|
| scottstts/Threejs-Awesome-Graphics-Agent-Skills | MIT | `D:\pesquisa_nichos\Threejs-Awesome-Graphics-Agent-Skills` | direção de câmera, geometria procedural (chanfro/junções), destroços, chuva, exposição/cor, bloom, validação visual |
| CloudAI-X/threejs-skills | MIT | `D:\pesquisa_nichos\threejs-skills` | API verificada da three r186 (HDR, PBR, pós, gltf-transform) |
| Poly Haven kloofendal_overcast_puresky | CC0 | `06_greenacres_p2\blender\assets` | HDRI de céu encoberto (reflexo do avião) |
| ~~@takram/three-clouds~~ | MIT | — | testado e reprovado (realista demais, fora da harmonia) |
| ~~anything2explainer~~ | PolyForm Noncommercial | — | proibido em canal monetizado |
