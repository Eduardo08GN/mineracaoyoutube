# B-roll de ACAO tirado de videos de terceiros, dentro da regra combinada (agente/estudio.py REGRAS_TERCEIROS):
#   trecho de ate' 8 s · no maximo 10% de cada video de origem · sem rosto · sem legenda/texto queimado · sem o audio.
# E so' entra trecho com acao do SUJEITO (fluxo optico com o movimento de camera descontado), que e' o que faltava
# no nosso b-roll (docs/divergencias-edicao-fatia01.md, item 1).
#   python work/video/broll_terceiros.py buscar     -> baixa as fontes: YouTube, Rutube e Bilibili (TERC_FONTES=... filtra)
#   python work/video/broll_terceiros.py recortar   -> corta os trechos aprovados + folha de contato
import json, os, re, subprocess, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
PASTA = os.environ.get("TERC_PASTA") or os.path.join(AQUI, "fatia01", "terceiros")
SRC, CLIPS = os.path.join(PASTA, "src"), os.path.join(PASTA, "clips")
REGRA = {"max_s_trecho": 8.0, "max_fracao_por_fonte": 0.10}
# ⛔ (09/10) b-roll SEMPRE com acao: 1% deixou passar vaso de lavanda parado (1,55%); 3% e' o minimo
ACAO_MIN = 3.0
MIN_S, ALVO_S = 3.0, 5.0
BUSCAS = ["Basilikum aus dem Supermarkt teilen umtopfen", "Basilikum vermehren teilen Wurzelballen",
          "Kräuter im Topf richtig gießen", "Kräuter umtopfen Anleitung Tontopf",
          "supermarket basil divide repot", "how to water potted herbs", "Petersilie schießt Blüte",
          "Kräutergarten Hochbeet Kräuter ernten"]
POR_BUSCA, DUR_MIN, DUR_MAX = 3, 60, 1800
# cookies da sessao do YouTube autorizada (perfil 12 Ivone), exportados por work/cookies_dolphin.py para a pasta temporaria
COOKIES = os.environ.get("YT_COOKIES", "")


def sh(*a, **k):
    return subprocess.run(list(a), capture_output=True, text=True, encoding="utf-8", errors="replace", **k)


# ⭐ o video completo: cada busca tem uma ETIQUETA (a erva ou o assunto) que vai junto com cada trecho aprovado;
#    a montagem casa a etiqueta com a frase que fala daquela erva
BUSCAS_COMPLETO = [
    ("petersilie", "Petersilie säen pflegen ernten"), ("petersilie", "parsley sowing harvesting garden"),
    ("basilikum", "Basilikum pflanzen ernten"), ("dill", "Dill aussäen ernten"), ("dill", "growing dill seeds garden"),
    ("schnittlauch", "Schnittlauch teilen ernten"), ("minze", "Minze im Kübel pflanzen"), ("minze", "mint rhizome pot planting"),
    ("liebstoeckl", "Liebstöckl pflanzen teilen"), ("thymian", "Thymian Stecklinge vermehren"), ("thymian", "thyme cuttings propagation"),
    ("salbei", "Salbei schneiden pflegen"), ("oregano", "Oregano pflanzen ernten"), ("lorbeer", "Lorbeer im Kübel überwintern"),
    ("koriander", "Koriander säen ernten Samen"), ("melisse", "Zitronenmelisse pflanzen ernten"),
    ("mittelmeer", "Kräuter Mittelmeer wild Hang Thymian Lavendel"), ("erde", "Kräutererde mischen Sand Drainage Topf"),
    ("kompost", "Kompost ausbringen Garten Hände"), ("saat", "Kräuter Aussaat Anzucht Samen"),
    ("trocknen", "Kräuter trocknen bündeln aufhängen"), ("tee", "Kräutertee frisch aufbrühen"),
    ("kloster", "Klostergarten Kräuter Mönch Garten"), ("garten", "Kräutergarten Hochbeet bepflanzen"),
    ("markt", "Kräuter Töpfe Gartencenter kaufen"), ("labor", "ätherische Öle Destillation Kräuter"),
]


# ⭐⭐ (Eduardo, 09/10) FONTES: alem do YouTube, o Rutube (o "YouTube russo") e o Bilibili (China). Material que o
#    publico alemao nunca viu, com a mesma regra (<=8 s, <=10% da fonte, sem rosto, sem texto — o OCR le chines/cirilico
#    queimado na imagem —, sem audio). A busca vai na lingua de cada plataforma (ru/zh); o id da fonte leva o prefixo da
#    plataforma (rt_..., bb_...) para nunca colidir com um id do YouTube.
# ⛔ nunca acima de 720p: baixa so' o video (o audio de terceiros nao entra mesmo), na maior resolucao <= 720p.
FONTES = ("youtube", "rutube", "bilibili")
FORMATO_720 = "bv*[height<=720][vcodec^=avc]/bv*[height<=720]/b[height<=720]"
BUSCAS_RU = {"petersilie": "петрушка посев уход урожай", "basilikum": "базилик выращивание обрезка",
             "dill": "укроп посев выращивание", "schnittlauch": "шнитт лук деление посадка", "minze": "мята посадка в горшок",
             "liebstoeckl": "любисток выращивание", "thymian": "тимьян черенкование посадка", "salbei": "шалфей обрезка уход",
             "oregano": "душица орегано выращивание", "lorbeer": "лавр в кадке уход", "koriander": "кинза кориандр посев",
             "melisse": "мелисса посадка урожай", "erde": "грунт для трав песок дренаж горшок", "kompost": "компост внесение руками огород",
             "saat": "посев семян трав рассада", "trocknen": "сушка трав пучки", "tee": "травяной чай заварка свежие травы",
             "garten": "огород травы грядка посадка", "kloster": "монастырский сад травы"}
BUSCAS_ZH = {"petersilie": "欧芹 种植 采收", "basilikum": "罗勒 种植 修剪", "dill": "莳萝 播种 种植", "schnittlauch": "细香葱 分株 种植",
             "minze": "薄荷 盆栽 种植", "thymian": "百里香 扦插 种植", "salbei": "鼠尾草 修剪 种植", "oregano": "牛至 种植",
             "lorbeer": "月桂 盆栽", "koriander": "香菜 播种 种植", "melisse": "柠檬香蜂草 种植", "erde": "盆栽 配土 沙子 排水",
             "kompost": "堆肥 施肥 菜园", "saat": "香草 播种 育苗", "trocknen": "晾晒 香草 草药", "tee": "花草茶 冲泡",
             "garten": "菜园 香草 种植 农活"}


def candidatos(fonte, q, n=12):
    """[(id_local, url, duracao, titulo, canal)] de uma busca numa plataforma."""
    if fonte == "youtube":
        r = sh("yt-dlp", "--flat-playlist", "-J", f"ytsearch{n}:{q}")
        try: ents = json.loads(r.stdout)["entries"]
        except Exception: return []                                                      # noqa: BLE001
        return [(e["id"], f"https://www.youtube.com/watch?v={e['id']}", e.get("duration") or 0, e.get("title"),
                 e.get("channel") or e.get("uploader")) for e in ents if e.get("id")]
    if fonte == "rutube":                       # a API publica de busca do Rutube (o yt-dlp nao busca no Rutube)
        import urllib.parse, urllib.request
        url = "https://rutube.ru/api/search/video/?query=" + urllib.parse.quote(q)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0", "Accept": "application/json"})
        try: rs = json.load(urllib.request.urlopen(req, timeout=30)).get("results", [])
        except Exception as e: print("  rutube: busca falhou", str(e)[:80]); return []                # noqa: BLE001
        return [("rt_" + x["id"], x["video_url"], x.get("duration") or 0, x.get("title"), (x.get("author") or {}).get("name"))
                for x in rs[:n] if not (x.get("is_paid") or x.get("is_adult") or x.get("is_livestream") or x.get("is_hidden"))]
    if fonte == "bilibili":                     # a busca plana do Bilibili nao traz duracao: le os metadados de cada um
        import time
        ents = []
        for tent in range(4):                   # ⛔ o Bilibili barra busca seguida (HTTP 412, antirrobo): espera e tenta de novo
            r = sh("yt-dlp", "--flat-playlist", "-J", f"bilisearch{n}:{q}")
            try: ents = [e for e in json.loads(r.stdout)["entries"] if e]
            except Exception: ents = []                                                  # noqa: BLE001
            if ents: break
            time.sleep(25 * (tent + 1))
        out = []
        for e in ents:
            if not e or not e.get("url"): continue
            time.sleep(2)
            m = sh("yt-dlp", "-J", "--skip-download", "--no-playlist", e["url"])
            try: d = json.loads(m.stdout)
            except Exception: continue                                                   # noqa: BLE001
            if not d: continue                                                           # removido / fora da regiao
            out.append(("bb_" + str(d.get("id") or e.get("id")), e["url"], d.get("duration") or 0,
                        d.get("title") or d.get("fulltitle") or " ".join(d.get("tags") or []), d.get("uploader")))
        return out
    raise ValueError(fonte)


def baixar_fonte(fonte, url, alvo, dur=0):
    """⭐ (09/10, velocidade) video longo (> 7 min): baixa so' de 1:00 a 6:00 — usamos no maximo 10% da fonte e o recorte
    ja' pula abertura e encerramento; o servidor do Bilibili chega a 100 KB/s."""
    cookies = os.environ.get("YT_COOKIES") or COOKIES
    extra = (["--cookies", cookies] if cookies else []) + ["--js-runtimes", "node", "--remote-components", "ejs:github"]         if fonte == "youtube" else []
    # ⛔ no Rutube (HLS) o recorte por trecho trava no ffmpeg (18 min parado num trecho de 5): la' baixa inteiro (~2 min)
    if dur > 420 and fonte != "rutube": extra += ["--download-sections", "*60-360"]
    return sh("yt-dlp", *extra, "-f", FORMATO_720, "-S", "res:720", "--remux-video", "mp4", "-o", alvo, "--no-playlist", url,
              timeout=600)


def buscar(fontes=None):
    os.makedirs(SRC, exist_ok=True)
    fontes = fontes or [f.strip() for f in os.environ.get("TERC_FONTES", ",".join(FONTES)).split(",") if f.strip()]
    vistos = set()
    if os.environ.get("TERC_COMPLETO"):
        buscas = [("youtube", t, q) for t, q in BUSCAS_COMPLETO] + [("rutube", t, q) for t, q in BUSCAS_RU.items()]             + [("bilibili", t, q) for t, q in BUSCAS_ZH.items()]
    else:
        buscas = [("youtube", "", q) for q in BUSCAS]
    for fonte, tag, q in buscas:
        if fonte not in fontes: continue
        n = 0
        for vid, url, d, titulo, canal in candidatos(fonte, q):
            if vid in vistos or not (DUR_MIN <= d <= DUR_MAX): continue
            vistos.add(vid)
            alvo = os.path.join(SRC, vid + ".mp4")
            if not os.path.exists(alvo):
                try: r2 = baixar_fonte(fonte, url, alvo)
                except subprocess.TimeoutExpired: print("  demorou demais:", vid); continue
                if not os.path.exists(alvo): print("  nao baixou", vid, (r2.stderr or "")[-160:]); continue
            json.dump({"id": vid, "fonte": fonte, "url": url, "titulo": titulo, "canal": canal, "dur": d, "busca": q, "tag": tag},
                      open(os.path.join(SRC, vid + ".json"), "w", encoding="utf-8"), ensure_ascii=False)
            print(f"  [{fonte}] {vid} {d:>5}s  {(titulo or '')[:60]}", flush=True)
            n += 1
            if n >= POR_BUSCA: break


def dur(a):
    return float(sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", a).stdout or 0)


def cortes(arq):
    r = sh("ffmpeg", "-hide_banner", "-i", arq, "-vf", "select='gt(scene,0.3)',metadata=print", "-an", "-f", "null", "-")
    return [float(x) for x in re.findall(r"pts_time:([0-9.]+)", r.stdout + r.stderr)]


def quadro(arq, t, w=640):
    import numpy as np
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", arq, "-frames:v", "1", "-vf", f"scale={w}:-2",
                          "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True).stdout
    h = len(raw) // (w * 3)
    return np.frombuffer(raw, np.uint8).reshape(h, w, 3) if h else None


_HAAR, _OCR = [], []


# ⭐ (09/10) YuNet (rede do OpenCV, cv2.FaceDetectorYN) no lugar do Haar: no teste da OpenCV achou 37 rostos onde o Haar
#    achou 7, e pega perfil e rosto parcial — o Haar deixou passar 11 rostos no banco do video do Klostergarten.
#    O modelo (~230 KB) fica em work/video/modelos/; sem ele, cai no Haar de antes (e avisa uma vez).
YUNET = os.path.join(AQUI, "modelos", "face_detection_yunet_2023mar.onnx")
_YUNET = []


def tem_rosto(img, limiar=0.6):
    import cv2
    if os.path.exists(YUNET):
        h, w = img.shape[:2]
        if not _YUNET: _YUNET.append(cv2.FaceDetectorYN.create(YUNET, "", (w, h), limiar, 0.3, 5000))
        det = _YUNET[0]; det.setInputSize((w, h))
        _, faces = det.detect(img)
        # rosto pequeno demais (multidao ao fundo, < 2,5% da altura) nao conta
        return faces is not None and any(f[3] >= 0.025 * h for f in faces)
    if not _HAAR:
        print("  ⚠ sem o modelo YuNet em", YUNET, "- usando o Haar (deixa passar perfil)", flush=True)
        _HAAR.extend(cv2.CascadeClassifier(cv2.data.haarcascades + x) for x in
                     ("haarcascade_frontalface_default.xml", "haarcascade_profileface.xml"))
    g = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    return any(len(c.detectMultiScale(g, 1.1, 6, minSize=(40, 40))) for c in _HAAR)


def tem_texto(img):
    if not _OCR:
        from rapidocr_onnxruntime import RapidOCR
        _OCR.append(RapidOCR())
    r, _ = _OCR[0](img)
    h, w = img.shape[:2]
    for pts, txt, conf in (r or []):
        xs = [p[0] for p in pts]; ys = [p[1] for p in pts]
        if float(conf) > 0.6 and len(txt.strip()) >= 3 and (max(xs) - min(xs)) * (max(ys) - min(ys)) > 0.002 * w * h:
            return True
    return False


def acao(arq, a, b, fps=8):
    """% da imagem com movimento proprio (camera descontada), media do trecho."""
    import numpy as np, cv2
    w, h = 320, 180
    raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{a:.2f}", "-t", f"{b - a:.2f}", "-i", arq,
                          "-vf", f"fps={fps},scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
    G = np.frombuffer(raw, np.uint8).reshape(-1, h, w)
    v = []
    for x, y in zip(G[:-1], G[1:]):
        p0 = cv2.goodFeaturesToTrack(x, 300, 0.01, 6)
        if p0 is None: continue
        p1, st, _ = cv2.calcOpticalFlowPyrLK(x, y, p0, None)
        ok = st.ravel() == 1
        if ok.sum() < 10: continue
        M = cv2.estimateAffinePartial2D(p0[ok], p1[ok])[0]
        if M is None: continue
        r = np.abs(cv2.warpAffine(x, M, (w, h), borderMode=cv2.BORDER_REPLICATE).astype(int) - y)[8:-8, 8:-8]
        v.append(float((r > 18).mean() * 100))
    return round(float(np.mean(v)), 2) if v else 0.0


def _recortar_fonte(f):
    """Os trechos aprovados de UMA fonte (roda num processo a parte: o recorte e' o gargalo de CPU da etapa)."""
    arq = os.path.join(SRC, f); vid = f[:-4]
    total = dur(arq)
    if total <= 0: return vid, [], "sem duracao"
    teto = REGRA["max_fracao_por_fonte"] * total
    cs = [0.0] + cortes(arq) + [total]
    tomadas = [(a, b) for a, b in zip(cs[:-1], cs[1:]) if b - a >= MIN_S and a > 8 and b < total - 8]  # sem abertura/encerramento
    cand = []
    for a, b in tomadas:
        m = (a + b) / 2; x0 = max(a + .2, m - ALVO_S / 2); x1 = min(b - .2, x0 + min(ALVO_S, REGRA["max_s_trecho"]))
        if x1 - x0 < MIN_S: continue
        imgs = [quadro(arq, t) for t in (x0 + .3, (x0 + x1) / 2, x1 - .3)]
        if any(i is None for i in imgs): continue
        if any(tem_rosto(i) for i in imgs): continue
        if any(tem_texto(i) for i in imgs): continue
        ac = acao(arq, x0, x1)
        if ac < ACAO_MIN: continue
        cand.append((ac, x0, x1))
    try: tag = json.load(open(os.path.join(SRC, vid + ".json"), encoding="utf-8")).get("tag", "")
    except Exception: tag = ""                                                      # noqa: BLE001
    usado, saidas = 0.0, []
    for ac, x0, x1 in sorted(cand, reverse=True):
        if usado + (x1 - x0) > teto: continue
        usado += x1 - x0
        saida = os.path.join(CLIPS, f"{vid}_{int(x0)}.mp4")
        sh("ffmpeg", "-v", "error", "-y", "-ss", f"{x0:.2f}", "-t", f"{x1 - x0:.2f}", "-i", arq, "-an",
           "-vf", "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30", "-c:v", "libx264", "-preset", "veryfast",
           "-crf", "17", saida)                                      # ⛔ (09/10) nada acima de 720p
        saidas.append({"clipe": os.path.basename(saida), "fonte": vid, "ini": round(x0, 2), "dur": round(x1 - x0, 2), "acao": ac, "tag": tag})
    return vid, saidas, f"{len(tomadas)} tomadas, {len(cand)} aprovadas, usei {usado:.0f}s de {teto:.0f}s permitidos"


def recortar(processos=3):
    """⭐ (09/10) incremental (os trechos ja' aprovados e revisados ficam; so' as fontes novas sao cortadas) e em
    paralelo (3 fontes ao mesmo tempo)."""
    os.makedirs(CLIPS, exist_ok=True)
    arq_ap = os.path.join(PASTA, "aprovados.json")
    aprovados = [c for c in (json.load(open(arq_ap, encoding="utf-8")) if os.path.exists(arq_ap) else [])
                 if os.path.exists(os.path.join(CLIPS, c["clipe"]))]
    feitos = {c["fonte"] for c in aprovados}
    novas = [f for f in sorted(os.listdir(SRC)) if f.endswith(".mp4") and f[:-4] not in feitos]
    from concurrent.futures import ProcessPoolExecutor
    with ProcessPoolExecutor(max_workers=processos) as ex:
        for vid, saidas, msg in ex.map(_recortar_fonte, novas):
            aprovados += saidas
            print(f"  {vid}: {msg}", flush=True)
    json.dump(aprovados, open(arq_ap, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    folha(aprovados)


def folha(aprovados):
    from PIL import Image, ImageDraw
    ims = []
    for a in aprovados:
        t = os.path.join(CLIPS, a["clipe"][:-4] + ".jpg")
        sh("ffmpeg", "-v", "error", "-y", "-ss", f"{a['dur'] / 2:.2f}", "-i", os.path.join(CLIPS, a["clipe"]), "-frames:v", "1",
           "-vf", "scale=320:-2", t)
        if os.path.exists(t):
            im = Image.open(t).convert("RGB"); ImageDraw.Draw(im).text((6, 6), a["clipe"][:-4], fill="yellow"); ims.append(im)
    if not ims: return
    col = 6; S = Image.new("RGB", (320 * col, 180 * ((len(ims) + col - 1) // col)), "white")
    for i, im in enumerate(ims): S.paste(im, ((i % col) * 320, (i // col) * 180))
    S.save(os.path.join(PASTA, "folha.jpg"), quality=85); print("folha:", len(ims), "clipes")


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    buscar() if sys.argv[1] == "buscar" else recortar()
