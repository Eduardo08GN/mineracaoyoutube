# K17: 3 miniaturas do A/B (par fixo título↔miniatura), a partir de quadros do render (out/final/q_*.png), no design system
# creme. Lição do K16: o objeto do título na imagem + 2–4 palavras que ACRESCENTAM ao título; contraste forte para o feed.
from PIL import Image, ImageDraw, ImageEnhance, ImageFont
Q = r"D:/kriegschronik/k17_pioniere/out/final/"; OUT = r"D:/kriegschronik/k17_pioniere/entrega/"
FB = r"D:/kriegschronik/tracer3d_15_emser/v1/public/fonts/BarlowCondensed-Bold.ttf"
W, H = 1280, 720
TINTA, ROT, PAPIER = (29, 26, 23), (164, 52, 30), (244, 238, 226)

def base(nome, caixa, contraste=1.35):
    im = Image.open(Q + nome).convert("RGB"); w, h = im.size; x0, y0, x1, y1 = caixa
    im = im.crop((round(x0 * w), round(y0 * h), round(x1 * w), round(y1 * h))).resize((W, H), Image.LANCZOS)
    im = ImageEnhance.Contrast(im).enhance(contraste); im = ImageEnhance.Color(im).enhance(1.25)
    # vinheta escura nas bordas: o papel creme some no feed sem ela
    v = Image.radial_gradient("L").resize((W, H)).point(lambda p: int(min(255, p * 1.1)))
    return Image.composite(Image.new("RGB", (W, H), (60, 44, 30)), im, v.point(lambda p: int(p * 0.55)))

def texto(im, linhas, x=60, y=60):
    d = ImageDraw.Draw(im)
    for txt, tam, cor in linhas:
        f = ImageFont.truetype(FB, tam)
        d.text((x, y), txt, font=f, fill=cor, stroke_width=max(3, tam // 18), stroke_fill=PAPIER)
        y += int(tam * 1.02)
    return im

texto(base("q_07_03.png", (0.25, 0.3, 0.75, 0.82), 1.5), [("DAS PULVER", 150, TINTA), ("FUHR WEG", 150, ROT)], 60, 40).save(OUT + "titulo1_thumb1.jpg", quality=92)
texto(base("q_05_04.png", (0.15, 0.15, 0.85, 0.75)), [("3 MIN", 170, ROT), ("PRO PONTON", 110, TINTA)], 60, 40).save(OUT + "titulo2_thumb2.jpg", quality=92)
texto(base("q_07_11.png", (0.2, 0.15, 0.8, 0.85)), [("11 UHR:", 150, TINTA), ("SEDAN ZU", 150, ROT)], 60, 40).save(OUT + "titulo3_thumb3.jpg", quality=92)
fs = [Image.open(OUT + f"titulo{i}_thumb{i}.jpg") for i in (1, 2, 3)]
fo = Image.new("RGB", (1920, 360)); [fo.paste(f.resize((640, 360)), (640 * i, 0)) for i, f in enumerate(fs)]; fo.save(OUT + "folha_miniaturas_k17.jpg", quality=88)
print("ok")
