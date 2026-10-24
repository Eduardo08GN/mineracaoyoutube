# Roda no venv do MOSS-SoundEffect v2.0 (Apache 2.0). Trechos de ate 30 s; trechos maiores viram 2+ geracoes encadeadas.
# Video 5: itens com "dur" (golpes curtos colocados em varios segundos pelo mixar.py) geram "variantes" com sementes diferentes.
import json, math, os, sys
sys.path.insert(0, "/content/MOSS-TTS")
import torch, soundfile as sf
from huggingface_hub import snapshot_download
from moss_soundeffect_v2 import MossSoundEffectPipeline

mapa = json.load(open(sys.argv[1])); saida = sys.argv[2]; os.makedirs(saida, exist_ok=True)
pasta = snapshot_download("OpenMOSS-Team/MOSS-SoundEffect-v2.0")
pipe = MossSoundEffectPipeline.from_pretrained(pasta, torch_dtype=torch.bfloat16, device="cuda")
for s in mapa["efeitos"]:
    if "dur" in s:
        n = int(s.get("variantes", 1)); seg = min(30.0, float(s["dur"]) + 0.5)
    else:
        total = s["e"] - s["s"] + 2
        n = max(1, math.ceil(total / 28)); seg = min(30.0, total / n + 2)
    for k in range(n):
        if os.path.exists(f"{saida}/{s['id']}_{k}.wav"): continue      # retomada: nao refaz o que ja saiu
        audio = pipe(prompt=s["prompt"], seconds=round(seg, 1), num_inference_steps=100, cfg_scale=4.0, sigma_shift=5.0, seed=100 + k)
        sf.write(f"{saida}/{s['id']}_{k}.wav", audio[0].detach().float().cpu().numpy().T, pipe.sample_rate)
    print("EFEITO", s["id"], n, "x", round(seg, 1), "s", flush=True)
print("EFEITOS_OK", flush=True)
