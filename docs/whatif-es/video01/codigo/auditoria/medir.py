# Leitura otica a 10 fps de um video: metricas por quadro (painel e legenda mascarados).
# Uso: python medir.py <video> <saida.npz>
import sys, subprocess, numpy as np, cv2

W, H = 256, 144
src, out = sys.argv[1], sys.argv[2]
p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", src, "-vf", f"fps=10,scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], stdout=subprocess.PIPE)
mask = np.ones((H, W), bool); mask[: int(H * 0.36), : int(W * 0.62)] = False; mask[int(H * 0.84):, :] = False
lum, sat, cor, borda, cortes, fmag, fdx, fdy, fdiv, frot, hue, mini = [], [], [], [], [], [], [], [], [], [], [], []
ant_h = ant_g = None
yy, xx = np.mgrid[0:72, 0:128]; cx, cy = (xx - 64) / 64.0, (yy - 36) / 36.0
m72 = cv2.resize(mask.astype(np.uint8), (128, 72), interpolation=cv2.INTER_NEAREST).astype(bool)
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    f = np.frombuffer(b, np.uint8).reshape(H, W, 3)
    hsv = cv2.cvtColor(f, cv2.COLOR_BGR2HSV)
    g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
    lum.append(float(g[mask].mean())); sat.append(float(hsv[..., 1][mask].mean()))
    R, G, B = [f[..., i][mask].astype(np.float32) for i in (2, 1, 0)]
    rg, yb = R - G, 0.5 * (R + G) - B
    cor.append(float(np.sqrt(rg.std() ** 2 + yb.std() ** 2) + 0.3 * np.sqrt(rg.mean() ** 2 + yb.mean() ** 2)))
    e = cv2.Canny(g, 60, 140); borda.append(float((e[mask] > 0).mean()))
    hh = cv2.calcHist([hsv], [0, 1, 2], mask.astype(np.uint8), [12, 4, 4], [0, 180, 0, 256, 0, 256]).flatten(); hh /= hh.sum() + 1e-9
    hue.append(cv2.calcHist([hsv], [0], (mask & (hsv[..., 1] > 40)).astype(np.uint8), [12], [0, 180]).flatten())
    cortes.append(0.0 if ant_h is None else float(cv2.compareHist(ant_h.astype(np.float32), hh.astype(np.float32), cv2.HISTCMP_BHATTACHARYYA)))
    g2 = cv2.resize(g, (128, 72))
    if ant_g is None: fmag.append(0); fdx.append(0); fdy.append(0); fdiv.append(0); frot.append(0)
    else:
        fl = cv2.calcOpticalFlowFarneback(ant_g, g2, None, 0.5, 3, 15, 3, 5, 1.2, 0)
        u, v = fl[..., 0][m72], fl[..., 1][m72]
        fmag.append(float(np.sqrt(u ** 2 + v ** 2).mean())); fdx.append(float(np.median(u))); fdy.append(float(np.median(v)))
        fdiv.append(float((u * cx[m72] + v * cy[m72]).mean()))       # >0 aproximando (zoom in / dolly in)
        frot.append(float((-u * cy[m72] + v * cx[m72]).mean()))      # rolagem
    ant_h, ant_g = hh, g2
    mini.append(cv2.resize(f, (48, 27), interpolation=cv2.INTER_AREA))
p.wait()
np.savez_compressed(out, lum=lum, sat=sat, cor=cor, borda=borda, corte=cortes, fmag=fmag, fdx=fdx, fdy=fdy, fdiv=fdiv, frot=frot,
                    hue=np.array(hue), mini=np.array(mini))
print("ok", out, len(lum))
