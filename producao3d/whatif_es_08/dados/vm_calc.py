# Na G4: o mar sobe sobre o relevo real da America Latina e conta a populacao que afunda.
# Dados: GHS-POP E2025 30" (JRC, CC-BY 4.0), ETOPO 2022 30" superficie (NOAA, dominio publico), Natural Earth admin0 10m (dominio publico).
# A agua entra pelo oceano: cada celula alaga no "nivel de transbordo" (reconstrucao morfologica por erosao = priority-flood),
# entao bacias interiores abaixo do mar (Laguna del Carbon) so alagam quando o mar chega ao divisor.
import json, os, sys, time, numpy as np, rasterio, rasterio.features, rasterio.warp
from rasterio.windows import from_bounds
from rasterio.enums import Resampling
import geopandas as gpd
from skimage.morphology import reconstruction
from PIL import Image
T0 = time.time(); D = "/content/mar"
def log(*a): print(f"[{time.time()-T0:6.0f}s]", *a, flush=True)
O, L, S, N = -118.0, -34.0, -56.5, 33.0          # oeste, leste, sul, norte
POP = f"{D}/GHS_POP_E2025_GLOBE_R2023A_4326_30ss_V1_0.tif"
with rasterio.open(POP) as src:
    win = from_bounds(O, S, L, N, src.transform).round_offsets().round_lengths()
    pop = src.read(1, window=win).astype(np.float32); tr = src.window_transform(win); crs = src.crs
pop[pop < 0] = 0; H, W = pop.shape; log("pop", pop.shape, f"{pop.sum()/1e6:.1f} mi")
dem = np.zeros((H, W), np.float32)
with rasterio.open(f"NETCDF:{D}/etopo30s.nc:z") as src:
    rasterio.warp.reproject(rasterio.band(src, 1), dem, src_crs="EPSG:4326", dst_transform=tr, dst_crs="EPSG:4326", resampling=Resampling.average)
log("dem", float(dem.min()), float(dem.max()))
ne = gpd.read_file(f"{D}/ne10/ne_10m_admin_0_countries.shp").to_crs("EPSG:4326")
ne["iso"] = ne["ADM0_A3"]
isos = list(ne["iso"]); idx = {k: i + 1 for i, k in enumerate(isos)}
pais = rasterio.features.rasterize(((g, idx[k]) for g, k in zip(ne.geometry, ne["iso"])), out_shape=(H, W), transform=tr, fill=0, dtype="int32")
log("paises rasterizados")
# oceano = celula <= 0 sem pais OU conectada a borda; semente = oceano, resto = maximo
from scipy import ndimage
mar0 = (dem <= 0) & (pais == 0)
rot, n = ndimage.label(dem <= 0)
borda = np.unique(np.concatenate([rot[0], rot[-1], rot[:, 0], rot[:, -1]])); borda = borda[borda > 0]
oceano = np.isin(rot, borda) | mar0
semente = np.where(oceano, dem, dem.max()).astype(np.float32)
log("reconstrucao (priority-flood)...")
nivel = reconstruction(semente, dem, method="erosion").astype(np.float32)   # nivel em que a celula alaga
nivel = np.maximum(nivel, dem)
log("ok nivel", float(nivel[~oceano].min()))
lat = N + (np.arange(H) + 0.5) * tr.e
area = (np.cos(np.radians(lat))[:, None] * np.ones((1, W))).astype(np.float32)   # peso de area
terra = ~oceano
ALVO = {"ARG": "Argentina", "BOL": "Bolivia", "BRA": "Brasil", "CHL": "Chile", "COL": "Colombia", "CRI": "Costa Rica", "CUB": "Cuba", "ECU": "Ecuador",
        "SLV": "El Salvador", "GTM": "Guatemala", "HTI": "Haití", "HND": "Honduras", "MEX": "México", "NIC": "Nicaragua", "PAN": "Panamá", "PRY": "Paraguay",
        "PER": "Perú", "DOM": "República Dominicana", "URY": "Uruguay", "VEN": "Venezuela", "PRI": "Puerto Rico"}
NIV = np.concatenate([np.arange(0, 100, 1), np.arange(100, 7001, 10)])
res = {"fonte": "GHS-POP E2025 30s (JRC CC-BY 4.0) + ETOPO 2022 30s (NOAA) + Natural Earth 10m", "paises": {}, "latam": {}}
mlat = np.isin(pais, [idx[k] for k in ALVO if k in idx]) & terra
for k, nome in ALVO.items():
    if k not in idx: log("SEM", k); continue
    m = (pais == idx[k]) & terra; p = pop[m]; nv = nivel[m]; a = area[m]; dm = dem[m]
    if p.sum() <= 0: continue
    o = np.argsort(nv); cp = np.cumsum(p[o]) / p.sum(); nvo = nv[o]
    def lv(f): return float(nvo[min(len(nvo) - 1, np.searchsorted(cp, f))])
    l99 = lv(0.99)
    # ultimo refugio: populacao acima do nivel de 98% (o 1-2% final), centroide ponderado e maior celula
    yy, xx = np.nonzero(m); sel = nv >= lv(0.98); w = p[sel]
    cy = float((yy[sel] * w).sum() / w.sum()); cx = float((xx[sel] * w).sum() / w.sum())
    j = np.argmax(np.where(sel, p, 0))
    acima = nv > l99 - 1; oo = np.argsort(-np.where(acima, p, 0))[:400]; ultimos = []
    for q in oo:
        lo_, la_ = float(tr.c + (xx[q] + .5) * tr.a), float(tr.f + (yy[q] + .5) * tr.e)
        if p[q] <= 0 or any(abs(lo_ - u["lon"]) < .25 and abs(la_ - u["lat"]) < .25 for u in ultimos): continue
        ultimos.append({"lon": lo_, "lat": la_, "pop": float(p[q]), "nivel": float(nv[q])})
        if len(ultimos) == 6: break
    res["paises"][k] = {"nome": nome, "pop": float(p.sum()), "l50": lv(0.5), "l90": lv(0.9), "l99": l99, "l100": float(nvo[-1]),
                        "pico_m": float(dm.max()), "refugio": {"lon": float(tr.c + (cx + .5) * tr.a), "lat": float(tr.f + (cy + .5) * tr.e),
                        "maior_lon": float(tr.c + (xx[j] + .5) * tr.a), "maior_lat": float(tr.f + (yy[j] + .5) * tr.e), "maior_pop": float(p[j]), "maior_nivel": float(nv[j])},
                        "curva_pop": [float(p[nv <= x].sum() / p.sum()) for x in NIV], "curva_terra": [float(a[nv <= x].sum() / a.sum()) for x in NIV], "ultimos": ultimos}
    log(nome, f"pop {p.sum()/1e6:.1f} mi | 50% {lv(.5):.0f} | 99% {l99:.0f} | pico {dm.max():.0f}")
pl = pop[mlat]; nl = nivel[mlat]; al = area[mlat]
res["latam"] = {"niveis": NIV.tolist(), "pop": [float(pl[nl <= x].sum() / pl.sum()) for x in NIV], "terra": [float(al[nl <= x].sum() / al.sum()) for x in NIV], "pop_total": float(pl.sum()), "pessoas_abs": [float(pl[nl <= x].sum()) for x in NIV]}
np.savez_compressed(f"{D}/saida/grade.npz", nivel=nivel, pop=pop, pais=pais, dem=dem)
# cidades: nivel de alagamento na celula
cid = json.load(open(f"{D}/cidades.json", encoding="utf-8"))
for c in cid:
    r_, c_ = rasterio.transform.rowcol(tr, c["lon"], c["lat"])
    jan = nivel[max(0, r_-1):r_+2, max(0, c_-1):c_+2]; c["nivel"] = float(jan.max()); c["dem"] = float(dem[r_, c_])
res["cidades"] = cid
json.dump(res, open(f"{D}/saida/resultado.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
# texturas para o shader (4096 de largura, proporcao do recorte)
TW = 4096; TH = int(round(TW * H / W))
def tex(a, nome, lo, hi, mode="I;16"):
    im = Image.fromarray(np.clip((a - lo) / (hi - lo) * 65535, 0, 65535).astype(np.uint16)).resize((TW, TH), Image.BILINEAR if nome != "pais" else Image.NEAREST)
    im.save(f"{D}/saida/{nome}.png")
tex(nivel, "nivel", -1000, 7000)          # metros: v/65535*8000-1000
tex(dem, "dem", -8000, 7000)
tex(np.log10(1 + pop), "pop", 0, 6)
pid = np.zeros_like(pais);
for i, k in enumerate(ALVO, start=1):
    if k in idx: pid[pais == idx[k]] = i
Image.fromarray(pid.astype(np.uint8)).resize((TW, TH), Image.NEAREST).save(f"{D}/saida/pais.png")
json.dump({"bounds": [O, S, L, N], "tw": TW, "th": TH, "ordem_pais": list(ALVO), "nivel": [-1000, 7000], "dem": [-8000, 7000], "pop_log10": [0, 6]},
          open(f"{D}/saida/texturas.json", "w"))
log("FIM")
