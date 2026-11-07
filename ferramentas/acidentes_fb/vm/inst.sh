#!/bin/bash
# venv isolado do batedor Wan 2.2 I2V + Qwen-Image + RIFE. Roda NA G4 em /content/t2/acid_bat
export UV_SYSTEM_PYTHON=false HF_HOME=/content/hf
set -e
mkdir -p /content/t2/acid_bat; cd /content/t2/acid_bat
command -v uv >/dev/null || pip install -q uv
[ -x venv/bin/python ] || uv venv -q -p 3.12 venv
T=venv/bin/python
uv pip install -q --python $T torch==2.8.0 torchvision==0.23.0 --index-url https://download.pytorch.org/whl/cu128 2>&1 | tail -3
uv pip install -q --python $T "diffusers>=0.35" "transformers>=4.51" accelerate peft safetensors sentencepiece ftfy pillow opencv-python-headless numpy "huggingface_hub" imageio imageio-ffmpeg hf_transfer 2>&1 | tail -3
$T -c "import torch, diffusers, peft; from diffusers import QwenImagePipeline, WanImageToVideoPipeline; print('INST_OK', torch.__version__, diffusers.__version__, torch.cuda.get_device_name(0))"
df -h /content | tail -1
echo INST_FIM
