# Legenda (auto ou manual, en) de um video em texto corrido com marcas de minuto. Pasta temporaria no D:.
#   python -I yt_legenda.py <video_id> <saida.txt>   (cliente ios, sem cookies: pega legenda automatica sem PO token)
import os, re, subprocess, sys, glob
vid, saida = sys.argv[1], sys.argv[2]; d = "D:/tmp/levantamento/subs"; os.makedirs(d, exist_ok=True)
env = dict(os.environ, TEMP="D:/tmp", TMP="D:/tmp")
subprocess.run(["yt-dlp", "-q", "--no-warnings", "--js-runtimes", "node", "--remote-components", "ejs:github",
                "--extractor-args", "youtube:player_client=ios", "--skip-download", "--ignore-no-formats-error", "--write-subs", "--write-auto-subs", "--sub-langs", "en,en-orig,en-US",
                "--sub-format", "vtt", "-o", f"{d}/{vid}.%(ext)s", f"https://www.youtube.com/watch?v={vid}"], env=env, timeout=300)
fs = sorted(glob.glob(f"{d}/{vid}*.vtt"))
if not fs: print("SEM_LEGENDA", vid); sys.exit(1)
linhas, ult, minuto = [], "", -1
for bloco in open(fs[0], encoding="utf-8").read().split("\n\n"):
    m = re.search(r"(\d+):(\d\d):(\d\d)\.\d+ -->", bloco)
    if not m: continue
    t = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3))
    txt = " ".join(l for l in bloco.split("\n")[1:] if "-->" not in l)
    txt = re.sub(r"<[^>]+>", "", txt).strip()
    if not txt or txt == ult: continue
    if txt.startswith(ult) and ult: txt = txt[len(ult):].strip()
    ult = re.sub(r"<[^>]+>", "", bloco.split("\n")[-1]).strip()
    if t // 60 != minuto: minuto = t // 60; linhas.append(f"\n[{minuto:02d}:00]")
    linhas.append(txt)
open(saida, "w", encoding="utf-8").write(" ".join(linhas)); print("OK", saida, len(" ".join(linhas).split()), "palavras")
