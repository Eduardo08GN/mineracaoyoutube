"""(Tracer3D 2.0, desde o video 7) Depth Anything V2 Small (Apache-2.0) em lote para as imagens de epoca -> v1/public/geo/tiefe/<nome>_{p_rgb,p_d,p_bgrgb,p_bgd}.
Receita do batedor (BATEDOR_sedan.md): 2 camadas, frente com bordas descartadas, fundo inpintado. Mapas e cartas ficam de fora.
  python ferramentas/tiefe.py   (depois: python ferramentas/epoca_indice.py)"""
import os, sys, json, subprocess
os.environ.update(HF_HOME='D:/tmp/hf', TEMP='D:/tmp', TMP='D:/tmp')
import numpy as np, cv2, torch
from PIL import Image
from transformers import pipeline
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))).replace(os.sep, '/')   # pasta do video (copiado para <video>/ferramentas)
SRC = f'{R}/geo/fotos/'; OUT = f'{R}/v1/public/geo/tiefe/'
fotos = json.load(open(SRC + 'fotos.json', encoding='utf-8'))
nomes = [f['arquivo'] for f in fotos if not f['titulo_de'].lower().startswith(('karte', 'plan ')) and 'telegramm' not in f['titulo_de'].lower()]
torch.set_num_threads(6)
pipe = pipeline('depth-estimation', model='depth-anything/Depth-Anything-V2-Small-hf', device='cpu')
for a in nomes:
    n = os.path.splitext(a)[0]
    if os.path.exists(OUT + n + '_p_bgd.png'): continue
    im = Image.open(SRC + a).convert('RGB')
    r = pipe(im); d = np.array(r['predicted_depth']).squeeze().astype(np.float32)
    d = (d - d.min()) / (d.max() - d.min() + 1e-9)
    rgb = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR); h, w = rgb.shape[:2]
    d = cv2.resize(d, (w, h))
    s = 1600 / max(h, w) if max(h, w) > 1600 else 1
    if s < 1: rgb = cv2.resize(rgb, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA); d = cv2.resize(d, (rgb.shape[1], rgb.shape[0]))
    d = cv2.GaussianBlur(d, (0, 0), 1.2)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    mask = cv2.dilate(((cv2.dilate(d, k) - cv2.erode(d, k)) > 0.10).astype(np.uint8) * 255, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (21, 21)))
    fg = (d > cv2.GaussianBlur(d, (0, 0), 25) + 0.04).astype(np.uint8) * 255
    m2 = cv2.dilate(cv2.bitwise_or(mask, fg), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    r2 = cv2.resize(rgb, None, fx=0.5, fy=0.5); m3 = cv2.resize(m2, (r2.shape[1], r2.shape[0]), interpolation=cv2.INTER_NEAREST)
    inp = cv2.GaussianBlur(cv2.resize(cv2.inpaint(r2, m3, 5, cv2.INPAINT_TELEA), (rgb.shape[1], rgb.shape[0])), (0, 0), 3)
    bd = cv2.GaussianBlur(cv2.erode(d, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41))), (0, 0), 8)
    cv2.imwrite(OUT + n + '_p_rgb.jpg', rgb, [cv2.IMWRITE_JPEG_QUALITY, 90]); cv2.imwrite(OUT + n + '_p_d.png', (d * 255).astype(np.uint8))
    cv2.imwrite(OUT + n + '_p_bgrgb.jpg', inp, [cv2.IMWRITE_JPEG_QUALITY, 85]); cv2.imwrite(OUT + n + '_p_bgd.png', (bd * 255).astype(np.uint8))
    print('ok', n, rgb.shape[:2], flush=True)
print('TIEFE_FIM', len(nomes))
