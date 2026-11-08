# K17 v2: mixagem NA G4. Voz (falas do K17 v1 nos começos de capítulo do plano, -16 LUFS) + efeitos do ton/plano.json
# (cada um normalizado ao seu LUFS) + tom de sala; master -14 LUFS, pico <= -1 dBFS. SEM música (regra do Kriegsmomente).
# Baixa mix.m4a e une (copia de fluxos, sem recodificar video) ao mudo local do Remotion: python -I g4_mix.py <mudo_local.mp4> <saida.mp4>
import json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "k17v2"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
K1 = r"D:\kriegschronik\k17_pioniere"; K2 = r"D:\kriegschronik\k17_v2"; W = "/content/k17v2_mix"
mudo, saida = sys.argv[1], sys.argv[2]
pl = json.load(open(os.path.join(K2, "v1", "src", "plano.json"), encoding="utf-8"))
tl = os.path.join(os.environ["TEMP"], "k17v2_mixin.tar")
with tarfile.open(tl, "w") as t:
    for k in pl["kapitel"]: t.add(os.path.join(K1, "voz", k["id"] + ".wav"), f"voz/{k['id']}.wav")
    t.add(os.path.join(K2, "ton", "pe"), "pe"); t.add(os.path.join(K2, "ton", "plano.json"), "efeitos.json")
    t.add(os.path.join(K2, "v1", "src", "plano.json"), "plano.json")
MIX = r'''
import json, subprocess, numpy as np, soundfile as sf, pyloudnorm as pyln
SR = 48000; P = json.load(open("plano.json")); N = int(P["dauer"] * SR) + SR
def ler(a):
    y = subprocess.run(["ffmpeg", "-v", "error", "-i", a, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(y, np.float32).reshape(-1, 2).copy()
lufs = lambda y: pyln.Meter(SR).integrated_loudness(y) if len(y) > SR // 2 else -70.0
def por(tr, y, t):
    i = int(t * SR); j = min(N, i + len(y))
    if j > i: tr[i:j] += y[: j - i]
def rampa(y, fi, fo):
    n = len(y); e = np.ones(n, np.float32); a, b = min(n, int(fi * SR)), min(n, int(fo * SR))
    if a: e[:a] = np.linspace(0, 1, a)
    if b: e[n - b:] = np.minimum(e[n - b:], np.linspace(1, 0, b))
    return y * e[:, None]
voz = np.zeros((N, 2), np.float32)
for k in P["kapitel"]: por(voz, ler(f"voz/{k['id']}.wav"), k["s"])
voz *= 10 ** ((-16 - lufs(voz)) / 20)
efx = np.zeros((N, 2), np.float32); falta = []
for e in json.load(open("efeitos.json")):
    try: y = ler(f"pe/{e['id']}_{e.get('var', 0)}.flac")
    except Exception: falta.append(e["id"]); continue
    if e.get("dur"):
        y = y[: int(e["dur"] * SR)]
    y = rampa(y, 0.02, min(0.6, len(y) / SR / 3))
    l = lufs(y)
    if l > -65: y *= 10 ** ((e.get("lufs", -27) - l) / 20)
    por(efx, y, e["t"])
# efeitos abaixam 4 dB sob a voz (ducking suave), sobem nos respiros
def media(x, w):
    c = np.concatenate([[0.0], np.cumsum(x, dtype=np.float64)]); i = np.arange(len(x))
    a = np.clip(i - w // 2, 0, len(x)); b = np.clip(i + w // 2, 0, len(x)); return ((c[b] - c[a]) / np.maximum(1, b - a)).astype(np.float32)
nivel = np.sqrt(media((voz ** 2).mean(1), int(0.05 * SR))); falando = np.clip(media((nivel > 0.01).astype(np.float32), int(0.4 * SR)), 0, 1)
efx *= (1 - 0.37 * falando)[:, None]
mix = voz + efx; mix = mix[: int(P["dauer"] * SR)]
mix *= 10 ** ((-14 - lufs(mix)) / 20)
sf.write("mix_bruto.wav", mix, SR, subtype="FLOAT")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "mix_bruto.wav", "-af", "alimiter=limit=0.89:attack=2:release=50:level=false", "-ar", str(SR), "-c:a", "pcm_s24le", "mix.wav"], check=True)
y = ler("mix.wav"); sil = float((np.abs(y).max(1) < 1e-5).mean())
print(f"MIX {len(y) / SR:.1f}s {lufs(y):.1f} LUFS pico {20 * np.log10(np.abs(y).max()):.1f} dBFS silencio_digital {100 * sil:.2f}% faltaram {sorted(set(falta))}")
'''
open(os.path.join(K2, "ton", "mix_vm.py"), "w", encoding="utf-8").write(MIX)
canal.subir(tl, f"{W}/in.tar"); canal.subir(os.path.join(K2, "ton", "mix_vm.py"), f"{W}/mix_vm.py")
out = canal.exec_vm(f"cd {W} && tar -xf in.tar && (python3 -c 'import pyloudnorm' 2>/dev/null || pip -q install pyloudnorm) && python3 mix_vm.py && "
                    "ffmpeg -loglevel error -y -i mix.wav -c:a aac -b:a 256k mix.m4a && echo MIX_OK", prazo=1800, estagnacao=900)
print(out[-900:])
if "MIX_OK" not in out: raise SystemExit("MIX_FALHOU")
m4a = os.path.join(K2, "ton", "mix.m4a"); canal.baixar(f"{W}/mix.m4a", m4a)
import subprocess
if not os.path.exists(mudo): raise SystemExit(f"MIX_PRONTO_SEM_MUDO {m4a}")
os.makedirs(os.path.dirname(saida), exist_ok=True)
subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", mudo, "-i", m4a, "-map", "0:v", "-map", "1:a", "-c", "copy", "-shortest", "-movflags", "+faststart", saida], check=True)
print("FINAL", saida, subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "compact", saida], capture_output=True, text=True).stdout)
