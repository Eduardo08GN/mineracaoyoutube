# Levantamento de prontos: acabamento de terreno e animação 3D (K19/K20, 06/11/2026)

Portão 1 do `CLAUDE.md` e passo 0 do `docs/BATEDOR.md`. O alvo é o defeito do K18: o chão `chao/` do three.js ficou cru, e tudo nele foi escrito à mão (`terreno.tsx`, `arvores.tsx`, `aldeia.tsx` e o toon). O resultado foi campo chapado, árvore-bola e casa-caixa.

Critério do Eduardo: **inteligente, leve e que agregue muito no visual**. Ou seja, o maior ganho por hora, sem low-poly em close, casando com o creme e a tinta dos takes de época.

## O que já existe (e não foi usado)
- **Stack do K18** (`D:/kriegschronik/k18_koeniggraetz/v1`):
  - `three` 0.180, `@react-three/fiber`, `@react-three/postprocessing` e `postprocessing` 6.39;
  - **`@dgreenheck/ez-tree` está instalado e nunca foi usado** (as árvores foram desenhadas à mão);
  - DEM real, névoa creme, contorno de nanquim, fumaça procedural e a ponte 3D → tinta continuam valendo.
- **Assets no disco** (`D:/kriegschronik/tracer3d_15_emser/v1/public/objetos/`):
  - **Maison lorraine** e **Maison Lorraine 2** (Sketchfab, MY-TRAVAUX, CC BY): casas de fazenda da Lorena, exatamente a região de Mars-la-Tour e Gravelotte. Têm ~600 mil faces cada; é preciso dizimar.
  - Quaternius (CC0): casa de reboco, casa de tijolo, celeiro, igreja.
  - Poly Haven (CC0):
    - texturas de chão: `sparse_grass`, `grass_path_2`, `brown_mud_leaves_01`, `forrest_ground_01`, `gravel_stones`;
    - tufos `grass_medium_01`;
    - árvores `island_tree_01` e `tree_small_02` (pesadas, 3,7 mi de polígonos);
    - 3 céus HDRI.
- **Fab** (`D:/EpicVault`, `D:/unreal3d/fab_projeto`):
  - Cozy Nature, StyleHex Forest, MW Landscape Auto Material e Starter VFX;
  - **todos são `.uasset` e só servem à rota Unreal**. O MW Landscape é material do UE e não porta para three.js nem Blender. Exportar malhas pelo UE custa 2–3 h e traz o estilo "fofo", que destoa do creme.
- **Megascans:** não estão no disco. Além disso, foram recusados em 02/11 por serem realistas demais.
- **Blender 4.2.3** em `D:/blender-4.2.3-windows-x64`: tem o **nó Kuwahara nativo** no compositor (modo anisotrópico), que serve à rota Cycles na G4.

## Shortlist (ranqueada por ganho visual por hora)

| # | Peça | Licença e onde está | Integração | Por que agrega |
|---|---|---|---|---|
| 1 | **Passe Kuwahara anisotrópico** (filtro de "pintura a óleo") de `cortiz2894/stylized-components`, pasta `src/components/kuwahara` (2 shaders num único `Pass` do `postprocessing`) | MIT, ★430, ativo em set/2026. github.com/cortiz2894/stylized-components | **~2 h**: copiar 4 arquivos para o kit, entrar como 1º passe no `EffectComposer` do `palco.tsx`, raio por distância de câmera, depois a gradação creme | Um passe só transforma **o quadro inteiro**: cápsula, toon chapado e hachura viram pincelada. Casa com o estilo "óleo de época" do take cinematográfico, com custo zero de modelagem. Na rota Cycles, o equivalente é o nó Kuwahara do Blender 4.2. |
| 2 | **Campo de grama estilizado** `GrassField` (mesmo repositório, `src/components/grassField`): lâminas e flores instanciadas, mistura com terra, vento, translucidez | MIT | **~3 h**: trocar o Leva por props, levar o vento ao quadro do Remotion (`useCurrentFrame`, sem relógio), espalhar pela máscara DEM/OSM, paleta de agosto de 1870 (palha, restolho e trigo maduro em ocre) | Mata o "chapado sem textura", que era o defeito nº 1 do K18. Tem movimento contínuo (regra dos 4 s). Alternativa: `simondevyoutube/Quick_Grass` (MIT), com o método explicado no vídeo SimonDev `bp7REZBV4P4` (grade com jitter, curva por lâmina, espessamento em espaço de vista, gradiente base→ponta, vento por ruído, 2 LODs). |
| 3 | **ez-tree** (`@dgreenheck/ez-tree` 1.1.0): árvore procedural com tronco, galhos e folhas, sementes e predefinições | MIT, ★1.747, **já instalado** no K18 | **~1,5 h**: gerar 4–6 árvores por semente, `InstancedMesh`, toon e contorno do kit | Substitui a árvore-bola por silhueta de árvore real, que fica pintada depois do passe 1. Custo baixo porque já está no projeto. |
| 4 | **Maison lorraine ×2** (CC BY) e **Quaternius** (CC0), já no disco | Crédito do MY-TRAVAUX na descrição | **~1,5 h**: `gltf-transform simplify` (meshopt) para ~40 mil faces, instâncias por aldeia (Vionville, Mars-la-Tour, Flavigny, Rezonville) com as posições do OSM | Fim da casa-caixa. É a arquitetura certa da região do K20 e serve também à Lorena do K19. |
| 5 | **TerrainMaterial** de `nwpointer/three-landscape` (splat RGBA e triplanar) com as texturas Poly Haven do disco | MIT, ★152 (parado desde 2023, mas é só material) | **~2 h**: splat por declive e uso do solo do OSM, texturas puxadas ao creme | Chão de plano médio e distante com variação (terra, caminho, cascalho). Opcional se a grama do item 2 cobrir a maior parte do quadro. |

**Descartados:**
- `spacejack/terra`: licença NOASSERTION.
- `three-grass-tufts`: parado desde 2022.
- Fab UE nesta rota: formato e estilo.
- Megascans: realista e fora do disco.
- `three-map-terrain`: o K18 já tem DEM e OSM próprios.

## Método (tutoriais lidos pelas legendas)
- **SimonDev, "How do Major Video Games Render Grass?"** (511 mil views, `bp7REZBV4P4`): a receita do Ghost of Tsushima em three.js, a referência para afinar o item 2.
- **Francesco Milanese, "The Kuwahara Node in Blender 4"** (`VjpHV-hgJUo`): usar o modo anisotrópico (o clássico deixa blocos), subir a uniformidade aos poucos e preservar os detalhes finos (hastes). Vale para a rota Cycles.
- **Cortiz Dev, "Painterly Shader in Three.js (Kuwahara)"** (`CmIfhwSyswk`, sem legenda): a descrição aponta o repositório do item 1 e o texto de Maxime Heckel "On Crafting Painterly Shaders".

## Recomendação para o batedor: **1 + 2 + 3** sobre o palco `chao/` do K18
- **Combinação:** passe Kuwahara anisotrópico (primeiro no composer, gradação creme e grão depois), GrassField com o vento pelo quadro e ez-tree instanciado. Tudo entra no palco que já tem DEM, névoa creme, contorno, fumaça e tinta.
- **Custo estimado:** ~6–7 h no total.
- **O still para provar:** um still ao rés do chão de Mars-la-Tour (planalto, trigo colhido, mata de Tronville ao fundo), **lado a lado** com um take de época (pintura de batalha de 1870).
- **Se aprovado:**
  - o item 4 entra na produção (1,5 h);
  - o item 5 só se o plano médio ainda parecer chapado.
- **Atenção:** o Kuwahara anisotrópico custa vários passes por quadro. Renderizar na G4 com as flags de GPU do `BADPATHS`, conferindo a linha `gpu:`.
