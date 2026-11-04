# 04/11: atlas chapado do Learjet 45 simples. Duas cores: pintura e cinza-escuro. Janela = disco cinza, sem gradiente,
# moldura, letreiro, faixa ou rebite. O avião é coadjuvante; a energia vai para a composição.
import shutil, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as nd

SRC = r"D:/reconstruccion/assets/sketchfab/bombardier_learjet_45_0a4776"
DST = r"D:/reconstruccion/assets/sketchfab/learjet45_chapado"
PINTURA, CINZA = (172, 172, 170), (58, 63, 70)   # pintura um tom abaixo: o branco estourava no céu de tempestade

if os.path.isdir(DST):
    shutil.rmtree(DST)
shutil.copytree(SRC, DST)
a = np.asarray(Image.open(f"{SRC}/textures/turbina_baseColor.png").convert("RGB")).astype(np.float32) / 255
lu = a @ np.array([0.299, 0.587, 0.114])
escuro = lu < 0.2

# janelas: faixas das duas fileiras (coordenadas do atlas 2048); dentro delas, a janela preenchida vira um disco
janelas = []
for y0, y1 in ((1300, 1390), (1600, 1690)):
    sub = np.zeros_like(escuro)
    sub[y0:y1, 580:1090] = lu[y0:y1, 580:1090] < 0.45
    lab, n = nd.label(nd.binary_fill_holes(sub))
    for i, sl in enumerate(nd.find_objects(lab), 1):
        h, w = sl[0].stop - sl[0].start, sl[1].stop - sl[1].start
        if 25 < h < 70 and 18 < w < 60:
            janelas.append(((sl[1].start + sl[1].stop) / 2, (sl[0].start + sl[0].stop) / 2, min(h, w)))
    escuro[y0:y1, 580:1090] = False           # some moldura, gradiente e marcação vermelha

# fan e cubo viram disco liso; pontinhos soltos (assinatura, rebites) somem
escuro = nd.binary_fill_holes(escuro)
lab, n = nd.label(escuro)
tam = nd.sum(escuro, lab, range(1, n + 1))
escuro = np.isin(lab, 1 + np.flatnonzero(tam >= 400))
out = np.where(escuro[..., None], np.array(CINZA), np.array(PINTURA)).astype(np.uint8)
im = Image.fromarray(out)
d = ImageDraw.Draw(im)
for cx, cy, s in janelas:
    r = s * 0.42
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CINZA)
im.save(f"{DST}/textures/turbina_baseColor.png")
im.resize((1024, 1024)).save(r"D:/tmp/atlas_chapado_prev.png")
print("JANELAS", len(janelas))
