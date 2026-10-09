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


# ⭐ (09/10) a conferencia dos falsos positivos (folhagem lida como letra) passa a ser feita pelo Claude na etapa B-roll:
#    folhas dos trechos marcados, com a caixa do que o OCR achou; o que ele disser que NAO e' texto volta ao banco.
def folhas_marcados(pasta, saida, por_folha=8):
    """[(folha.jpg, [indices])] dos trechos com texto achado pelo OCR (nao os que so' herdaram da fonte)."""
    os.makedirs(saida, exist_ok=True)
    ap = json.load(open(os.path.join(pasta, "aprovados.json"), encoding="utf-8"))
    if not _OCR:
        from rapidocr_onnxruntime import RapidOCR
        _OCR.append(RapidOCR())
    tiles = []
    for i, c in enumerate(ap):
        if not c.get("texto") or c.get("texto_fonte") or c.get("texto_revisto"): continue
        achou = None
        for img in quadros(os.path.join(pasta, "clips", c["clipe"])):
            for v in realces(img):
                r, _ = _OCR[0](v)
                for pts, txt, conf in (r or []):
                    if float(conf) >= 0.3 and len("".join(ch for ch in txt if ch.isalnum())) >= 2:
                        achou = (img.copy(), pts); break
                if achou: break
            if achou: break
        if not achou: continue
        img, pts = achou
        cv2.polylines(img, [np.int32(pts)], True, (0, 0, 255), 3)
        cv2.rectangle(img, (0, 0), (110, 48), (0, 0, 0), -1)
        cv2.putText(img, str(i), (8, 38), cv2.FONT_HERSHEY_SIMPLEX, 1.3, (0, 255, 255), 3)
        tiles.append((i, cv2.resize(img, (480, 270))))
    out = []
    for k in range(0, len(tiles), por_folha):
        grupo = tiles[k:k + por_folha]
        ims = [t for _, t in grupo] + [np.zeros((270, 480, 3), np.uint8)] * (-len(grupo) % 4)
        folha = os.path.join(saida, f"texto_{k // por_folha:02d}.jpg")
        cv2.imwrite(folha, np.vstack([np.hstack(ims[r:r + 4]) for r in range(0, len(ims), 4)]))
        out.append((folha, [i for i, _ in grupo]))
    return out


def reabrir_falsos(pasta, indices, reais=()):
    """Os indices viram 'nao e' texto' (texto_revisto=falso); os trechos que so' tinham saido pela fonte suja voltam
    para a conferencia (o main() os le de novo)."""
    arq = os.path.join(pasta, "aprovados.json")
    ap = json.load(open(arq, encoding="utf-8"))
    for i in indices: ap[i]["texto_revisto"] = "falso"
    for i in reais: ap[i]["texto_revisto"] = "real"          # conferido: e' texto mesmo (nao volta para a conferencia)
    sujas = {c["clipe"].rsplit("_", 1)[0] for c in ap if c.get("texto") and not c.get("texto_fonte")
             and c.get("texto_revisto") != "falso"}
    for c in ap:
        if c.get("texto_fonte") and c["clipe"].rsplit("_", 1)[0] not in sujas:
            c.pop("texto", None); c.pop("texto_fonte", None)
    json.dump(ap, open(arq, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
