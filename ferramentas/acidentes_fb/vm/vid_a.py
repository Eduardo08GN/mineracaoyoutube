# Rota (a), passo 2: Wan 2.2 I2V A14B + LoRAs lightx2v 4 passos (high/low), vertical 480x832, 65 quadros a 16 fps (= 4,0 s)
import os, time, json, torch, numpy as np
from PIL import Image
from diffusers import WanImageToVideoPipeline, UniPCMultistepScheduler
from diffusers.utils import export_to_video
from huggingface_hub import hf_hub_download
D = "/content/t2/acid_bat"; P = json.load(open(f"{D}/vm/prompts.json")); W, H, FRAMES = int(os.environ.get("W", 480)), int(os.environ.get("H", 832)), 65
t0 = time.time()
pipe = WanImageToVideoPipeline.from_pretrained("Wan-AI/Wan2.2-I2V-A14B-Diffusers", torch_dtype=torch.bfloat16)
pipe.scheduler = UniPCMultistepScheduler.from_config(pipe.scheduler.config, flow_shift=5.0); pipe.to("cuda")
r = "lightx2v/Wan2.2-Distill-Loras"
pipe.load_lora_weights(hf_hub_download(r, "wan2.2_i2v_A14b_high_noise_lora_rank64_lightx2v_4step_1022.safetensors"), adapter_name="hi")
pipe.load_lora_weights(hf_hub_download(r, "wan2.2_i2v_A14b_low_noise_lora_rank64_lightx2v_4step_1022.safetensors"), adapter_name="lo", load_into_transformer_2=True)
print("CARREGOU", round(time.time() - t0), flush=True)
NEG = "blurry, static, deformed, morphing, extra limbs, realistic photo, worst quality, jpeg artifacts, subtitles, text, watermark"
os.makedirs(f"{D}/raw", exist_ok=True); T = {}
for k, p in [(k, v) for k, v in P["movimento"].items() if k in os.environ.get("KS", "k1,k2,k3,k4").split(",")]:
    img = Image.open(f"{D}/img/{k}.png").convert("RGB").resize((W, H), Image.LANCZOS)
    t1 = time.time()
    out = pipe(image=img, prompt=p, negative_prompt=NEG, height=H, width=W, num_frames=FRAMES, num_inference_steps=4,
               guidance_scale=1.0, guidance_scale_2=1.0, generator=torch.Generator("cuda").manual_seed(11)).frames[0]
    torch.cuda.synchronize(); T[k] = round(time.time() - t1, 1)
    a = np.array(out); a = (a * 255).round().astype(np.uint8) if a.dtype != np.uint8 else a; np.save(f"{D}/raw/{k}{os.environ.get("SUF", "")}.npy", a)
    export_to_video(out, f"{D}/raw/{k}{os.environ.get("SUF", "")}_16fps.mp4", fps=16); print("WAN", k, T[k], flush=True)
json.dump(T, open(f"{D}/raw/tempos_wan{os.environ.get("SUF", "")}.json", "w")); print("VID_FIM", round(time.time() - t0), flush=True)
