#!/bin/bash
# Batedor rota (a) na G4: install || download Qwen -> K1 -> (apaga Qwen-Image, baixa Wan) || edits -> Wan -> RIFE. Tempos em tempos.log
export HF_HOME=/content/hf HF_HUB_ENABLE_HF_TRANSFER=1
D=/content/t2/acid_bat; cd $D; L=$D/tempos.log; : > $L
t(){ echo "$(date +%T) $*" | tee -a $L; }
dl(){ python3 -c "import sys; from huggingface_hub import snapshot_download as s; [print('DL', r, s(r), flush=True) for r in sys.argv[1:]]" "$@"; }
t INICIO; pip install -q -U "huggingface_hub[hf_transfer]" hf_transfer >/dev/null 2>&1
(dl Qwen/Qwen-Image Qwen/Qwen-Image-Edit-2509 > dl1.log 2>&1; echo DL_FIM >> dl1.log) &
bash vm/inst.sh > inst.log 2>&1; t "INST $(grep -o 'INST_OK.*' inst.log)"
while ! grep -q DL_FIM dl1.log; do sleep 10; done; t "DL1 $(grep -c '^DL ' dl1.log)/2 $(df -h /content | tail -1 | awk '{print $3}')"
P=venv/bin/python
$P vm/img_a.py k1 > img_k1.log 2>&1; t "K1 $(tail -1 img_k1.log)"
rm -rf /content/hf/hub/models--Qwen--Qwen-Image
(dl Wan-AI/Wan2.2-I2V-A14B-Diffusers > dl2.log 2>&1; echo DL_FIM >> dl2.log) &
$P vm/img_a.py edit > img_edit.log 2>&1; t "EDIT $(tail -1 img_edit.log)"
rm -rf /content/hf/hub/models--Qwen--Qwen-Image-Edit-2509
while ! grep -q DL_FIM dl2.log; do sleep 10; done; t "DL2 $(grep -c '^DL ' dl2.log)/1 $(df -h /content | tail -1 | awk '{print $3}')"
$P vm/vid_a.py > vid.log 2>&1; t "WAN $(tail -1 vid.log)"
$P vm/rife.py > rife.log 2>&1; t "RIFE $(tail -1 rife.log)"
tar czf saida.tgz img/*.png img/*.json raw/*.json raw/*_16fps.mp4 *_30fps.mp4 *.log
t "BATEDOR_A_FIM"
