# Eddie3D

**Eddie3D** é o pipeline que produz os vídeos de simulação 3D do canal **¿Qué Pasaría Si? 3D** (What If ES): refações em espanhol
de vídeos "What If" com cena 3D própria, painel, legendas, música e efeitos gerados, render na GPU do Colab ("G4") e
entrega com miniatura, Shorts/Reels e textos de publicação.

É um pipeline **independente** do resto deste repositório (a pasta `motor/` é outro pipeline, para outro tipo de vídeo). Tudo o que o
Eddie3D usa está nesta pasta; a documentação detalhada de cada produção fica em [`../docs/whatif-es/`](../docs/whatif-es/).

## Vídeos feitos com o Eddie3D

| # | Vídeo | Documentação |
|---|---|---|
| 1 | ¿Qué pasaría si la Tierra girara cada vez más rápido…? | [video01/PRODUCAO.md](../docs/whatif-es/video01/PRODUCAO.md) (manual completo do pipeline) |
| 2 | ¿Qué pasaría si te calentaras cada vez más…? | [STACK.md](../docs/whatif-es/STACK.md) (primeiro vídeo na stack de qualidade) |
| 5 | ¿Qué pasaría si el tiempo se acelerara…? | [video05/PRODUCAO.md](../docs/whatif-es/video05/PRODUCAO.md) (produção em paralelo por agentes) |
| 6 | ¿Qué pasaría si la Tierra girara cada vez más lento…? | [video06/PRODUCAO.md](../docs/whatif-es/video06/PRODUCAO.md) (primeiro com o batedor) |

## As etapas

```
original no YouTube
  → 1 LEITURA      analisar.py: quadros a 10 fps, folhas de contato, OCR das legendas, mapa de som (PANNs)
  → 2 MAPA         mapa de ações: cada acontecimento com segundo, quem/onde, câmera; painel; legendas corrigidas
  → 3 BATEDOR      inventário do que a stack faz fraco/nunca fez + varredura de libs/assets grátis (BATEDOR.md)
  → 4 ADAPTAÇÃO    referências dos EUA → hispânicas (mesma física); take inédito de 30 s com fato verificado
  → 5 ESQUELETO    roteiro.ts (capítulos, câmera, take), fisica/tempo (números do painel), Cena.tsx, BRIEF, stubs
  → 6 MUNDOS       um agente por mundo/módulo em paralelo (céu, cenários, HUD, take, som), testes locais (still.sh)
  → 7 G4           assets pelo painel do Colab (pedaços de 45 MB, md5), música (ACE-Step) + efeitos (MOSS), stills na GPU
  → 8 RENDER       render_seq.sh: dezenas de Chromes de 1 aba, quadros JPEG, reparo de glitch, encode; desligar a G4
  → 9 FINAL        mixar.py (−14 LUFS), glitch.py, emendas, lado a lado com o original, miniatura, Shorts, textos
```

Regras de ouro (detalhe em [video01/PRODUCAO.md, seção 13](../docs/whatif-es/video01/PRODUCAO.md)): determinismo (tudo função
do tempo do quadro), ação em cena (nunca > 4 s parado; legenda = ação), adaptação cultural, take inédito de 30 s, névoa + god rays
em cena externa com Sol, batedor antes de modelar, só assets com licença comercial, nada no C:, a G4 sempre desligada quando
não está renderizando, repositório público (nada de chave, e-mail, perfil ou link de notebook).

## Pastas

| Pasta | O que tem |
|---|---|
| [`ferramentas/`](ferramentas/) | Roda no PC. `colab.py` (controla o notebook do Colab pelo navegador: células, upload pelo painel Arquivos em pedaços, download), `g4.py` (ligar, enviar, rodar, ler, baixar, desligar), `term.py`/`espera.py`, `analisar.py` (leitura a 10 fps), `glitch.py`/`flicker.py` (varredura do mp4), `lut_mkl.py` (LUT de cor do original), `zipar.py`, [`auditoria/`](ferramentas/auditoria/) (medir, comparar, folhas, som, `comparativo.sh` lado a lado), [`exemplos/`](ferramentas/exemplos/) (rodadas reais do vídeo 6: stills e render) |
| [`vm/`](vm/) | Roda na G4. `preparar.sh` (EGL da NVIDIA, bibliotecas, `npm ci`), `stills.sh` (stills na GPU + folha), `render_seq.sh` + `reparar.py` (render sem flicker), `lancar_render.sh` (trava contra execução dupla), `efeitos.sh`, [`audio/`](vm/audio/) (música ACE-Step e efeitos MOSS a partir do `mapa_g4.json`) |
| [`stack/`](stack/) | `package.json` + lock com as versões travadas (Remotion 4, three 0.180, R3F 9, drei, postprocessing, n8ao, EZ-Tree) |
| [`biblioteca/src/`](biblioteca/src/) | Módulos reutilizáveis: `look/Look.tsx` (compositor: AO, saneamento, névoa, god rays, bloom, AgX, LUT, vinheta), `mundo/vfx.tsx` (flipbooks de fogo/fumaça), `pessoas.tsx` (humanos Quaternius com rig), `arvores.tsx` (EZ-Tree com estações), `palmeiras.tsx`, `chao_molhado.tsx` (molhado → seco → rachado), `ambiente.tsx` (HDRI, areia PBR), `comum.tsx`, `ceu_lapso.tsx` (céu em lapso de tempo, vídeo 5), `ceu_lugares.tsx` (céu físico por lugar com o Sol pela rotação, vídeo 6) |
| [`modelo/`](modelo/) | Esqueleto de projeto (exemplo do vídeo 6): `roteiro.ts`, `fisica.ts`, `Cena.tsx`, `index.tsx`, `teste/still.sh` (stills locais com trava de 3 renders), `BRIEF_modelo.md` (regras que todo agente lê) |
| [`som/`](som/) | `mixar.py`: monta os stems da G4 pelo `mapa.json` (inserção do take, `vezes`/`alinhar`), −14 LUFS, true peak ≤ −1 dBTP, duração exata |
| [`shorts/`](shorts/) | Projeto Remotion dos Shorts/Reels por edição (sem re-render): fundo desfocado, vídeo inteiro sem a faixa de legenda, gancho no topo, legendas grandes |
| [`miniaturas/`](miniaturas/) | `fazer_miniaturas.py`: quadro forte do vídeo, borra o texto gravado, título curto em Anton |

## Instalar numa máquina nova

1. Node 20+, Python 3.12 (numpy, pillow, playwright, soundfile, pyloudnorm, rapidocr-onnxruntime, librosa, panns-inference), ffmpeg.
2. `cd stack && npm ci` e, em cada projeto de vídeo, `node_modules` como junction para `stack/node_modules`.
3. Copiar `local.exemplo.json` para `local/config.json` (fora do Git) e preencher: o perfil do Dolphin Anty com o Colab
   logado, o link do notebook com a G4 e a pasta de trabalho (`D:\whatif_es`). Também aceita variáveis `EDDIE3D_<CHAVE>`.
4. No notebook do Colab: runtime com GPU; o `g4.py ligar` conecta e sobe o vigia.

## Rodar um vídeo (resumo)

```
python ferramentas/analisar.py                 # dentro de <video>/ref, com v.mp4 baixado (yt-dlp)
# mapa de ações + batedor + esqueleto + mundos (agentes) — ver docs/whatif-es/video05 e video06
bash modelo/teste/still.sh <pasta> 10 45 120   # stills locais
python ferramentas/g4.py ligar
python -c "import colab; colab.subir_painel('assets.zip')"   # em ferramentas/; pedaços de 45 MB com md5
bash ferramentas/exemplos/rodada_v6_b.sh g <quadros...>      # código + preparar + stills na GPU
bash ferramentas/exemplos/render_v6.sh                       # render completo + download
python ferramentas/g4.py desligar
python som/mixar.py                                          # mix_final.wav
python ferramentas/glitch.py <video>.mp4                     # varredura antes de entregar
```

As cópias em uso na produção ficam em `D:\whatif_es` (ferramentas, `vm_comum`, `stack`) e em `D:\prehistoria\colab.py`; esta pasta
é a versão de referência no repositório (com os caminhos da máquina trocados pela config local).

## Referências
- Stack de qualidade e decisões: [STACK.md](../docs/whatif-es/STACK.md)
- Rotina do batedor: [BATEDOR.md](../docs/whatif-es/BATEDOR.md)
- Erros e regras aprendidas (76 itens): [erros-pipeline.md](../docs/whatif-es/erros-pipeline.md)
- Pesquisa de mercado (canais faceless): [docs/pesquisa/faceless-2026-10](../docs/pesquisa/faceless-2026-10/)
