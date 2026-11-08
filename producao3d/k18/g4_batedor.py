# Lote do batedor do K18 na G4:
#   prof     -> Depth Anything V2 (Large) nas pinturas de v1/public/epoca/*.jpg -> <motivo>_prof.png (8 bits, claro = perto)
#   vitrine  -> stills 1080p da composicao Video nos segundos de vitrine.json ([{"beat": "b005", "u": 0.5}, ...])
# Uso: python g4_batedor.py prof vitrine      (um ou os dois; os dois rodam em paralelo: profundidade e stills)
import glob, json, os, sys, threading
os.environ.setdefault("T2_DONO", "k18"); os.environ.setdefault("TEMP", "D:/tmp"); os.environ.setdefault("T2_PROJ", "k18_koeniggraetz")
sys.path.insert(0, r"D:\tracer3d2"); import canal
R = os.path.dirname(os.path.abspath(__file__)); P = os.path.join(R, "v1"); EP = os.path.join(P, "public", "epoca"); quer = set(sys.argv[1:])
try: canal.saude()
except SystemExit:
    if not canal.reconectar(): canal.ligar()

PROF = r'''
import glob, os, sys, numpy as np, torch
from PIL import Image
from transformers import pipeline
d = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Large-hf", device=0, torch_dtype=torch.float16)
for f in sorted(glob.glob(sys.argv[1] + "/*.jpg")):
    im = Image.open(f).convert("RGB"); r = d(im)["predicted_depth"]
    r = r.squeeze().float().cpu().numpy(); r = (r - r.min()) / max(1e-6, r.max() - r.min())
    Image.fromarray((r * 255).astype(np.uint8)).resize((min(1024, im.size[0]), round(min(1024, im.size[0]) * im.size[1] / im.size[0])), Image.BICUBIC).save(f[:-4] + "_prof.png"); print("PROF", os.path.basename(f), flush=True)
print("PROF_OK", flush=True)
'''

def prof():
    V = "/content/k18_prof"; canal.exec_vm(f"rm -rf {V} && mkdir -p {V}/img", prazo=60)
    ped = [l.strip() for l in open(os.path.join(EP, "PROFUNDIDADE_PEDIDO.txt"), encoding="utf-8") if l.strip() and not l.startswith("#")]
    fs = [os.path.join(EP, m + ".jpg") for m in ped if os.path.exists(os.path.join(EP, m + ".jpg"))]
    for f in fs: canal.subir(f, f"{V}/img/{os.path.basename(f)}")
    tmp = os.path.join(os.environ["TEMP"], "k18_prof_vm.py"); open(tmp, "w", encoding="utf-8").write(PROF); canal.subir(tmp, f"{V}/prof.py")
    out = canal.exec_vm(f"cd {V} && python prof.py {V}/img > log.txt 2>&1; grep -E 'PROF_OK|Traceback|Error' log.txt | tail -5", prazo=1800, estagnacao=900)
    print(out[-400:], flush=True)
    if "PROF_OK" not in out: print("PROF_FALHOU", flush=True); return
    for f in fs: canal.baixar(f"{V}/img/{os.path.basename(f)[:-4]}_prof.png", f[:-4] + "_prof.png")
    print("PROF_BAIXADO", len(fs), flush=True)

th = threading.Thread(target=prof) if "prof" in quer else None
if th: th.start()
if "vitrine" in quer:
    pl = json.load(open(os.path.join(P, "src", "plano.json"), encoding="utf-8")); B = {b["id"]: b for b in pl["beats"]}
    vt = json.load(open(os.path.join(R, "vitrine.json"), encoding="utf-8"))
    if th: th.join()   # a profundidade entra no bundle dos stills
    # stills() chama garantir(): prepara so se o projeto ainda nao esta na VM (preparar de novo derruba: EADDRINUSE 8766)
    seg = [round(B[v["beat"]]["ini"] + v.get("u", 0.5) * (B[v["beat"]]["fim"] - B[v["beat"]]["ini"]), 3) for v in vt]
    canal.stills(P, "vitrine", seg, escala="1"); print("VITRINE_OK", len(seg), flush=True)
if th and th.is_alive(): th.join()
print("LOTE_BATEDOR_FIM", flush=True)
