# Folhas de contato do comparativo (original | produzido): visao geral a cada 2 s e folhas densas a 10 fps nas
# trocas de capitulo e nos cortes do original. Uso: python folhas.py <pasta_auditoria> <roteiro.ts>
import sys, os, re, json, subprocess, numpy as np
from PIL import Image, ImageDraw

D, ROT = sys.argv[1], sys.argv[2]
os.makedirs(f"{D}/folhas", exist_ok=True)
W, H = 480, 150          # cada par (1920x600 reduzido)
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f"{D}/comparativo.mp4", "-vf", f"fps=10,scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3); N = len(F)
def cel(i, w=W, h=H):
    im = Image.fromarray(F[min(i, N - 1)]).resize((w, h)); d = ImageDraw.Draw(im); t = i / 10
    d.rectangle([0, 0, 58, 13], fill=(0, 0, 0)); d.text((2, 1), f"{int(t // 60)}:{t % 60:04.1f}", fill=(255, 255, 0)); return im
def folha(idx, nome, cols, w=W, h=H):
    ims = [cel(i, w, h) for i in idx]; rows = (len(ims) + cols - 1) // cols
    G = Image.new("RGB", (cols * w, rows * h), (20, 20, 20))
    for k, im in enumerate(ims): G.paste(im, ((k % cols) * w, (k // cols) * h))
    G.save(f"{D}/folhas/{nome}.jpg", quality=82)
# visao geral: um par a cada 2 s, 4 colunas x 15 linhas = 2 min por folha
g = list(range(0, N, 20))
for k in range(0, len(g), 60): folha(g[k:k + 60], f"geral_{k // 60:02d}", 4)
# densas a 10 fps: 3 s em volta de cada troca de capitulo e de cada corte do original (30 quadros, 6 x 5, pares menores)
caps = [float(m) for m in re.findall(r"s: ([\d.]+), e:", open(ROT, encoding="utf-8").read())]
cortes = json.load(open(f"{D}/metricas.json"))["cortes_o"]
pontos = sorted(set([round(c, 1) for c in caps + cortes]))
janelas, ult = [], -99
for c in pontos:
    if c - ult < 3: continue
    janelas.append(c); ult = c
for j, c in enumerate(janelas):
    a = max(0, int(c * 10) - 10)
    folha(list(range(a, min(N, a + 30))), f"densa_{j:02d}_{int(c)}s", 6, 360, 112)
print("geral", (len(g) + 59) // 60, "densas", len(janelas))
