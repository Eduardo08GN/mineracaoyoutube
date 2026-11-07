"""OCR do texto na tela a 2 fps (rapidocr, CPU). Uso: python -I ocr_texto.py VIDEO.mp4 SAIDA.tsv
Saida: t_s, area_texto_pct, n_caixas, texto (caixas com confianca >= 0.6, ordem de leitura)."""
import sys, cv2
from rapidocr_onnxruntime import RapidOCR
ocr = RapidOCR()
cap = cv2.VideoCapture(sys.argv[1]); fps = cap.get(cv2.CAP_PROP_FPS) or 30
n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)); passo = max(1, round(fps / 2))
out = open(sys.argv[2], "w", encoding="utf-8"); out.write("t_s\tarea_pct\tn\ttexto\n")
for i in range(0, n, passo):
    cap.set(cv2.CAP_PROP_POS_FRAMES, i); ok, f = cap.read()
    if not ok: break
    h, w = f.shape[:2]
    res, _ = ocr(f)
    caixas = [r for r in (res or []) if r[2] >= 0.6]
    caixas.sort(key=lambda r: (round(r[0][0][1] / (h * 0.04)), r[0][0][0]))
    area = sum(cv2.contourArea(__import__("numpy").array(r[0], dtype="float32")) for r in caixas) / (w * h) * 100
    out.write(f"{i/fps:.1f}\t{area:.1f}\t{len(caixas)}\t{' | '.join(r[1] for r in caixas)}\n")
out.close(); print("ok", sys.argv[1])
