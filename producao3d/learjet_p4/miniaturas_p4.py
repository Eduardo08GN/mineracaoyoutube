"""Miniaturas da PARTE 4 (Learjet), estilo do canal (caixas vermelhas + etiqueta preta, igual às partes 2 e 3), a partir de
quadros do render final (out/final/q_*.png, 2560x1440). Par fixo do Teste A/B: título N só com thumb N. O texto ACRESCENTA ao
título (não repete). Só composição de imagem."""
import math
from PIL import Image, ImageDraw, ImageEnhance, ImageFont
R = "D:/reconstruccion/09_learjet_p4/"; Q = R + "out/final/"; OUT = R + "entrega/"
F = "C:/Windows/Fonts/arialbd.ttf"; VERM, BRANCO, PRETO = (226, 56, 52), (255, 255, 255), (20, 20, 22)

def base(q, caixa):
    im = Image.open(Q + q).convert("RGB"); W, H = im.size; x0, y0, x1, y1 = caixa
    im = im.crop((round(x0 * W), round(y0 * H), round(x1 * W), round(y1 * H))).resize((1280, 720), Image.LANCZOS)
    return ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.2)).enhance(1.12)

def caixas(im, linhas, tam=92, lado="dir", y0=36):
    d = ImageDraw.Draw(im); f = ImageFont.truetype(F, tam); y = y0
    for t in linhas:
        l, tp, r, b = d.textbbox((0, 0), t, font=f); w, h = r - l, b - tp
        x = 1280 - 36 - w - 36 if lado == "dir" else 36
        d.rectangle((x, y, x + w + 36, y + h + 30), fill=VERM); d.text((x + 18 - l, y + 15 - tp), t, font=f, fill=BRANCO); y += h + 40

def tag(im, t):
    d = ImageDraw.Draw(im); f = ImageFont.truetype(F, 34); l, tp, r, b = d.textbbox((0, 0), t, font=f)
    d.rectangle((36, 720 - 36 - (b - tp) - 24, 36 + (r - l) + 28, 720 - 36), fill=PRETO); d.text((50 - l, 720 - 36 - (b - tp) - 12 - tp), t, font=f, fill=BRANCO)

def seta(im, de, a):
    d = ImageDraw.Draw(im); d.line([de, a], fill=VERM, width=12); ang = math.atan2(a[1] - de[1], a[0] - de[0]); L = 38
    d.polygon([a, (a[0] - L * math.cos(ang - 0.5), a[1] - L * math.sin(ang - 0.5)), (a[0] - L * math.cos(ang + 0.5), a[1] - L * math.sin(ang + 0.5))], fill=VERM)

# 1: "¿Por qué no quedó casi nada?" -> o avião quase vertical + a velocidade que responde
im = base("q_01_09.png", (0.12, 0.05, 0.88, 0.81)); caixas(im, ["1.120 KM/H", "CASI VERTICAL"], lado="esq", tam=84); tag(im, "LEARJET 60 · FLORIDA"); im.save(OUT + "titulo1_thumb1.jpg", quality=92)
# 2: "la nivelación que los datos no muestran" -> as duas altitudes lado a lado
im = base("q_07_16.png", (0.10, 0.0, 0.90, 0.75)); caixas(im, ["¿NIVELÓ?"], lado="dir", y0=470, tam=110); tag(im, "2 ALTITUDES, 1 AVIÓN"); im.save(OUT + "titulo2_thumb2.jpg", quality=92)
# 3: "La pieza que apareció a 6 km" -> a cauda e o profundor saindo
im = base("q_01_10.png", (0.30, 0.18, 1.0, 0.84)); caixas(im, ["EN 3 PEDAZOS"], lado="esq", tam=92); seta(im, (900, 200), (1090, 330)); tag(im, "RECONSTRUCCIÓN 3D"); im.save(OUT + "titulo3_thumb3.jpg", quality=92)
fs = [Image.open(OUT + f"titulo{i}_thumb{i}.jpg") for i in (1, 2, 3)]
fo = Image.new("RGB", (1920, 360)); [fo.paste(f.resize((640, 360)), (640 * i, 0)) for i, f in enumerate(fs)]; fo.save(OUT + "folha_miniaturas_p4.jpg", quality=88)
print("ok")
