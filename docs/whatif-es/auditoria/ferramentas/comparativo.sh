#!/bin/bash
# comparativo.sh <original> <produzido> <saida>: lado a lado 960x540 cada, faixa com rotulos e tempo, audio L=original R=produzido
O=$1; P=$2; S=$3
F=/c/Windows/Fonts/arial.ttf
ffmpeg -v error -y -i "$O" -i "$P" -filter_complex "\
[0:v]scale=960:540,setsar=1,fps=30[a];[1:v]scale=960:540,setsar=1,fps=30[b];[a][b]hstack=inputs=2,pad=1920:600:0:60:color=0x111318,\
drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='ORIGINAL':x=20:y=18:fontsize=26:fontcolor=white,\
drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='PRODUZIDO (ES)':x=980:y=18:fontsize=26:fontcolor=0xf2b45a,\
drawtext=fontfile='C\:/Windows/Fonts/arial.ttf':text='%{pts\:hms}':x=700:y=16:fontsize=30:fontcolor=yellow[v];\
[0:a]pan=mono|c0=0.5*c0+0.5*c1[al];[1:a]pan=mono|c0=0.5*c0+0.5*c1[ar];[al][ar]join=inputs=2:channel_layout=stereo[au]" \
-map "[v]" -map "[au]" -c:v libx264 -crf 23 -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 160k -shortest "$S"
echo "pronto $S"
