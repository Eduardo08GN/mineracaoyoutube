import json, os, sys, time
sys.path.insert(0, "work/video")
import flow_ivone as fi
fh = fi.fh
s, cdp = fi.conectar()
ret = fh.upload(s, r"C:\Users\edlut\mineracaoyoutube\data\personas\kloster-moench.jpg", fi.PROJETO)[0]
print("retrato subiu:", ret[:12])
prompt = ("Use the man in the reference image: exactly the same face, hair, beard and black Benedictine habit. "
          "He sits at a worn oak table in a quiet vaulted monastery kitchen, soft daylight from a small window on the left, "
          "dried herb bundles and copper pots softly out of focus behind him. Medium close-up from the chest up, eye level, "
          "he looks directly into the camera with a calm, kind expression, hands resting on the table. Photorealistic, "
          "natural warm colors, shallow depth of field, 16:9 landscape frame.")
with fi.Gratis(s):
    t0 = time.time()
    mid = fh.gerar_imagem_refs(s, prompt, [ret], fi.PROJETO)
    print(f"imagem pronta em {time.time()-t0:.0f}s:", mid[:12])
dest = fh.baixar_limpa(s, mid, os.path.abspath("work/video/fatia01/quadros/avatar_cozinha.png"))
from PIL import Image
print(dest, Image.open(dest).size, "| modelo:", fh.MODELOS_IMAGEM[fh._modelo_imagem[0]])
json.dump({"retrato": ret}, open("work/video/fatia01/ids.json", "w"))
cdp.close()
