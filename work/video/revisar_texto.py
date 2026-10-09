# Segunda passada contra TEXTO nos trechos de terceiros (o Eduardo achou marca d'agua semitransparente que passou:
# "...Homegarden Project" sobre a lavanda). A primeira passada olhava 3 quadros, sem realce e com confianca 0,6.
# Aqui: 7 quadros por trecho, contraste realcado (CLAHE + nitidez) e tambem o quadro invertido, confianca 0,3.
# Marca "texto": true em aprovados.json (nao apaga: os indices da fatia continuam valendo).
#   python work/video/revisar_texto.py <pasta terceiros> [<pasta terceiros> ...]
import json, os, subprocess, sys
import numpy as np, cv2

_OCR = []


def quadros(arq, n=7, w=960):
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arq],
                             capture_output=True, text=True).stdout or 0)
    out = []
    for t in np.linspace(.15, d - .15, n):
        raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{t:.2f}", "-i", arq, "-frames:v", "1", "-vf", f"scale={w}:-2",
                              "-f", "rawvideo", "-pix_fmt", "bgr24", "-"], capture_output=True).stdout
        h = len(raw) // (w * 3)
        if h: out.append(np.frombuffer(raw, np.uint8).reshape(h, w, 3))
    return out


def realces(img):
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    lab[:, :, 0] = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8)).apply(lab[:, :, 0])
    a = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    a = cv2.addWeighted(a, 1.6, cv2.GaussianBlur(a, (0, 0), 3), -0.6, 0)
    return [img, a, 255 - a]


def texto_em(arq):
    if not _OCR:
        from rapidocr_onnxruntime import RapidOCR
        _OCR.append(RapidOCR())
    for img in quadros(arq):
        for v in realces(img):
            r, _ = _OCR[0](v)
            for pts, txt, conf in (r or []):
                limpo = "".join(c for c in txt if c.isalnum())
                if float(conf) >= 0.3 and len(limpo) >= 2:
                    return txt
    return ""


def main(pastas):
    for pasta in pastas:
        arq = os.path.join(pasta, "aprovados.json")
        ap = json.load(open(arq, encoding="utf-8"))
        n = 0
        sujas = {c["clipe"].rsplit("_", 1)[0] for c in ap if c.get("texto") and c.get("texto_revisto") != "falso"}
        for i, c in enumerate(ap):
            if "texto" in c: continue
            fonte = c["clipe"].rsplit("_", 1)[0]
            if fonte in sujas:                       # a fonte ja' tem texto/selo: sai inteira, sem gastar OCR
                c["texto"] = True; c["texto_fonte"] = True; continue
            t = texto_em(os.path.join(pasta, "clips", c["clipe"]))
            if t: sujas.add(fonte)
            c["texto"] = bool(t)
            if t: n += 1; print(f"  [{i}] {c['clipe']}: texto '{t[:40]}'", flush=True)
            if i % 20 == 0: json.dump(ap, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        json.dump(ap, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        print(f"{pasta}: {n} de {len(ap)} trechos com texto", flush=True)


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    main(sys.argv[1:])
