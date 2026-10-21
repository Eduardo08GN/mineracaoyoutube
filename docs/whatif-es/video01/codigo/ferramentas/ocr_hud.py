import sys, json, subprocess, numpy as np
sys.stdout.reconfigure(encoding="utf-8")
from rapidocr_onnxruntime import RapidOCR
ocr = RapidOCR(); out = []
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "v.mp4", "-vf", "fps=1,crop=1000:300:40:40,scale=667:200", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True).stdout
F = np.frombuffer(raw, np.uint8).reshape(-1, 200, 667, 3)
for k, a in enumerate(F):
    r, _ = ocr(a); out.append({"t": k, "hud": [x[1] for x in (r or [])]})
    if k % 60 == 0: print(k, out[-1], flush=True)
json.dump(out, open("hud_ocr.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print("OK", flush=True)
