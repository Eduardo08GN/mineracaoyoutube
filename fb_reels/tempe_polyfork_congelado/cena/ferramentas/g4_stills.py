# Stills do batedor Tempe x Polyfork na G4-2 (caminho do tempe20: canal.preparar + canal.stills). NUNCA liga nem desliga a G4.
# Uso: python -X utf8 g4_stills.py <tag> [--spp N] [--gi pt|barato] [segundos ...]   (padrao: 0.5 1.5 2.5 = estagios A, B, C; escala 1 = 1080x1920)
# RODADA 2: --spp grava src/modo.json (amostras do path tracer por quadro; 256 padrao). O tempo por quadro sai no log da G4 (linhas 'PT spp=...').
import json, os, sys
os.environ.setdefault("T2_G4", "2"); os.environ.setdefault("T2_DONO", "reels_codigo"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
PROJ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try: print("saude:", canal.saude(), flush=True)
except SystemExit as e: raise SystemExit("G4-2 FORA DO AR (nao ligo): %s" % e)
a = sys.argv[1:]; tag = a.pop(0); modo_p = os.path.join(PROJ, "src", "modo.json"); modo = json.load(open(modo_p, encoding="utf-8"))
for k, tipo in (("--spp", int), ("--gi", str)):
    if k in a: i = a.index(k); modo[k[2:]] = tipo(a[i + 1]); del a[i:i + 2]
json.dump(modo, open(modo_p, "w", encoding="utf-8"), ensure_ascii=False); print("modo:", modo, flush=True)
segs = [float(x) for x in a] or [0.5, 1.5, 2.5]
# package.json mudou (rodada 2: pathtracer, bvh, n8ao)? entao npm na VM de novo (preparar.sh compara package.json); marcador por hash
import hashlib
h = hashlib.sha1(open(os.path.join(PROJ, "package.json"), "rb").read()).hexdigest(); marc = os.path.join(PROJ, ".pkg_g4_ok")
if not canal.saude().get("stills") or not (os.path.exists(marc) and open(marc).read() == h):
    canal.preparar(PROJ); open(marc, "w").write(h)
canal.sincronizar(PROJ, ["public", "src"])
canal.stills(PROJ, tag, segs, escala="1")
print("SEGS", segs, "->", os.path.join(PROJ, "teste", tag))
