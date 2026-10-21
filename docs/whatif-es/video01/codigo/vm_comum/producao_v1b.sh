#!/bin/bash
# Video 1 refeito (pipeline novo): GPU + dependencias do stack, efeitos novos no MOSS em paralelo, render em quadros com reparo.
log(){ echo "$(date +%H:%M:%S) $*" >> /content/status_v1b.txt; }
log inicio
( cd /content && ([ -d MOSS-TTS ] || git clone -q https://github.com/OpenMOSS/MOSS-TTS.git)
  pip -q install uv > /dev/null 2>&1
  if [ ! -x /content/moss_env/bin/python ]; then uv venv -q -p 3.12 /content/moss_env > /content/au1/efeitos.log 2>&1
    uv pip install --python /content/moss_env/bin/python -q torch==2.9.0 torchaudio==2.9.0 --index-url https://download.pytorch.org/whl/cu128 >> /content/au1/efeitos.log 2>&1
    uv pip install --python /content/moss_env/bin/python -q numpy==1.26.4 einops safetensors transformers==4.57.1 diffusers==0.37.1 ftfy regex soundfile descript-audiotools==0.7.2 huggingface_hub >> /content/au1/efeitos.log 2>&1; fi
  cd /content/au1 && TORCHDYNAMO_DISABLE=1 /content/moss_env/bin/python gerar_efeitos.py mapa_g4.json efeitos >> efeitos.log 2>&1
  mkdir -p pe && for f in efeitos/*.wav; do ffmpeg -v error -y -i $f pe/$(basename ${f%.wav}).flac; done && tar -cf efeitos.tar pe
  log EFEITOS_PRONTOS $(ls pe | wc -l) ) &
export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH
mkdir -p /usr/share/glvnd/egl_vendor.d
echo '{"file_format_version":"1.0.0","ICD":{"library_path":"/usr/lib64-nvidia/libEGL_nvidia.so.0"}}' > /usr/share/glvnd/egl_vendor.d/10_nvidia.json
rm -f /usr/share/glvnd/egl_vendor.d/50_mesa.json
apt-get -qq update > /dev/null 2>&1
apt-get -qq install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libxkbcommon0 > /dev/null 2>&1
apt-get -qq install -y libasound2t64 > /dev/null 2>&1 || apt-get -qq install -y libasound2 > /dev/null 2>&1
log apt_ok
cd /content/v1b && mkdir -p public
wget -q -O public/terra_dia.jpg https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74092/world.200407.3x5400x2700.jpg
wget -q -O public/terra_noite.jpg https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg
wget -q -O public/waternormals.jpg https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/textures/waternormals.jpg
wget -q -O public/lua.jpg https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/textures/planets/moon_1024.jpg
log texturas $(ls public | wc -l)
npm ci --no-audit --no-fund --loglevel=error > npm.log 2>&1 && log npm_ok || log npm_FALHOU
bash /content/vm_comum/render_seq.sh /content/v1b 13725 VIDEO1B
log FIM $(tail -1 /content/v1b/status.txt)
