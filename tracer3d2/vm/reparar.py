# Tracer3D 2.0: reparar.py do 1.0 com trecho de quadros (ini..fim). Uso: python3 reparar.py <projeto> <ini> <fim>
# Acha quadros com glitch (area grande que difere dos dois vizinhos, que sao parecidos entre si), re-renderiza cada um
# com 3 quadros de aquecimento antes (o glitch acontece nos primeiros quadros de uma aba nova) e fica com a versao mais coerente.
import sys, os, re, glob, shutil, subprocess, numpy as np
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
D, I, F = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]); N = F - I + 1; Q = range(I, F + 1); os.chdir(D)
arqs = {int(re.findall(r"(\d+)\.jpeg$", f)[0]): f for f in glob.glob("frames/p*/*.jpeg")}
print("quadros", len(arqs), "esperados", N, flush=True)
def mini(f): a = np.asarray(Image.open(f).convert("L").resize((192, 108)), np.int16); a[:39, :119] = 0; a[90:, :] = 0; return a
def nota(k, f=None):
    a = mini(f or arqs[k]); p = mini(arqs[max(I, k - 1)]); s = mini(arqs[min(F, k + 1)])
    return int((((np.minimum(np.abs(a - p), np.abs(a - s)) - np.abs(s - p)) > 18)).sum())
def refazer(k, w=3):
    d = f"frames/fix/{k:05d}"; shutil.rmtree(d, ignore_errors=True)
    subprocess.run(["npx", "remotion", "render", "bundle", "Video", d, "--sequence", f"--frames={max(0, k - w)}-{k}", "--image-format=jpeg", "--jpeg-quality=94",
                    "--gl=angle-egl", "--chrome-mode=chrome-for-testing", "--concurrency=1", "--timeout=240000", "--log=error"], capture_output=True)
    c = [f for f in glob.glob(d + "/*.jpeg") if int(re.findall(r"(\d+)\.jpeg$", f)[0]) == k]
    return c[0] if c else None
for k in [k for k in Q if k not in arqs]:
    arqs[k] = refazer(k)
with ThreadPoolExecutor(32) as ex: notas = dict(zip(Q, ex.map(nota, Q)))
ruins = [k for k in range(I + 1, F) if notas[k] > 150]
print("suspeitos", len(ruins), [(k, notas[k]) for k in ruins[:60]], flush=True)
def tratar(k):
    f = refazer(k)
    if not f: return (k, notas[k], None)
    n2 = nota(k, f)
    if n2 < notas[k]: arqs[k] = f
    return (k, notas[k], n2)
with ThreadPoolExecutor(24) as ex: res = list(ex.map(tratar, ruins))
print("reparo", [r for r in res][:80], flush=True)
print("trocados", sum(1 for r in res if r[2] is not None and r[2] < r[1]), "de", len(res), flush=True)
shutil.rmtree("seq", ignore_errors=True); os.makedirs("seq")
for j, k in enumerate(Q): os.symlink(os.path.abspath(arqs[k]), f"seq/{j:05d}.jpeg")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", "30", "-i", "seq/%05d.jpeg", "-c:v", "libx264", "-crf", "21",
                "-preset", "medium", "-pix_fmt", "yuv420p", "-threads", "32", "out/video_crf.mp4"], check=True)
print("encode_ok", flush=True)
