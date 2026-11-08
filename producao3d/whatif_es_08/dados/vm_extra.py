# Na G4, depois do vm_calc.py: texturas em float16 (o PNG 16 bits cai para 8 bits no navegador), sombra de relevo,
# pontos de populacao (1 por 100 mil, semente fixa) e cume de cada pais. Le saida/grade.npz.
import json, numpy as np
from PIL import Image
D = "/content/mar"; g = np.load(f"{D}/saida/grade.npz"); nivel, pop, pais, dem = g["nivel"], g["pop"], g["pais"], g["dem"]
t = json.load(open(f"{D}/saida/texturas.json")); O, S, L, N = t["bounds"]; H, W = nivel.shape; TW, TH = t["tw"], t["th"]
def f16(a, nome):
    r = np.array(Image.fromarray(a.astype(np.float32), mode="F").resize((TW, TH), Image.BILINEAR), np.float32)
    r.astype(np.float16).tofile(f"{D}/saida/{nome}.f16.bin"); return r
nv = f16(nivel, "nivel"); dm = f16(dem, "dem")
# sombra multidirecional (relevo realcado 1.5x), em metros por celula (~0.92 km * cos lat)
lat = N - (np.arange(TH) + .5) * (N - S) / TH
dx = (L - O) / TW * 111320 * np.cos(np.radians(lat))[:, None]; dy = (N - S) / TH * 110540
z = np.maximum(dm, 0) * 1.5; gy, gx = np.gradient(z); gx /= dx; gy /= dy
sl = np.arctan(np.hypot(gx, gy)); asp = np.arctan2(-gx, gy); sh = np.zeros_like(z)
for az, w in ((315, .45), (270, .2), (360, .2), (225, .15)):
    a_ = np.radians(az); alt = np.radians(40)
    sh += w * (np.sin(alt) * np.cos(sl) + np.cos(alt) * np.sin(sl) * np.cos(a_ - asp))
Image.fromarray((np.clip(sh, 0, 1) * 255).astype(np.uint8)).save(f"{D}/saida/sombra.png")
# pontos de populacao (so os 21 alvos: ids 1..21 no pais.png)
pid = np.array(Image.open(f"{D}/saida/pais.png"))
ALVO = t["ordem_pais"]; ne_idx = {}
import geopandas as gpd
ne = gpd.read_file(f"{D}/ne10/ne_10m_admin_0_countries.shp"); isos = list(ne["ADM0_A3"])
idx = {k: i + 1 for i, k in enumerate(isos)}
m = np.isin(pais, [idx[k] for k in ALVO if k in idx]) & (pop > 0)
w = np.where(m, pop, 0).ravel().astype(np.float64); tot = w.sum(); n = int(tot / 100000)
rng = np.random.default_rng(42); pick = rng.choice(w.size, n, replace=True, p=w / tot)
yy, xx = np.unravel_index(pick, pop.shape); jx, jy = rng.random(n), rng.random(n)
lon = O + (xx + jx) * (L - O) / W; la = N - (yy + jy) * (N - S) / H
inv = {idx[k]: i + 1 for i, k in enumerate(ALVO) if k in idx}
pts = {"lon": np.round(lon, 3).tolist(), "lat": np.round(la, 3).tolist(), "nivel": np.round(nivel[yy, xx]).astype(int).tolist(),
       "pais": [inv[int(v)] for v in pais[yy, xx]], "por_ponto": 100000}
json.dump(pts, open(f"{D}/saida/pontos.json", "w"))
# cume de cada pais (celula mais alta)
cumes = {}
for i, k in enumerate(ALVO, start=1):
    if k not in idx: continue
    mm = pais == idx[k]
    if not mm.any(): continue
    j = np.argmax(np.where(mm, dem, -1e9)); y, x = np.unravel_index(j, dem.shape)
    cumes[k] = {"lon": float(O + (x + .5) * (L - O) / W), "lat": float(N - (y + .5) * (N - S) / H), "m": float(dem[y, x])}
json.dump(cumes, open(f"{D}/saida/cumes.json", "w"), indent=1)
print("EXTRA_OK pontos", n, "tex", TW, TH, flush=True)
