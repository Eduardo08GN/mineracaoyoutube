#!/bin/bash
# Tracer3D 2.0 - prepara a VM para um projeto Remotion: EGL da NVIDIA, libs do Chrome, npm install, Chrome for Testing.
# Uso: bash preparar.sh <projeto>   (o servidor.py chama via /exec; o stills_quente sobe em seguida, num job proprio)
D=$1; cd "$D" || exit 1
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
echo APT_OK
[ -d node_modules/remotion ] || npm install --no-audit --no-fund --loglevel=error || { echo NPM_FALHOU; exit 2; }
echo NPM_OK
npx remotion browser ensure > /dev/null 2>&1 && echo CHROME_OK
