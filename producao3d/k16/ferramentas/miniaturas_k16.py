# K16: 3 miniaturas do A/B (par fixo título↔miniatura). Lição do concorrente (04/11): o objeto do título na imagem,
# 2–4 palavras que ACRESCENTAM ao título (não repetem), contraste forte, legível no celular. Fonte: Barlow Condensed Bold (OFL).
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
import os
T = r"D:/tmp/thumb16"; OUT = r"D:/kriegschronik/k16_seekrieg/entrega"
FB = r"D:/kriegschronik/tracer3d_15_emser/v1/public/fonts/BarlowCondensed-Bold.ttf"
W, H = 1280, 720
LAR, BRA = (255, 122, 31), (245, 242, 235)

def base(path, foco=(0.5, 0.5), escuro=0.55, sat=0.9):
    im = Image.open(path).convert("RGB")
    r = max(W / im.width, H / im.height); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x = int((im.width - W) * foco[0]); y = int((im.height - H) * foco[1])
    im = im.crop((x, y, x + W, y + H))
    im = ImageEnhance.Color(im).enhance(sat); im = ImageEnhance.Contrast(im).enhance(1.15)
    # escurece o lado do texto (gradiente da esquerda), para o texto ler sem cartão
    g = Image.linear_gradient("L").rotate(90).resize((W, H)); g = g.point(lambda v: int(255 * escuro * (v / 255) ** 1.4))
    return Image.composite(Image.new("RGB", (W, H), (8, 10, 12)), im, g)

def texto(im, linhas):
    d = ImageDraw.Draw(im)
    y = 120
    for txt, tam, cor in linhas:
        f = ImageFont.truetype(FB, tam)
        d.text((64 + 4, y + 4), txt, font=f, fill=(0, 0, 0))
        d.text((64, y), txt, font=f, fill=cor); y += int(tam * 1.02)
    return im

# 1: título 1 já diz 49 gegen 5 → a miniatura acrescenta o mistério: o casco com a parte submersa e a régua, "ZU TIEF?"
texto(base(f"{T}/calado.png", (0.75, 0.5), escuro=0.45, sat=1.1), [("ZU TIEF?", 190, LAR), ("8,4 m", 120, BRA)]).save(f"{OUT}/titulo1_thumb1.jpg", quality=92)
# 2: título 2 (Helgoland) → a esquadra francesa diante de Helgoland, 1870 (pintura de época) + "NUR ZUSCHAUEN?"
texto(base(f"{T}/helgoland.jpg", (0.6, 0.5), escuro=0.6, sat=0.8), [("VIER", 150, LAR), ("WOCHEN", 150, LAR), ("NUR GEWARTET?", 84, BRA)]).save(f"{OUT}/titulo2_thumb2.jpg", quality=92)
# 3: título 3 (Kohle und Wattenmeer) → couraçado no temporal + "KOHLE LEER"
texto(base(f"{T}/sturm.jpg", (0.55, 0.5), escuro=0.6, sat=0.8), [("KOHLE", 170, LAR), ("LEER", 170, BRA), ("IN 5–8 TAGEN", 80, BRA)]).save(f"{OUT}/titulo3_thumb3.jpg", quality=92)
print("OK")
