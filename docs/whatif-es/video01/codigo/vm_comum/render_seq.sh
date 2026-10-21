#!/bin/bash
# Render sem flicker: 32 Chromes com 1 aba cada, saida em quadros JPEG, deteccao e re-render dos quadros com glitch, depois encode.
# Uso: bash render_seq.sh <pasta do projeto> <total de quadros> <rotulo>
D=$1; N=$2; R=$3; cd $D
log(){ echo "$(date +%H:%M:%S) $*" >> status.txt; }
export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH
rm -rf bundle frames out; mkdir -p frames out
npx remotion bundle src/index.tsx --out-dir=bundle > bundle.log 2>&1 && log bundle_ok || log bundle_FALHOU
P=${P:-24}; TAM=$(( (N + P - 1) / P )); T0=$(date +%s)
for i in $(seq 0 $((P-1))); do
  S=$((i*TAM)); E=$((S+TAM-1)); [ $E -ge $N ] && E=$((N-1))
  npx remotion render bundle Video frames/p$(printf %02d $i) --sequence --frames=$S-$E --image-format=jpeg --jpeg-quality=94 \
    --gl=angle-egl --chrome-mode=chrome-for-testing --concurrency=1 --timeout=240000 --log=verbose > out/p$(printf %02d $i).log 2>&1 &
  sleep 2   # escalona a partida dos Chromes: todos juntos disputavam a GPU e alguns caiam para WebGL por software
done
wait
log quadros_$(( $(date +%s) - T0 ))s $(find frames -name '*.jpeg' | wc -l)
python3 /content/vm_comum/reparar.py $D $N >> status.txt 2>&1
log ${R}_PRONTO $(du -m out/video_crf.mp4 | cut -f1)MB
