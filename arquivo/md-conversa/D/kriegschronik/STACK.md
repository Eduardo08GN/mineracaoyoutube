# KriegsChronik — stack de produção (20/10/2026)

Princípio: a G4 renderiza mundos 3D EXATOS e reutilizáveis (mapa + maquete), não imita cinema.
Código é bom para terreno real e máquina; ruim para coisa orgânica (lição do vídeo dos dinossauros).

## Mundo 1 — Atlas (Blender na G4)
| Ferramenta | Para quê | Situação |
|---|---|---|
| Técnica de relevo sombreado no Blender (Daniel Huffman, 2017) | O visual "mapa 3D com sombra real" que virou gênero na cartografia | Adotar |
| Copernicus DEM GLO-30 | Relevo real (atribuição obrigatória) | Adotar |
| Atlas alemão de época (Andrees/Stielers, domínio público) projetado no relevo | Identidade visual do canal | Adotar |
| NASA Blue Marble | Terra vista do espaço (domínio público) | Adotar |
| aourednik/historical-basemaps (GPL-3) | Fronteiras por ano | Adotar (conferir precisão) |
| BlenderGIS | Importar GeoTIFF georreferenciado | Adotar |
| Céu físico do Blender (altitude real) | Estratosfera do Paris-Geschütz / HARP | Adotar |

## Mundo 2 — Maquete (CAD + Blender na G4)
| Ferramenta | Para quê | Situação |
|---|---|---|
| build123d / CadQuery | Canhões paramétricos com medidas reais (perfil de torno, chanfros) → GLB | Adotar |
| TRELLIS 2 (MIT) na G4 | Objetos secundários a partir de foto (vagão, caixa de munição) | Testar |

## Camada 2D (Remotion local / G4)
| Ferramenta | Para quê | Situação |
|---|---|---|
| remotion-dev/skills (oficial) | Qualidade do código Remotion | Adotar |
| @remotion/paths, MapLibre no Remotion (sem chave) | Rótulos que se desenham, mapas 2D estilo "Texas" | Adotar |
| three-globe / r3f-globe | Globo leve com arcos de trajetória | Adotar |
| Remotion com --gl=angle-egl na G4 | Render paralelo dos gráficos pesados | Testar |

## Fora, com motivo
- HyperFrames (HeyGen, ~68k★, Apache 2.0): ótimo, mas duplicaria o motor; ficamos no Remotion já montado.
- GeoReel / Cesium ion / Google 3D Tiles: tier grátis é não comercial.
- Google Earth Studio: não permite uso comercial.
- Imagens Esri/Maxar: licença incerta para canal monetizado.
- Skills de Blender via MCP (cc-blender-skill, Blender Lab MCP): exigem Blender com interface; rodamos sem tela na G4.
- 3dviz-pro-max, rayshader: domínio ou motor diferentes do nosso.
- Wan "cinema": baixo valor agregado aqui.
