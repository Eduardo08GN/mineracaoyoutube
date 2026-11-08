# K17 v2: gera os efeitos do ton/mapa.json NA G4 (MOSS-SoundEffect v2.0, Apache 2.0; mesmo setup do audio_vm.sh do What If ES),
# uma geração por (id, variação), e baixa para ton/pe/<id>_<var>.flac.
import json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "k17v2"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
T = r"D:\kriegschronik\k17_v2\ton"; W = "/content/k17v2_ton"
canal.saude()
GER = r'''
import json, os, sys
sys.path.insert(0, "/content/MOSS-TTS")
import torch, soundfile as sf
from huggingface_hub import snapshot_download
from moss_soundeffect_v2 import MossSoundEffectPipeline
m = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
pipe = MossSoundEffectPipeline.from_pretrained(snapshot_download("OpenMOSS-Team/MOSS-SoundEffect-v2.0"), torch_dtype=torch.bfloat16, device="cuda")
for s in m["efeitos"]:
    for v in range(max(1, m["variacoes"].get(s["id"], 1))):
        p = f"{out}/{s['id']}_{v}.wav"
        if os.path.exists(p): continue
        a = pipe(prompt=s["prompt"], seconds=float(min(30, s["e"])), num_inference_steps=100, cfg_scale=4.0, sigma_shift=5.0, seed=300 + 17 * v)
        sf.write(p, a[0].detach().float().cpu().numpy().T, pipe.sample_rate)
        print("EFEITO", s["id"], v, flush=True)
print("EFEITOS_OK", flush=True)
'''
open(os.path.join(T, "gerar.py"), "w", encoding="utf-8").write(GER)
canal.subir(os.path.join(T, "mapa.json"), f"{W}/mapa.json")
canal.subir(os.path.join(T, "gerar.py"), f"{W}/gerar.py")
SETUP = ("cd /content && ([ -d MOSS-TTS ] || git clone -q https://github.com/OpenMOSS/MOSS-TTS.git) && pip -q install uv > /dev/null 2>&1; "
         "([ -x /content/moss_env/bin/python ] || uv venv -q -p 3.12 /content/moss_env) && . /content/moss_env/bin/activate && (python -c 'import torch, diffusers, audiotools' 2>/dev/null || ("
         "uv pip install --python /content/moss_env/bin/python -q torch==2.9.0 torchaudio==2.9.0 --index-url https://download.pytorch.org/whl/cu128 && "
         "uv pip install --python /content/moss_env/bin/python -q numpy==1.26.4 einops safetensors transformers==4.57.1 diffusers==0.37.1 ftfy regex soundfile descript-audiotools==0.7.2 huggingface_hub)) > /content/k17v2_ton/setup.log 2>&1; "
         f". /content/moss_env/bin/activate && cd {W} && TORCHDYNAMO_DISABLE=1 python gerar.py mapa.json efeitos 2>&1 | tail -3 && "
         "mkdir -p pe && for f in efeitos/*.wav; do ffmpeg -v error -y -i $f pe/$(basename ${f%.wav}).flac; done && tar -cf ton.tar pe && echo TON_TAR_OK")
out = canal.exec_vm(SETUP, prazo=3600, estagnacao=1500)
print(out[-700:])
if "TON_TAR_OK" not in out: raise SystemExit("TON_FALHOU")
tl = os.path.join(os.environ["TEMP"], "k17v2_ton.tar"); canal.baixar(f"{W}/ton.tar", tl)
with tarfile.open(tl) as t: t.extractall(T)
print("TON_BAIXADO", len(os.listdir(os.path.join(T, "pe"))))
