# Mix do video 08 (roda NA G4): voz nos tempos do plano, cama musical por capitulo (ACE-Step limpa pelo Demucs) que sobe
# nos respiros, efeitos presos as batidas (ondas no malecon, rua alagando, vento no altiplano, gelo) e um "boom" a cada pais
# que cai (mesmos instantes dos cartoes do HUD). Saida: mix.wav a -14 LUFS, pico <= -1 dBFS.  Uso: python mixar_vm.py <pasta>
import json, os, subprocess, sys
import numpy as np, soundfile as sf, pyloudnorm as pyln
D = sys.argv[1]; SR = 48000
P = json.load(open(f"{D}/plano.json", encoding="utf-8")); M = json.load(open(f"{D}/mapa_g4.json", encoding="utf-8"))
N = int(P["dauer"] * SR); A = P["ancoras"]

def ler(arq):
    y = subprocess.run(["ffmpeg", "-v", "error", "-i", arq, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(y, np.float32).reshape(-1, 2).copy()
lufs = lambda y: pyln.Meter(SR).integrated_loudness(y) if len(y) > SR // 2 else -70.0
def por(tr, y, t, g=1.0):
    i = max(0, int(t * SR)); j = min(N, i + len(y))
    if j > i: tr[i:j] += y[: j - i] * g
def rampa(y, fi, fo):
    n = len(y); e = np.ones(n, np.float32); a, b = int(fi * SR), int(fo * SR)
    if a: e[:a] = np.linspace(0, 1, a)
    if b: e[n - b:] = np.minimum(e[n - b:], np.linspace(1, 0, b))
    return y * e[:, None]
def media(x, w):
    c = np.concatenate([[0.0], np.cumsum(x, dtype=np.float64)]); i = np.arange(len(x))
    a = np.clip(i - w // 2, 0, len(x)); b = np.clip(i + w // 2, 0, len(x)); return ((c[b] - c[a]) / np.maximum(1, b - a)).astype(np.float32)

# voz (capitulos nos mesmos tempos do plano.py: inicio 0,6 s, pausa 0,7 s)
voz = np.zeros((N, 2), np.float32); t = 0.6
for m in M["musica"]:
    cap = [f for f in os.listdir(f"{D}/voz") if f.startswith(m["id"][1:3])][0]
    por(voz, ler(f"{D}/voz/{cap}"), m["s"])
voz *= 10 ** ((-16 - lufs(voz)) / 20)
# musica por capitulo, com fusao entre faixas
mus = np.zeros((N, 2), np.float32); ms = M["musica"]
for i, m in enumerate(ms):
    y = ler(f"{D}/pm/{m['id']}.flac"); fim = ms[i + 1]["s"] + 1.4 if i + 1 < len(ms) else P["dauer"]
    falta = int((fim - m["s"] + 0.8) * SR)
    while len(y) < falta:
        xf = int(1.5 * SR); r = np.linspace(0, 1, xf, dtype=np.float32)[:, None]; y = np.concatenate([y[:-xf], y[-xf:] * (1 - r) + y[:xf] * r, y[xf:]])
    y = rampa(y[:falta] * 10 ** ((-29 - lufs(y[:falta])) / 20), 0.8 if i else 0.05, 1.8)
    por(mus, y, max(0, m["s"] - 0.8))
nv = np.sqrt(media((voz ** 2).mean(1), int(0.05 * SR))); falando = media((nv > 0.01).astype(np.float32), int(0.6 * SR))
mus *= (1.0 + 0.7 * (1 - np.clip(falando, 0, 1)))[:, None]
# efeitos
ef = np.zeros((N, 2), np.float32); pe = lambda n: f"{D}/pe/{n}.flac"
def leito(nome, a, b, g):
    if not os.path.exists(pe(nome + "_0")): return
    y = ler(pe(nome + "_0")); k = 1
    while len(y) < (b - a + 1) * SR and os.path.exists(pe(f"{nome}_{k}")): y = np.concatenate([y, ler(pe(f"{nome}_{k}"))]); k += 1
    y = rampa(y[: int((b - a + 1) * SR)], 0.8, 1.2); por(ef, y * 10 ** ((g - lufs(y)) / 20), a)
for b in P["beats"]:
    f, a, z = b["familia"], b["ini"], b["fim"]
    if f == "salinas": leito("ondas", a, z, -30)
    elif f == "bsas": leito("rua_alaga", a, z, -31)
    elif f == "eureka_gelo" and b.get("fase") == "solta": leito("gelo", a, z, -30)
    elif b.get("reg") in ("altiplano", "titicaca", "puna", "rinconada", "cerro_pasco") or f == "lapaz": leito("vento_alto", a, z, -34)
    elif f == "eureka_ar" and b.get("fase") == "sobe":
        if os.path.exists(pe("ar_sobe_0")): y = ler(pe("ar_sobe_0")); por(ef, y * 10 ** ((-30 - lufs(y)) / 20), a + 0.6)
# boom de cada pais que cai: mesma fila dos cartoes (Video.tsx): nivel cruza l99, >= 1,9 s entre um e outro
def nivel(t):
    for (ta, ma), (tb, mb) in zip(A, A[1:]):
        if t <= tb:
            u0 = (t - ta) / max(1e-6, tb - ta); u = u0 * u0 * (3 - 2 * u0) * 0.35 + u0 * 0.65
            return float(np.exp(np.log(ma + 1) + (np.log(mb + 1) - np.log(ma + 1)) * u) - 1)
    return A[-1][1]
grade = np.arange(0, P["dauer"], 1 / 30); nvs = np.array([nivel(x) for x in grade])
res = json.load(open(f"{D}/resultado.json", encoding="utf-8"))["paises"]
quedas = sorted(float(grade[np.argmax(nvs >= p["l99"])]) for k, p in res.items() if k != "PRI" and (nvs >= p["l99"]).any())
ini = []
for q in quedas: ini.append(max(q, ini[-1] + 1.9) if ini else q)
for i, q in enumerate(ini):
    arq = pe(f"cai_pais_{i % 6}")
    if os.path.exists(arq): y = ler(arq); por(ef, y * 10 ** ((-27 - lufs(y)) / 20), q)
mix = voz + mus + ef
mix *= 10 ** ((-14 - lufs(mix)) / 20); pk = np.abs(mix).max()
if pk > 0.891: mix *= 0.891 / pk
sf.write(f"{D}/mix.wav", mix, SR, subtype="PCM_24")
print("MIX_OK", round(lufs(mix), 2), "LUFS | pico", round(20 * np.log10(np.abs(mix).max()), 2), "dBFS | quedas", len(ini), flush=True)
