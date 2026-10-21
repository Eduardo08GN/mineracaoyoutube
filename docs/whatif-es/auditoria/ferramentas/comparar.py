# Compara as metricas a 10 fps do original e do produzido, por capitulo (capitulos do roteiro do produzido).
# Uso: python comparar.py <pasta_auditoria> <roteiro.ts>   -> metricas.json, capitulos.md, graficos.png
import sys, re, json, numpy as np
import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt

D, ROT = sys.argv[1], sys.argv[2]
o, p = np.load(f"{D}/orig.npz"), np.load(f"{D}/prod.npz")
n = min(len(o["lum"]), len(p["lum"]))
caps = [(m[0], float(m[1]), float(m[2])) for m in re.findall(r"\{id: '([^']+)', s: ([\d.]+), e: ([\d.]+)", open(ROT, encoding="utf-8").read())]

def cortes(z):
    c = np.asarray(z["corte"]); l = np.asarray(z["lum"])
    idx = [i for i in range(1, len(c)) if c[i] > 0.45 and c[i] > 2.5 * np.median(c[max(0, i - 15):i + 15]) + 0.05]
    out = []
    for i in idx:                                   # junta cortes a menos de 0,5 s (dissolve/mergulho)
        if out and i - out[-1] < 5: continue
        out.append(i)
    return np.array(out) / 10.0

co, cp = cortes(o), cortes(p)
def seg(z, a, b, k):
    v = np.asarray(z[k])[int(a * 10):int(b * 10)]
    return float(np.mean(v)) if len(v) else 0.0
def corr_hue(a, b):
    ho = np.asarray(o["hue"])[int(a * 10):int(b * 10)].sum(0); hp = np.asarray(p["hue"])[int(a * 10):int(b * 10)].sum(0)
    if ho.sum() == 0 or hp.sum() == 0: return 0.0
    ho, hp = ho / ho.sum(), hp / hp.sum(); return float(np.minimum(ho, hp).sum())   # intersecao de histograma (0..1)
def compos(a, b):
    # semelhanca de composicao: correlacao dos quadros de 48x27 (cinza, normalizados), media no trecho
    mo, mp = np.asarray(o["mini"])[int(a * 10):int(b * 10):5].astype(np.float32).mean(-1), np.asarray(p["mini"])[int(a * 10):int(b * 10):5].astype(np.float32).mean(-1)
    k = min(len(mo), len(mp)); r = []
    for i in range(k):
        x, y = mo[i].ravel(), mp[i].ravel(); x, y = x - x.mean(), y - y.mean()
        r.append(float((x * y).sum() / (np.sqrt((x * x).sum() * (y * y).sum()) + 1e-6)))
    return float(np.mean(r)) if r else 0.0

linhas = []
for cid, a, b in caps:
    b = min(b, n / 10)
    if b - a < 1: continue
    d = {"cap": cid, "s": a, "e": b,
         "cortes_o": int(((co >= a) & (co < b)).sum()), "cortes_p": int(((cp >= a) & (cp < b)).sum()),
         "mov_o": seg(o, a, b, "fmag"), "mov_p": seg(p, a, b, "fmag"),
         "pan_o": seg(o, a, b, "fdx"), "pan_p": seg(p, a, b, "fdx"), "tilt_o": seg(o, a, b, "fdy"), "tilt_p": seg(p, a, b, "fdy"),
         "zoom_o": seg(o, a, b, "fdiv"), "zoom_p": seg(p, a, b, "fdiv"), "rol_o": seg(o, a, b, "frot"), "rol_p": seg(p, a, b, "frot"),
         "lum_o": seg(o, a, b, "lum"), "lum_p": seg(p, a, b, "lum"), "sat_o": seg(o, a, b, "sat"), "sat_p": seg(p, a, b, "sat"),
         "cor_o": seg(o, a, b, "cor"), "cor_p": seg(p, a, b, "cor"), "det_o": seg(o, a, b, "borda") * 100, "det_p": seg(p, a, b, "borda") * 100,
         "paleta": corr_hue(a, b), "compos": compos(a, b)}
    linhas.append(d)

json.dump({"cortes_o": co.tolist(), "cortes_p": cp.tolist(), "capitulos": linhas}, open(f"{D}/metricas.json", "w"), indent=1)
f = lambda x: f"{x:.2f}"
md = ["| cap | s–e | cortes O/P | movimento O/P | pan O/P | zoom O/P | luz O/P | saturação O/P | detalhe % O/P | paleta | composição |", "|" + "---|" * 11]
for d in linhas:
    md.append(f"| {d['cap']} | {d['s']:.0f}–{d['e']:.0f} | {d['cortes_o']}/{d['cortes_p']} | {f(d['mov_o'])}/{f(d['mov_p'])} | {f(d['pan_o'])}/{f(d['pan_p'])} | "
              f"{d['zoom_o']:.3f}/{d['zoom_p']:.3f} | {d['lum_o']:.0f}/{d['lum_p']:.0f} | {d['sat_o']:.0f}/{d['sat_p']:.0f} | {d['det_o']:.1f}/{d['det_p']:.1f} | {d['paleta']:.2f} | {d['compos']:.2f} |")
tot = lambda k: np.mean([d[k] for d in linhas])
md.append(f"\nCortes no vídeo inteiro: original {len(co)}, produzido {len(cp)}. Movimento médio O/P: {tot('mov_o'):.2f}/{tot('mov_p'):.2f}. "
          f"Detalhe médio O/P: {tot('det_o'):.1f}%/{tot('det_p'):.1f}%. Saturação O/P: {tot('sat_o'):.0f}/{tot('sat_p'):.0f}. Paleta média {tot('paleta'):.2f}. Composição média {tot('compos'):.2f}.")
open(f"{D}/capitulos.md", "w", encoding="utf-8").write("\n".join(md))

# graficos: series por segundo, original x produzido
t = np.arange(n) / 10.0
def suav(v, k=10): v = np.asarray(v)[:n]; return np.convolve(v, np.ones(k) / k, mode="same")
fig, ax = plt.subplots(5, 1, figsize=(16, 13), sharex=True)
for a_, k, nome in zip(ax, ["fmag", "lum", "sat", "borda", "cor"], ["movimento de câmera (px/quadro)", "luz", "saturação", "densidade de detalhe", "colorido"]):
    a_.plot(t, suav(o[k]), color="#3b6fb6", lw=1, label="original"); a_.plot(t, suav(p[k]), color="#e0832b", lw=1, label="produzido")
    a_.set_ylabel(nome, fontsize=9)
    for _, s, e in caps: a_.axvline(s, color="#999", lw=0.4)
for c in co: ax[0].axvline(c, color="#3b6fb6", lw=0.6, ymin=0.85)
for c in cp: ax[0].axvline(c, color="#e0832b", lw=0.6, ymax=0.15)
ax[0].legend(loc="upper right"); ax[-1].set_xlabel("segundos")
plt.tight_layout(); plt.savefig(f"{D}/graficos.png", dpi=80)
print("\n".join(md))
