#!/bin/bash
# Tracer3D 2.0: render sem flicker do 1.0 (um Chrome por faixa, 1 aba cada; varias abas WebGL num Chrome so dao
# "Shader Error VALIDATE_STATUS"), com trecho de quadros. Uso: bash render.sh <projeto> <ini> <fim>   [P=24]
# Saida: <projeto>/out/video_crf.mp4 (mudo; o audio entra na mixagem no PC)
D=$1; I=$2; F=$3; cd $D
export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH
rm -rf bundle frames out seq; mkdir -p frames out
npx remotion bundle src/index.tsx --out-dir=bundle > out/bundle.log 2>&1 || { tail -20 out/bundle.log; echo BUNDLE_FALHOU; exit 1; }
N=$((F - I + 1)); P=${P:-24}; TAM=$(( (N + P - 1) / P )); T0=$(date +%s)
for i in $(seq 0 $((P-1))); do
  S=$((I + i*TAM)); E=$((S+TAM-1)); [ $E -gt $F ] && E=$F; [ $S -gt $F ] && break
  npx remotion render bundle Video frames/p$(printf %02d $i) --sequence --frames=$S-$E --image-format=jpeg --jpeg-quality=94 \
    --gl=angle-egl --chrome-mode=chrome-for-testing --concurrency=1 --timeout=240000 --log=verbose > out/p$(printf %02d $i).log 2>&1 &
  sleep 2   # escalona a partida dos Chromes: todos juntos disputavam a GPU e alguns caiam para WebGL por software
done
wait
echo quadros $(( $(date +%s) - T0 ))s $(find frames -name '*.jpeg' | wc -l) de $N
python3 /content/t2/vm/reparar.py $D $I $F && echo RENDER_PRONTO $(du -m out/video_crf.mp4 | cut -f1)MB
