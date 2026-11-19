# Efeitos sonoros pelas batidas (v1/src/batidas.json) + voz -> wav final a -14 LUFS. Sem música (regra do canal de notícia).
import json, sys, os, glob, numpy as np, soundfile as sf, librosa
B = json.load(open(sys.argv[1], encoding="utf-8"))["batidas"]; VOZ = sys.argv[2]; SFX = sys.argv[3]; OUT = sys.argv[4]
voz, sr = sf.read(VOZ, dtype="float32"); voz = voz if voz.ndim == 1 else voz.mean(1)
mix = np.zeros(len(voz) + sr * 3, np.float32)
def carrega(id_, k):
    fs = sorted(glob.glob(f"{SFX}/{id_}_*.wav"))
    if not fs: return None
    a, s = sf.read(fs[k % len(fs)], dtype="float32"); a = a if a.ndim == 1 else a.mean(1)
    return librosa.resample(a, orig_sr=s, target_sr=sr) if s != sr else a
def poe(id_, t, db, k=0, dur=None, fade=0.4):
    a = carrega(id_, k)
    if a is None: return
    if dur: a = a[: int(dur * sr)]
    n = len(a); f = int(fade * sr)
    if n > 2 * f: a[-f:] *= np.linspace(1, 0, f); a[:min(f, n) // 4] *= np.linspace(0, 1, min(f, n) // 4)
    a = a / (np.abs(a).max() + 1e-6) * 10 ** (db / 20)
    i = max(0, int(t * sr)); j = min(len(mix), i + n); mix[i:j] += a[: j - i]
ult = {}; k = {}
def pode(id_, t, gap):
    if t - ult.get(id_, -99) < gap: return False
    ult[id_] = t; k[id_] = k.get(id_, -1) + 1; return True
for b in B:
    t0, t1, tp = b["ini"], b["fim"], b["tipo"]; fx = b.get("fx", "") or ""
    if tp == "explosao" or (tp == "foto25d" and "faiscas" in fx and "fogo" in fx):
        if pode("explosao", t0, 25): poe("explosao", t0, -10, k["explosao"], fade=1.5); continue
    if tp == "titulo" and pode("impacto", t0, 20): poe("impacto", t0, -16, k["impacto"])
    elif b.get("trans") in ("whip", "fumaca", "zoom", "tinta") and pode("whoosh", t0 - 0.25, 3.5): poe("whoosh", t0 - 0.25, -24, k["whoosh"])
    if tp == "relogio" and pode("tique", t0, 2): [poe("tique", t0 + s, -26, s) for s in range(int(min(4, t1 - t0)))]
    if (tp == "nuvem" or "gas" in fx) and pode("gas", t0, 9): poe("gas", t0, -32, k["gas"], dur=min(8, t1 - t0 + 1.5), fade=1.2)
    if ("fogo" in fx) and pode("fogo", t0, 9): poe("fogo", t0, -30, k["fogo"], dur=min(10, t1 - t0 + 1.5), fade=1.5)
mix[: len(voz)] += voz
import pyloudnorm as pyln
m = pyln.Meter(sr); mix = pyln.normalize.loudness(mix, m.integrated_loudness(mix), -14.0)
mix = np.clip(mix, -0.89, 0.89); sf.write(OUT, mix, sr)
print("MIX_OK", round(len(mix) / sr, 1), "s", {i: k.get(i, -1) + 1 for i in ("whoosh", "tique", "gas", "explosao", "fogo", "impacto")})
