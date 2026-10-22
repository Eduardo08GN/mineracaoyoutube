# Video 6 (la Tierra girara cada vez mas lento). Mixagem local a partir dos stems da G4 em pacote/ (mNN.flac / mtake.flac e sNN_K.flac):
# cada faixa e efeito no seu trecho com nivel alvo (LUFS), fades por camada, golpes curtos em varios segundos ("vezes"),
# take inedito de 30 s em 244,9 s, silencios curtos nos cortes secos 97,8 e 383,3 e o preto 390,1-391,2 antes das telas finais
# (tempos do original), limitador + loudnorm em duas passadas,
# saida mix_final.wav a -14 LUFS, true peak <= -1 dBTP, exatamente 442,0 s (21.216.000 amostras a 48 kHz).
# Uso: python mixar.py [video_mudo.mp4 saida.mp4]     (PACOTE=<pasta> troca a pasta dos stems)
import glob, json, os, re, subprocess, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
from scipy.signal import resample_poly

A = os.path.dirname(os.path.abspath(__file__))
mapa = json.load(open(os.path.join(A, "mapa.json"), encoding="utf-8"))
PAC = os.environ.get("PACOTE", os.path.join(A, "pacote"))
SR = 48000
# take inedito: o mapa fica no tempo do original; tudo a partir de INS anda DUR segundos (camadas com "tempo": "video" nao)
INS = mapa.get("insercao", {}).get("t", 1e9); DUR = mapa.get("insercao", {}).get("dur", 0)
TOTAL = round(mapa["duracao"] + DUR, 3); N = int(round(TOTAL * SR))
def vt(t):  # segundo do original -> segundo do video
    return t + DUR if t >= INS else t
def nov(c):
    s, e = c["s"], c["e"]
    if c.get("tempo") == "video": return s, e
    if s >= INS: return s + DUR, e + DUR
    return s, min(e, INS)
med = pyln.Meter(SR)

def ler(arq):
    y, sr = sf.read(arq, always_2d=True)
    if sr != SR:
        y = resample_poly(y, SR, sr, axis=0)
    return y[:, :2] if y.shape[1] >= 2 else np.repeat(y, 2, axis=1)

def nivel(y, alvo):
    if len(y) < int(0.45 * SR):   # pyloudnorm precisa de >= 400 ms
        y = np.concatenate([y, np.zeros((int(0.45 * SR) - len(y), 2))])
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
        x = min(x, len(out) // 2, len(p) // 2)
        r = np.linspace(0, 1, x)[:, None]
        out = np.concatenate([out[:-x], out[-x:] * (1 - r) + p[:x] * r, p[x:]])
    return out

def env(y, jan=0.02):
    h = int(jan * SR); m = np.abs(y).mean(1)
    k = len(m) // h
    return np.sqrt((m[: k * h].reshape(k, h) ** 2).mean(1) + 1e-12), h

def ponto(y, modo):
    """amostra do clipe que deve cair no segundo marcado: 'pico' (maior energia) ou 'ataque' (inicio do golpe)."""
    e, h = env(y)
    if not len(e): return 0
    if modo == "pico": return int(np.argmax(e) * h + h // 2)
    lim = e.max() * 10 ** (-18 / 20)
    return int(np.argmax(e >= lim) * h)

mix = np.zeros((N, 2))
def somar(y, i):
    if i < 0: y = y[-i:]; i = 0
    j = min(N, i + len(y))
    if j > i: mix[i:j] += y[: j - i]

def por(y, s, e, alvo, fi, fo, extra=1.5, alinhar=None):
    if alinhar: y = y[max(0, ponto(y, "ataque") - int(0.01 * SR)):]   # tira o silencio antes do golpe
    dur = int((e - s + extra) * SR)
    while len(y) < dur: y = encadear([y, y])
    y = fades(nivel(y[:dur].copy(), alvo), fi, fo)
    somar(y, int(round(s * SR)))

def partes_de(i):
    return [ler(f) for f in sorted(glob.glob(os.path.join(PAC, i + "_*.flac")), key=lambda f: int(re.search(r"_(\d+)\.flac$", f).group(1)))]

faltam = []
for c in mapa["musica"]:
    arq = os.path.join(PAC, c["id"] + ".flac")
    if os.path.exists(arq): por(ler(arq), *nov(c), c["lufs"], c.get("fi", 1.5), c.get("fo", 2.5), c.get("extra", 1.5))
    else: faltam.append(c["id"])
for s in mapa["efeitos"]:
    partes = partes_de(s["id"])
    if not partes: faltam.append(s["id"]); continue
    if "vezes" in s:
        # golpe curto: cada ocorrencia usa uma variante (rodizio), com o pico/ataque no segundo marcado
        d = int(s["dur"] * SR)
        for k, t in enumerate(s["vezes"]):
            y = partes[k % len(partes)].copy()
            p0 = ponto(y, s.get("alinhar", "pico"))
            if s.get("alinhar") == "ataque": y = y[max(0, p0 - int(0.01 * SR)):]; p0 = int(0.01 * SR)
            y = fades(nivel(y[: max(d, p0 + int(0.5 * SR))].copy(), s["lufs"]), s.get("fi", 0.01), s.get("fo", 0.6))
            tt = t if s.get("tempo") == "video" else vt(t)
            somar(y, int(round(tt * SR)) - p0)
    else:
        por(encadear(partes), *nov(s), s["lufs"], s.get("fi", 2.0), s.get("fo", 2.5), s.get("extra", 1.5), s.get("alinhar"))
if faltam: print("SEM", " ".join(faltam))

# silencios do mapa (cortes secos 97,8 e 383,3; preto 390,1-391,2 antes das telas finais), com rampa curta para nao estalar
for a, b in [nov({"s": a, "e": b}) for a, b in mapa.get("silencio", [])]:
    i, j, r = int(a * SR), int(b * SR), int(0.08 * SR)
    mix[i - r:i] *= np.linspace(1, 0, r)[:, None]; mix[i:j] = 0; mix[j:j + r] *= np.linspace(0, 1, r)[:, None]
bruto = os.path.join(A, "mix_bruto.wav"); sf.write(bruto, mix, SR, subtype="FLOAT")
# loudnorm em duas passadas (medicao e aplicacao linear) depois de um limitador suave
FA = "alimiter=limit=0.84:attack=5:release=80:level=false,loudnorm=I=-14:TP=-1.5:LRA=11"
r = subprocess.run(["ffmpeg", "-hide_banner", "-i", bruto, "-af", FA + ":print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(re.search(r"\{[^{}]*\"input_i\"[^{}]*\}", r, re.S).group())
af = (f"{FA}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
norm = os.path.join(A, "mix_norm.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", bruto, "-af", af, "-ar", str(SR), "-c:a", "pcm_f32le", norm], check=True)

# acabamento: duracao exata, ajuste fino para -14 LUFS e true peak (4x) <= -1 dBTP
y, _ = sf.read(norm, always_2d=True); os.remove(norm)
y = y[:N] if len(y) >= N else np.concatenate([y, np.zeros((N - len(y), y.shape[1]))])
tp = lambda z: 20 * np.log10(np.abs(resample_poly(z, 4, 1, axis=0)).max() + 1e-12)
for k in range(8):
    li = med.integrated_loudness(y); g = -14.0 - li
    if 20 * np.log10(np.abs(y).max() + 1e-12) + g > -1.2 or tp(y) + g > -1.1:
        # o ganho de nivel estouraria o pico: limita so os picos (soft clip) e mede de novo
        # (a margem cresce a cada volta: o true peak entre amostras passa do pico de amostra)
        lim = 10 ** ((-1.6 - 0.3 * k - g) / 20)
        y = np.where(np.abs(y) > lim * 0.8, np.sign(y) * (lim * 0.8 + (lim * 0.2) * np.tanh((np.abs(y) - lim * 0.8) / (lim * 0.2))), y)
    else:
        break
y = y * 10 ** ((-14.0 - med.integrated_loudness(y)) / 20)
t = tp(y)
if t > -1.0: y *= 10 ** ((-1.0 - t - 0.05) / 20)
final = os.path.join(A, "mix_final.wav")
sf.write(final, y, SR, subtype="PCM_24")
z, _ = sf.read(final, always_2d=True)
print(f"MIX_OK entrada {m['input_i']} LUFS -> {med.integrated_loudness(z):.2f} LUFS, true peak {tp(z):.2f} dBTP, "
      f"{len(z)} amostras = {len(z) / SR:.3f} s (alvo {TOTAL} s)")
if len(sys.argv) > 2:
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", sys.argv[1], "-i", final, "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                    "-c:a", "aac", "-b:a", "256k", "-shortest", sys.argv[2]], check=True)
    print("MUX_OK", sys.argv[2])
