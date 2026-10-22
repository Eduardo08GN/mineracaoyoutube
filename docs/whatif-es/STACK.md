# Stack de qualidade do What If ES (atualizada em 21/10/2026)

Esta é a stack que substitui o visual "de cartão" dos vídeos 1 e 2 (fogo em cartão, fumaça em bolha, céu e água de desenho,
bonecos de bloco, cenas paradas). Decisão do Eduardo em 21/10/2026: **atualizar a stack atual** (three.js + React Three Fiber +
Remotion, render na G4 do Colab) **só com assets gratuitos** com licença comercial. Unreal e Unity ficaram para depois
(ver [pesquisa-stack-qualidade.md](pesquisa-stack-qualidade.md)).

Primeiro vídeo na stack nova: vídeo 2 ("¿Qué pasaría si te calentaras…?"), a partir de `D:\whatif_es\02_got_hotter\v2`.
O código dos módulos fica em [`stack/`](stack/) (cópia) e no projeto vivo em `src/mundo/`.

---

## 1. O que mudou, em uma tabela

| Problema apontado | Antes | Agora | Módulo |
|---|---|---|---|
| Céu de desenho | gradiente + nuvens em billboard | **HDRI fotográfico** (Poly Haven "pure sky"): fundo, luz ambiente (IBL) e o que a água reflete | `ambiente.tsx` → `CeuFoto` |
| Sombras sem relação com o céu | sol fixo | **sol medido no pico do HDRI** (elevação e azimute) | `ambiente.tsx` → `solDoHDRI` |
| Areia lisa | textura de canvas repetida | **areia PBR fotográfica** (cor, normal, rugosidade, AO) + variação de tom de baixa frequência contra a repetição | `ambiente.tsx` → `useAreiaPBR`, `materialAreia` |
| Água ciano com listras | cor chapada | **reflexo do céu real** com Fresnel, tons teal naturais, espuma na costa | `comum.tsx` → `Mar` (`env`) |
| Fogo em cartão/cone | shader procedural | **flipbooks de simulação real** (Unity Labs, feitos no Houdini) | `vfx.tsx` → `Flipbook` |
| Fumaça em bolha | esferas Lambert | **baforadas de fumaça pré-iluminadas** que sobem, crescem e giram, com a cor e a luz da cena | `vfx.tsx` → `Flipbook fumaca` |
| Bonecos de bloco, "boneco caído" | caixas e cápsulas | **humanos com rig** (65 ossos) e 43 animações; roupa de banho, pele, cabelo e altura variados por pessoa | `pessoas.tsx` → `Multidao3D` |
| "Todos correm" sem ninguém correndo | — | **fuga em fórmula fechada** (reage, levanta, acelera até o sprint) com o passo casado com a distância | `pessoas.tsx` → `estadoPessoa` |
| Cenas paradas | — | **mapa de ações** do original executado no mesmo segundo (regra 4.4 do PRODUCAO.md) | `acoes.ts` por vídeo |

## 2. Assets (todos com uso comercial liberado)

Pasta mestra no PC: `D:\whatif_es\assets\` (cada fonte tem um `LICENCA.txt` com a data do download). Nada no C:.

| Asset | Fonte | Licença | Onde entra |
|---|---|---|---|
| `kloofendal_48d_partly_cloudy_puresky` (HDR 2k para luz + JPG 8k para fundo) | [polyhaven.com](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky) | CC0 | céu de praia ensolarada; sol a 47,9° de elevação |
| `coast_sand_01` (diff, nor_gl, rough, ao, disp 2k) | [polyhaven.com](https://polyhaven.com/a/coast_sand_01) | CC0 | areia de praia (5 m por repetição) |
| `aerial_beach_03` | [polyhaven.com](https://polyhaven.com/a/aerial_beach_03) | CC0 | reserva para vistas aéreas (de perto mostra sulcos) |
| Flipbooks Unity Labs: SmallFlame01, Flame02, Flame03, FireBall01, Explosion01, Cloud01, Cloud02, WispySmoke01 | [unity.com/blog](https://unity.com/blog/engine-platform/free-vfx-image-sequences-flipbooks) | CC0 | fogo (16×4 quadros), fumaça (8×8), explosão (5×5), bola de fogo (8×8) |
| Universal Base Characters [Standard] (2 corpos, 8 cabelos) | [quaternius.itch.io](https://quaternius.itch.io/universal-base-characters) | CC0 (no pacote) | pessoas |
| Universal Animation Library [Standard] (43 clipes) | [quaternius.itch.io](https://quaternius.itch.io/universal-animation-library) | CC0 (no pacote) | andar, correr, sprint, nadar, sentar, cair, conversar… |

Observações de licença:
- Quaternius passou a publicar a "Quaternius Asset License v1.0" para lançamentos a partir de 28/08/2026 (uso comercial liberado, sem
  redistribuir os arquivos soltos). Os packs baixados trazem `License.txt` CC0 — guardado em `public/pessoas/LICENCA_Quaternius_CC0.txt`.
- Nunca usar a textura padrão do `<Clouds>` do drei (repositório sem licença) nem shaders do Shadertoy (padrão CC BY-NC-SA).

### Como baixar de novo (sem login)
- **Poly Haven**: `https://api.polyhaven.com/files/<id>` devolve as URLs; ex.
  `https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/<id>_2k.hdr` e `…/Textures/jpg/2k/<id>/<id>_diff_2k.jpg`.
- **Unity Labs**: `https://unity3d.com/files/labs/downloads/vfx/assets01/<Set>/<Set>-flipbooks.zip` (TGA → convertido para PNG).
- **Quaternius (itch.io, "pague quanto quiser")**: GET da página do jogo (pega o `csrf_token`), POST `/<jogo>/download_url`,
  GET da página de download, POST `/<jogo>/file/<upload_id>?source=game_download` só com o `csrf_token` (sem `key`) → URL do CDN.

### Preparação dos assets para o projeto
- Texturas dos personagens reduzidas para 1024 px em JPG (o pacote caiu de ~55 MB para 11 MB); `.gltf` reescrito para apontar
  para `tex/*.jpg`; cabelos "Rigged to Head Bone" (mesmos 65 ossos do corpo).
- Flipbooks TGA → PNG (`D:\whatif_es\assets\unitylabs\png`), copiados para `public/vfx/`.
- No projeto: `public/hdri/`, `public/tex/`, `public/vfx/`, `public/pessoas/`.

## 3. Módulos

### `ambiente.tsx` — céu, luz e areia fotográficos
- `CeuFoto({nome, rot, exposicao, nevoa, luzAmbiente})`: esfera presa à câmera com o JPG 8k (convertido para linear no shader,
  a mesma convenção dos shaders próprios), névoa perto do horizonte; o `.hdr` vira `scene.environment` via PMREM (IBL).
- `HDRIS` registra cada HDRI com o sol medido (pico de luminância do `.hdr`: `cv2.imread(..., IMREAD_ANYDEPTH)`);
  `solDoHDRI(nome)` devolve `{elev, azim}` para o `luzDe`, então as sombras batem com o céu fotografado.
- `useAreiaPBR(metros)` + `materialAreia(pbr, L, P)`: MeshStandard com os 4 mapas e repetição em metros; `onBeforeCompile` multiplica
  o tom por um ruído de baixa frequência (quebra a repetição vista do alto).
- Convenção de direção = a do three (`equirectUv`): `u = atan(z, x)/2π + 0,5`, `v = asin(y)/π + 0,5`.

### `comum.tsx` → `Mar` com `env`
- Passando `env={hdr}`, o mar reflete o céu real (Fresnel, `R.y = |R.y|` para não refletir o chão do panorama) e usa tons
  teal naturais; sem `env`, continua como antes (vídeos antigos não mudam).

### `vfx.tsx` — `Flipbook`
- Motor de partículas **sem estado**: `InstancedBufferGeometry` com atributos por partícula (base, nascimento, fim, escala,
  semente, fase, deslocamento, vida). Idade = `fract((t − t0)/vida + fase)` → tudo é função do tempo; qualquer quadro sai igual
  em qualquer aba do render.
- Quadro do atlas pela idade, **mistura entre dois quadros** (sem engasgo); fogo em billboard **cilíndrico** (fica em pé) e
  aditivo; fumaça em billboard esférico, normal blending, sobe (`sobe`), cresce (`cresce`), gira devagar, entra e sai em fade;
  a fumaça usa a luminância do atlas (luz embutida) × `cor` × `luz` da cena.
- `porEmissor` partículas com fases espalhadas por foco: o foco queima sem parar e sem piscar. `t1` apaga o foco.
- Atlas registrados em `ATLAS` (chamaPequena, chama, chamaOca, nuvem1, nuvem2, fiapo, explosao, bola).
- Hooks: listas de emissores memorizadas **no topo** do componente da cena (nunca `useMemo` dentro de condicional nem depois de
  `return` antecipado).

### `pessoas.tsx` — `Multidao3D` e `estadoPessoa`
- Cada pessoa: `SkeletonUtils.clone` do corpo (masc/fem), cabelo `SkinnedMesh` religado aos ossos do corpo por nome,
  material do corpo clonado com recolor em shader (regiões escuras e pouco saturadas = roupa de banho → cor da pessoa; pele
  multiplicada pelo tom), altura 0,92–1,06.
- Animação **sem relógio**: um `AnimationMixer` por pessoa, `action.time` calculado a partir de `t` e `mixer.update(0)`.
  Locomoção: `tempo = distância / passada` (Walk 1,45 m, Jog 2,6 m, Sprint 3,9 m por ciclo) → o pé não desliza.
- `estadoPessoa(p, t, de, tFuga)`: andar na calçada (dá a volta fora do quadro), conversar, sentar, deitar (último quadro de
  `Death01`), nadar; a partir de `tFuga + reação` foge para longe de `de` (e um pouco para o calçadão), levantando antes se
  estava sentado/deitado, acelerando até o sprint — tudo em fórmula fechada.
- Quem está a menos de 8 m da câmera some (nada de boneco gigante no primeiro plano).

### `acoes.ts` — o mapa de ações virando encenação (por vídeo)
- Origem: `mapa_acoes.json` (agente lendo o original a 10 fps: 214 eventos no vídeo 2, com segundo, quem, o quê, onde no quadro e
  movimentos de câmera). Também revelou que a nossa câmera girava **ao contrário** do original em 5 trechos (corrigido).
- **Figurantes** com pontos `[segundo, lateral, frente]` **relativos à câmera** num segundo de referência (`relMundo(ref, …)`),
  então caem exatamente onde o original mostra (ex.: camisa laranja passando a 1,5 m entre as mãos, 25,4–26,8 s).
  `estadoFigurante`: anda/corre entre os pontos com o clipe pela velocidade (Walk < 1,9 m/s < Jog < 3,6 m/s < Sprint) e o passo
  pela distância; `levanta`: deitado até o segundo X e levanta em 0,7 s (a queda tocada ao contrário); `carbonizado` /
  `carbonizado_deitado`: corpo preto parado com focos de fogo.
- **Roupa por região do corpo** (shader, na pose de bind em T de 1,8 m): camisa de manga curta (torso |x|<0,24, 0,98–1,47 m;
  manga até |x|<0,5), calça (até 0,1 m) ou short (até 0,52 m); sem camisa = roupa de banho recolorida. Cores do original por
  figurante (camisa vermelha/calça marrom etc.).
- **Objetos**: toalha aos pés pega fogo em 48,2 s (baixo-direita) e carboniza, fumaça pulsando até 63 s; primeiros focos na areia
  (67,4) e na base do muelle (68); copas da frente explodem juntas em 75,4 s; gaivotas 10,5–14 s.
- Conferência: stills nos segundos de cada evento, lado a lado com o original (no vídeo 2: 8 de 8 eventos no quadro e no tempo).

## 4. Pipeline: o que mudou

- **Upload para a G4**: o canal por células (base64 em pedaços de 15 mil caracteres) só serve para código. Assets com URL pública
  (Poly Haven, Unity Labs, NASA, three.js) são baixados **pela própria VM** em `vm_comum/preparar.sh`; os que não têm (personagens
  preparados) vão pelo widget de upload do Colab (`files.upload()` + `set_input_files` do Playwright).
- **Testes locais** (`teste/stills.sh`): porta aleatória (`--port`) — a 3001 é da API do Dolphin.
- **Nada no C:**: `colab.baixar` apaga a cópia temporária do Playwright depois do `save_as` (ver memória e erros-pipeline).
- O look HDR (bloom, AgX, aditivos) só se julga na G4; o Chrome local (SwiftShader, 8 bits) estoura o branco.

## 5. Estado do teste no vídeo 2 (21/10/2026, noite)

- Feito e conferido em stills locais: céu fotográfico, areia PBR, mar com reflexo, flipbooks de fogo (chamas no chão e no muelle
  com cara de fogo de verdade), vapor do Panamá, pessoas com rig.
- Ajustado depois do primeiro still: fumaça mais clara (estava preta), bola de fogo menos aditiva (lavava a tela), areia de chão.
- Feito: **mapa de ações → `acoes.ts`** (figurantes, toalha, focos, copas, gaivotas), câmera com os sentidos do original,
  roupas por região. Stills locais: os 8 eventos conferidos aparecem no quadro e no segundo do original.
- Pendente: stills na G4 (look HDR), render completo, lado a lado novo com o original.

## 6. Próximos passos da stack (ainda gratuitos)

1. Fumaça de pluma grande assada no Blender na G4 a partir dos VDBs CC0 da JangaFX (Fire Plume, chimney, high-res plume) →
   flipbook com a luz do sol da cena (o `Flipbook` já aceita qualquer atlas).
2. Soft particles (fade pela profundidade) para a fumaça não "cortar" no chão.
3. Roda-gigante, guarda-sóis, palmeiras com folhas separadas e gaivotas por código.
4. Multidão maior com `InstancedMesh2` (MIT) se passar de ~150 pessoas.
