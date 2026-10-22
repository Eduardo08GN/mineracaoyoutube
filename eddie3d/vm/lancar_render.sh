#!/bin/bash
# Dispara o render uma vez so: trava, limpa e renderiza dentro do mesmo lock (a celula do Colab as vezes roda duas vezes;
# sem isso a segunda execucao apagava os quadros da primeira). Uso: bash lancar_render.sh <pasta> <quadros> <rotulo>
exec 9>/content/render.lock
flock -n 9 || { echo "$(date +%H:%M:%S) render_ja_rodando" >> $1/status.txt; exit 0; }
cd $1 && rm -rf frames out seq
bash /content/vm_comum/render_seq.sh $1 $2 $3
