# P4: mix final (roda NA G4 por g4_alinhar_mix.py). Voz (Gemini TTS) nos mesmos tempos do frases.py (capítulo após capítulo,
# 0,45 s de pausa) + cama instrumental (as camas da P3, já medidas sem voz pelo Demucs) em sequência com crossfade de 3 s,
# abaixando sob a voz (ducking). Saída: audio/mix_final.wav e .m4a, -14 LUFS integrado, pico <= -1 dBFS.
import glob, json, os, subprocess
import numpy as np, soundfile as sf, pyloudnorm as pyln
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR, PAUSA = 48000, 0.45
caps = json.load(open(f"{R}/roteiro/skript_de.json", encoding="utf-8"))["kapitel"]
DUR = json.load(open(f"{R}/cena/learjet_p4/plano.json", encoding="utf-8"))["dur"]
N = int(DUR * SR)
def ler(a):
    y = subprocess.run(["ffmpeg", "-v", "error", "-i", a, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(y, np.float32).reshape(-1, 2).copy()
voz = np.zeros((N, 2), np.float32); off = 0.0
for c in caps:
    y = ler(f"{R}/voz/{c['id']}.wav"); i = int(off * SR); j = min(N, i + len(y)); voz[i:j] += y[: j - i]
    off += len(y) / SR + PAUSA
meter = pyln.Meter(SR)
voz *= 10 ** ((-16 - meter.integrated_loudness(voz)) / 20)
# cama: concatena as faixas com crossfade até cobrir o vídeo
cama = np.zeros((0, 2), np.float32); XF = int(3 * SR)
for f in sorted(glob.glob(f"{R}/audio/pm/*.flac")) * 3:
    y = ler(f)
    if len(cama) == 0: cama = y
    else:
        r = np.linspace(0, 1, XF, dtype=np.float32)[:, None]
        cama = np.concatenate([cama[:-XF], cama[-XF:] * (1 - r) + y[:XF] * r, y[XF:]])
    if len(cama) >= N: break
cama = cama[:N]
cama *= 10 ** ((-30 - meter.integrated_loudness(cama)) / 20)
# ducking: envelope da voz (janela de 0,3 s) abaixa a cama mais 6 dB onde há fala
env = np.convolve(np.abs(voz).mean(1), np.ones(int(0.3 * SR)) / int(0.3 * SR), mode="same")
duck = 1 - 0.5 * np.clip(env / (env.max() * 0.08 + 1e-9), 0, 1)
fim = np.ones(N, np.float32); k = int(3 * SR); fim[-k:] = np.linspace(1, 0, k)
mix = voz + cama * (duck * fim)[:, None]
mix *= 10 ** ((-14 - meter.integrated_loudness(mix)) / 20)
pk = np.abs(mix).max(); lim = 10 ** (-1 / 20)
if pk > lim: mix = np.tanh(mix / lim) * lim
os.makedirs(f"{R}/audio", exist_ok=True)
sf.write(f"{R}/audio/mix_final.wav", mix, SR, subtype="PCM_24")
print("MIX", round(N / SR, 1), "s · LUFS", round(meter.integrated_loudness(mix), 2), "· pico dBFS", round(20 * np.log10(np.abs(mix).max()), 2))
