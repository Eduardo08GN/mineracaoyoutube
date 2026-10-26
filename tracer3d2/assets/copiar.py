# Copia os assets compartilhados do Acabamento para o public/acabamento/ de um projeto Tracer3D.
#   python <raiz>/assets/copiar.py <projeto v1> [hdri,tex,pessoas,vfx]
# Cada projeto copia so o que precisa (ex.: "tex,vfx" para um video sem soldados rigados).
import os, shutil, sys
AQUI = os.path.dirname(os.path.abspath(__file__))
MAPA = {"hdri": ("polyhaven/hdri", "hdri"), "tex": ("polyhaven/tex", "tex"), "pessoas": ("quaternius/pessoas", "pessoas"), "vfx": ("unitylabs/vfx", "vfx")}
proj = sys.argv[1]; quais = (sys.argv[2] if len(sys.argv) > 2 else ",".join(MAPA)).split(",")
dest = os.path.join(proj, "public", "acabamento"); os.makedirs(dest, exist_ok=True)
for q in quais:
    src, sub = MAPA[q]; d = os.path.join(dest, sub)
    shutil.copytree(os.path.join(AQUI, src), d, dirs_exist_ok=True); print("copiado", q, "->", d)
lic = []
for f in ("polyhaven/LICENCA.txt", "quaternius/LICENCA.txt", "unitylabs/LICENCA.txt"):
    lic.append("=== " + f + " ===\n" + open(os.path.join(AQUI, f), encoding="utf-8", errors="replace").read())
open(os.path.join(dest, "LICENCAS.txt"), "w", encoding="utf-8").write("\n\n".join(lic))
