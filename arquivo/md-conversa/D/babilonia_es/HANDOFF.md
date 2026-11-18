# HANDOFF: vídeo Babilônia (Spanish 3D), em produção (30/10/2026, 15:08)

Você herda uma produção em andamento. Leia este arquivo inteiro antes de agir. A memória do projeto (MEMORY.md) já carrega as regras do Eduardo. As mais relevantes aqui: [[spanish3d]], [[feedback-mineracao-bidimensional]] (agora **tridimensional**: produção ≤ 2 h por vídeo), [[feedback-g4-diferencial]], [[historia-dark-estilos]], [[g4-multisessao]], [[feedback-gpu-colab-desligar]], [[feedback-entrega-so-arquivo-final]], [[feedback-musica-instrumental]], [[feedback-taskstop-windows]], [[feedback-nada-no-c]].

## Quem e o quê

- **Eduardo:** escreve em português informal e decide rápido. Quer as respostas em português, diretas.
- **Pipeline Spanish 3D:** canal-teste em espanhol (Segundo a Segundo como laboratório de nichos). Doc em `D:\mineracaoyoutube\spanish3d\README.md`, que é o repositório **público** `mineracaoyoutube`; nunca versionar chave, e-mail ou caminho local.
- **Vídeo 1:** "La antigua Babilonia era más extraña de lo que crees", modelado no Nils History ("Ancient Babylon Was Weirder Than You Think", 1,74 mi).
  - A estrutura do título é fiel à referência. Os 3 títulos do A/B mudam só a palavra.
  - Nunca "(Sin IA)".
- **Estilo:** ilustração rica de HQ (estilo Runic) com planos animados, tudo na G4.
- **Prazo:** o Eduardo fixou **no máximo 2 h de produção**; a stack foi montada à parte. A produção começou às 14:22, e a previsão dada a ele foi **pronto entre 16:10 e 16:15**.

## O que já está pronto (local, `D:\babilonia_es`)

- **Roteiro:**
  - `roteiro/gerar_skript.py`: 14 capítulos, 2.027 palavras. Gera `skript_es.md` e `skript_de.json`.
  - `roteiro/plano.py`: 98 planos (87 ilustrações, 23 delas com clipe Wan, 11 cartões). Gera `g4/jobs_img.json`, `g4/jobs_vid.json` e `roteiro/plano.json`.
- **Voz:** `voz/*.wav`, 14 capítulos (Gemini TTS, `voz/narrar.py`, estilo contador de histórias), 12,25 min. Alinhamento em `voz/alinhamento.json` (stable-ts na G4).
- **Imagens:** `v1/public/img/` com 151 PNGs (Qwen-Image + LoRA Lightning de 8 passos, 4,9 s por imagem).
- **Remotion:** `v1/`. É um sequenciador leve (`src/Video.tsx`) que lê `src/timeline.json` com ilustração + câmera, clipe e cartão; marca `@SegundoASegundo`. Os `node_modules` são uma junction para `D:\tracer3d\stack\node_modules`.
- **Linha do tempo:** `ferramentas/montar_timeline.py` gera `v1/src/timeline.json` (170 planos, 12,5 min, média de 4,4 s) e `v1/src/plano.json` (compatível com `mixar.py`, `efeitos.py` e `legendas.py`).
- **Entrega parcial:** `entrega/titulo1_thumb1.jpg` … `titulo3_thumb3.jpg` (de `dados/miniaturas/montar.py`) e `entrega/titulo_e_descricao.txt` (títulos A/B, descrição, capítulos, fontes, créditos, etiquetas).

## O que está rodando AGORA na G4 (RTX PRO 6000 96 GB, Colab)

Controle pelo `D:\tracer3d2\canal.py`. **SEMPRE** use `MSYS_NO_PATHCONV=1` e `TEMP=D:/tmp`; sem isso, o Git Bash troca `/content/...` por caminho do Windows.

1. **Wan 2.2 I2V A14B + LoRA Lightning (4 passos):** os 23 clipes.
   - Em `/content/s3d/prod`: `python3 ../gen_vid.py jobs_vid.json img vid`, com log em `vid.log`.
   - Às 15:08 ainda carregava os pesos do disco, que é lento (~10 min).
   - Procure `CARGA`, `VID <id> <s>` e `FIM_VID`.
   - Se aparecer `LIGHTNING_FALHOU`, ele cai para 30 passos, que **não cabe no prazo**. Nesse caso mate o processo por PID (`pgrep -f '^python3 ../gen_vid.py'`) e deixe os clipes faltantes virarem imagem; o montador já usa `src_img`, mas precisa de ajuste: troque `tipo` "clip" por "img" para os clipes que não existem.
2. **Efeitos MOSS, regerando:**
   - A 1ª tentativa morreu com `urllib3` quebrado no `moss_env`; o ambiente foi reinstalado e a geração relançada.
   - Em `/content/t2/kv3`, com log em `efeitos.log`. No fim escreve `EFEITOS_PRONTOS n` em `status.txt` e gera `efeitos.tar` (pasta `pe/`).
3. O ACE-Step já está instalado; a música **ainda não foi gerada**.
4. O projeto Remotion já foi sincronizado na VM em `/content/t2/proj/babilonia_es_v1` (preparar ok).

**Armadilhas já vistas nesta sessão:**
- `pkill -f 'padrão'` dentro do `canal.py exec` mata o próprio shell. Use `pgrep` ancorado (`'^python3 ...'`) e mate por PID.
- Com transformers 5, os componentes vinham em fp32 e davam OOM. O `gen_img.py` e o `gen_vid.py` já convertem para bf16 antes de `.to('cuda')`.
- O `torchao` antigo quebrava a LoRA; já foi removido da VM.
- O Python da VM é o `python3` do sistema, com diffusers 0.42 e transformers 5.22; **não existe** `python` nem o venv `/content/s3d/venv`.
- O Qwen (58 GB) e o Wan (~70 GB) **não cabem juntos** na VRAM. O ACE-Step (vllm) reserva quase toda a GPU, então rode a música **sozinha** na GPU.

**Atualização das 15:10:**
- O Wan carregou com a LoRA Lightning (`CARGA lightning4 713 s`, ou seja, 12 min de carga pelo disco).
- O 1º clipe levou 97,8 s, então os 23 clipes ficam prontos por volta das 15:45.
- A previsão realista de entrega passa a ser **~16:20–16:25**. Avise o Eduardo do atraso.

## Passos que faltam (em ordem)

1. **Esperar `FIM_VID`.** Depois copie os clipes para o projeto remoto e baixe para o local:
   ```bash
   cd D:/tracer3d2 && MSYS_NO_PATHCONV=1 TEMP=D:/tmp python canal.py exec "mkdir -p /content/t2/proj/babilonia_es_v1/public/vid && cp /content/s3d/prod/vid/*.mp4 /content/t2/proj/babilonia_es_v1/public/vid/ && cd /content/s3d/prod && tar -cf vid.tar vid"
   MSYS_NO_PATHCONV=1 TEMP=D:/tmp python canal.py baixar /content/s3d/prod/vid.tar D:/babilonia_es/v1/public/vid.tar   # depois: tar -xf em v1/public
   ```
2. **8 imagens corrigidas** (Júpiter saiu com anéis; zigurates viraram pirâmides egípcias; texto em inglês na última). Os prompts estão em `g4/jobs_fix.json`, já no VM em `/content/s3d/prod/jobs_fix.json`.
   - Gere com `python3 ../gen_img.py jobs_fix.json img`, rodando **depois** do Wan.
   - Copie `img/*_fix_*.png` para `public/img` no projeto remoto e no local.
   - Em `v1/src/timeline.json`, troque `img/<id>_7.png` por `img/<id>_fix_7.png` e `_21` por `_fix_21`, para os ids 02_010, 08_053, 09_055, 10_057, 12_067, 12_070, 12_071 e 14_086. Depois `canal.py sync D:/babilonia_es/v1 src`.
   - Se o tempo apertar, pule este passo; o vídeo sai com as originais.
3. **Render mudo:**
   ```bash
   canal.py render D:/babilonia_es/v1 0 <dur_s do timeline> D:/babilonia_es/render/RENDER_MUDO_NAO_PUBLICAR.mp4
   ```
   `dur_s` está em `v1/src/timeline.json` (~751 s).
4. **Música, em paralelo com o render** (o render é quase só CPU):
   - Em `/content/t2/kv3`, rode `bash musica_bat.sh`. Ele aplica a receita do batedor com variantes pos/neg, o Demucs e escolhe a mais limpa.
   - Saída em `musica_b.tar` (pasta `pm_b/mNN.flac`). Baixe e extraia para `D:/babilonia_es/audio/pm/` com os nomes `m01.flac` … `m14.flac`, que é o que o `mixar.py` espera.
   - Confira em `vocal_b.txt` se a folga entre música e voz passa de ~22 dB.
5. **Efeitos:**
   - Baixe `/content/t2/kv3/efeitos.tar` e extraia em `D:/babilonia_es/audio/` (fica `audio/pe/*.flac`).
   - Rode `python ferramentas/efeitos.py`, que gera `audio/efeitos_plano.json`; as regras de regex são as da Babilônia.
   - Se os efeitos não vierem, siga sem eles.
6. **Mixagem e legenda:** `python ferramentas/mixar.py` (gera `audio/mix_final.wav`, -14 LUFS) e `python ferramentas/legendas.py` (gera `entrega/subtitulos_es.srt`).
7. **Mux:**
   ```bash
   ffmpeg -i render/RENDER_MUDO_NAO_PUBLICAR.mp4 -i audio/mix_final.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest entrega/la_antigua_babilonia_era_mas_extrana_de_lo_que_crees.mp4
   ```
   - Confira com `ffprobe` que há stream de áudio e com `ebur128` que fica em ~-14 LUFS.
   - Em `entrega/` só entra o mp4 com áudio.
8. **Entrega ao Eduardo:**
   - mande a folha das miniaturas e o `titulo_e_descricao.txt` via SendUserFile e abra o Explorer em `entrega/`;
   - diga o caminho e o tempo total de produção, honesto: começou 14:22, e a stack foi montada à parte;
   - diga os pontos fracos.
9. **Desligar a G4:** `canal.py desligar` e conferir com `canal.py saude`, que deve dar `CANAL_SEM_URL`. Só desligue se nenhum job da outra sessão (Kriegsmomente) estiver rodando.
10. **Lições para registrar** no `MEDICAO.md` (crie em `D:\babilonia_es`) e no `spanish3d/README.md`, depois commit e push só dessas pastas:
    - carga do modelo pelo disco da VM: ~10 min por modelo;
    - manter os modelos residentes ou pré-aquecer o cache;
    - `MSYS_NO_PATHCONV`;
    - o bf16 forçado;
    - o `torchao`.

    Leve as ferramentas reutilizáveis para `spanish3d/` no repo: `gen_img.py`, `gen_vid.py`, `montar_timeline.py`, `Video.tsx`, `plano.py` como modelo. Sem caminhos locais.

## Contexto paralelo (outros assuntos do dia)

- **Mineração de nichos:**
  - scripts e dados em `D:\pesquisa_nichos` (neutra, bidim, historia) e `D:\pesquisa_oceano`;
  - 10 chaves da API YouTube no `.env` do repo (não versionado), cerca de 100 mil de cota por dia;
  - pendente: um radar diário e um teste no passado. O Eduardo ainda não pediu.
- **Kriegsmomente:**
  - o vídeo 9 (Königgrätz) foi entregue em `D:\kriegschronik\tracer3d_09_koeniggraetz\entrega`; ainda não foi publicado;
  - o vídeo de 1870 tem 33 mil views, contra menos de 4 mil dos outros.
