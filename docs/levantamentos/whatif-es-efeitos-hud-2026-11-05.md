# Levantamento de prontos: efeitos e HUD do What If ES (Eddie3D), 05/11/2026

Portão 1 do `CLAUDE.md` ("pronto antes de construir"), passo 0 de `docs/BATEDOR.md`. Nada foi construído nem baixado (só
metadados, READMEs e 3 legendas). Rascunhos em `D:/tmp/levant_wi/` (buscas `rall.txt`, metadados `meta.txt`, legendas `leg/`).

**Stack-alvo, travada em `eddie3d/stack/package.json`:** Remotion 4.0.537, three 0.180.0, R3F 9.8.2, drei 10.7.9,
postprocessing 6.39.5, n8ao. O render é `--gl=angle-egl` (WebGL2 por EGL) em Chrome for Testing headless na G4, com o quadro em
função do tempo e vários Chromes de 1 aba renderizando fatias (`vm/render_seq.sh`).

**Critérios de entrada:**
- licença comercial;
- compatível com 0.180/WebGL ou portável em menos de 1 h;
- **determinístico por quadro isolado**: uma aba que abre no quadro 4.000 tem de dar o mesmo pixel que a aba que veio do
  quadro 0;
- custo de G4 baixo;
- versão com mais de 2 semanas (`docs/whatif-es/BATEDOR.md`).

**Já temos, então não se repete:**
- `Look.tsx`: GodRaysEffect, N8AO, névoa, AgX, LUT;
- `vfx.tsx`: flipbooks Unity Labs CC0, sem estado;
- `pessoas.tsx`: Quaternius com rig e 43 animações;
- `comum.tsx → Mar`: reflexo do HDRI e espuma na costa;
- `ceu_lapso.tsx` e `ceu_lugares.tsx`: sol pela rotação;
- a lista do `D:/whatif_es/STACK_GEMS.md`;
- o batedor do vídeo 6 (`docs/whatif-es/video06/batedor.md`), que já leu o `coastal-simulation` e as skills do scottstts.

---

## 0. Respostas diretas às perguntas do maestro

### 0.1 "Qual lib de godrays/pathtracer travou no three 0.180?"
Ninguém quebrou em render. A trava é **de versão**, registrada em `docs/acabamento-threejs.md` e conferida hoje no npm:

| Pacote | Versão | Peer `three` | Funciona no nosso 0.180? |
|---|---|---|---|
| `three-good-godrays` | 0.12.1 (06/08/2026) | `>=0.125 <=0.182` | **sim**. Mas trava a subida do three acima de 0.182 |
| `three-gpu-pathtracer` | 0.0.28 (02/11) | `>=0.187` | não. A **0.0.24** aceita `>=0.180` |
| `three.quarks` | 0.17.1 | `>=0.182` | não. A **0.16.0** (29/03/2025) aceita `>=0.165` |
| `three-vat` | 5.0.0 (todas as versões) | `>=0.185` (TSL/WebGPU) | não |
| `@takram/three-clouds` | 0.7.6 | `>=0.170` | sim, mas custou **11 min de G4 por 20 s** e foi reprovado (`erros-pipeline` #17) |

**Ponto doce de versão:** `three@0.182.0` (10/12/2025) é a única versão que atende ao mesmo tempo o `three.quarks` 0.17 e o
`three-good-godrays`. O `postprocessing` 6.39.6 aceita `<0.188` e o drei aceita `>=0.159`.

### 0.2 Repositórios de skills que o maestro clonou em `D:/tmp/skills_threejs/` (só leitura)

| Repo | Licença real | WebGL × WebGPU | O que serve ao Eddie3D | Decisão |
|---|---|---|---|---|
| **scottstts/Threejs-Awesome-Graphics-Agent-Skills** (v0.13.0) | `package.json` diz **"MIT AND GPL-3.0-only"**. GPL em `wet-puddle-rain`, `deformable-sand` e `tearable-denim`. Fontes **sem licença** tratadas como "MIT by project rule": FFTOCEAN, rocksdanister/rain e r3f-gist. Sem licença = todos os direitos reservados | Misto. Exemplos do mar: `coastal-breaker-ocean`, `ocean-beach-waves`, `submerged-snell-ocean` e `volumetric-fluid-fire` são **WebGPU/TSL**. São **WebGL** o `spectral-cascade-ocean` (porte WebGL2 do poseidon, MIT, 1.253 linhas, só `import * as THREE`), o `stylized-above-below-ocean` (derivado do FFTOCEAN **sem licença**), o `weather-volume-clouds` (cópia do código da Takram: a nuvem que já reprovamos) e o `lut-aerial-perspective` (Takram) | O melhor é o **`spectral-cascade-ocean`**: mar aberto com cascatas FFT e espuma pelo Jacobiano, e o still de exemplo é forte. Os textos `references/*.md` valem como método | **Copiar só exemplos MIT de origem rastreada** (`spectral-cascade-ocean`, os do autor). Fora: tudo o que é GPL ou "by project rule". O `coastal-breaker-ocean` (still de praia muito bom, MIT do autor) fica só para uma "ilha WebGPU" (§0.3) |
| **CloudAI-X/threejs-skills** | MIT | API de referência da **r186**, mais nova que a nossa | consulta de API (HDR, PBR, pós) | Usar com cuidado: conferir cada chamada contra a 0.180 |
| **majidmanzarpour/threejs-game-skills** | MIT | WebGL (0 usos de WebGPURenderer) | `threejs-aaa-graphics-builder`: cartão de pontuação visual em 10 categorias, LOD e orçamento. É guia de jogo, sem peças | Filosofia só (o placar de 10 categorias pode alimentar o "olho da G4") |
| **PHANTOMTONYT/motion-design-skills** (`kinetic-typography`) | MIT | HyperFrames + GSAP (padronizamos Remotion; HyperFrames está "fora do nosso uso") | Regras boas: 1 ideia por tela; texto entre 50 e 80% da largura; entrada ≤ 0,8 s; stagger ≤ 0,5 s; pausa de 0,3 a 0,75 s antes do clímax; sem elástico e sem bounce | **Filosofia, não literalidade** (`feedback-filosofia-nao-literal`). As regras viram checklist do HUD |
| **owenyuwono/poseidon** | MIT, 317★, three 0.184 | **WebGPU/TSL** (FFT em compute) | Mar FFT de referência; já existe o porte WebGL2 dele no scottstts (acima) | Usar o porte WebGL2, não o original |
| **achrefelouafi/WaterThreeJS** | MIT, 104★, three ^0.185 | WebGL (0 usos de WebGPU) | Faixa de espuma na praia e água rasa pela profundidade (já estava nas GEMS) | Candidato B do mar estilizado. Portar de 0.185 para 0.180 (só GLSL) |
| **achrefelouafi/ProceduralBuildingsThreeJS** | MIT, 128★, three ^0.185.1 | WebGL | Prédios procedurais para cidade inundada ou destruída (demo em proceduralbuildings.chirostudio.xyz) | Candidato para a "rua que inunda" (§1) |

### 0.3 WebGPU headless na G4 (Linux/NVIDIA): é viável? Vale subir a stack?
- **O que já está pronto no Remotion 4.0.537:** o `open-browser.js` sempre passa `--enable-unsafe-webgpu` e
  `--ignore-gpu-blocklist`.
- **O que muda com `--gl=vulkan`:** o Remotion acrescenta `--use-angle=vulkan --use-vulkan=native
  --disable-vulkan-fallback-to-gl-for-testing --disable-vulkan-surface --enable-gpu` e deixa de usar `--single-process`.
- **Por que não é o que usamos hoje:** o nosso `render_seq.sh` usa `--gl=angle-egl`. No Linux o WebGPU (Dawn) depende do
  **Vulkan**, e o `vm/preparar.sh` só registra o ICD de **EGL** da NVIDIA. Não há `nvidia_icd.json` de Vulkan nem `libvulkan1`.

**Veredito:** é viável em tese e **não está provado**. O batedor custa cerca de 20 min de G4:
1. `apt install libvulkan1 vulkan-tools`;
2. escrever `/usr/share/vulkan/icd.d/nvidia_icd.json` → `libGLX_nvidia.so.0` (da pasta `/usr/lib64-nvidia`);
3. `vulkaninfo --summary` deve mostrar a placa NVIDIA;
4. um still Remotion com `--gl=vulkan` deve imprimir `(await navigator.gpu.requestAdapter()).info`, com vendor `nvidia`, nem
   SwiftShader nem fallback.

**Custo de migrar a stack inteira para WebGPU (three ≥ 0.185 + WebGPURenderer):** alto.
- O `postprocessing` (pmndrs) e o `n8ao` **só funcionam em WebGL**. O `Look.tsx` inteiro (AO, god rays, bloom, LUT) teria de
  ser reescrito no pós em TSL do three.
- Todos os `onBeforeCompile`/GLSL (palmeira, geada, `chao_molhado`, `Mar`) virariam NodeMaterial.
- O `three-good-godrays` deixa de servir.

**Recomendação:**
- **Não subir agora.** Ficar no 0.180. Subir para 0.182.0 só se precisarmos do `three.quarks` 0.17, e com teste de regressão
  (MD5 dos stills).
- Se algum take-herói só existir em WebGPU (praia do `coastal-breaker-ocean`, Eanpa-Sky), fazer uma **"ilha WebGPU"**: um
  projeto Remotion separado, com three 0.187 e `--gl=vulkan`, que renderiza só aquele clipe para entrar na montagem como vídeo.
  Só depois do batedor de viabilidade acima, e só se o caminho WebGL do §1 perder no lado a lado.

---

## 1. MAR e água: ondas, espuma na praia, reflexo do céu, nível subindo, rua inundando

| # | Candidato | Licença / versão | Compatível com 0.180? | Custo de render | Demo / exemplo | Determinismo |
|---|---|---|---|---|---|---|
| A | **[Humpalumps/Ultra-Water](https://github.com/Humpalumps/Ultra-Water)**: FFT de Tessendorf com 4 cascatas, **arrebentação na costa por campo eikonal**, espraiamento (swash) com borda de espuma e areia molhada que seca, espuma pelo Jacobiano com renda que envelhece, cáusticas, subaquático, objetos boiando, 6 presets de cor | MIT, 634★, push 02/11/2026 (fixar commit ≥ 2 semanas); three ^0.186.1 | **WebGL2 puro** (23 arquivos em `src/`, só `import * as THREE`): porte provável em menos de 1 h, provar | **medido no README: 3,3–5,9 ms/quadro** em 1440p numa RTX 3060 (FFT ~0,45 ms) | sem demo hospedada; `npm run dev` local com 8 câmeras (Breakers, Lagoon, Golden hour…) | ondas: **função de t** (ω quantizado num laço de 300 s, gauss por hash). Espuma: estado com `dt` → **aquecer de 6 a 10 s de simulação antes de cada quadro**, ~240 passos × 0,45 ms ≈ 0,1 s/quadro |
| B | **[Token-Gremlin/natural-disasters ("ABYSSAL")](https://github.com/Token-Gremlin/natural-disasters)**: oceano FFT procedural e clima extremo com **tsunami, furacão com olho, tromba-d'água, onda gigante (rogue wave), redemoinho**, chuva e raios; ~400 KB, sem texturas | MIT, 301★, three r169 | **WebGL2/GLSL3**, compatível | tempo real (presets de qualidade) | [demo ao vivo](https://token-gremlin.github.io/natural-disasters/); `tools/sb.mjs` **dispara um evento e tira foto num tempo de simulação fixo** | tem modo de captura determinística (pausa a simulação); a espuma acumula → mesmo aquecimento do A |
| C | `spectral-cascade-ocean` (skills do scottstts, porte WebGL2 do poseidon) | MIT de origem rastreada (poseidon) | WebGL2, só `three` | baixo a médio (FFT por fragmento) | `example-render.jpeg`: mar aberto com cristas brancas, muito bom | função de t + espuma com histórico |
| D | [thaslle/stylized-water](https://github.com/thaslle/stylized-water) (cartoon) ou [achrefelouafi/WaterThreeJS](https://github.com/achrefelouafi/WaterThreeJS) (faixa de espuma na praia) | MIT; R3F 8 / three 0.172 · three ^0.185 | portáveis (GLSL) | muito baixo | [stylized-water.vercel.app](https://stylized-water.vercel.app) | sem estado (função de t) |
| E | **Nativos para inundar rua e subir de nível**: `MeshReflectorMaterial` do drei (reflexo planar com distorção e blur) + `Caustics` do drei + `three/examples/jsm/objects/Water.js` e `Water2.js` | MIT, **já instalados** (drei 10.7.9, three 0.180) | sim | baixo (1 passe de reflexo) | exemplos do drei e do three | plano em `nivel(t)`, sem estado |

**Fora:**
- poseidon, `coastal-breaker-ocean`/`coastal-simulation`, Eanpa e `norio/three-stylized-water`: WebGPU/TSL, e o coastal ainda
  tem solver com estado (WASM);
- FFTOCEAN: sem licença;
- `jeantimex/threejs-water`: licença "other".

**Recomendação: Ultra-Water (A)** como mar-herói de praia e mar aberto. É o único pronto em **WebGL2**, MIT, que já traz
arrebentação, espraiamento com espuma e areia molhada medidos a ~5 ms/quadro, que era a lacuna do nosso `Mar`. Receita:
1. portar os 23 arquivos de `src/water` para um módulo `biblioteca/src/mundo/oceano/` fixado num commit;
2. tempo do quadro em `uTime`;
3. aquecimento da espuma por quadro.

**Rua inundando** sai do (E) sem construir peça nova: um plano em `nivel(t)` com `MeshReflectorMaterial`, borda de espuma pela
diferença de profundidade (depth texture) e o `chao_molhado.tsx` que já temos para a marca de água que fica.

**Tsunami e furacão:** extrair os módulos de desastre do **ABYSSAL (B)** (mesmo WebGL2, MIT) quando o tema pedir.

## 2. CÉU e NUVENS estilizadas baratas; dia/noite acelerado

| # | Candidato | Licença / versão | Compatível com 0.180? | Custo | Demo | Determinismo |
|---|---|---|---|---|---|---|
| A | **`<Clouds>`/`<Cloud>` do drei** (nuvens de billboards instanciados com profundidade ordenada, `seed`, `segments`, `bounds`, `volume`, `growth`, `speed`) | MIT, **já instalado** (drei 10.7.9) | sim | muito baixo (sprites) | exemplos do drei | **2 armadilhas, conferidas no código:** `seed = Math.random()` por padrão → **sempre passar `seed` fixo**; o movimento lê `state.clock.elapsedTime` → um componente com `useFrame(prioridade −1)` grava `clock.elapsedTime = frame/fps` antes |
| B | **`@takram/three-atmosphere` 0.19.1** (só o céu: espalhamento físico, sol pela data e hora → **dia/noite acelerado com cor correta**, perspectiva aérea) | MIT; three ≥ 0.170, postprocessing ≥ 6.36.7 | sim | baixo (LUTs pré-calculadas em `public/`) | [three-geospatial](https://github.com/takram-design-engineering/three-geospatial) | função de t. **Não confundir com o `three-clouds`**, que é temporal e caro |
| C | Nossos `ceu_lapso.tsx`/`ceu_lugares.tsx` + série Poly Haven **Qwantani** puresky (do amanhecer à noite, CC0) + `<Stars>`/`<Sky>` do drei | CC0 / MIT | sim | ~0 | — | sem estado |
| D | Nuvens volumétricas raymarched: SkyeShark/Eanpa-Sky (MIT, **WebGPU**), ZyFou/ProceduralTerrains (MIT, 652★, three 0.185), `weather-volume-clouds` (scottstts = Takram) | MIT | WebGPU, ou caras e temporais | alto | [Eanpa](https://skyeshark.github.io/Eanpa-Sky/) | temporal (reconstrução entre quadros), quebra a renderização por fatias |

**Recomendação: `<Clouds>` do drei (A)** com seed fixo e relógio do quadro, por cima do céu que já temos (C).
- **Dia/noite:** a cor física do céu vem do `three-atmosphere` (B, só o `Sky` + o sol pela hora), provado num still antes.
- **Por quê:** é nativo, já instalado, custa quase nada e entrega o "tufo estilizado" que o What If Sim usa. O volumétrico já
  provou custar 11 min de G4 por 20 s.

## 3. RAIOS DE SOL, god rays e luz volumétrica

| # | Candidato | Licença / versão | Compatível com 0.180? | Custo | Demo / tutorial | Observação |
|---|---|---|---|---|---|---|
| A | `GodRaysEffect` do postprocessing (**em uso** no `Look.tsx`) | Zlib | sim | baixo | — | Só funciona com o **disco do sol na tela**; some quando o sol sai do quadro |
| B | **[three-good-godrays](https://github.com/Ameobea/three-good-godrays) 0.12.1**: raymarch em espaço de tela contra o **shadow map** → feixes que respeitam palmeiras, prédios e janelas | permissiva tipo zlib, com crédito ao N8python (GitHub: "NOASSERTION", ler o LICENSE); 236★ | **sim** (peer ≤ 0.182) | médio (meia resolução) | [three-good-godrays.ameo.design](https://three-good-godrays.ameo.design) | funciona com o sol fora do quadro; **bloqueia three > 0.182** |
| C | **Feixe falso por malha**: cilindro ou cone com ruído + Fresnel + fade de profundidade. `SpotLight volumetric` do drei (**nativo**, usa `depthBuffer` para cortar suave), [wass08/r3f-godrays](https://github.com/wass08/r3f-godrays) (MIT; TSL, ~60 linhas para portar a GLSL), [TrentSterling/threejs-volumetric-beam](https://github.com/TrentSterling/threejs-volumetric-beam) (MIT) | MIT | sim (o drei já está instalado) | muito baixo | tutoriais: Wawa Sensei "How to Fake Godrays in Three.js" (`qCqt0E-NXqU`, legenda lida: cilindro + ruído + transparência, receita vinda de um tutorial de Blender) e Cortiz Dev "Making STUNNING God Rays" (`sHiyKH02-E4`) | feixe autoral, direcionável e barato. Ideal para janela, floresta e poeira em interior |
| D | `GodRaysShader.js` dos exemplos do three | MIT | sim | baixo | `webgl_postprocessing_godrays` | é o mesmo princípio do (A) |

**Recomendação: three-good-godrays (B)** nos planos-herói externos, porque resolve o defeito do (A) com o sol fora do quadro e
casa com a nossa versão. Para interiores e "feixe pela janela" basta o `SpotLight volumetric` do drei (C), que já está no
projeto.

## 4. FUMAÇA, FOGO e EXPLOSÕES

| # | Candidato | Licença / versão | Compatível com 0.180? | Custo | Demo | Determinismo |
|---|---|---|---|---|---|---|
| A | **JangaFX Free VDBs** (explosões, plumas, fogo, poeira, tornado, nuvens; feitos no EmberGen) → **assados em flipbook no Blender NA G4**, com luz da cena + atlas de normal → nosso `Flipbook` | CC0 (página da JangaFX; já anotado no `pacotes-por-canal.md`) | sim (é textura) | 1 job de Blender por efeito; ~0 no render | método: "VDB → Flipbook (Game VFX Blender Tutorial)" (`B4mbbyFKX20`, legenda lida: importar sequência, remapear o tempo para N quadros, enquadrar a pluma inteira, renderizar o atlas) | **sem estado** (já é o nosso `vfx.tsx`) |
| B | Unity Labs flipbooks (em uso) + Kenney Particle Pack (faíscas, estrelas, fumaça 2D) | CC0 | sim | ~0 | — | sem estado |
| C | **three.quarks** (sistema de partículas e VFX; editor em quarks.art; conversor de prefab Unity) | MIT, 1.181★; **0.16.0 para o 0.180** (0.17 pede ≥ 0.182) | sim na 0.16.0 | baixo (instanciado) | [quarks.art](https://quarks.art) | **com estado + `Math.random`** → só com RNG semeado e simulação refeita desde o início do plano a passo fixo |
| D | [wawa-vfx](https://github.com/wass08/wawa-vfx) (R3F 9) · [Humpalumps/ultra-elements](https://github.com/Humpalumps/ultra-elements) (39 feitiços em shader WebGL2, three ^0.186) · three-nebula 13.3 | MIT | wawa exige `leva` + `zustand`; ultra-elements é WebGL2 portável | baixo | wawa-vfx.wawasensei.dev | wawa tem estado; ultra-elements vale **pelos shaders** de raio e fogo |
| — | Fora: Three-VFX (mustache-dev), aeronautic e `volumetric-fluid-fire` (scottstts): WebGPU/TSL. EmberGen (exportar exige licença paga). Realistic Starter VFX (Fab): é Niagara/UE, não three | | | | | |

**Recomendação: VDBs CC0 da JangaFX assados em flipbook no Blender da G4 (A)**, tocados pelo nosso `Flipbook` sem estado.
- **Por quê:** é o maior salto de qualidade (simulação EmberGen de verdade, iluminada com o sol da cena) sem custo no render
  nem risco de determinismo. Já estava como "próximo passo 1" no `STACK.md`.
- **Detritos e faíscas:** `three.quarks` 0.16.0 só para isso, e com semente fixa.

## 5. MULTIDÃO low poly animada (pessoas e carros)

| # | Candidato | Licença / versão | Compatível com 0.180? | Custo | Demo | Determinismo |
|---|---|---|---|---|---|---|
| A | **[@three.ez/instanced-mesh](https://github.com/agargaro/instanced-mesh) (InstancedMesh2) 0.3.16**: culling por frustum com BVH, **LOD**, LOD de sombra, **skinning** (`initSkeleton` + `setBonesAt`) | MIT, 467★, 26/07/2026; peer three ≥ 0.159 | **sim** | 1 draw call por LOD; skinning na CPU por instância (amortizar: 8 a 16 "fases" do ciclo de caminhada compartilhadas) | demo "Skinning 3k instances" (StackBlitz) no README | `mixer.setTime(t + fase_i)` → função de t |
| B | VAT próprio em GLSL: textura assada pelo add-on **VAT** do Blender (`extensions.blender.org/add-ons/vat`, flement; repo sem LICENSE, mas a textura gerada é nossa) + shader de ~30 linhas (referência: `sneha-belkhale/vertex-texture-cache`) | saída nossa | sim | o mais barato: 0 CPU, milhares de bonecos | — | função de t |
| C | `three-vat` 5.0 (MikeFernandez-Pro) · Horde (sweriko, impostores octaédricos) | MIT | **não** (TSL/WebGPU, three ≥ 0.185) | — | — | — |
| Assets | **Quaternius Universal Animation Library 1 e 2** (120+ e 130+ clipes, rig humano universal, glTF) + Universal Base Characters; **Kenney** Car Kit / City Kit (CC0); Mixamo | CC0 na página de hoje (a memória registra a mudança de parte do catálogo Quaternius para QAL em 28/08: **guardar print e `LICENCA.txt` no download**) | — | — | [quaternius.com](https://quaternius.com/packs/universalanimationlibrary.html) | — |

**Recomendação: InstancedMesh2 (A) + Quaternius Universal Animation Library.**
- **Por quê:** é a única lib pronta de multidão instanciada **com esqueleto** que roda no 0.180. Troca o `Multidao3D` de malha por
  pessoa por 1 draw call com LOD.
- **Carros:** o mesmo `InstancedMesh2` sem esqueleto, com trajetórias em função de t.
- **Acima de ~2.000 pessoas:** o VAT próprio (B) vira o plano B.

## 6. TEXTO, HUD e marcadores modernos (Remotion/React)

| # | Candidato | Licença / versão | Funciona no Remotion? | Demo | Observação |
|---|---|---|---|---|---|
| A | **[Remocn](https://github.com/Remocn/remocn)**: registro shadcn de componentes Remotion **copiados para o projeto**. Pastas `numbers/`: `rolling-number`, `ticker-tape`, `countdown`, `split-flash`, `smash-count`, `live-ticker`. `typography/`: `kinetic-morph-text`, `kinetic-center-build`, `rolodex-flip`, `inline-word-roll`, `shader-text-reveal`, `led-ticker`, `caption-label-maker` | MIT, 1.674★, Remotion 4.0.530 (fixar commit ≥ 2 semanas) | **sim**: "usa `useCurrentFrame`/`interpolate`/`spring`, sem `Math.random`" (README) | [remocn.dev](https://remocn.dev) com player por quadro | o código fica nosso; sem dependência nova |
| B | **GSAP** 3.15 (SplitText, ScrambleText, DrawSVG, grátis desde 2025) com timeline **pausada e `seek(frame/fps)`** | licença padrão "no charge" (uso comercial ok); usar ≤ 3.15.0 (a 3.15.1 tem 1 dia) | sim, se dirigido pelo quadro | gsap.com | já é a rota do `marcadores.md` (branch `producao/stack-3d-baseline`) |
| C | `remotion-bits` 0.2.1 (`AnimatedCounter`, revelações de texto) · `lifeprompt-team/remotion-scenes` (201 cenas, MIT) · `iart-ai/motion-skills` (MIT) · oficiais `@remotion/paths` (`evolvePath`), `@remotion/layout-utils` (`fitText`), `@remotion/transitions`, `@remotion/motion-blur` | npm MIT (o repo do remotion-bits não tem LICENSE: conferir); oficiais na licença Remotion | sim | remotion-bits.dev | os oficiais já estão na versão travada |
| D | **number-flow** (7,7k★), rolling-number, sfinterface-numbers, slot-text | MIT | **não direto**: animam por CSS/WAAPI no relógio do navegador, que o render do Remotion não busca por quadro | number-flow.barvian.me | servem **só como referência de desenho** (dígito rolando com máscara e desfoque de movimento) |
| E | **Rótulo preso ao objeto 3D**: `<Text>` do drei (troika SDF) + `<Billboard>`, dentro do canvas; ou projetar `Vector3.project(camera)` no componente da cena e passar x,y para a camada Remotion por cima; `<Html>` do drei como terceira via | MIT, instalados | sim (os três são função do quadro) | — | dentro do canvas ele passa pelo pós (excluir do bloom); a projeção mantém o texto nítido em 2D e reaproveita o "rótulo com linha guia" do `marcadores.md` |
| F | `gkurt/tegaki` 1.1.0 (escrita à mão de qualquer fonte, 3,3k★) | MIT | conferir se aceita progresso manual (senão, `evolvePath` sobre o contorno) | tegaki.ink | também serve à escrita a tinta do Kriegsmomente |

**Fontes livres para uso comercial:**
- **Google Fonts (OFL), via `@remotion/google-fonts`, já no stack:**
  - número de painel: **Inter Tight** ou **Space Grotesk** com `font-variant-numeric: tabular-nums` (os dígitos não pulam ao
    rolar);
  - dados: **JetBrains Mono** ou **IBM Plex Mono**;
  - título: **Anton** (em uso nas miniaturas), **Bebas Neue**, **Big Shoulders Display**, **Archivo** (largura variável,
    ótima para "esticar" na tipografia cinética).
- **Fontshare (ITF Free Font License, permite uso comercial):** **Clash Display**, **Satoshi**, **General Sans**.

**Referência de motion:** o What If Sim (dinamismo, `referencia-whatifsim-24fps`), o Elapsed (só visual: contador + "NEXT…";
não copiar o layout) e as regras do `kinetic-typography`. Em resumo: 1 ideia por tela, entrada ≤ 0,8 s, pausa antes do número,
sem bounce.

**Recomendação: Remocn (A).** Copiar `rolling-number`, `ticker-tape`, `countdown` e `kinetic-morph-text` para
`eddie3d/biblioteca/src/hud/`, trocar a fonte para Inter Tight com dígitos tabulares e acrescentar o rótulo por projeção (E).
- **Por quê:** é frame-correto por construção, MIT, o código fica nosso e cobre de uma vez o contador com dígitos rolando e a
  tipografia cinética.
- **number-flow:** fica como referência visual.

---

## 7. Recomendação final, em ordem de impacto ÷ custo

| Ordem | Item | Peça escolhida | Impacto | Custo para entrar | Primeiro passo do batedor |
|---|---|---|---|---|---|
| 1 | HUD e texto | **Remocn** + Inter Tight tabular + rótulo por projeção | alto (todo plano tem HUD) | ~0 (copiar componentes) | 3 stills: contador rolando, rótulo preso a um objeto, título cinético |
| 2 | Multidão | **InstancedMesh2 0.3.16** (skinning + LOD) + Quaternius UAL | alto em cidade e praia | baixo (1 dependência MIT) | 1.000 pessoas e 200 carros; medir ms/quadro e MD5 entre 2 abas |
| 3 | God rays | **three-good-godrays 0.12.1** (externo) + `SpotLight volumetric` do drei (interior) | médio-alto | baixo | still com o sol fora do quadro atrás de palmeiras |
| 4 | Céu | **`<Clouds>` do drei** (seed fixo + relógio do quadro) + céu atual; `three-atmosphere` para o dia/noite | médio | baixo | 24 h em 10 s, 4 stills |
| 5 | Fumaça, fogo, explosão | **VDBs CC0 da JangaFX → flipbook no Blender NA G4** + nosso `Flipbook` | alto nos desastres | médio (1 job de Blender por efeito) | 1 explosão + 1 pluma assadas; lado a lado com a Unity Labs |
| 6 | Mar e inundação | **Ultra-Water** (porte para 0.180 + aquecimento da espuma); `MeshReflectorMaterial` para rua inundada; ABYSSAL para tsunami | muito alto na praia | médio-alto (porte de 23 arquivos) | still Breakers + Lagoon em 0.180; MD5 do quadro 4.000 vindo de 0 × direto |
| 7 | WebGPU | **Não migrar.** Batedor de 20 min de Vulkan na G4; "ilha WebGPU" só se o item 6 perder | — | alto se migrar (reescrever `Look.tsx`) | `vulkaninfo` + `requestAdapter()` com `--gl=vulkan` |

**Versão do three:** ficar no **0.180**. Única subida aceitável sem reescrita: **0.182.0**, e só se o `three.quarks` 0.17
fizer falta. Acima de 0.182 perde-se o `three-good-godrays`; a partir de 0.185 o ganho é só WebGPU, que exige reescrever o pós.

**Licença, sempre:** guardar `LICENCA.txt` e data em `D:/whatif_es/assets/<fonte>/` em cada download. Não copiar nada GPL nem
"MIT by project rule" do repo do scottstts. Créditos só na descrição.

---

## 8. Método e fontes deste levantamento
- **GitHub:**
  - 57 buscas `gh search repos` com termos sem aspas (ocean, water, foam, FFT, gerstner, flood, caustics, clouds, sky,
    atmosphere, godrays, volumetric light, particles, quarks, smoke, explosion, vfx, crowd, VAT, instancedmesh2, remotion
    templates/animation/text/three, kinetic typography, number counter, odometer, number flow, html labels);
  - metadados de 50 repos pela API (estrelas, push, licença);
  - `package.json` dos 19 principais (versão do three, WebGL × WebGPU).
- **npm:** `npm view` de 40 pacotes (versão, licença, peerDependencies e histórico do `three.quarks`, `three-vat`,
  `three-good-godrays`, `three-gpu-pathtracer`, `three` e `gsap`).
- **Código local:**
  - flags do `@remotion/renderer` 4.0.537 (`open-browser.js`);
  - `Cloud.js` e `SpotLight.js` do drei 10.7.9;
  - `OceanSim.js` do Ultra-Water (via API);
  - `THIRD_PARTY_NOTICES.md` e `example-traces.json` do scottstts;
  - stills `coastal-breaker-ocean` e `spectral-cascade-ocean`.
- **YouTube API** (`ferramentas/levantamento/yt_busca.py`, 14 buscas; usar `python -I -X utf8`, porque com `-I` o
  `PYTHONIOENCODING` é ignorado e emoji no título derruba o script):

  | ID | Vídeo |
  |---|---|
  | `qCqt0E-NXqU` | Wawa Sensei, fake godrays (legenda lida) |
  | `sHiyKH02-E4` / `LkmbJMX35zQ` | Cortiz Dev, god rays |
  | `v5YoO8gPYPQ` | Cortiz Dev, anime water (legenda lida: duas camadas, Voronoi animado, FBM no UV, brilhos em estrela) |
  | `B4mbbyFKX20` | VDB → Flipbook no Blender (legenda lida) |
  | `JrBjEoX28-c` | JangaFX, flipbooks para jogos |
  | `Qj_tK_mdRcA` | SimonDev, nuvens AAA |
  | `v_bwJMZULq8` | Anderson Mancini, nuvens raymarched em R3F |
  | `ot8cO2C2kMs` | VAT explicado |
  | `kAyFWTDYrJw` | números rolando no After Effects (referência de desenho) |
  | `EwKCAgt4aKI` | Remotion Agent Skill |
- **Web:** [Quaternius UAL](https://quaternius.com/packs/universalanimationlibrary.html) (CC0 na página de hoje);
  [80.lv sobre os VDBs grátis da JangaFX](https://80.lv/articles/free-vdb-simulations) (CC0).
- **Não feito:** nenhum download de binário, nenhum uso da G4 nem do Chrome do Eduardo. As demos ao vivo (Ultra-Water, ABYSSAL,
  Remocn) não foram abertas: julgamento visual só pelos stills de exemplo e pelos READMEs. O batedor (passo 1) é que prova.
