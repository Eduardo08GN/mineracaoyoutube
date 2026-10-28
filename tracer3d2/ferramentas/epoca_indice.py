# Gera v1/src/kit/epoca/indice.json para a cena Gemaelde: quais imagens de geo/fotos/fotos.json tem mapa de profundidade em geo/tiefe/
# (frente + fundo inpintado) e os metadados (para o rotulo 'auto'). Rode de novo se mexer em tiefe/ ou fotos.json.
import json, os
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/v1"
fotos = json.load(open(f"{R}/public/geo/fotos/fotos.json", encoding="utf-8"))
tiefe = {f[:-len("_p_rgb.jpg")] for f in os.listdir(f"{R}/public/geo/tiefe") if f.endswith("_p_rgb.jpg")
         and all(os.path.exists(f"{R}/public/geo/tiefe/{f[:-len('_p_rgb.jpg')]}{s}") for s in ("_p_d.png", "_p_bgrgb.jpg", "_p_bgd.png"))}
out = {"tiefe": sorted(tiefe), "fotos": {}}
for e in fotos:
    nome = os.path.splitext(e["arquivo"])[0]
    out["fotos"][nome] = {k: e.get(k) for k in ("arquivo", "titulo_de", "autor", "ano", "art", "px", "rotulo_vorschlag")}
json.dump(out, open(f"{R}/src/kit/epoca/indice.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(out["fotos"]), "imagens,", len(tiefe), "com tiefe; sem tiefe:", [n for n in out["fotos"] if n not in tiefe])
