"""Folha lado a lado do batedor de estilo: referências (No Air, reel) + rota (a) IA + rota (b) three.js, com HUD/legenda
desenhados em código (simula o Remotion). Uso: python -I folha_estilo.py SAIDA.jpg"""
import sys, subprocess, io
from PIL import Image, ImageDraw, ImageFont
B = "D:/pesquisa_nichos/acidentes_fb"
W, H = 540, 960
F = "C:/Windows/Fonts/"
mono = lambda s: ImageFont.truetype(F + "consola.ttf", s); monob = lambda s: ImageFont.truetype(F + "consolab.ttf", s)
serif = lambda s: ImageFont.truetype(F + "georgia.ttf", s); serifb = lambda s: ImageFont.truetype(F + "georgiab.ttf", s)
ACC = (255, 196, 75)
HUD = {
 "k1": ("TIEMPO BAJO TIERRA", "00:00:12", "Entró a las *4 de la tarde*. Dijo que volvía en dos horas."),
 "k2": ("PROFUNDIDAD", "-38 m", "El paso mide *40 cm*. Menos que una maleta."),
 "k3": ("NIVEL DEL AGUA", "+1,2 m/h", "La lluvia de afuera *sube el agua* de adentro."),
 "k4": ("AIRE RESPIRABLE", "O2 15,8 %", "Llevaba *9 días* a oscuras cuando vio luces."),
}
def quadro(video, t):
    r = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(t), "-i", video, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"], capture_output=True)
    return Image.open(io.BytesIO(r.stdout)).convert("RGB")
def caber(im):
    im = im.copy(); r = max(W / im.width, H / im.height); im = im.resize((round(im.width * r), round(im.height * r)), Image.LANCZOS)
    x, y = (im.width - W) // 2, (im.height - H) // 2; return im.crop((x, y, x + W, y + H))
def hud(im, k):
    lab, num, cap = HUD[k]; d = ImageDraw.Draw(im, "RGBA"); s = W / 1080
    x0, y0 = int(80 * s), int(290 * s)
    d.text((x0, y0), " ".join(lab), font=mono(int(26 * s)), fill=(230, 230, 235, 230))
    d.text((x0, y0 + int(38 * s)), num, font=monob(int(92 * s)), fill=(255, 255, 255, 255))
    # legenda serifada, palavra entre * no destaque, centralizada, no terço de baixo da zona segura
    fs = serif(int(52 * s)); fb = serifb(int(52 * s)); linhas, cur, larg = [], [], int(860 * s)
    for w in cap.split(" "):
        tst = " ".join(c[0] for c in cur + [(w, 0)]).replace("*", "")
        if d.textlength(tst, font=fs) > larg and cur: linhas.append(cur); cur = []
        cur.append((w, 0))
    linhas.append(cur); y = int(1020 * s); dest = False
    for ln in linhas:
        pal = [w for w, _ in ln]; tot = d.textlength(" ".join(pal).replace("*", ""), font=fs); x = (W - tot) / 2
        for w in pal:
            if w.startswith("*"): dest = True
            limpo = w.replace("*", ""); f = fb if dest else fs
            for dx, dy in ((2, 2), (0, 2), (2, 0)): d.text((x + dx, y + dy), limpo, font=f, fill=(0, 0, 0, 170))
            d.text((x, y), limpo, font=f, fill=ACC if dest else (250, 250, 250))
            x += d.textlength(limpo + " ", font=fs)
            if w.endswith("*") or w.rstrip(".,").endswith("*"): dest = False
        y += int(66 * s)
    d.text((x0, int(1210 * s)), "HIPOTÉTICO · BATEDOR DE ESTILO", font=mono(int(20 * s)), fill=(200, 200, 205, 160))
    return im
def rotulo(im, txt):
    d = ImageDraw.Draw(im, "RGBA"); d.rectangle((0, 0, W, 34), fill=(0, 0, 0, 200)); d.text((10, 6), txt, font=monob(20), fill=(255, 255, 255)); return im
cel = []
cel.append(rotulo(caber(quadro(f"{B}/ref_noair/noair.mp4", 4.0)), "REF No Air (Scenario) 4 s"))
cel.append(rotulo(caber(quadro(f"{B}/ref_noair/noair.mp4", 16.0)), "REF No Air 16 s"))
cel.append(rotulo(caber(quadro(f"{B}/fb/r2.mp4", 20.0)), "REF reel Toonverso r2 20 s"))
cel.append(rotulo(caber(quadro(f"{B}/fb/r4.mp4", 45.0)), "REF reel Toonverso r4 45 s"))
for k in ("k1", "k2", "k3", "k4"):
    cel.append(rotulo(hud(caber(Image.open(f"{B}/batedor/a_ia/img/{k}.png").convert("RGB")), k), f"(a) IA Qwen {k}"))
nb = {"k1": "k1_entrada", "k2": "k2_passagem", "k3": "k3_corte", "k4": "k4_resgate"}
for k in ("k1", "k2", "k3", "k4"):
    cel.append(rotulo(hud(caber(Image.open(f"{B}/batedor/b_threejs/final/{nb[k]}.png").convert("RGB")), k), f"(b) three.js {k}"))
G = 8; folha = Image.new("RGB", (4 * W + 5 * G, 3 * H + 4 * G), (18, 18, 22))
for i, c in enumerate(cel): folha.paste(c, (G + (i % 4) * (W + G), G + (i // 4) * (H + G)))
folha.save(sys.argv[1], quality=88); print("ok", folha.size)
