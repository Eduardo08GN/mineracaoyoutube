#!/bin/bash
# Stills locais (WebGL por software): bash teste/still.sh <pasta> <segundo_do_VIDEO> [...]  (segundos, nao quadros)
# Empacota uma vez por pasta e renderiza em sequencia. Trava global de 3 renders ao mesmo tempo na maquina (varios agentes).
# temporarios do Chrome do Remotion (um perfil por still) fora do C:, que enche (29 GB em 22/10/2026)
export TEMP=D:/tmp TMP=D:/tmp; mkdir -p D:/tmp
cd "$(dirname "$0")/.."
D=$1; shift; mkdir -p teste/$D
B=teste/_b_$D; rm -rf $B; npx remotion bundle src/index.tsx --out-dir=$B > teste/$D/bundle.log 2>&1 || { tail -20 teste/$D/bundle.log; exit 1; }
SL=/d/whatif_es/_slots; mkdir -p $SL
for s in "$@"; do
  q=$(python -c "print(round($s*30))")
  while true; do for k in 1 2 3; do mkdir $SL/s$k 2>/dev/null && { SLOT=$k; break 2; }; done; sleep 3; done
  npx remotion still $B Video teste/$D/t$(printf %07.2f $s).png --frame=$q --scale=${ESCALA:-0.4} --timeout=300000 --port=$((3300 + RANDOM % 600)) > teste/$D/$q.log 2>&1
  rmdir $SL/s$SLOT
  [ -f teste/$D/t$(printf %07.2f $s).png ] || { echo "FALHOU $s"; tail -5 teste/$D/$q.log; }
done
rm -rf $B
ls teste/$D/*.png 2>/dev/null | wc -l
