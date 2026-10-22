#!/bin/bash
# Efeitos sonoros na G4 com MOSS-SoundEffect v2.0 (Apache 2.0), venv proprio, empacota assim que termina.
# Uso: bash efeitos.sh <pasta com gerar_efeitos.py e mapa_g4.json>   -> <pasta>/efeitos.tar e EFEITOS_PRONTOS em <pasta>/status.txt
D=$1; log(){ echo "$(date +%H:%M:%S) $*" >> $D/status.txt; }
log efeitos_inicio
cd /content && ([ -d MOSS-TTS ] || git clone -q https://github.com/OpenMOSS/MOSS-TTS.git)
pip -q install uv > /dev/null 2>&1
if [ ! -x /content/moss_env/bin/python ]; then
  uv venv -q -p 3.12 /content/moss_env > $D/efeitos.log 2>&1
  uv pip install --python /content/moss_env/bin/python -q torch==2.9.0 torchaudio==2.9.0 --index-url https://download.pytorch.org/whl/cu128 >> $D/efeitos.log 2>&1
  uv pip install --python /content/moss_env/bin/python -q numpy==1.26.4 einops safetensors transformers==4.57.1 diffusers==0.37.1 ftfy regex soundfile descript-audiotools==0.7.2 huggingface_hub >> $D/efeitos.log 2>&1
fi
cd $D && TORCHDYNAMO_DISABLE=1 /content/moss_env/bin/python gerar_efeitos.py mapa_g4.json efeitos >> efeitos.log 2>&1
mkdir -p pe && for f in efeitos/*.wav; do ffmpeg -v error -y -i $f pe/$(basename ${f%.wav}).flac; done && tar -cf efeitos.tar pe
log EFEITOS_PRONTOS $(ls pe | wc -l)
