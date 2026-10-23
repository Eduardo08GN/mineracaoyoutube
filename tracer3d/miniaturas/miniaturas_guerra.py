# Miniaturas dos canais de guerra (Tracer3D, KriegsChronik) — padrao fixado em 23/10/2026: SEMPRE 3 variantes para o
# Teste A/B do YouTube (o vencedor e escolhido pelo tempo de exibicao):
#   A  dado/simulacao: quadro forte do proprio video (ex.: arco sobre a Terra curva) + inset do momento-heroi + numero grande
#   B  rosto: retrato fotorrealista de uma pessoa FICTICIA da epoca, susto expressivo, olhando para a ameaca; rosto de um lado,
#      pergunta-gancho curta do outro (ex.: "KEIN FLUGZEUG?")
#   C  hibrida: o mesmo tipo de rosto + o numero-chave do video (ex.: "42 KM HOCH")
# Rostos: Flow / Nano Banana (16:9, x4, "no text, no flags, no insignia, no logos"); nunca figura historica real nem simbolos.
# Fonte Anton (SIL OFL), amarelo #F2C14E para o numero, branco papel, vermelho #D9483B para a linha menor; contorno + sombra.
#   python miniaturas_guerra.py <pasta_saida> --a quadro.png [--inset momento.png] --b rosto_dir.jpg --c rosto_esq.jpg \
#       --num "42 KM" --num2 "HOCH" --gancho "KEIN" --gancho2 "FLUGZEUG?" --linha "PARIS 1918" --vermelho "KRUPPS KANONE"
import argparse, os
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

FONTE = os.environ.get("FONTE_ANTON", r"D:\whatif_es\06_spun_slower\v1\public\madrid\fontes\Anton-Regular.ttf")
AMARELO, BRANCO, VERMELHO = (242, 193, 78), (240, 236, 226), (217, 72, 59)
W, H = 1280, 720


def base(arq):
    im = Image.open(arq).convert("RGB")
    s = max(W / im.width, H / im.height); im = im.resize((round(im.width * s), round(im.height * s)))
    x, y = (im.width - W) // 2, (im.height - H) // 2
    im = im.crop((x, y, x + W, y + H))
    return ImageEnhance.Contrast(ImageEnhance.Color(im).enhance(1.12)).enhance(1.08)


def escurecer(im, lado):                       # gradiente escuro do lado do texto
    g = Image.new("L", (W, H)); d = ImageDraw.Draw(g)
    for x in range(W):
        v = 170 - (x if lado == "esq" else W - 1 - x) * 0.33
        d.line([(x, 0), (x, H)], fill=int(max(0, v)))
    return Image.composite(Image.new("RGB", (W, H), (5, 7, 12)), im, g)


def texto(d, s, tam, cor, y, lado, margem=44):
    f = ImageFont.truetype(FONTE, tam); x = margem if lado == "esq" else W - margem - d.textlength(s, font=f)
    d.text((x + 4, y + 5), s, font=f, fill=(0, 0, 0)); d.text((x, y), s, font=f, fill=cor, stroke_width=3, stroke_fill=(10, 10, 10))


def bloco(im, lado, l1, l2, l3, l4, cor1=AMARELO, cor2=BRANCO):
    d = ImageDraw.Draw(im)
    if l1: texto(d, l1, 170, cor1, 40, lado)
    if l2: texto(d, l2, 120 if cor2 == BRANCO else 150, cor2, 235 if cor2 == BRANCO else 205, lado)
    if l3: texto(d, l3, 64, BRANCO, 410, lado)
    if l4: texto(d, l4, 48, VERMELHO, 495, lado)
    return im


if __name__ == "__main__":
    a = argparse.ArgumentParser()
    a.add_argument("saida"); a.add_argument("--a"); a.add_argument("--inset"); a.add_argument("--b"); a.add_argument("--c")
    a.add_argument("--num"); a.add_argument("--num2"); a.add_argument("--gancho"); a.add_argument("--gancho2")
    a.add_argument("--linha"); a.add_argument("--vermelho")
    o = a.parse_args(); os.makedirs(o.saida, exist_ok=True)
    feitas = []
    if o.a:
        im = escurecer(base(o.a), "esq")
        if o.inset:
            ins = base(o.inset).resize((560, 315))
            m = Image.new("L", ins.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, 559, 314), 18, fill=255)
            fr = Image.new("L", (568, 323), 0); ImageDraw.Draw(fr).rounded_rectangle((0, 0, 567, 322), 20, fill=255)
            im.paste(Image.new("RGB", (568, 323), AMARELO), (690, 360), fr); im.paste(ins, (694, 364), m)
        bloco(im, "esq", o.num, o.num2, o.linha, o.vermelho).save(os.path.join(o.saida, "miniatura_A.jpg"), quality=92); feitas.append("A")
    if o.b:
        im = escurecer(base(o.b), "esq")
        bloco(im, "esq", o.gancho, o.gancho2, o.linha, o.vermelho, cor1=BRANCO, cor2=AMARELO).save(os.path.join(o.saida, "miniatura_B.jpg"), quality=92); feitas.append("B")
    if o.c:
        im = escurecer(base(o.c), "dir")
        bloco(im, "dir", o.num, o.num2, None, o.vermelho).save(os.path.join(o.saida, "miniatura_C.jpg"), quality=92); feitas.append("C")
    print("miniaturas:", ", ".join(feitas), "->", o.saida)
