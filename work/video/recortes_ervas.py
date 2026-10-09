# Os recortes FOTORREALISTAS das ervas para os blocos de motion graphics (regra do Eduardo: recorte sempre de imagem
# real do tema). Tirados de quadros dos videos de terceiros de cada erva, sem rosto e sem texto, com a borda de adesivo.
#   python work/video/recortes_ervas.py   ->  work/video/mg_comum/ervas/<erva>.png + folha.jpg
import json, os, subprocess, sys
import numpy as np, cv2
from PIL import Image, ImageFilter

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
import broll_terceiros as bt       # noqa: E402  (tem_rosto, tem_texto, quadro)

SRC = os.path.join(AQUI, "completo", "terceiros", "src")
OUT = os.path.join(AQUI, "mg_comum", "ervas")
ERVAS = ["petersilie", "basilikum", "dill", "schnittlauch", "minze", "liebstoeckl", "thymian", "salbei", "oregano",
         "lorbeer", "koriander", "melisse"]
_SES = []


def recorte(img_bgr):
    from rembg import remove, new_session
    if not _SES: _SES.append(new_session("isnet-general-use"))
    rgba = remove(Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)), session=_SES[0]).convert("RGBA")
    a = np.array(rgba.split()[-1]); m = (a > 150).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if n <= 1: return None, 0
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); m = (lab == i).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    rgba.putalpha(Image.fromarray(cv2.GaussianBlur(m * 255, (3, 3), 0)))
    h, w = m.shape; area = m.mean()
    ys, xs = np.nonzero(m); cx = xs.mean() / w; toca_borda = (xs.min() < 3) + (xs.max() > w - 4) + (ys.min() < 3) + (ys.max() > h - 4)
    # nota: planta grande o bastante, centrada, inteira (pouca borda cortada), e com bastante verde
    rgb = np.array(rgba.convert("RGB")).astype(int)[m > 0]
    verde = float(((rgb[:, 1] > rgb[:, 0] + 8) & (rgb[:, 1] > rgb[:, 2] + 8)).mean()) if len(rgb) else 0
    nota = (0.1 < area < 0.5) * (1 - abs(cx - .5)) * (1 - .25 * toca_borda) * verde
    return rgba.crop(rgba.getbbox()), nota


def adesivo(rgba, branco=0, ocre=0):
    """⛔ (Eduardo, 09/10) SEM contorno: a borda branca + dourada de "adesivo" ficou feia e grosseira. O recorte sai
    limpo (a sombra suave vem do CSS .cut dos motion graphics). branco/ocre > 0 so' para reproduzir o estilo antigo."""
    if not branco and not ocre:
        big = Image.new("RGBA", (rgba.width + 50, rgba.height + 50), (0, 0, 0, 0)); big.alpha_composite(rgba, (25, 25))
        return big
    big = Image.new("RGBA", (rgba.width + 50, rgba.height + 50), (0, 0, 0, 0)); big.alpha_composite(rgba, (25, 25))
    a = big.split()[-1]; dil = lambda m, r: m.filter(ImageFilter.MaxFilter(2 * r + 1))   # noqa: E731
    a1 = dil(a, branco); a2 = dil(a1, ocre)
    base = Image.new("RGBA", big.size, (0, 0, 0, 0))
    base.paste(Image.new("RGBA", big.size, (184, 134, 47, 255)), mask=a2)
    base.paste(Image.new("RGBA", big.size, (250, 245, 232, 255)), mask=a1)
    base.alpha_composite(big); return base


def candidatos(n_max=8):
    """Os melhores recortes de cada erva como CANDIDATOS (mg_comum/ervas/cand/<erva>_<i>.png + uma folha por erva):
    a nota automatica nao sabe a especie (saiu manjericao como salsinha, um vaso como hortela, um homem como tomilho),
    entao quem escolhe e' o olho: python recortes_ervas.py escolher erva=i ..."""
    cand = os.path.join(OUT, "cand"); os.makedirs(cand, exist_ok=True)
    fontes = {}
    for f in os.listdir(SRC):
        if f.endswith(".json"):
            d = json.load(open(os.path.join(SRC, f), encoding="utf-8")); fontes.setdefault(d.get("tag"), []).append(d["id"])
    for erva in ERVAS:
        if os.path.exists(os.path.join(cand, erva + "_folha.jpg")): continue
        achados = []
        for vid in fontes.get(erva, [])[:6]:
            arq = os.path.join(SRC, vid + ".mp4")
            if not os.path.exists(arq): continue
            total = bt.dur(arq)
            for fr in np.linspace(.1, .9, 10):
                img = bt.quadro(arq, total * fr, w=960)
                if img is None or bt.tem_rosto(img) or bt.tem_texto(img): continue
                r, nota = recorte(img)
                if r is None or nota <= 0: continue
                if bt.tem_rosto(cv2.cvtColor(np.array(r.convert("RGB")), cv2.COLOR_RGB2BGR)): continue
                achados.append((nota, r, f"{vid}@{total * fr:.0f}s"))
        achados.sort(key=lambda x: -x[0])
        # no maximo 2 por fonte: variedade para escolher
        por_fonte, esc = {}, []
        for a in achados:
            v = a[2].split("@")[0]
            if por_fonte.get(v, 0) < 2: esc.append(a); por_fonte[v] = por_fonte.get(v, 0) + 1
            if len(esc) == n_max: break
        S = Image.new("RGB", (4 * 300, 2 * 320), (205, 200, 190))
        from PIL import ImageDraw
        dr = ImageDraw.Draw(S)
        for k, (nota, r, origem) in enumerate(esc):
            im = adesivo(r); im.thumbnail((900, 900)); im.save(os.path.join(cand, f"{erva}_{k}.png"))
            t = im.copy(); t.thumbnail((290, 290)); S.paste(t, ((k % 4) * 300 + 5, (k // 4) * 320 + 5), t)
            dr.text(((k % 4) * 300 + 8, (k // 4) * 320 + 298), f"{k}  {origem}", fill=(20, 20, 20))
        S.save(os.path.join(cand, erva + "_folha.jpg"), quality=85)
        print(f"  {erva}: {len(esc)} candidatos", flush=True)


def escolher(pares):
    import shutil
    for par in pares:
        erva, k = par.split("=")
        shutil.copy(os.path.join(OUT, "cand", f"{erva}_{k}.png"), os.path.join(OUT, erva + ".png")); print("  ", erva, "<-", k)
    folha = [Image.open(os.path.join(OUT, e + ".png")) for e in ERVAS if os.path.exists(os.path.join(OUT, e + ".png"))]
    S = Image.new("RGB", (6 * 320, 2 * 320), (205, 200, 190))
    for i, im in enumerate(folha):
        t = im.copy(); t.thumbnail((310, 310)); S.paste(t, ((i % 6) * 320 + 5, (i // 6) * 320 + 5), t)
    S.save(os.path.join(OUT, "folha.jpg"), quality=85)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if len(sys.argv) > 1 and sys.argv[1] == "escolher": escolher(sys.argv[2:])
    else: candidatos()
