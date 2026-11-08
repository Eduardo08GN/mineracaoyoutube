#!/bin/bash
# Clipe completo do batedor (14 s = 420 quadros a 30 fps) NA G4: render_seq.sh (Chromes de 1 aba, JPEG, reparo de glitch, encode).
# Pre-requisito: o stills_g4.sh ja rodou nesta sessao da G4 (pacote em /content/b07 com npm pronto). Saida: RENDER MUDO (sem audio).
# Uso: bash 07_batedor_fab/g4/clipe_g4.sh
export MSYS_NO_PATHCONV=1
N=420; R=BATEDOR07
cd /d/whatif_es
python g4.py rodar "P=12 bash /content/vm_comum/lancar_render.sh /content/b07 $N $R"
for i in $(seq 1 80); do o=$(timeout 150 python g4.py ler /content/b07/status.txt 600 2>/dev/null); if echo "$o" | grep -q "${R}_PRONTO\|bundle_FALHOU\|render_ja_rodando"; then echo "$o" | grep -E "bundle|quadros_|${R}_PRONTO|FALHOU|ja_rodando" | tail -6; break; fi; sleep 30; done
mkdir -p 07_batedor_fab/g4/saida
python g4.py baixar /content/b07/out/video_crf.mp4 07_batedor_fab/g4/saida/RENDER_MUDO_NAO_PUBLICAR_batedor07.mp4 2>&1 | tail -1
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height -of csv=p=0 07_batedor_fab/g4/saida/RENDER_MUDO_NAO_PUBLICAR_batedor07.mp4
# regua de dinamismo (meta: movimento >= 2, parados <= 25%): mesmo ler24.py da leitura do What If Sim
python D:/tmp/ref_cql/ler24.py 07_batedor_fab/g4/saida/RENDER_MUDO_NAO_PUBLICAR_batedor07.mp4 07_batedor_fab/g4/saida/leitura24.json | tee 07_batedor_fab/g4/saida/leitura24.txt | head -6
