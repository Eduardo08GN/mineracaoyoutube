# Roda no ambiente do ACE-Step (uv run). Uma faixa curta por trecho, 2 sementes; escolhe a com menos chiado.
import json, os, subprocess, sys
import numpy as np
os.environ.setdefault("MPLBACKEND", "Agg")
from acestep.handler import AceStepHandler
from acestep.llm_inference import LLMHandler
from acestep.inference import GenerationParams, GenerationConfig, generate_music

mapa = json.load(open(sys.argv[1])); saida = sys.argv[2]; os.makedirs(saida, exist_ok=True)
ROOT = os.getcwd(); dit, llm = AceStepHandler(), LLMHandler()
for dit_cfg, lm_cfg, backend in (("acestep-v15-xl-sft", "acestep-5Hz-lm-4B", "vllm"), ("acestep-v15-turbo", "acestep-5Hz-lm-1.7B", "pt")):
    try:
        dit.initialize_service(project_root=ROOT, config_path=dit_cfg, device="cuda")
        llm.initialize(checkpoint_dir=os.path.join(ROOT, "checkpoints"), lm_model_path=lm_cfg, backend=backend, device="cuda")
        print("MODELO", dit_cfg, flush=True); break
    except Exception as e: print("falhou", dit_cfg, str(e)[:300], flush=True)
else: raise SystemExit("ACE-Step nao carregou")
turbo = "turbo" in dit_cfg

def chiado(arq):
    import soundfile as sf
    y, sr = sf.read(arq); y = y.mean(1) if y.ndim > 1 else y
    S = np.abs(np.fft.rfft(y[: len(y) // 4096 * 4096].reshape(-1, 4096) * np.hanning(4096), axis=1)) + 1e-9
    f = np.fft.rfftfreq(4096, 1 / sr); b = (f > 4000) & (f < 14000)
    plano = np.exp(np.log(S[:, b]).mean(1)) / S[:, b].mean(1)      # planura espectral alta = ruido
    pico = np.abs(y).max()
    return float(plano.mean() + (1.0 if pico > 0.999 else 0.0))

for c in mapa["musica"]:
    dur = round(c["e"] - c["s"] + 4, 1)
    cands = []
    for semente in (11, 29):
        params = GenerationParams(task_type="text2music", caption=c["caption"], lyrics="[Instrumental]", instrumental=True,
                                  vocal_language="en", duration=max(12.0, dur), seed=semente, **({"shift": 3.0} if turbo else {}))
        conf = GenerationConfig(batch_size=1, use_random_seed=False, seeds=[semente], audio_format="wav")
        res = generate_music(dit, llm, params, conf, save_dir=f"{saida}/bruto")
        if not res.success: print("falhou", c["id"], semente, res.error, flush=True); continue
        arq = f"{saida}/{c['id']}_{semente}.wav"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", res.audios[0]["path"], "-ar", "48000", "-ac", "2", arq], check=True)
        cands.append((chiado(arq), arq))
    cands.sort()
    if cands:
        subprocess.run(["cp", cands[0][1], f"{saida}/{c['id']}.wav"], check=True)
        print("MUSICA", c["id"], [(round(a, 4), os.path.basename(b)) for a, b in cands], flush=True)
print("MUSICAS_OK", flush=True)
