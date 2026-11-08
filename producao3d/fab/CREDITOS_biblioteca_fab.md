# Créditos e licenças: pacotes do Fab convertidos para o Eddie3D (05/11/2026)

Origem: a biblioteca do Fab do Eduardo, baixada pelo Epic Launcher para `D:/EpicVault/VaultCache/FabLibrary/`.

**Licença:** o arquivo `metadata` de cada pacote não traz o campo de licença. Pelo Eduardo, cada pacote é **CC-BY 4.0** ou **Fab Standard**.
- Os pacotes "converted" (GLB gerado pelo próprio Fab) vêm da antiga loja do Sketchfab e costumam ser CC-BY.
- Os pacotes nativos (Unity, FBX e GLB do autor) são Fab Standard.
- **Antes de publicar, confira a licença em `https://www.fab.com/listings/<uid>`.**
- Nos dois casos, creditar o autor **na descrição**. Nada de crédito na imagem.
- Uso restrito a este canal e a estes vídeos. O texto do Fab Standard proíbe redistribuir os arquivos brutos, então nada disto vai para o repositório público.

| Pacote (pasta) | Título no Fab | Autor | uid do Fab | Licença provável | Arquivos |
|---|---|---|---|---|---|
| `small_town/` | Small Town | Pedram Ashoori | 583be5e5-5fca-4b1c-ac1f-ecc5a659c233 | CC-BY 4.0 (converted) | 1 GLB, 245 × 87 × 160 m, 754 triângulos |
| `large_low_poly_building/` | Large Low Poly Building | Jimbogies | 2db0d283-6c8a-461d-b813-5e1aee85b79c | CC-BY 4.0 (converted) | 1 GLB, 25,6 × 32 × 30,7 m |
| `modern_street_props/` | Modern Street Props - 01 | Shape Illusion 3D | ceee34d0-85e7-4b9b-8e00-3ebf216b4710 | CC-BY 4.0 (converted) | 1 GLB. **A conversão do Fab só trouxe o banco**: o poste, a lixeira e o cone da miniatura não vieram |
| `beach_umbrella/` | Beach Umbrella - Low Poly | Styro | 02a568ce-9d5e-448d-9fac-90d8fc5e55f2 | CC-BY 4.0 (converted) | 1 GLB, 1,6 m |
| `beach_ball/` | Beach Ball - Low Poly | Styro | b4561793-54a8-49ab-9f2b-413db0205d48 | CC-BY 4.0 (converted) | 1 GLB, 0,4 m |
| `surfboards/` | Game Ready \| Free Surfboards | Saritasa | e9655d67-3af9-427e-86f5-34c5a659bae3 | CC-BY 4.0 (converted) | 1 GLB: 4 pranchas + monte de areia |
| `fish/` | Animated Low poly Fish | Oliver Cooke | b99b6056-f756-4e3d-891b-3d6f9867d3ba | CC-BY 4.0 (converted) | 1 GLB com animação `ArmatureAction` (vem em pé: girar 90° no uso) |
| `sailboat/` | Coastal Skiff Sailboat - Realistic Optimized Asset | Synapse Studio | 99c9928c-94ff-403d-967a-d8dc33eb0fce | Fab Standard | FBX → GLB, texturas 4k → 2k |
| `flat_style_vehicles/` | Flat Style Vehicles Pack | Underhill Labz | 639b3ddb-be6c-40f0-96d6-1d23f827d53d | Fab Standard | Unity → 98 GLB: 41 veículos sem interior, 16 prédios, 39 peças de cenário. Mais 16 paletas em `paletas/` (o mesmo atlas em cores diferentes) |
| `lowpoly_nature/` | Low Poly Nature: Essentials | Vertex Rage Studio | a607441d-b811-440b-a20c-59e74804c4ce | Fab Standard | Unity → 62 GLB (árvores temperadas, pedras, arbustos, cogumelos). **Não tem palmeira** |
| `voxel_beach/` | Voxel Sand & Beach Pack | Max3nce's Store | b0ef1ece-d0c6-4b69-83d4-0d7e0ff468ea | Fab Standard | 31 GLB estáticos (as 4 animações quadro a quadro ficaram de fora) |
| — | Free Stylized Lowpoly Whales | LapaModels | fc34ebc6 | — | só em `.blend`, **pulado** a pedido |

Linha pronta para a descrição do vídeo (só com os pacotes que aparecem na tela):

> Modelos 3D: "Small Town" (Pedram Ashoori), "Large Low Poly Building" (Jimbogies), "Flat Style Vehicles Pack" (Underhill Labz), "Beach Umbrella" y "Beach Ball" (Styro), "Free Surfboards" (Saritasa), "Coastal Skiff Sailboat" (Synapse Studio), "Modern Street Props" (Shape Illusion 3D), vía Fab. Personas: Quaternius (CC0). Palmeras: Yughues/Nobiax (CC0).

## Código e fontes de terceiros usados no batedor `07_batedor_fab`

| O quê | Licença | Onde entrou |
|---|---|---|
| Remocn, componente `rolling-number` (github.com/Remocn/remocn, commit `fd2d301`, 11/10/2026) | MIT | Mecânica da coluna de dígitos do odômetro em `src/hud/Hud.tsx`, reescrita em base mista (minutos 0 a 59) |
| PHANTOMTONYT/motion-design-skills, `kinetic-typography` | MIT | Regras de movimento da frase cinética e do "flip swap" da comparação (filosofia, sem código copiado) |
| Fonte do vídeo 6 (`06_spun_slower/v1/src/mundo/calcadao.tsx`) | nossa | `src/mundo/fonte.tsx`, agora com a gravidade variável |
| Inter Tight e Instrument Serif Italic (Google Fonts) | SIL OFL 1.1 | `public/fontes/` (com os OFL.txt) |
| Textura `nuvem_tufo.png` | nossa (gerada por script) | nuvens `<Clouds>` do drei |

## Como foi convertido (ferramentas prontas, nada modelado à mão)

1. **Unity → FBX:** o `.unitypackage` é um tar.gz. Foi extraído e a árvore de pastas refeita a partir de `pathname`, em `D:/tmp/fab_x/*_tree`.
2. **FBX → GLB:** pelo importador FBX do Blender 4.2 sem tela (`_scripts/fbx_para_glb.py`).
   - Os veículos do 3ds Max vinham com −90° em X nas malhas filhas. A rotação foi compensada na raiz.
   - O veleiro teve as texturas religadas por material.
3. **Otimização** (`_scripts/otimizar.mjs`, @gltf-transform 4.5):
   - dedup → prune → weld → escala para metros → `center` (pé no chão);
   - texturas reduzidas com o sharp: 2048 nas peças-herói, 1024 nas comuns, 512 nas pequenas;
   - **meshopt**, que o `useGLTF` do drei decodifica sem rede. Draco não, porque o decoder do Draco vem de CDN.
4. **Escalas aplicadas:**
   - Small Town × 0,001 (o original está em mm);
   - Large Building × 0,01 (o original está em cm);
   - Flat Style × 3,9 (um carro de 1,1 unidade vira 4,3 m).
5. **Erro de ferramenta registrado:** o `textureCompress` do gltf-transform 4.5 quebrava com "colourspace: parameter space not set".
   - **Causa:** dois sharp no mesmo processo (0.33 no projeto e 0.35 dentro do ndarray-pixels).
   - **Solução:** um único `sharp@0.35.5`, com a redução feita direto pelo sharp.
6. **Catálogo:** `catalogo.json`, com 199 itens. Cada item traz arquivo, nós nomeados com bbox em metros, triângulos, texturas antes e depois, animações, autor, licença e uid.
7. **Folhas de contato:**
   - `folha_contato_fab.jpg`: as miniaturas do Fab com os nomes;
   - `folha_pecas_flat_vehicles.jpg`: cada peça do Flat Style renderizada com o Workbench do Blender.
