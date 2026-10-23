#!/bin/bash
# Stills sob demanda na G4 (chamado pelo g4_stills.py do PC). Uso: bash stills_srv.sh <projeto> <tag> <escala> q1 q2 ...
# Bundle novo a cada chamada (o src acabou de chegar), 8 Chromes em paralelo, JPEG, tudo num tar para um download so.
D=$1; TAG=$2; ESC=$3; shift 3; cd $D
export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH
rm -rf bundle_srv st_$TAG; mkdir -p st_$TAG
npx remotion bundle src/index.tsx --out-dir=bundle_srv > bundle_srv.log 2>&1 || { tail -30 bundle_srv.log; echo BUNDLE_FALHOU; exit 1; }
for q in "$@"; do
  while [ $(jobs -r | wc -l) -ge 8 ]; do sleep 0.5; done
  npx remotion still bundle_srv Video st_$TAG/$q.jpg --frame=$q --scale=$ESC --image-format=jpeg --jpeg-quality=88 \
    --gl=angle-egl --chrome-mode=chrome-for-testing --timeout=240000 > st_$TAG/$q.log 2>&1 &
done
wait
for q in "$@"; do [ -f st_$TAG/$q.jpg ] || { echo "FALHOU $q"; tail -6 st_$TAG/$q.log; }; done
grep -l LOOK_SOFTWARE st_$TAG/*.log 2>/dev/null | sed 's/^/AVISO_SOFTWARE /'
tar -cf /content/st_$TAG.tar -C st_$TAG $(cd st_$TAG && ls *.jpg 2>/dev/null) && echo TAR_OK $(ls st_$TAG/*.jpg | wc -l)
