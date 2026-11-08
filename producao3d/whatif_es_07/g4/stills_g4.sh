#!/bin/bash
# Stills do batedor NA G4 (look HDR de verdade, GPU). Roda no PC (Git Bash), na pasta D:/whatif_es, com a G4 ja ligada por
# `python g4.py ligar` e SEM job de outra sessao rodando (regra G4 em duas sessoes: 1 render por vez; nunca desligar job alheio).
# Uso: bash 07_batedor_fab/g4/stills_g4.sh <rotulo> <quadros...>      ex.: bash 07_batedor_fab/g4/stills_g4.sh b1 45 135 210 270 330 405
export MSYS_NO_PATHCONV=1
R=$1; shift; Q="$*"
cd /d/whatif_es && python 07_batedor_fab/g4/empacotar.py
# pacote pelo painel Arquivos do Colab (pedacos de 45 MB com md5; mesma rota do video 6)
timeout 2400 python -c "
import sys; sys.path.insert(0, r'D:\prehistoria'); import colab; colab.subir_painel(sys.argv[1])" "D:/whatif_es/07_batedor_fab/pkg_07.zip" 2>&1 | grep -o "SUBIU_PAINEL.*" | tail -1
python g4.py rodar "exec 9>/content/b07.lock; flock -n 9 || exit 0; rm -rf /content/b07 && mkdir -p /content/b07 && cd /content/b07 && python3 -c \"import zipfile; zipfile.ZipFile('/content/pkg_07.zip').extractall('/content/b07')\" && bash /content/vm_comum/preparar.sh /content/b07 && bash /content/vm_comum/stills.sh /content/b07 $R $Q"
for i in $(seq 1 60); do o=$(timeout 150 python g4.py ler /content/b07/status.txt 400 2>/dev/null); if echo "$o" | grep -q "STILLS_${R}_PRONTO\|STILLS_${R}_BUNDLE\|FALHOU"; then echo "$o" | grep -E "PREPARADO|npm|STILLS_${R}|FALHOU"; break; fi; sleep 30; done
mkdir -p 07_batedor_fab/g4/saida
python g4.py baixar /content/b07/st_$R.jpg 07_batedor_fab/g4/saida/st_$R.jpg 2>&1 | tail -1
for q in $Q; do python g4.py baixar /content/b07/st_$R/$(printf %05d $q).png 07_batedor_fab/g4/saida/st_${R}_$(printf %05d $q).png 2>&1 | tail -1; done
