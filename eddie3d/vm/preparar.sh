#!/bin/bash
# Prepara um projeto na G4: Chrome com GPU (EGL da NVIDIA), bibliotecas, texturas publicas e npm ci.
# Uso: bash preparar.sh <pasta do projeto>   (escreve em <pasta>/status.txt)
D=$1; cd $D; log(){ echo "$(date +%H:%M:%S) $*" >> $D/status.txt; }
log preparar_inicio
export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH
mkdir -p /usr/share/glvnd/egl_vendor.d
echo '{"file_format_version":"1.0.0","ICD":{"library_path":"/usr/lib64-nvidia/libEGL_nvidia.so.0"}}' > /usr/share/glvnd/egl_vendor.d/10_nvidia.json
rm -f /usr/share/glvnd/egl_vendor.d/50_mesa.json
if [ ! -f /content/.apt_ok ]; then
  apt-get -qq update > /dev/null 2>&1
  apt-get -qq install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libxkbcommon0 > /dev/null 2>&1
  apt-get -qq install -y libasound2t64 > /dev/null 2>&1 || apt-get -qq install -y libasound2 > /dev/null 2>&1
  touch /content/.apt_ok
fi
log apt_ok
mkdir -p public
[ -s public/terra_dia.jpg ] || wget -q -O public/terra_dia.jpg https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74092/world.200407.3x5400x2700.jpg
[ -s public/terra_noite.jpg ] || wget -q -O public/terra_noite.jpg https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg
[ -s public/waternormals.jpg ] || wget -q -O public/waternormals.jpg https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/textures/waternormals.jpg
[ -s public/lua.jpg ] || wget -q -O public/lua.jpg https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/textures/planets/moon_1024.jpg
log texturas $(ls public | wc -l)
[ -d node_modules/remotion ] || { npm ci --no-audit --no-fund --loglevel=error > npm.log 2>&1 && log npm_ok || log npm_FALHOU; }
log PREPARADO
