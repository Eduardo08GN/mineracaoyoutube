#!/bin/bash
# Tracer3D 2.0 / V3: roda na G4: musica (ACE-Step 1.5) e efeitos (MOSS-SoundEffect v2.0) em paralelo.
# Cada um empacota e sinaliza ASSIM QUE termina (baixar na hora; erro 39).
# Disparo (uma vez so; o flock impede a segunda copia, erro 60):
#   setsid nohup flock -n /content/t2/kv3.lock bash /content/kb1/audio_vm.sh > /content/kb1/audio_vm.out 2>&1 < /dev/null &
D=/content/t2/kv3
cd $D
rm -rf musica efeitos pm pe musica.tar efeitos.tar
log(){ echo "$(date +%H:%M:%S) $*" >> $D/status.txt; }
log inicio
pip -q install uv > /dev/null 2>&1
( if [ ! -d /content/ACE-Step-1.5 ]; then git clone -q https://github.com/ACE-Step/ACE-Step-1.5.git /content/ACE-Step-1.5; fi
  cd /content/ACE-Step-1.5 && uv sync -q > $D/musica.log 2>&1 && uv pip install -q soundfile >> $D/musica.log 2>&1
  MPLBACKEND=Agg uv run python $D/gerar_musica.py $D/mapa_g4.json $D/musica >> $D/musica.log 2>&1
  cd $D && mkdir -p pm && for f in musica/m*.wav; do b=$(basename ${f%.wav}); case $b in *_*) continue;; esac; ffmpeg -v error -y -i $f pm/$b.flac; done && tar -cf musica.tar pm
  log MUSICA_PRONTA $(ls pm | wc -l) ) &
( cd /content && ([ -d MOSS-TTS ] || git clone -q https://github.com/OpenMOSS/MOSS-TTS.git)
  if [ ! -x /content/moss_env/bin/python ]; then rm -rf /content/moss_env; uv venv -q -p 3.12 /content/moss_env > $D/efeitos.log 2>&1
  uv pip install --python /content/moss_env/bin/python -q torch==2.9.0 torchaudio==2.9.0 --index-url https://download.pytorch.org/whl/cu128 >> $D/efeitos.log 2>&1
  uv pip install --python /content/moss_env/bin/python -q numpy==1.26.4 einops safetensors transformers==4.57.1 diffusers==0.37.1 ftfy regex soundfile descript-audiotools==0.7.2 huggingface_hub >> $D/efeitos.log 2>&1; fi
  /content/moss_env/bin/python -c "import torch; print('torch', torch.__version__, torch.cuda.is_available())" >> $D/efeitos.log 2>&1
  cd $D && TORCHDYNAMO_DISABLE=1 /content/moss_env/bin/python $D/gerar_efeitos.py $D/mapa_g4.json $D/efeitos >> $D/efeitos.log 2>&1
  cd $D && mkdir -p pe && for f in efeitos/*.wav; do ffmpeg -v error -y -i $f pe/$(basename ${f%.wav}).flac; done && tar -cf efeitos.tar pe
  log EFEITOS_PRONTOS $(ls pe | wc -l) ) &
wait
log FIM_AUDIO
