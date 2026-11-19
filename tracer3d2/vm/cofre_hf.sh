#!/bin/bash
# Cofre no Hugging Face (dataset privado MrEddie10/g4-cofre): mesmo layout de t2_stacks/ do Drive.
#   bash cofre_hf.sh espelhar                         copia todo o t2_stacks do Drive (rclone) para o repo do HF (uma vez)
#   bash cofre_hf.sh puxar <rel> <destino>           baixa do HF e monta (squashfuse + overlay); .safetensors so baixa
#   bash cofre_hf.sh gravar <arquivo> <rel>           sobe um pacote pronto para o repo (pacote novo do cofre)
# Token do HF em /root/.cache/huggingface/token (enviado pelo cofre.py, nunca no repositorio).
set -e
REPO=MrEddie10/g4-cofre; IMG=/content/img; mkdir -p $IMG
export HF_HUB_ENABLE_HF_TRANSFER=1
python3 -c "import hf_transfer" 2>/dev/null || pip -q install "huggingface_hub[hf_transfer]" >/dev/null 2>&1
command -v squashfuse >/dev/null && command -v fuse-overlayfs >/dev/null || apt-get -qq install -y squashfuse fuse-overlayfs >/dev/null 2>&1
if [ "$1" = "espelhar" ]; then
  t0=$(date +%s); D=/content/hf_espelho; mkdir -p $D
  rclone --config /root/.config/rclone/rclone.conf -q copy ultra:t2_stacks $D --transfers 4 --multi-thread-streams 16
  t1=$(date +%s); echo "DRIVE_BAIXADO $(du -sh $D | cut -f1) $((t1-t0))s"
  hf upload-large-folder $REPO $D --repo-type dataset --num-workers 16 >/content/hf_upload.log 2>&1
  echo "HF_ESPELHADO $(( $(date +%s)-t1 ))s"; rm -rf $D
elif [ "$1" = "puxar" ]; then
  rel=$2; dst=$3; n=$(basename $rel); n=${n%.sqfs}; t0=$(date +%s)
  hf download $REPO $rel --repo-type dataset --local-dir $IMG/_hf >/dev/null
  t1=$(date +%s)
  case $rel in
    *.sqfs) mv -f $IMG/_hf/$rel $IMG/$n.sqfs; mkdir -p $IMG/$n/{ro,up,wk} $dst
            mountpoint -q $IMG/$n/ro || squashfuse $IMG/$n.sqfs $IMG/$n/ro
            mountpoint -q $dst || fuse-overlayfs -o lowerdir=$IMG/$n/ro,upperdir=$IMG/$n/up,workdir=$IMG/$n/wk $dst ;;
    *)      mkdir -p $(dirname $dst) && mv -f $IMG/_hf/$rel $dst ;;
  esac
  echo "COFRE_OK hf:$rel baixar=$((t1-t0))s"
elif [ "$1" = "gravar" ]; then
  t0=$(date +%s); hf upload $REPO $2 $3 --repo-type dataset >/dev/null && echo "COFRE_GRAVADO hf:$3 $(du -m $2 | cut -f1)MB $(( $(date +%s)-t0 ))s"
fi
