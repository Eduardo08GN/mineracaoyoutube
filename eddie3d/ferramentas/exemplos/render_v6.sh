export MSYS_NO_PATHCONV=1
N=13260; R=VIDEO6
cd /d/whatif_es
python g4.py rodar "bash /content/vm_comum/lancar_render.sh /content/v6 $N $R"
for i in $(seq 1 120); do o=$(timeout 150 python g4.py ler /content/v6/status.txt 600 2>/dev/null); if echo "$o" | grep -q "${R}_PRONTO\|bundle_FALHOU\|render_ja_rodando"; then echo "$o" | grep -E "bundle|quadros_|${R}_PRONTO|FALHOU|ja_rodando" | tail -6; break; fi; sleep 45; done
mkdir -p 06_spun_slower/v1/render
python g4.py baixar /content/v6/out/video_crf.mp4 06_spun_slower/v1/render/video6_mudo.mp4 2>&1 | tail -1
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames,width,height -of csv=p=0 06_spun_slower/v1/render/video6_mudo.mp4
python g4.py ler /content/au6/status.txt 400 2>&1 | grep -v socket.send | grep -E "MUSICA|EFEITOS|FIM_AUDIO|inicio" | tail -4
