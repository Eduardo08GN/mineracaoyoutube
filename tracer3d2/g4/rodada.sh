#!/bin/bash
# Tracer3D 2.0 / V3: alinhamento (stable-ts large-v3) em paralelo com musica (ACE-Step) e efeitos (MOSS). Sinaliza em status.txt.
D=/content/t2/kv3; cd $D
log(){ echo "$(date +%H:%M:%S) $*" >> $D/status.txt; }
log inicio
# batimento no stdout do job (o canal corta job calado por estagnacao)
( while sleep 60; do echo "BATIMENTO $(date +%H:%M:%S) $(tail -1 $D/status.txt)"; done ) & BAT=$!
( pip -q install stable-ts > $D/alinhar.log 2>&1; python alinhar.py >> $D/alinhar.log 2>&1 && log ALINHAMENTO_FIM || log ALINHAMENTO_FALHOU ) & ALI=$!
bash $D/audio_vm.sh > $D/audio_vm.out 2>&1
wait $ALI; kill $BAT; log FIM_TUDO; cat $D/status.txt
