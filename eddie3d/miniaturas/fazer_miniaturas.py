"""Miniaturas 1280x720 dos videos do What If ES a partir de quadros do video final.
Recorte com zoom (tira a faixa das legendas gravadas), contraste/saturacao, gradiente escuro do lado do texto (cobre o painel),
titulo curto em Anton (SIL OFL) com contorno e sombra; uma linha em amarelo."""
import os
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

AQUI = os.path.dirname(os.path.abspath(__file__))
FONTE = r"D:\whatif_es\06_spun_slower\v1\public\madrid\fontes\Anton-Regular.ttf"
W, H = 1280, 720
AMARELO, BRANCO = (255, 210, 63), (255, 255, 255)

# arquivo, zoom, foco (0..1), lado do texto, linhas [(texto, cor)], tamanho
MINIS = {
    'v1': ('fr/v1_344.png', 1.2, (0.55, 0.42), 'esq', [('DÍAS DE', BRANCO), ('2 MINUTOS', AMARELO)], 150),
    'v2': ('fr/v2_184.png', 1.15, (0.52, 0.44), 'dir', [('MÁS CALIENTE', BRANCO), ('QUE EL SOL', AMARELO)], 128),
    'v3': ('fr/v3_326.png', 1.1, (0.56, 0.5), 'esq', [('LA TIERRA', BRANCO), ('SE DERRITE', AMARELO)], 140),
    'v4': ('fr/v4_3.95.png', 1.05, (0.5, 0.55), 'topo', [('TE VUELVES UN', BRANCO), ('AGUJERO NEGRO', AMARELO)], 118),
    'v5': ('fr/v5_466.png', 1.4, (0.5, 0.55), 'topo', [('TODO EL UNIVERSO', BRANCO), ('EN 9 MINUTOS', AMARELO)], 112),
    'v6': ('fr/v6_96.3.png', 1.1, (0.56, 0.42), 'esq', [('EL MAR', BRANCO), ('LLEGA A MADRID', AMARELO)], 124),
}


def recorte(im, z, foco):
    cw, ch = im.width / z, im.height / z
    x0 = min(max(foco[0] * im.width - cw / 2, 0), im.width - cw)
    y0 = min(max(foco[1] * im.height - ch / 2, 0), im.height - ch)
    return im.crop((round(x0), round(y0), round(x0 + cw), round(y0 + ch))).resize((W, H), Image.LANCZOS)


def gradiente(lado):
    g = Image.new('L', (W, H), 0)
    px = g.load()
    for y in range(H):
        for x in range(W):
            if lado == 'esq': a = max(0.0, 1 - x / (W * 0.62)) ** 1.4 * 0.85 + max(0.0, 1 - y / (H * 0.5)) * 0.25
            elif lado == 'dir': a = max(0.0, (x - W * 0.38) / (W * 0.62)) ** 1.4 * 0.85 + max(0.0, 1 - y / (H * 0.55)) * 0.45 * max(0.0, 1 - x / (W * 0.6))
            else: a = max(0.0, 1 - y / (H * 0.55)) ** 1.3 * 0.85
            px[x, y] = int(255 * min(1.0, a))
    return g


def texto(base, lado, linhas, tam):
    d = ImageDraw.Draw(base)
    f = ImageFont.truetype(FONTE, tam)
    alt = [d.textbbox((0, 0), t, font=f) for t, _ in linhas]
    larg = [b[2] - b[0] for b in alt]
    passo = int(tam * 1.08)
    y = 70 if lado == 'topo' else int(H * 0.5 - passo * len(linhas) / 2) - 20
    for (t, cor), lw in zip(linhas, larg):
        if lado == 'esq': x = 60
        elif lado == 'dir': x = W - 60 - lw
        else: x = (W - lw) // 2
        sombra = Image.new('RGBA', base.size, (0, 0, 0, 0))
        ImageDraw.Draw(sombra).text((x + 6, y + 8), t, font=f, fill=(0, 0, 0, 200))
        base.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(8)))
        d.text((x, y), t, font=f, fill=cor, stroke_width=max(4, tam // 22), stroke_fill=(0, 0, 0))
        y += passo


# areas do quadro original (1920x1080) com texto gravado: painel a esquerda, painel a direita (video 5), faixa das legendas
HUD_ESQ, HUD_DIR, LEGENDA = (30, 30, 860, 420), (1120, 30, 1900, 360), (240, 930, 1680, 1070)
BORRAR = {'v1': [HUD_ESQ, LEGENDA], 'v2': [HUD_ESQ, LEGENDA], 'v3': [HUD_ESQ, LEGENDA], 'v4': [LEGENDA],
          'v5': [HUD_ESQ, HUD_DIR, LEGENDA], 'v6': [HUD_ESQ, LEGENDA]}


def borra(im, caixas):
    """Apaga texto gravado: troca a caixa pelo proprio quadro muito desfocado, com borda suave."""
    borrado = im.filter(ImageFilter.GaussianBlur(45))
    m = Image.new('L', im.size, 0)
    d = ImageDraw.Draw(m)
    for c in caixas: d.rectangle(c, fill=255)
    return Image.composite(borrado, im, m.filter(ImageFilter.GaussianBlur(30)))


def fazer(nome, arq, z, foco, lado, linhas, tam):
    im = Image.open(os.path.join(AQUI, arq)).convert('RGB')
    im = borra(im, BORRAR.get(nome, []))
    im = recorte(im, z, foco)
    im = ImageEnhance.Contrast(im).enhance(1.12)
    im = ImageEnhance.Color(im).enhance(1.18)
    base = im.convert('RGBA')
    escuro = Image.new('RGBA', (W, H), (4, 6, 12, 255))
    base = Image.composite(escuro, base, gradiente(lado)).convert('RGBA')
    texto(base, lado, linhas, tam)
    saida = os.path.join(AQUI, f'miniatura_{nome}.jpg')
    base.convert('RGB').save(saida, quality=92)
    return saida


if __name__ == '__main__':
    for k, v in MINIS.items():
        print(fazer(k, *v))
