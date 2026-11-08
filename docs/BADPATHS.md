# Caminhos ruins (gerais): o que já deu errado e não se repete

Os de cada pipeline ficam no doc dela (como `tracer3d2/BADPATHS.md`). Aqui ficam os que atravessam pipelines.

## 1. Construir à mão o que já existe pronto (5 recorrências)
- **06/11, K18 Königgrätz (o vídeo ficou bom, mas não retroagir):** o terreno e a animação de campo e chão foram ao ar crus e destoaram do resto. O resto do vídeo era de época e acabado (tinta, pinturas e HUD).
  - O que ficou cru: chapado sem textura, árvore em bola low-poly, casa-caixa e bloco de soldados.
  - **Causa:** as 7 frentes cuidaram do desenho da informação, e nenhuma ficou com o acabamento do terreno. Não rodei o levantamento de prontos para isso: Fab/Megascans (o Eduardo já tinha o MW Landscape Auto Material e rochas e plantas Megascans no disco), GitHub three.js (splat de terreno, árvores, grama e casario instanciados) e a G4 (bake e texturas no Cycles).
  - **Correção:** todo vídeo com mundo 3D tem uma **frente de acabamento** própria, com levantamento Fab, GitHub e G4 antes de construir. Ela entrega o terreno, a vegetação e as construções no mesmo registro visual dos outros takes. Ela faz o still lado a lado com um take de época do próprio vídeo antes do render.
- **03/11, Kriegsmomente 14 e auditoria do Learjet:** setas, mapa em relevo, nuvem, céu e cidade feitos à mão no three.js. O Unreal ficou deformando um mapa de floresta.
  - O que já existia: perfect-arrows, `@remotion/paths`, a skill de mapas do Remotion, MapStage, VDBs CC0 da JangaFX, Blosm, LiDAR público.
  - Parte disso já estava instalada sem uso.
  - Os concorrentes (Reconstructed) usam modelo grátis do Sketchfab e dados públicos.
  - **Causa:** o levantamento cobriu só assets. Não houve busca de código (`gh search repos`) nem de método (tutoriais pela YouTube API).
  - **Correção:** as três frentes viraram obrigatórias no portão 1, e as ferramentas estão em `ferramentas/levantamento/`.
- **23/10, Dicke Bertha, e 24/10, V3 (Tracer3D 2.0):** pulei o batedor de stack com a desculpa de que a stack era reaproveitada.
- **02/11, unreal3d (Kriegsmomente) e Segundo a Segundo:** construí à mão o material "ilustrado", as casas peça por peça, a luz, a gradação e o espalhamento de plantas. No three.js, escrevi do zero uma nuvem volumétrica, quando já existe `@takram/three-clouds`.
  - **Resultado:** "cara de PS2", segundo o Eduardo, contra o Elapsed, feito por uma pessoa só em UE5 com a mesma engine.
  - **Causa:** o batedor foi usado para provar o meu código e não para achar o pronto. A regra estava escrita só para three.js e espalhada no D:, fora do repositório.
- **Correção:** o portão 1 do `CLAUDE.md` e o passo 0 de `docs/BATEDOR.md` (levantamento de prontos antes de qualquer construção).

## 2. Render sem convergência na UE5 dá "PS2"
- **02/11:** o render da Schlacht saía com aquecimento 0 (o parâmetro era ignorado), 2 amostras temporais e AA desligado.
- **Efeito:** sombras pretas sem rebote e serrilhado.
- **Regra:**
  - Lumen com aquecimento ≥ 64 quadros na prévia e ≥ 128 no final;
  - ≥ 8 amostras temporais na prévia e ≥ 32 no final.

## 3. Referências de altura diferentes na mesma cena
- **02/11:** o chão era um plano inclinado com centro em x = 250 m e altura 0, e os objetos usavam `z = x·tan 3°` (plano pela origem).
- **Efeito:** tudo flutuava ~13 m, e as sombras viravam "manchas pretas" no chão.
- **Regra:** uma única função de altura para o chão e para os objetos.

## 4. Desligamento automático com tarefa pendente
- **02/11:** a cadeia desligou a G4 segundos depois de o Drive montar, e a imagem da engine não foi gravada.
- **Regra:** com pendência (cópia ao Drive, conferência), a cadeia não tem `fim → desligar`. Quem confere e desliga é o maestro.

## Render longo na G4 perdido por silêncio e ociosidade (03/11, Learjet parte 3)
- **O que houve:**
  - O Blender renderizou 212 quadros (~20 min) sem imprimir nada.
  - O `exec_vm` declarou JOB_ESTAGNADO aos 1.200 s, a fila morreu antes do ffmpeg e a G4 caiu por ociosidade antes da montagem manual.
  - Os quadros, que estavam só na VM, se perderam.
- **Correção:**
  1. Batimento por quadro ligado ao vigia (Monitor), não só ao log.
  2. Render em LOTES de ~30 quadros, cada lote baixado na hora para o PC, com retomar e montagem local (`07_greenacres_p3/blender/lotes_g4.py`).
  3. Ao ver JOB_ESTAGNADO, conferir a VM na hora.

## Chromium headless na G4 caiu no SwiftShader (CPU) e um filme de 26 s empacou por 20 min (04/11, teste do teardown)
- **O que houve:** o Chromium do Playwright, sem flags de GPU no Linux, rodou o WebGL em software (`gpu: ANGLE … SwiftShader`). O still saía em 10 s, mas a captura a 60 fps deu JOB_ESTAGNADO.
- **Correção:** a mesma receita do `render.sh` do Remotion: `export LD_LIBRARY_PATH=/usr/lib64-nvidia` + `--use-gl=angle --use-angle=gl-egl`. Com ela, `gpu: … NVIDIA RTX PRO 6000 Blackwell …`, still em 1 s, filme de 26,2 s a 1080p60 (1.572 quadros) capturado em 55 s.
- **Regra:** toda ferramenta de browser na G4 (teardown, machine-skill, Kalem, HyperFrames) roda com essas flags. Confira a linha `gpu:` antes do filme longo.
- **Também:** `pkill -f "<padrão>"` dentro de `exec_vm` mata o próprio job, porque a linha de comando dele contém o padrão. Use `pgrep -f "^node …"` ancorado.

## Dois renders do mesmo projeto na G4 derrubaram a VM (03/11, Learjet parte 3)
- **O que houve:**
  - Enfileirei o v3 enquanto o v2 ainda baixava. Como os dois usavam o mesmo T2_DONO, o porteiro deixou os dois entrarem.
  - O `render.sh` do v3 apagou `frames/` e `out/` do v2 (`rm -rf`) enquanto o `reparar.py` do v2 ainda renderizava quadros de conserto.
  - Por alguns minutos rodaram juntos 24 Chromes do v3, os Chromes do reparar do v2 e o Blender. O v2 se perdeu.
  - Em seguida, um 5xx do proxy no `/job` matou os dois orquestradores locais, com os jobs ainda vivos na VM.
  - Depois, o `saude` respondeu 404 sem JSON e pareceu "runtime desligado". Era só a URL do proxy que tinha mudado: o religar achou a mesma VM (uptime de 1 h), com os jobs rodando.
  - Religar às cegas teria duplicado o lote do Blender. Ao ver G4_FORA com uptime, confira `rodando` antes de relançar e reanexe com `canal.acompanhar(id)`.
- **Correção:**
  1. `tracer3d2/vm/render.sh` trava por projeto (`flock` em `.render.lock`, herdado pelos filhos), e o segundo render sai com RENDER_OCUPADO.
  2. `canal.acompanhar(id)` tolera ~3 min de proxy instável e reanexa a um job que já roda; o `exec_vm` usa ele.
  3. Só enfileirar render novo depois do MARCO de render pronto do anterior, nunca no meio do download.
  4. A URL do proxy da G4 trocou duas vezes na mesma noite (23:28 e 00:23, ~1 h de intervalo), e as duas vezes pareceram G4_FORA. `canal.ligar()` relê a URL e acha a mesma VM.
     - A fila retoma barata: o modo `lote` pula quadros feitos na VM e o PC pula lotes baixados.
     - Pendente: o `acompanhar` deveria reler a URL sozinho num 404 sem JSON, em vez de abortar.
  5. Fila longa nunca dentro de `threading.Thread`: um SystemExit numa thread mata só a thread, sem traceback, e o processo sai com código 0.

## Mix travou >12 min na G4 por `np.convolve` com janela longa (04/11, Kriegsmomente 15)
- **Sintoma:** `mix.py` a 2.000 % de CPU por mais de 12 min, sem saída; a mesma mix sem efeitos tinha saído antes.
- **Causa:** envelope da voz (duck) com `np.convolve(x, np.ones(12000)/12000)` sobre ~42 mi de amostras. É convolução direta, O(N·K), ~5×10¹¹ operações.
- **Correção:** média móvel em O(N) com `scipy.ndimage.uniform_filter1d(x, K)` (ou soma cumulativa): a mix inteira em 1,5 min.
- **Regra:** em áudio de vídeo inteiro, janela > ~100 amostras nunca vai para `np.convolve`; use `uniform_filter1d` ou `scipy.signal.fftconvolve`.

## Ligar a G4 com a narração do AI Studio rodando no mesmo navegador (05/11, What If ES 08)
- **Sintoma:** o `canal.ligar` deu `CANAL_SEM_URL`, e o AI Studio baixou WAV vazio (0 bytes) no mesmo capítulo, várias vezes seguidas.
- **Causa:** os dois scripts usam o mesmo Dolphin (Ivone) por CDP. O Colab e o AI Studio disputam o foco e o download.
- **Regra:** nunca rodar ao mesmo tempo nada que dirija o navegador (ligar/reconectar a G4, narração, Flow). O que roda NA G4 depois de ligada não usa o navegador e pode ir em paralelo à vontade. Ordem: narrar → ligar G4 → lote paralelo na G4.

## Dependência nova no projeto não chega à G4 (06/11, K18)
- **Sintoma:** os stills na G4 falharam com `Can't resolve '@orbat-mapper/control-measures'` (e tegaki, perfect-freehand), embora tudo rodasse no PC.
- **Causa (dupla):**
  - o `package.json` do projeto foi copiado da stack ANTES de instalar as bibliotecas novas;
  - o `vm/preparar.sh` só rodava `npm install` se não existisse `node_modules/remotion`.
- **Regra:**
  - toda biblioteca nova vai no `package.json` do PROJETO, com versão exata;
  - o `preparar.sh` agora compara o `package.json` com `node_modules/.package_ok` e reinstala se mudou;
  - `r"D:\tracer3d2"` escrito via heredoc/replace em Python vira TAB (`\t`): em scripts gerados use `"D:/tracer3d2"`.

## 5. Stack "Frankenstein", sem unidade de arte
- **08/11 (reels FB):** o boneco Quaternius cru, a árvore EZ-Tree e o terreno por código vinham cada um com sua paleta. O Eduardo chamou de "rascunho de estudante de animação" e "Frankenstein sem identidade".
- **Regra:** comece por um kit harmonizado (Polyfork, ou um pacote Fab da biblioteca do Eduardo). Uma paleta, uma receita de luz, um sistema de texto. O que vier de fora é recolorido para a paleta do kit.

## 6. Reinstalar a stack a cada ligada da G4
- **Até 08/11:** a stack Remotion reinstalava apt, npm e Chrome em toda VM nova. Isso custava minutos de G4 em cada job, de todas as sessões.
- **Regra:** toda stack nova ou alterada vira uma imagem `.sqfs` no Drive da conta Ultra (ver `docs/g4-imagem-stack.md`).

## 7. Tudo misturado entre canais
- **Até 08/11:** os reels do FB moravam dentro da pasta de mineração, e os pipelines tinham nome de ferramenta, não de canal.
- **Regra:** separe por tenant, canal → formato (ver `docs/arquitetura-tenants.md`).
