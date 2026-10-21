#!/bin/bash
# Sessao nova da G4: prepara o Chrome com GPU e o node_modules uma vez, audio do video 4 em paralelo, depois render dos videos 4 e 3.
log(){ echo "$(date +%H:%M:%S) $*" >> /content/status34.txt; }
log inicio
( bash /content/au/audio_vm.sh > /content/au/audio_vm.out 2>&1 ) &
export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH
mkdir -p /usr/share/glvnd/egl_vendor.d
echo '{"file_format_version":"1.0.0","ICD":{"library_path":"/usr/lib64-nvidia/libEGL_nvidia.so.0"}}' > /usr/share/glvnd/egl_vendor.d/10_nvidia.json
rm -f /usr/share/glvnd/egl_vendor.d/50_mesa.json
apt-get -qq update > /dev/null 2>&1
apt-get -qq install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libxkbcommon0 > /dev/null 2>&1
apt-get -qq install -y libasound2t64 > /dev/null 2>&1 || apt-get -qq install -y libasound2 > /dev/null 2>&1
log apt_ok
cd /content/es4 && mkdir -p public
wget -q -O public/terra_dia.jpg https://eoimages.gsfc.nasa.gov/images/imagerecords/74000/74092/world.200407.3x5400x2700.jpg
wget -q -O public/terra_noite.jpg https://eoimages.gsfc.nasa.gov/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg
wget -q -O public/waternormals.jpg https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/textures/waternormals.jpg
wget -q -O public/cloud.png https://raw.githubusercontent.com/pmndrs/drei-assets/master/cloud.png
wget -q -O public/lua.jpg https://raw.githubusercontent.com/mrdoob/three.js/r170/examples/textures/planets/moon_1024.jpg
log texturas $(ls public | wc -l)
npm ci --no-audit --no-fund --loglevel=error > npm.log 2>&1 && log npm_ok || log npm_FALHOU
cd /content/es3 && ln -sfn /content/es4/node_modules node_modules && rm -rf public && cp -r /content/es4/public public
bash /content/vm_comum/render_seq.sh /content/es4 11670 VIDEO4
log VIDEO4 $(tail -1 /content/es4/status.txt)
bash /content/vm_comum/render_seq.sh /content/es3 12150 VIDEO3
log VIDEO3 $(tail -1 /content/es3/status.txt)
