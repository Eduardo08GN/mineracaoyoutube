#!/bin/bash
# Tracer3D 2.0 - prepara a VM para um projeto Remotion: EGL da NVIDIA, libs do Chrome, npm install, Chrome for Testing.
# Uso: bash preparar.sh <projeto> [canal] [formato] [id_node] [id_apt]   (o servidor.py chama via /exec; o stills_quente sobe depois)
# 08/11/2026 IMAGEM DE STACK (aditivo; sem imagem/falha = caminho antigo identico). A imagem node_<hash>.sqfs guarda o node_modules
# (o Remotion guarda o Chrome for Testing em node_modules/.remotion, entao ele vai junto). Duas origens:
#  - Drive montado (G4-1): MyDrive/t2_stacks/<canal>/<formato>/node_<hash>.sqfs, le e GRAVA.
#  - sem Drive (G4-2, que nunca monta Drive): baixa por gdown do id de leitura (arg 4/5); se nao ha, instala e deixa a imagem em
#    /content/t2cache/out/ para o canal.py baixar ao PC (D:/t2_stacks). Nunca grava no Drive da G4-2.
D=$1; CANAL=$2; FORMATO=$3; IMG_ID=$4; APT_ID=$5; cd "$D" || exit 1
[ "$CANAL" = "-" ] && CANAL=""; [ "$FORMATO" = "-" ] && FORMATO=""; [ "$IMG_ID" = "-" ] && IMG_ID=""; [ "$APT_ID" = "-" ] && APT_ID=""
SECONDS=0; T_APT=0; T_NODE=0; T_CHROME=0; MODO=npm; APT_MODO=apt; ORIGEM=nenhuma
export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH
mkdir -p /usr/share/glvnd/egl_vendor.d
echo '{"file_format_version":"1.0.0","ICD":{"library_path":"/usr/lib64-nvidia/libEGL_nvidia.so.0"}}' > /usr/share/glvnd/egl_vendor.d/10_nvidia.json
rm -f /usr/share/glvnd/egl_vendor.d/50_mesa.json

DRIVE=/content/drive/MyDrive; SD=""; CACHE=/content/t2cache; OUT=$CACHE/out; mkdir -p $CACHE $OUT
if [ -n "$T2_SEM_IMAGEM" ]; then echo "IMG_DESLIGADA (T2_SEM_IMAGEM): caminho antigo"; SEMIMG=1
elif [ -d "$DRIVE" ]; then
  if [ -n "$CANAL" ] && [ -n "$FORMATO" ]; then SD="$DRIVE/t2_stacks/$CANAL/$FORMATO"
  else SD="$DRIVE/t2_stacks/_sem_tenant"; echo "AVISO_SEM_TENANT: sem canal/formato (T2_CANAL/T2_FORMATO ou stack.json); imagem em _sem_tenant"; fi
  mkdir -p "$SD" 2>/dev/null || SD=""
  [ -n "$SD" ] && { echo "IMG_DIR=$SD"; ORIGEM=drive; }
else echo "IMG_SEM_DRIVE: imagem so por gdown (id) ou gerada para o PC"; ORIGEM=sem_drive; fi

baixar_gdown() {   # $1=id $2=destino ; confere o formato (cota do Drive devolve HTML)
  [ -n "$1" ] || return 1
  command -v gdown > /dev/null || pip install -q gdown > /dev/null 2>&1 || return 1
  gdown -q "https://drive.google.com/uc?id=$1" -O "$2" > /dev/null 2>&1 && [ -s "$2" ] || { rm -f "$2"; return 1; }
}

# ---------- apt (libs do Chrome) ----------
APT_A="libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libxkbcommon0"
APTH=$(echo "$APT_A $(. /etc/os-release; echo $VERSION_ID)" | sha256sum | cut -c1-12)
if [ ! -f /content/.apt_ok ]; then
  t=$SECONDS; AT=""
  if [ -n "$SD" ] && [ -s "$SD/apt_$APTH.tar" ]; then AT="$SD/apt_$APTH.tar"
  elif [ "$ORIGEM" = sem_drive ] && baixar_gdown "$APT_ID" $CACHE/apt_dl.tar; then AT=$CACHE/apt_dl.tar; fi
  if [ -n "$AT" ]; then   # .debs prontos: dpkg -i, sem apt update/download
    rm -rf $CACHE/apt; mkdir -p $CACHE/apt
    if tar -xf "$AT" -C $CACHE/apt && dpkg -i $CACHE/apt/*.deb > /dev/null 2>&1; then touch /content/.apt_ok; APT_MODO=imagem; echo APT_IMG_OK
    else echo "APT_IMG_FALHOU: caminho antigo"; fi
  fi
  if [ ! -f /content/.apt_ok ]; then
    apt-get -qq update > /dev/null 2>&1
    apt-get -qq install -y $APT_A > /dev/null 2>&1
    apt-get -qq install -y libasound2t64 > /dev/null 2>&1 || apt-get -qq install -y libasound2 > /dev/null 2>&1
    touch /content/.apt_ok
    if [ -z "$AT" ] && [ "$ORIGEM" != nenhuma ] && ls /var/cache/apt/archives/*.deb > /dev/null 2>&1; then   # guarda os .deb em segundo plano
      DEST="$OUT/apt_$APTH.tar"; [ -n "$SD" ] && DEST="$SD/apt_$APTH.tar"
      ( tar -cf $CACHE/apt_$APTH.tar -C /var/cache/apt/archives $(cd /var/cache/apt/archives && ls *.deb) && cp $CACHE/apt_$APTH.tar "$DEST.parcial" && mv "$DEST.parcial" "$DEST" && echo "APT_TAR_GERADO $DEST" ) > /content/t2/imagem_apt.log 2>&1 < /dev/null &
    fi
  fi
  T_APT=$((SECONDS - t))
fi
echo APT_OK

# ---------- node_modules (imagem ou npm) ----------
# 06/11/2026: so "existe node_modules" deixava dependencia nova do package.json sem instalar (K18: orbat/tegaki). Compara o package.json.
t=$SECONDS
NH=$(cat package.json package-lock.json 2>/dev/null | sha256sum | cut -c1-12); IMG_USADA=0; S=""
ok_nm() { [ -d node_modules/remotion ] && cmp -s package.json node_modules/.package_ok; }
if ! ok_nm && [ "$ORIGEM" != nenhuma ]; then
  if [ -n "$SD" ] && [ -s "$SD/node_$NH.sqfs" ]; then echo "IMG_ENCONTRADA drive node_$NH"; cp "$SD/node_$NH.sqfs" $CACHE/node_$NH.sqfs && S=$CACHE/node_$NH.sqfs
  elif [ "$ORIGEM" = sem_drive ] && baixar_gdown "$IMG_ID" $CACHE/node_$NH.sqfs; then echo "IMG_ENCONTRADA gdown node_$NH"; S=$CACHE/node_$NH.sqfs; fi
  if [ -n "$S" ] && head -c4 "$S" | grep -q hsqs && { { command -v squashfuse > /dev/null && command -v fuse-overlayfs > /dev/null; } || apt-get -qq install -y squashfuse squashfs-tools fuse-overlayfs > /dev/null 2>&1; }; then
    umount -l node_modules 2>/dev/null; umount -l $CACHE/nm_ro 2>/dev/null; rm -rf node_modules $CACHE/nm_up $CACHE/nm_work
    mkdir -p node_modules $CACHE/nm_ro $CACHE/nm_up $CACHE/nm_work
    # overlay gravavel: o Remotion escreve em node_modules/.cache e .remotion
    if squashfuse -o allow_other "$S" $CACHE/nm_ro 2>/dev/null || squashfuse "$S" $CACHE/nm_ro; then
      fuse-overlayfs -o allow_other,lowerdir=$CACHE/nm_ro,upperdir=$CACHE/nm_up,workdir=$CACHE/nm_work node_modules 2>/dev/null \
        || fuse-overlayfs -o lowerdir=$CACHE/nm_ro,upperdir=$CACHE/nm_up,workdir=$CACHE/nm_work node_modules
    fi
  fi
  if [ -n "$S" ]; then
    if ok_nm && touch node_modules/.escrita_t2 2>/dev/null && rm -f node_modules/.escrita_t2; then IMG_USADA=1; MODO=imagem; echo IMG_MONTADA_OK
    else echo "IMG_FALHOU: caminho antigo (npm install)"; umount -l node_modules 2>/dev/null; umount -l $CACHE/nm_ro 2>/dev/null; rm -rf node_modules; fi
  fi
fi
ok_nm || { npm install --no-audit --no-fund --loglevel=error && cp package.json node_modules/.package_ok; } || { echo NPM_FALHOU; exit 2; }
T_NODE=$((SECONDS - t))
echo NPM_OK
t=$SECONDS
npx remotion browser ensure > /dev/null 2>&1 && echo CHROME_OK
T_CHROME=$((SECONDS - t))

# ---------- gera a imagem em segundo plano (so se veio do npm; nao atrasa o job) ----------
# Drive montado: grava no Drive. Sem Drive: deixa em /content/t2cache/out/ (o canal.py baixa ao PC). Quem ja tem a imagem nao refaz.
DEST=""
if [ "$IMG_USADA" = 0 ] && [ "$ORIGEM" != nenhuma ]; then
  [ -n "$SD" ] && DEST="$SD/node_$NH.sqfs" || DEST="$OUT/node_$NH.sqfs"
fi
if [ -n "$DEST" ] && [ ! -s "$DEST" ] && mkdir $CACHE/lock_$NH 2>/dev/null; then
  ( command -v mksquashfs > /dev/null || apt-get -qq install -y squashfs-tools > /dev/null 2>&1
    t0=$(date +%s); O=$CACHE/gerando_$NH.sqfs; rm -f "$O"
    nice -n 19 mksquashfs node_modules "$O" -comp zstd -noappend -no-progress -quiet -e .cache \
      && cp "$O" "$DEST.parcial" && mv "$DEST.parcial" "$DEST" && echo "IMG_GERADA $DEST $(du -h "$DEST" | cut -f1) em $(( $(date +%s) - t0 )) s"
    rm -f "$O"; rmdir $CACHE/lock_$NH ) > /content/t2/imagem_$NH.log 2>&1 < /dev/null &
  echo "IMG_GERANDO node_$NH (segundo plano, destino $DEST)"
fi
echo "PREP_SEG modo=$MODO apt=$APT_MODO origem=$ORIGEM t_apt=$T_APT t_node=$T_NODE t_chrome=$T_CHROME total=$SECONDS hash=$NH"
