#!/bin/bash
# Roda na G4: musica (ACE-Step) e efeitos (MOSS) em paralelo. Cada um empacota e sinaliza ASSIM QUE termina (baixar na hora).
cd /content/au
log(){ echo "$(date +%H:%M:%S) $*" >> /content/au/status.txt; }
log inicio
pip -q install uv > /dev/null 2>&1
( if [ ! -d /content/ACE-Step-1.5 ]; then git clone -q https://github.com/ACE-Step/ACE-Step-1.5.git /content/ACE-Step-1.5; fi
  cd /content/ACE-Step-1.5 && uv sync -q > /content/au/musica.log 2>&1 && uv pip install -q soundfile >> /content/au/musica.log 2>&1
  MPLBACKEND=Agg uv run python /content/au/gerar_musica.py /content/au/mapa.json /content/au/musica >> /content/au/musica.log 2>&1
  cd /content/au && mkdir -p pm && for f in musica/m??.wav; do ffmpeg -v error -y -i $f pm/$(basename ${f%.wav}).flac; done && tar -cf musica.tar pm
  log MUSICA_PRONTA $(ls pm | wc -l) ) &
( cd /content && ([ -d MOSS-TTS ] || git clone -q https://github.com/OpenMOSS/MOSS-TTS.git)
  uv venv -q -p 3.12 /content/moss_env > /content/au/efeitos.log 2>&1
  . /content/moss_env/bin/activate
  uv pip install -q torch==2.9.0 torchaudio==2.9.0 --index-url https://download.pytorch.org/whl/cu128 >> /content/au/efeitos.log 2>&1
  uv pip install -q numpy==1.26.4 einops safetensors transformers==4.57.1 diffusers==0.37.1 ftfy regex soundfile descript-audiotools==0.7.2 huggingface_hub >> /content/au/efeitos.log 2>&1
  python -c "import torch; print('torch', torch.__version__, torch.cuda.is_available())" >> /content/au/efeitos.log 2>&1
  TORCHDYNAMO_DISABLE=1 python /content/au/gerar_efeitos.py /content/au/mapa.json /content/au/efeitos >> /content/au/efeitos.log 2>&1
  cd /content/au && mkdir -p pe && for f in efeitos/*.wav; do ffmpeg -v error -y -i $f pe/$(basename ${f%.wav}).flac; done && tar -cf efeitos.tar pe
  log EFEITOS_PRONTOS $(ls pe | wc -l) ) &
wait
log FIM_AUDIO
