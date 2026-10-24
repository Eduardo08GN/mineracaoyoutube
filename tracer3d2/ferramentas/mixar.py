# Mix final do video 1 (KriegsChronik): voz (Gemini TTS) nos tempos do plano, cama musical por capitulo (ACE-Step, G4) e
# efeitos (MOSS, G4) pelos pontos de audio/efeitos_plano.json. Saida: audio/mix_final.wav, -14 LUFS, pico <= -1 dBFS.
#   python ferramentas/mixar.py
import json, os, subprocess
import numpy as np, soundfile as sf, pyloudnorm as pyln

R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
PLAN = json.load(open(f"{R}/v1/src/plano.json", encoding="utf-8"))
N = int(PLAN["dauer"] * SR)

def ler(arq):
    y = subprocess.run(["ffmpeg", "-v", "error", "-i", arq, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(y, np.float32).reshape(-1, 2).copy()

def lufs(y):
    return pyln.Meter(SR).integrated_loudness(y) if len(y) > SR // 2 else -70.0

def por(trilha, y, t, ganho=1.0):
    i = int(t * SR); j = min(N, i + len(y))
    if j > i: trilha[i:j] += y[: j - i] * ganho

def rampa(y, fi, fo):
    n = len(y); e = np.ones(n, np.float32)
    a, b = int(fi * SR), int(fo * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if b: e[n - b:] = np.minimum(e[n - b:], np.linspace(1, 0, b))
    return y * e[:, None]

voz = np.zeros((N, 2), np.float32)
for k in PLAN["kapitel"]:
    y = ler(f"{R}/voz/{k['id']}.wav")
    por(voz, y, k["s"])
voz *= 10 ** ((-16 - lufs(voz)) / 20)                     # voz sozinha em -16 LUFS

mus = np.zeros((N, 2), np.float32)
caps = PLAN["kapitel"]
for i, k in enumerate(caps):
    y = ler(f"{R}/audio/pm/m{k['id'][:2]}.flac")
    fim = caps[i + 1]["s"] + 1.2 if i + 1 < len(caps) else PLAN["dauer"]
    falta = int((fim - k["s"] + 0.6) * SR)
    while len(y) < falta:   # capitulo ficou mais longo que a trilha (ex.: TTS regerado): repete com fusao de 1,5 s
        xf = int(1.5 * SR); r = np.linspace(0, 1, xf, dtype=np.float32)[:, None]
        y = np.concatenate([y[:-xf], y[-xf:] * (1 - r) + y[:xf] * r, y[xf:]])
    y = y[:falta]
    y = rampa(y * 10 ** ((-31 - lufs(y)) / 20), 0.8 if i else 0.05, 1.6)
    por(mus, y, max(0, k["s"] - 0.6))
# cama sobe um pouco nos respiros entre capitulos e nos ultimos segundos (sem voz)
def media(x, w):                                         # media movel centrada (soma acumulada: O(N))
    c = np.concatenate([[0.0], np.cumsum(x, dtype=np.float64)])
    i = np.arange(len(x)); a = np.clip(i - w // 2, 0, len(x)); b = np.clip(i + w // 2, 0, len(x))
    return ((c[b] - c[a]) / np.maximum(1, b - a)).astype(np.float32)
nivel = np.sqrt(media((voz ** 2).mean(1), int(0.05 * SR)))
falando = media((nivel > 0.01).astype(np.float32), int(0.6 * SR))
env = 1.0 + 0.6 * (1 - np.clip(falando, 0, 1))             # ate +4 dB sem voz
mus *= env[:, None]

efx = np.zeros((N, 2), np.float32)
plano_ef = f"{R}/audio/efeitos_plano.json"
if os.path.exists(plano_ef):
    for e in json.load(open(plano_ef, encoding="utf-8")):
        y = ler(f"{R}/audio/pe/{e['id']}_{e.get('var', 0)}.flac")
        if e.get("dur"): y = rampa(y[: int(e["dur"] * SR)], 0.02, min(0.5, e["dur"] / 3))
        y *= 10 ** ((e.get("lufs", -24) - lufs(y)) / 20) if lufs(y) > -60 else 1
        por(efx, y, e["t"])

mix = voz + mus + efx
mix *= 10 ** ((-14 - lufs(mix)) / 20)
os.makedirs(f"{R}/audio", exist_ok=True)
sf.write(f"{R}/audio/mix_bruto.wav", mix, SR, subtype="FLOAT")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{R}/audio/mix_bruto.wav", "-af", "alimiter=limit=0.89:attack=2:release=50:level=false",
                "-ar", str(SR), "-c:a", "pcm_s24le", f"{R}/audio/mix_final.wav"], check=True)
y = ler(f"{R}/audio/mix_final.wav")
print(f"mix_final.wav {len(y) / SR:.1f} s · {lufs(y):.1f} LUFS · pico {20 * np.log10(np.abs(y).max()):.1f} dBFS")
