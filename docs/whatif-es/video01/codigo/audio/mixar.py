# Mixagem local: cada faixa e efeito no seu trecho, nivel alvo por camada (LUFS), fades e encadeamento,
# depois limitador + loudnorm em duas passadas (-14 LUFS, -1,5 dBTP) e mux com o video (imagem copiada, sem re-render).
import glob, json, os, re, subprocess, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln

A = os.path.dirname(os.path.abspath(__file__))
mapa = json.load(open(os.path.join(A, "mapa.json")))
PAC = os.path.join(A, "pacote")
SR = 48000; N = int(mapa["duracao"] * SR)
med = pyln.Meter(SR)

def ler(arq):
    y, sr = sf.read(arq, always_2d=True)
    if sr != SR:
        tmp = arq + ".48k.wav"; subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", arq, "-ar", str(SR), tmp], check=True); y, _ = sf.read(tmp, always_2d=True)
    return y[:, :2] if y.shape[1] >= 2 else np.repeat(y, 2, axis=1)

def nivel(y, alvo):
    l = med.integrated_loudness(y)
    return y * (10 ** ((alvo - l) / 20)) if np.isfinite(l) else y

def fades(y, fi, fo):
    n = len(y); a = min(int(fi * SR), n // 2); b = min(int(fo * SR), n // 2)
    if a: y[:a] *= np.linspace(0, 1, a)[:, None]
    if b: y[-b:] *= np.linspace(1, 0, b)[:, None]
    return y

def encadear(partes, xf=1.5):
    out = partes[0]; x = int(xf * SR)
    for p in partes[1:]:
        r = np.linspace(0, 1, x)[:, None]
        out = np.concatenate([out[:-x], out[-x:] * (1 - r) + p[:x] * r, p[x:]])
    return out

mix = np.zeros((N, 2))
def por(y, s, e, alvo, fi, fo, extra=1.5):
    dur = int((e - s + extra) * SR)
    while len(y) < dur: y = encadear([y, y])
    y = fades(nivel(y[:dur].copy(), alvo), fi, fo)
    i = int(s * SR); j = min(N, i + len(y)); mix[i:j] += y[: j - i]

for c in mapa["musica"]:
    arq = os.path.join(PAC, c["id"] + ".flac")
    if os.path.exists(arq): por(ler(arq), c["s"], c["e"], c["lufs"], 1.5, 2.5)
    else: print("SEM", c["id"])
for s in mapa["efeitos"]:
    partes = [ler(f) for f in sorted(glob.glob(os.path.join(PAC, s["id"] + "_*.flac")))]
    if partes: por(encadear(partes), s["s"], s["e"], s["lufs"], 0.4 if s["id"] in ("s04", "s12", "s14") else 2.0, 2.5)
    else: print("SEM", s["id"])

# silencios do original (ex.: 7:14,5-7:17 antes das telas finais), com rampa curta para nao estalar
for a, b in mapa.get("silencio", []):
    i, j, r = int(a * SR), int(b * SR), int(0.08 * SR)
    mix[i - r:i] *= np.linspace(1, 0, r)[:, None]; mix[i:j] = 0; mix[j:j + r] *= np.linspace(0, 1, r)[:, None]
bruto = os.path.join(A, "mix_bruto.wav"); sf.write(bruto, mix, SR, subtype="FLOAT")
# loudnorm em duas passadas (medicao e aplicacao linear) depois de um limitador suave
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", bruto, "-af", "alimiter=limit=0.89:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r, re.S).group())
af = (f"alimiter=limit=0.89:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
      f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
final = os.path.join(A, "mix_final.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", bruto, "-af", af, "-ar", str(SR), final], check=True)
if len(sys.argv) > 2:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", sys.argv[1], "-i", final, "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", sys.argv[2]], check=True)
print("MIX_OK", m["input_i"], "->", "-14")
