"""Leitura optica a 20 fps + audio de um video baixado (v/<id>.mp4 + v/<id>.*.vtt).
Saida em a/<id>/: analise.json (planos, ritmo, movimento, paleta, loudness, fala), folha.jpg (1 quadro por plano), transcricao.txt.
  python ler20.py <id> [<id> ...]      (sem args: todos de inventario.json)"""
import glob, json, os, re, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw
AQUI = os.path.dirname(os.path.abspath(__file__)); V = os.path.join(AQUI, "v"); A = os.path.join(AQUI, "a")
FPS, W, H = 20, 96, 54


def ffprobe_dur(f):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f], capture_output=True, text=True).stdout)


def quadros(f):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", f, "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)


def hist(fr):
    q = (fr // 32).astype(np.int32)
    h = np.bincount((q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]).ravel(), minlength=512).astype(np.float32)
    return h / h.sum()


def vtt_texto(arq):
    linhas, ult = [], ""
    for l in open(arq, encoding="utf-8", errors="ignore"):
        l = re.sub(r"<[^>]+>", "", l).strip()
        if not l or "-->" in l or l.startswith(("WEBVTT", "Kind:", "Language:")) or re.match(r"^\d+$", l): continue
        if l != ult and not (linhas and l in linhas[-1]): linhas.append(l)
        ult = l
    txt = " ".join(linhas)
    return re.sub(r"\s+", " ", txt).strip()


def vtt_falas(arq):
    ivs = []
    for m in re.finditer(r"(\d+):(\d+):(\d+\.\d+) --> (\d+):(\d+):(\d+\.\d+)", open(arq, encoding="utf-8", errors="ignore").read()):
        a = int(m[1]) * 3600 + int(m[2]) * 60 + float(m[3]); b = int(m[4]) * 3600 + int(m[5]) * 60 + float(m[6])
        ivs.append((a, b))
    return ivs


def audio(f):
    r = subprocess.run(["ffmpeg", "-v", "info", "-i", f, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    I = re.findall(r"I:\s+(-?[\d.]+) LUFS", r); LRA = re.findall(r"LRA:\s+([\d.]+) LU", r)
    s = subprocess.run(["ffmpeg", "-v", "info", "-i", f, "-af", "silencedetect=n=-45dB:d=0.6", "-f", "null", "-"], capture_output=True, text=True).stderr
    sil = [(float(a), float(b)) for a, b in re.findall(r"silence_end: ([\d.]+) \| silence_duration: ([\d.]+)", s)]
    # RMS por janela de 0,5 s (16 kHz mono) para estimar a cama musical nas pausas da fala
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True)
    x = np.frombuffer(p.stdout, np.int16).astype(np.float32) / 32768
    win = 8000; n = len(x) // win
    rms = 20 * np.log10(np.sqrt((x[:n * win].reshape(n, win) ** 2).mean(1)) + 1e-9)
    return {"lufs_I": float(I[-1]) if I else None, "lra": float(LRA[-1]) if LRA else None,
            "silencios_ge_0_6s": len(sil), "silencio_total_s": round(sum(d for _, d in sil), 1)}, rms


def analisar(vid):
    f = os.path.join(V, vid + ".mp4")
    if not os.path.exists(f): print(vid, "sem mp4"); return
    out = os.path.join(A, vid); os.makedirs(out, exist_ok=True)
    dur = ffprobe_dur(f)
    prev_h = prev = None; cortes = [0.0]; mov = []; brilho = []; sat = []; amostras = []
    for i, fr in enumerate(quadros(f)):
        h = hist(fr); g = fr.astype(np.float32)
        if prev is not None:
            d = np.abs(g - prev).mean(); mov.append(d)
            dh = 0.5 * np.abs(h - prev_h).sum()
            t = i / FPS
            if dh > 0.45 and d > 18 and t - cortes[-1] > 0.25: cortes.append(round(t, 2))
        prev, prev_h = g, h
        mx, mn = g.max(2), g.min(2); brilho.append(g.mean()); sat.append(((mx - mn) / (mx + 1e-6)).mean())
        if i % (FPS * 2) == 0: amostras.append(fr.reshape(-1, 3)[::7])
    mov = np.array(mov)
    planos = [(cortes[k], (cortes[k + 1] if k + 1 < len(cortes) else dur)) for k in range(len(cortes))]
    dl = np.array([b - a for a, b in planos])
    # paleta: k-means simples sobre amostras
    px = np.concatenate(amostras).astype(np.float32); rng = np.random.default_rng(0)
    c = px[rng.choice(len(px), 6, replace=False)]
    for _ in range(12):
        lab = ((px[:, None] - c[None]) ** 2).sum(2).argmin(1)
        c = np.array([px[lab == k].mean(0) if (lab == k).any() else c[k] for k in range(6)])
    cnt = np.bincount(lab, minlength=6); ordem = cnt.argsort()[::-1]
    paleta = [{"hex": "#%02x%02x%02x" % tuple(int(v) for v in c[k]), "pct": round(100 * cnt[k] / cnt.sum(), 1)} for k in ordem]
    # folha: 1 quadro no meio de cada plano (ate 160)
    sel = planos if len(planos) <= 160 else [planos[int(j)] for j in np.linspace(0, len(planos) - 1, 160)]
    TW, TH, COL = 320, 180, 8
    folha = Image.new("RGB", (TW * COL, TH * ((len(sel) + COL - 1) // COL)), (15, 15, 15)); dr = ImageDraw.Draw(folha)
    for k, (a, b) in enumerate(sel):
        t = (a + b) / 2
        r = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", f, "-frames:v", "1", "-vf", f"scale={TW}:{TH}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
        if len(r.stdout) == TW * TH * 3:
            folha.paste(Image.frombytes("RGB", (TW, TH), r.stdout), ((k % COL) * TW, (k // COL) * TH))
        x, y = (k % COL) * TW, (k // COL) * TH
        dr.rectangle((x, y, x + 120, y + 14), fill=(0, 0, 0)); dr.text((x + 2, y + 1), f"{int(a // 60)}:{a % 60:04.1f} {b - a:.1f}s", fill=(255, 255, 0))
    folha.save(os.path.join(out, "folha.jpg"), quality=82)
    au, rms = audio(f)
    vtts = sorted(glob.glob(os.path.join(V, vid + ".en*.vtt")), key=lambda p: ("orig" not in p, p))
    fala = {}
    if vtts:
        txt = vtt_texto(vtts[0]); open(os.path.join(out, "transcricao.txt"), "w", encoding="utf-8").write(txt)
        ivs = vtt_falas(vtts[0]); pal = len(txt.split())
        fala = {"palavras": pal, "wpm": round(pal / (dur / 60), 1), "fonte": os.path.basename(vtts[0])}
        # cama musical: RMS nas janelas sem fala vs com fala
        sp = np.zeros(len(rms), bool)
        for a, b in ivs: sp[int(a * 2):int(b * 2) + 1] = True
        if (~sp).sum() > 4 and sp.sum() > 4:
            fala["rms_fala_db"] = round(float(np.median(rms[sp[:len(rms)]])), 1); fala["rms_pausas_db"] = round(float(np.median(rms[~sp[:len(rms)]])), 1)
    es = glob.glob(os.path.join(V, vid + ".es*.vtt"))
    if es: open(os.path.join(out, "legenda_es.txt"), "w", encoding="utf-8").write(vtt_texto(es[0]))
    res = {"id": vid, "dur_s": round(dur, 1), "planos": len(planos), "plano_medio_s": round(float(dl.mean()), 2), "plano_mediano_s": round(float(np.median(dl)), 2),
           "planos_lt2s": int((dl < 2).sum()), "planos_gt8s": int((dl > 8).sum()), "cortes_por_min": round(len(planos) / (dur / 60), 1),
           "movimento_medio": round(float(mov.mean()), 2), "quadros_quase_parados_pct": round(100 * float((mov < 1.0).mean()), 1),
           "brilho_medio": round(float(np.mean(brilho)), 1), "saturacao_media": round(float(np.mean(sat)), 3), "paleta": paleta,
           "audio": au, "fala": fala, "cortes_s": cortes}
    json.dump(res, open(os.path.join(out, "analise.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(vid, f"{dur/60:.1f} min · {len(planos)} planos · med {res['plano_mediano_s']} s · parados {res['quadros_quase_parados_pct']}% · {au['lufs_I']} LUFS · {fala.get('wpm')} wpm", flush=True)


if __name__ == "__main__":
    ids = sys.argv[1:] or [v["id"] for v in json.load(open(os.path.join(AQUI, "inventario.json"), encoding="utf-8"))["videos"]]
    for i in ids:
        try: analisar(i)
        except Exception as e: print(i, "ERRO", e, flush=True)
