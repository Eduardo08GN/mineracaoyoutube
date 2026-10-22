#!/bin/bash
# Stills na G4 (look HDR de verdade) + folha de contato e brilho medio. Uso: bash stills.sh <pasta> <rotulo> q1 q2 ...
D=$1; R=$2; shift 2; cd $D; log(){ echo "$(date +%H:%M:%S) $*" >> $D/status.txt; }
export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH
rm -rf bundle_st st_$R; mkdir -p st_$R
npx remotion bundle src/index.tsx --out-dir=bundle_st > bundle_st.log 2>&1 || { log STILLS_${R}_BUNDLE_FALHOU; exit; }
for q in "$@"; do
  while [ $(jobs -r | wc -l) -ge 8 ]; do sleep 1; done
  npx remotion still bundle_st Video st_$R/$(printf %05d $q).png --frame=$q --gl=angle-egl --chrome-mode=chrome-for-testing --timeout=240000 --log=verbose > st_$R/$q.log 2>&1 &
  sleep 1
done
wait
python3 - "$R" << 'PY'
import sys, glob
from PIL import Image
import numpy as np
R = sys.argv[1]; fs = sorted(glob.glob(f'st_{R}/*.png')); W, H = 640, 360; col = 4
m = Image.new('RGB', (W * col, H * ((len(fs) + col - 1) // col)))
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB'); m.paste(im.resize((W, H)), ((i % col) * W, (i // col) * H))
    print(f.split('/')[-1], round(float(np.asarray(im.convert('L')).mean()), 1))
m.save(f'st_{R}.jpg', quality=85)
PY
log STILLS_${R}_PRONTO $(ls st_$R/*.png | wc -l) software=$(grep -l LOOK_SOFTWARE st_$R/*.log 2>/dev/null | wc -l)
