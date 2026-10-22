# LUT 3D de transferencia de cor (Monge-Kantorovich linear, Pitie 2007) dos nossos quadros para os do original.
# Uso: python lut_mkl.py <pasta com pNNN.png (nosso) e oNNN.png (original)> <saida luts.json> mundo=f1,f2,... [mundo=...]
# Painel (canto superior esquerdo) e legenda (faixa de baixo) ficam fora da estatistica.
import sys, json, numpy as np
from PIL import Image

pasta, saida = sys.argv[1], sys.argv[2]
N, FORCA = 17, 0.85

def amostra(arq):
    a = np.asarray(Image.open(arq).convert('RGB').resize((480, 270)), np.float64) / 255.0
    m = np.ones(a.shape[:2], bool); m[:100, :300] = False; m[220:, :] = False
    return a[m]

def raiz(M):
    w, v = np.linalg.eigh(M); w = np.clip(w, 1e-9, None)
    return (v * np.sqrt(w)) @ v.T

def mkl(src, dst):
    ms, mt = src.mean(0), dst.mean(0)
    Cs, Ct = np.cov((src - ms).T), np.cov((dst - mt).T)
    Rs = raiz(Cs); Rsi = np.linalg.inv(Rs)
    T = Rsi @ raiz(Rs @ Ct @ Rs) @ Rsi
    return ms, mt, T

out = {}
for arg in sys.argv[3:]:
    mundo, fs = arg.split('=')
    src = np.concatenate([amostra(f'{pasta}/p{f}.png') for f in fs.split(',')])
    dst = np.concatenate([amostra(f'{pasta}/o{f}.png') for f in fs.split(',')])
    ms, mt, T = mkl(src, dst)
    g = np.linspace(0, 1, N)
    b, gg, r = np.meshgrid(g, g, g, indexing='ij')          # ordem do LUT3D: r varia mais rapido
    c = np.stack([r, gg, b], -1).reshape(-1, 3)
    m = np.clip((c - ms) @ T + mt, 0, 1)
    m = c + (m - c) * FORCA
    out[mundo] = [round(float(v), 3) for v in m.reshape(-1)]
    print(mundo, 'media nossa', ms.round(3), 'original', mt.round(3), 'sat nossa/orig',
          round(float(np.std(src, 1).mean()), 3), round(float(np.std(dst, 1).mean()), 3))
json.dump(out, open(saida, 'w'))
