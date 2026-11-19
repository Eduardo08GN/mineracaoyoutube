#!/bin/bash
# Uma vez so: junta os pesos do MiniMax H3 V2 (mesma lista do prefetch da limpeza_avatar) + LoRA/modelo FL2V (primeiro e
# ultimo quadro, ja no Drive em gerente_g4/h3) numa pasta no layout models/ do ComfyUI, que vira _comum/pesos/minimax_h3v2.sqfs
set -e
export HF_HUB_ENABLE_HF_TRANSFER=1; pip -q install "huggingface_hub[hf_transfer]" >/dev/null 2>&1
M=/content/pesos/minimax_h3v2; C=Comfy-Org/MiniMax-H3; t0=$(date +%s); mkdir -p $M
dl(){ hf download "$1" "$2" --local-dir $M/_dl >/dev/null && mkdir -p $M/$3 && mv -f "$M/_dl/$2" $M/$3/ && echo "OK $(basename $2)"; }
dl WarmBloodAban/Minimax-h3_Singularity Minimax-h3_Singularity_ref2va_v2_pruned_int8.safetensors diffusion_models &
dl $C text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors text_encoders &
dl $C vae/minimax_h3_video_vae_fp16.safetensors vae &
dl $C vae/minimax_h3_audio_vae_fp32.safetensors vae &
dl $C loras/minimax_h3_ref2v_turbo_4step_v0.1_comfyui_bf16.safetensors loras &
dl prithivMLmods/MiniMax-H3-Facial-Realism-CloseUp minimax-h3-facial-realism-closeup-cp2000.safetensors loras &
( rclone --config /root/.config/rclone/rclone.conf -q copyto ultra:t2_stacks/gerente_g4/h3/minimax_h3_fl2va_pruned_int8_convrot.safetensors $M/diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors --multi-thread-streams 16 && echo OK fl2va ) &
( rclone --config /root/.config/rclone/rclone.conf -q copyto ultra:t2_stacks/gerente_g4/h3/minimax_h3_fl2v_turbo_4step_v1.0_768p_comfyui_bf16.safetensors $M/loras/minimax_h3_fl2v_turbo_4step_v1.0_768p_comfyui_bf16.safetensors --multi-thread-streams 16 && echo OK fl2v_lora ) &
wait; rm -rf $M/_dl
echo "PESOS_OK minimax $(du -sh $M | cut -f1) $(( $(date +%s)-t0 ))s"; find $M -name "*.safetensors" | wc -l
