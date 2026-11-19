#!/bin/bash
# Cofre de stacks (docs/g4-cofre-de-stacks.md): pacotes .sqfs no Drive Ultra, trazidos por rclone (sem drive.mount, sem clique).
#   bash cofre.sh puxar <caminho em t2_stacks/...sqfs> <destino>     baixa e monta (squashfuse + overlay gravavel)
#   bash cofre.sh gravar <pasta_origem> <caminho em t2_stacks/...sqfs> [pesos]   empacota e grava no Drive (so G4-1)
# O rclone.conf chega do PC em /root/.config/rclone/rclone.conf (token so no D:/segredos, nunca no repositorio).
set -e
R=/root/.config/rclone/rclone.conf; IMG=/content/img; mkdir -p $IMG
command -v rclone >/dev/null || { cd /tmp && curl -sSLo rc.zip https://downloads.rclone.org/rclone-current-linux-amd64.zip && unzip -qo rc.zip && cp rclone-*-linux-amd64/rclone /usr/local/bin/ && rm -rf rc.zip rclone-*; }
command -v squashfuse >/dev/null && command -v fuse-overlayfs >/dev/null && command -v mksquashfs >/dev/null || apt-get -qq install -y squashfuse fuse-overlayfs squashfs-tools >/dev/null 2>&1
RC="rclone --config $R -q --drive-chunk-size 256M"
if [ "$1" = "puxar" ]; then
  rel=$2; dst=$3; n=$(basename $rel .sqfs); t0=$(date +%s)
  if [ ! -s $IMG/$n.sqfs ]; then
    $RC copyto ultra:t2_stacks/$rel $IMG/$n.sqfs --multi-thread-streams 16 --multi-thread-cutoff 64M || { echo "COFRE_FALTA $rel"; exit 3; }
  fi
  t1=$(date +%s); mkdir -p $IMG/$n/{ro,up,wk} $dst
  mountpoint -q $IMG/$n/ro || squashfuse $IMG/$n.sqfs $IMG/$n/ro
  mountpoint -q $dst || fuse-overlayfs -o lowerdir=$IMG/$n/ro,upperdir=$IMG/$n/up,workdir=$IMG/$n/wk $dst
  echo "COFRE_OK $rel tam=$(du -m $IMG/$n.sqfs | cut -f1)MB baixar=$((t1-t0))s montar=$(( $(date +%s)-t1 ))s"
elif [ "$1" = "gravar" ]; then
  src=$2; rel=$3; n=$(basename $rel .sqfs); t0=$(date +%s)
  # pesos ja sao comprimidos: sem compressao (empacota ~1 GB/s); ambiente: zstd
  if [ "$4" = "pesos" ]; then op="-noI -noD -noF -noX"; else op="-comp zstd -Xcompression-level 6"; fi
  rm -f $IMG/$n.sqfs; mksquashfs $src $IMG/$n.sqfs $op -processors 16 -quiet -no-progress
  t1=$(date +%s); $RC copyto $IMG/$n.sqfs ultra:t2_stacks/$rel --transfers 1
  echo "COFRE_GRAVADO $rel tam=$(du -m $IMG/$n.sqfs | cut -f1)MB empacotar=$((t1-t0))s subir=$(( $(date +%s)-t1 ))s"
fi
