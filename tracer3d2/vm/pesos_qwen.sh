#!/bin/bash
# Uma vez so: baixa os pesos do Qwen-Image-Edit-2509 (completo e a versao FP4 Lightning do Nunchaku) do HF para pastas no
# formato de cache do HF, que viram pacotes do cofre em t2_stacks/_comum/pesos/. Uso: bash pesos_qwen.sh completo|fp4
set -e
export HF_HUB_ENABLE_HF_TRANSFER=1
pip -q install "huggingface_hub[hf_transfer]" >/dev/null 2>&1
t0=$(date +%s)
if [ "$1" = "completo" ]; then
  D=/content/pesos/qwen_edit_2509; mkdir -p $D
  hf download Qwen/Qwen-Image-Edit-2509 --cache-dir $D >/dev/null
elif [ "$1" = "fp4" ]; then
  D=/content/pesos/qwen_edit_2509_fp4; mkdir -p $D
  hf download nunchaku-ai/nunchaku-qwen-image-edit-2509 lightning-251115/svdq-fp4_r128-qwen-image-edit-2509-lightning-4steps-251115.safetensors --local-dir $D/nunchaku >/dev/null
fi
echo "PESOS_OK $1 $(du -sh $D | cut -f1) $(( $(date +%s)-t0 ))s"
