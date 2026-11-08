# Receita da stack K19/K20 (Kriegsmomente)

Batedor único da stack nova, usado pelo K19 e pelo K20 (ver `docs/plano-k19-k20.md`).

## Narração (Qwen3-TTS na G4)
Substitui o AI Studio desde 06/11. Modelo aberto (Apache-2.0), roda na G4, sem navegador.

- **Modelos:**
  - `Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign`: desenha a voz a partir de uma descrição em texto;
  - `Qwen/Qwen3-TTS-12Hz-1.7B-Base`: clona a voz a partir de uma referência.
- **Idioma:** `German`, um dos 10 idiomas oficiais. O script confere com `get_supported_languages()`.
- **Instalação:** venv próprio (`uv`, Python 3.12, torch 2.8 cu128) com `UV_SYSTEM_PYTHON=false`. O Colab exporta essa variável como `true`, e o uv instalava no Python do sistema (lição do piloto de 06/11).
- **Voz fixa do canal:**
  1. o VoiceDesign gera 3 candidatas (A: barítono de ~55 anos, sóbrio; B: baixo de ~60 anos, levemente rouco; C: barítono firme de ~48 anos), todas em Hochdeutsch de documentário;
  2. cada candidata tem 2 sementes, e a melhor (WER + UTMOS) vira a referência;
  3. o Eduardo escolhe a candidata, e a referência dela fica congelada para o canal todo.
- **Produção:**
  - o modelo Base clona a referência, frase a frase, em lote, com N = 3 tomadas por frase;
  - QA por tomada: Whisper large-v3 (`de`) contra o roteiro normalizado (WER; ano por extenso via num2words), UTMOS22 (SpeechMOS) e velocidade contra a mediana;
  - nota = UTMOS − 4·WER − 2·|velocidade/mediana − 1|;
  - frase sem tomada com WER ≤ 0,10 ganha mais 2 tentativas;
  - pausa de 0,45 s entre frases e mixagem a −16 LUFS (pyloudnorm).
- **Roteiro:** número, data e nome escritos por extenso no alemão (como em `texto_teste.txt`). Nome que sair mal pronunciado vai para um dicionário de pronúncia; não se troca de modelo sem medir.
- **Batedor:** `D:/kriegschronik/k19_batedor/voz/`, com trecho-teste de ~40 s sobre Krupp 1868–1870.
  - Rodar do PC (G4-1): `bash D:/kriegschronik/k19_batedor/voz/rodar_g4.sh`
  - Saída em `saida/`: `cand_A|B|C_teste.wav`, `ref_*.wav`, `qa.json` e `resumo.txt`. O Eduardo ouve as 3 e escolhe.
  - Para o K20 (G4-2), rodar com `T2_G4=2 T2_DONO=kriegsmomente_k20`. Usa a mesma referência escolhida, sem desenhar de novo.

## Take cinematográfico (molde Chernobyl)
Referência medida a 24 fps: `D:/pesquisa_nichos/leitura_tesseract_chernobyl/ANALISE.md`.
- **Movimento:** 4,85, com 1% de quadros parados e 0 cortes secos.
- **Câmera:** push contínuo de ~2,4%/s.
- **Transições:** 5, todas motivadas (fumaça, nuvem, fogo vira ponto, enquadramento).
- **Mudança por quadro:** ~55% dela vem de grão e partículas.
- **Texto:** dentro da cena, apagado pela fumaça.

O método é barato: **uma imagem por batida + câmera contínua + transição motivada + camada fixa de acabamento.**

### Levantamento de prontos (portão 1, 06/11)
| Peça | Pronto escolhido | Licença | Situação |
|---|---|---|---|
| Imagem de época | **Qwen-Image** (diffusers `QwenImagePipeline`, 20B, BF16) | Apache-2.0 | Planejado no `spanish3d/README.md`, nunca rodado. **FLUX.1-dev fica fora** (licença não comercial). |
| Profundidade | **Depth Anything V2 Small** | Apache-2.0 | Já usado: `D:/tracer3d2/ferramentas/tiefe.py` e a família `epoca` do K18. Base/Large ficam fora (CC-BY-NC). |
| Push 2,5D, opção A | **`epoca/Mesa.tsx` do K18** (malha R3F deslocada por `_prof.png`, claro = perto, dolly contínuo) | nossa | Pronto no K18 (`D:/kriegschronik/k18_koeniggraetz/v1/src/cenas/epoca*`). Texto, fumaça e tinta vivem na mesma cena 3D, então a fumaça passa na frente do texto. |
| Push 2,5D, opção B | **DepthFlow** 1.0.1 (BrokenSource, 1,6 mil ★, ray marching GLSL, bordas sem rasgo, headless) | AGPL-3.0 (o autor incentiva uso comercial; só usamos o programa, não redistribuímos código) | Vai no batedor para comparar com o Mesa. Sai como mp4 de base, com texto e fumaça por cima no Remotion. |
| Fumaça de pólvora, nuvem, explosão | **Unity Labs flipbooks** (`WispySmoke01_8x8`, `Cloud01/02`, `Explosion01_5x5`) | CC0 | Já no disco: `D:/whatif_es/assets/unitylabs/`. |
| Grão e vinheta | `<GraoPapel>` + `<Papel>` da tinta do K18 (ambientCG CC0 + grão) | CC0 / nossa | Pronto. Falta só animar o grão por quadro (semente = frame). |
| Texto com profundidade | IM Fell Italic traço a traço (`tinta/imfell_it`, tegaki) | nossa | Pronto. Novo: o plano do texto fica **entre** a camada do fundo e a da fumaça e frente. |

No GitHub não apareceu nada melhor para Remotion: as buscas por "remotion film grain", "remotion smoke", "three.js depth parallax", "photo parallax webgl" e "3d ken burns" (sniklaus, licença própria) não deram resultado útil. A busca parou no limite de taxa da API depois de 14 consultas.

### Pipeline por batida
1. **Roteiro:** a batida marcada `cine` traz a cena (lugar, data, ação, o que fica em primeiro plano), o terço de céu ou teto livre para o texto e a transição de saída motivada (fumaça, poeira, faísca, match de forma).
2. **G4, imagem:** Qwen-Image 1664×928, 50 passos, true_cfg 4, negativo anti-anacronismo. Fazer 2 sementes por batida e escolher a melhor no olho ou pelo olho da G4 (Qwen3-VL).
3. **G4, creme:** duotono tinta `#2a2622` → papel `#e9e1d0`. O colódio fica 100% duotono; o óleo preserva 45% da cor.
4. **G4, profundidade:** Depth Anything V2 Small gera `_prof.png` (8 bits, contrato do Mesa) e `_prof16.png`.
5. **Remotion, opção A (padrão):** `epoca/Mesa` com dolly contínuo (~2,4%/s mais deriva lateral). Entram depois:
   - o texto (data em monoespaçada, frase palavra a palavra, número grande contando) num plano Z entre o fundo e a fumaça;
   - os flipbooks de fumaça em 2 a 3 planos Z;
   - o grão animado, a vinheta e o `<GraoPapel>`.
6. **Opção B:** DepthFlow na G4 renderiza a base (4–8 s, 1080p24, ssaa 1,5) e o Remotion só compõe texto e fumaça por cima. Usar quando o Mesa rasgar a borda (galhos, rodas, canos finos).
7. **Transição:** a fumaça ou poeira enche o quadro por 8 a 24 quadros e a próxima cena surge pelos buracos (revelação por luminância do flipbook). Nunca corte seco.
8. **Regra:** cada batida `cine` tem imagem e movimento próprios. Imagem e take nunca se repetem, nem no K19, nem entre o K19 e o K20.

### Batedor (stills, sem produção)
- **Pasta:** `D:/kriegschronik/k19_batedor/cinematico/`. Os prompts estão em `prompts.json`.
- **Cenas:** 2 (bateria Krupp C/64 em Sedan, 1º/09/1870; o martelo "Fritz" na fábrica de Essen, 1868).
- **Estilos:** 2 (colódio e óleo).
- **Total:** 2 sementes por combinação, 8 stills.
- **Saídas por still:** a versão creme, a profundidade e uma folha de contato. Também 4 clipes DepthFlow de 4 s.
- **Rodar do PC (G4-1):** `bash D:/kriegschronik/k19_batedor/cinematico/rodar_g4.sh`. Pode rodar em paralelo ao batedor de voz. `DEPTHFLOW=0` pula os clipes.
- **Saída:** `saida/folha.jpg`, `*_creme.jpg`, `*_prof.png`, `*_depthflow.mp4`, `resumo.json` (tempo por imagem).
- **O Eduardo escolhe** o estilo (colódio ou óleo) e a opção de push (A ou B). Depois, 1 take completo de 6 s no Remotion, lado a lado com o Chernobyl a 24 fps (`ler24`).
- **Risco a conferir no still:** o Qwen-Image pode não conhecer a culatra de cunha Krupp. Nesse caso, Qwen-Image-Edit com foto real do C/64 como referência, ou deixar o detalhe técnico para o take 3D.

## Acabamento de terreno (batedor de 07/11, `D:/kriegschronik/k19_batedor/terreno/`)
Feito sobre uma cópia do palco `chao/` do K18; o K18 não foi tocado. O levantamento está em `docs/levantamentos/terreno-k19.md`.

**Folha lado a lado:** `terreno/folha_final.jpg`, com as colunas antes (K18) | depois | take de época do K18.

| Peça | Onde | Resultado |
|---|---|---|
| **Capim e restolho** (núcleo do GrassField, `cortiz2894/stylized-components`, MIT) | `src/kit/capim/` + `cenas/chao/capim.tsx` | **O maior ganho.** O chão chapado ao rés do chão vira campo de trigo dourado com vento. A lâmina é instanciada num disco do próprio DEM em volta da câmera (raio 70 m, 70/m²); a borda encolhe e rareia, sem corte. O vento lê `t`. |
| **Filtro de óleo** (Kuwahara anisotrópico, mesmo repositório, MIT) | `src/kit/kuwahara/` + `palco.tsx` | Pincelada suave em todo o mundo 3D. A tinta (SVG) e o grão ficam fora do filtro, nítidos. O céu virou textura dentro da cena, porque o filtro grava alpha 1. Raio 4: com 7, os soldados ao longe sumiam. |
| **ez-tree** (MIT, já instalado) | `cenas/chao/arvores.tsx` | Árvore procedural real só com a câmera a < 20 m do chão e a < 320 m do foco. Vista do alto, a folhagem dele vira mancha escura; ali ficam as copas em nuvem, que o filtro pinta igual. |

**Armadilha resolvida:** o `<EffectComposer>` do `@react-three/postprocessing` sai vazio no Remotion. O `ThreeCanvas` avança o quadro num `useEffect` antes de o componente montar as passadas. A solução é montar o `EffectComposer` do `postprocessing` num `useMemo` e renderizar com `useFrame(..., 1)`; está em `palco.tsx`, no componente `Pintura`.

**Como usar na produção:**
- Copiar `kit/kuwahara`, `kit/capim`, `palco.tsx`, `arvores.tsx`, `capim.tsx` e `cenario.tsx`.
- Pôr `<Capim>` em todo palco com câmera abaixo de ~15 m.
- Cores de agosto de 1870: restolho e trigo colhido (`base`, `ponta` e `seco` em `opc`).
- Desligar a pintura num quadro: `--props='{"pintura":false}'`.

**Hugging Face** (busca rápida de 07/11):
- `ccore/ThreeJS-3D-GLB-Assets` (MIT): só objetos modernos.
- `daftAI2026/lowpoly-world-assets` (CC BY 4.0): low poly, vetado em close.
- `codepawl/scanned-objects-glb` (CC BY): objetos escaneados de mesa.
- Nada de árvore, casario ou canhão de 1870 que sirva.

**Pendente (fora do batedor):**
- Casas da Lorena (item 4 do levantamento).
- Teste do ez-tree num close de árvore.

### Rodada 2 (07/11): luz e sombra
O Eduardo reprovou a rodada 1 ("ainda amador; sombra e lighting fracos"). Por isso a luz virou a prioridade 1.

**Folha:** `terreno/folha_r2.jpg`, com as colunas antes (K18) | rodada 1 | rodada 2.

| Peça | Onde | Resultado |
|---|---|---|
| **Sol baixo com sombra projetada** | `palco.tsx` (`SolSombra`) + `luz.ts` | Elevação de 16°, de lado e um pouco por trás da câmera, calculada por plano (`solDoPlano`). A sombra é longa e legível em miniatura: troncos, borda da mata, canhões e guarnição. Uma luz direcional com mapa 8192, com a caixa ortográfica **encaixada no trecho câmera→alvo de cada plano**. Funciona como uma cascata única por plano. |
| **Terreno recebe sombra** | `terreno.tsx` (`lights: true` + chunks `shadowmap_*` + `getShadowMask()`) | A luz do terreno passou a ser o céu frio mais o sol quente vezes a sombra. Com `luzK19:false` volta a luz encoberta do K18. |
| **Contraste quente/frio** | `estilo.ts` (toon), `luz.ts` | A faixa clara do toon é multiplicada pelo quente e a escura pelo frio azulado. A mesma regra vale no terreno. Tudo ainda no creme. |
| **N8AO** (oclusão de ambiente, MIT, `n8ao@2.0.1`) | `palco.tsx` (`Pintura`, antes do Kuwahara) | Raio de 0,3% da distância câmera→alvo, entre 0,5 e 8 m, intensidade 1,5 e cor azul-ardósia. Com valor alto (3,2, raio de 8 m) o trigo virava lama e os blocos de tropa viravam manchas pretas. |
| **Capim** | `capim.tsx` | Recebe a sombra (`uShadowStrength` 0,6) e **nunca projeta**: a autossombra de 400 mil lâminas sujava o campo (`userData.semSombra`). O contraluz do sol do K19 acende o trigo. |

**O que foi avaliado e ficou fora (levantamento de 07/11):**
- **CSM do three:** o `setupMaterial` sobrescreve o `onBeforeCompile` e quebraria a cadeia toon + névoa + Heer. Ficou a sombra encaixada por plano.
- **`@takram/three-atmosphere`:** céu físico azul, briga com o céu de papel creme. A névoa de papel já dá a perspectiva aérea.
- **ContactShadows do drei:** redundante com sombra real + N8AO.
- **Próximo passo para árvores e mata ao longe:** `agargaro/octahedral-impostor` (MIT, ativo) com `agargaro/instanced-mesh` (InstancedMesh2, MIT, LOD), impostor de árvore real (ez-tree/Quaternius) no lugar das copas em bola. Estimativa de ~3–4 h, ainda não feito.
- **Soldados:** a Heer instanciada fica. Ao longe, com a sombra e a luz novas, os blocos ainda leem escuros. VAT/Mixamo instanciado continua pendente.
- **three-gpu-pathtracer** (gkjohnson, MIT) e **Blender Cycles** (com o nó Kuwahara): não comparados nesta rodada. O three.js já chegou à sombra legível. Ficam para um plano-herói curto, se o Eduardo pedir mais.

**Rota B, repintura guiada (`terreno/repinta/`):**
- O 3D sem HUD (`cenas/chao/somundo.ts`, `SO_MUNDO=true` só para gerar a entrada) é repintado pelo Qwen-Image img2img (Apache) em óleo de 1866, com forças 0,35 e 0,5.
- O teste mede a tremedeira entre quadros vizinhos (1/30 s) em `saida/estabilidade.json`. Razão ~1 = estável para vídeo; razão alta = só serve para plano parado com push 2,5D.
- Agendada na G4-1 por `agendar.sh`: espera o lote cinematográfico (`lote.py`) terminar, porque os dois modelos de 20B não cabem juntos na VRAM.
- Para baixar:
  ```
  canal.py baixar /content/t2/k19_terra_rep/saida.tgz D:/kriegschronik/k19_batedor/terreno/repinta/saida.tgz
  ```
  O log da VM tem `FEITO` no fim. No PC, extrair com `tar --force-local`.

### Decisão (07/11, madrugada): a repintura guiada com força 0,35 vira a receita de terreno
Folha: `terreno/repinta/folha_repinta.jpg`, com as colunas entrada 3D rodada 2 | força 0,35 | força 0,5.

| Força | Tremedeira (dif. média das saídas ÷ dif. das entradas, quadros a 1/30 s) | Geometria |
|---|---|---|
| 0,35 | 0,59 (14,5 s) e 1,00 (41,5 s) | mantém a linha de canhões, a guarnição e a fumaça |
| 0,5 | 0,62 e 0,80 | inventa: some com a guarnição, muda a fumaça e troca a mata |

**Critério objetivo:** razão ≤ 1,2 = a repintura não cria tremedeira além do movimento do próprio 3D. A força 0,35 passou e ganha muito em acabamento: pincelada, campo, canhões de época. **Força 0,5 é vetada** porque altera o dado.

**Receita:** o 3D da rodada 2 (sol baixo, sombra, N8AO) continua sendo a base, porque posiciona câmera, tropas e dados. Por cima vai a repintura com Qwen-Image img2img:
- força 0,35, 20 passos;
- semente fixa por plano;
- "em dois": 1 repintura a cada 2 quadros de 24 fps;
- custo de ~9 s por quadro repintado na G4, um modelo por G4.

Ainda não testado: a estabilidade com o intervalo de 1/12 s ("em dois") e um plano em movimento inteiro. O primeiro plano da produção serve de prova: vê-lo em vídeo antes de repintar os outros.

O HUD e a tinta (SVG) entram DEPOIS, por cima do quadro repintado, nunca dentro dele.

**Comandos por plano:**
1. Quadros limpos: em `src/cenas/chao/somundo.ts`, `SO_MUNDO = true`. Renderizar o trecho do plano em quadros jpg. Voltar a `false`.
2. Na G4:
   ```
   HF_HOME=/content/hf /content/t2/k19_cine/venv_img/bin/python repinta_plano.py <quadros> <saida> <semente> 2
   ```
   O script é `terreno/repinta/repinta_plano.py`. Ele retoma de onde parou.
3. Montar os quadros repintados como fundo do plano e compor o HUD e a tinta por cima no Remotion.
