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

## Regras de uso
- **Créditos:** só na descrição, nunca na imagem, salvo se uma licença exigir atribuição na tela. Nesse caso, avaliar antes de usar.
- **Licença:** aceite na conta do Eduardo, sempre com o OK dele. Compra só com item e valor confirmados.
- **Arquivos:** nada no C: (cache do Launcher em `D:\EpicVault`, projeto em `D:\unreal3d\fab_projeto`).
- **Ao adotar um pacote:** começar do mapa de demonstração dele, renderizar com o render de cinema (Lumen convergido, amostras, pós) e comparar lado a lado com a referência (`docs/BATEDOR.md`).
