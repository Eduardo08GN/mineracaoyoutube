# Leitura otica a 10 fps (folhas de contato), legendas por OCR a 1 fps e mapa de som (PANNs CNN14 a cada 2 s).
# Uso (dentro da pasta ref, com v.mp4): python -I D:\whatif_es\analisar.py
import sys, json, os, subprocess, numpy as np
sys.stdout.reconfigure(encoding="utf-8")
from PIL import Image, ImageDraw
os.makedirs("q10", exist_ok=True); os.makedirs("hd", exist_ok=True)
if not os.listdir("q10"):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "v.mp4", "-vf", "fps=10,scale=480:-2", "-q:v", "4", "q10/%05d.jpg"], check=True)
fs = sorted(os.listdir("q10")); N = len(fs)
def folha(idx, nome, cols=10, w=240):
    ims = []
    for i in idx:
        im = Image.open(f"q10/{fs[i]}").resize((w, int(w * 9 / 16))); d = ImageDraw.Draw(im); t = i / 10
        d.rectangle([0, 0, 46, 14], fill=(0, 0, 0)); d.text((2, 1), f"{int(t//60)}:{int(t%60):02d}", fill=(255, 255, 0)); ims.append(im)
    h = ims[0].height; G = Image.new("RGB", (cols * w, ((len(ims) + cols - 1) // cols) * h))
    for k, im in enumerate(ims): G.paste(im, ((k % cols) * w, (k // cols) * h))
    G.save(nome, quality=85)
g = list(range(0, N, 20))
for k in range(0, len(g), 60): folha(g[k:k + 60], f"geral_{k // 60}.jpg")
print("FOLHAS", N, flush=True)
# quadros em alta para detalhe (a cada 25 s)
dur = N / 10
for s in range(5, int(dur), 25):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", str(s), "-i", "v.mp4", "-frames:v", "1", "-vf", "scale=800:-2", f"hd/f{s:03d}.jpg"])
hs = sorted(os.listdir("hd")); ims = [Image.open("hd/" + f) for f in hs if f.startswith("f")]
w, h = ims[0].size; cols = 4
G = Image.new("RGB", (w * cols, h * ((len(ims) + cols - 1) // cols)))
for k, im in enumerate(ims): G.paste(im, ((k % cols) * w, (k // cols) * h))
G.save("hd_grade.jpg", quality=85); print("HD", len(ims), flush=True)
# legendas a 1 fps
from rapidocr_onnxruntime import RapidOCR
ocr = RapidOCR(); out = []; ant = None; txt = ""
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", "v.mp4", "-vf", "fps=1,crop=1420:110:250:920,scale=946:74,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 74, 946)
for k, a in enumerate(fr):
    a16 = a.astype(np.int16)
    if ant is None or np.abs(a16 - ant).mean() > 2.0:
        r, _ = ocr(np.stack([a] * 3, -1)); txt = " ".join(x[1] for x in (r or []))
    ant = a16; out.append({"t": k, "leg": txt})
seg = []
for x in out:
    if seg and x["leg"] == seg[-1][2]: seg[-1][1] = x["t"] + 1
    else: seg.append([x["t"], x["t"] + 1, x["leg"]])
json.dump(seg, open("legendas_en.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print("OCR_OK", flush=True)
# mapa de som
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", "v.mp4", "-ac", "1", "-ar", "32000", "audio32k.wav"], check=True)
import librosa
from panns_inference import AudioTagging, labels
at = AudioTagging(checkpoint_path=r"C:\Users\edlut\panns_data\Cnn14_mAP=0.431.pth", device="cpu")
y, sr = librosa.load("audio32k.wav", sr=32000, mono=True)
W = 2.0; M = int(len(y) / sr / W)
segs = np.stack([y[int(k * W * sr):int((k + 1) * W * sr)] for k in range(M)])
P = np.concatenate([at.inference(segs[i:i + 16])[0] for i in range(0, M, 16)])
rows = []
for k in range(M):
    p = P[k]; top = np.argsort(-p)[:6]; rms = float(np.sqrt(np.mean(segs[k] ** 2)))
    rows.append({"t": k * W, "rms_db": round(20 * np.log10(rms + 1e-9), 1), "top": [(labels[i], round(float(p[i]), 2)) for i in top]})
json.dump(rows, open("tags.json", "w"), ensure_ascii=False)
print("TAGS_OK", flush=True)
