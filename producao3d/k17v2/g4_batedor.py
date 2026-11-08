# K17 v2: stills do batedor NA G4 (2 por batida: 35% e 90%) e folha de contato. Uso: python -I g4_batedor.py <tag> [ids|todos|semclip]
import json, os, sys, glob
os.environ.setdefault("T2_DONO", "k17v2"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
K2 = r"D:\kriegschronik\k17_v2"; V1 = os.path.join(K2, "v1")
tag = sys.argv[1]; sel = sys.argv[2] if len(sys.argv) > 2 else "semclip"
pl = json.load(open(os.path.join(V1, "src", "plano.json"), encoding="utf-8"))
if sel == "todos": bs = pl["beats"]
elif sel == "semclip": bs = [b for b in pl["beats"] if b["dono"] != "clips"]
else: bs = [b for b in pl["beats"] if b["id"] in sel.split(",")]
segs = []
for b in bs: segs += [round(b["s"] + 0.35 * (b["e"] - b["s"]), 2), round(b["s"] + 0.9 * (b["e"] - b["s"]), 2)]
canal.stills(V1, tag, segs, escala="0.5")
from PIL import Image, ImageDraw
fs = sorted(glob.glob(os.path.join(V1, "teste", tag, "t*.jpg")), key=lambda f: float(os.path.basename(f)[1:-4])); W, H = 640, 360
os.makedirs(os.path.join(K2, "batedor"), exist_ok=True)
for parte in range(0, len(fs), 24):
    lote = fs[parte: parte + 24]
    F = Image.new("RGB", (W * 4, (H + 22) * ((len(lote) + 3) // 4)), "black"); d = ImageDraw.Draw(F)
    for i, f in enumerate(lote):
        t = float(os.path.basename(f)[1:-4]); b = next((x for x in bs if x["s"] <= t < x["e"]), None)
        x, y = (i % 4) * W, (i // 4) * (H + 22); F.paste(Image.open(f).convert("RGB").resize((W, H)), (x, y + 22))
        d.text((x + 4, y + 5), f"{b['id'] if b else '?'} t={t:.1f}  {(b['bild'][:70] if b else '')}", fill="white")
    F.save(os.path.join(K2, "batedor", f"{tag}_{parte // 24 + 1}.jpg"), quality=82)
print("FOLHAS", sorted(glob.glob(os.path.join(K2, "batedor", f"{tag}_*.jpg"))))
