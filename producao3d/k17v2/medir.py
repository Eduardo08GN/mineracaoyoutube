# K17 v2: régua de 25 fps por batida (mov médio, % quase parados, maior trecho parado)
import subprocess, json, sys, numpy as np
arq = sys.argv[1]; w, h = 160, 90
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", arq, "-vf", f"fps=25,scale={w}:{h},format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32); d = np.abs(np.diff(f, axis=0)).mean(axis=(1, 2))
print(f"mov medio {d.mean():.2f} | quase parados {100 * (d < 0.5).mean():.0f}%")
pl = json.load(open(r"D:\kriegschronik\k17_v2\v1\src\plano.json", encoding="utf8")); rows = []
for b in pl["beats"]:
    x = d[int(b["s"] * 25): int(b["e"] * 25)]
    if len(x): rows.append((b["id"], b["dono"], round(float(x.mean()), 2), round(100 * float((x < 0.5).mean()))))
best = cur = end = 0
for i, p in enumerate(d < 0.5):
    cur = cur + 1 if p else 0
    if cur > best: best, end = cur, i
print("maior parado continuo", best / 25, "s ate", end / 25)
for fam in ("karten", "ui", "clips"):
    xs = [r for r in rows if r[1] == fam]; print(fam, "mov", round(np.mean([r[2] for r in xs]), 2), "parados", round(np.mean([r[3] for r in xs])))
print(sorted(rows, key=lambda r: -r[3])[:12])
