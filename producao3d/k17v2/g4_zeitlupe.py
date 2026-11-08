# K17 v2: câmera lenta suave NA G4. Captura o take em fps alto (render(t) é puro) e reescala o tempo para 30 fps,
# para o Remotion tocar a 1x sem quadro repetido. Saídas em v1/public/aktion/:
#   noveant_a.mp4 = noveant_flut 0–6,45 s a 0,5x (12,9 s) | noveant_b.mp4 = 6,45–15 s a 1x | donchery_lento.mp4 = 10 s a 0,75x (13,3 s)
import os, sys, tarfile
os.environ.setdefault("T2_DONO", "k17v2"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal, fila_g4
K2 = r"D:\kriegschronik\k17_v2"; V = "/content/teardown"; O = "teardown-out/aktion"; TMP = os.environ["TEMP"]
canal.saude()
cap = lambda tk, fps, out: (f"{fila_g4.EGL} && node sims/capture.mjs aktion --config maquinas/aktion/cfg_{tk}.json --size 1600x900 --dpr 1.2 "
                            f"--fps {fps} --pixfmt yuv420p --crf 14 --out {O}/{out} 2>&1 | tail -1")
jobs = [
    {"nome": "nov60", "faixa": "3d", "cwd": V, "cmd": cap("noveant_flut", 60, "nov60.mp4")},
    {"nome": "don40", "faixa": "3d", "cwd": V, "cmd": cap("donchery_sprengung", 40, "don40.mp4")},
    {"nome": "pos", "faixa": "video", "cwd": f"{V}/{O}", "depois": ["nov60", "don40"], "cmd":
     "set -o pipefail; "
     "ffmpeg -loglevel error -y -i nov60.mp4 -vf \"trim=0:6.45,setpts=2*(PTS-STARTPTS),fps=30\" -an -c:v libx264 -crf 16 -pix_fmt yuv420p noveant_a.mp4 && "
     "ffmpeg -loglevel error -y -i nov60.mp4 -vf \"trim=6.45:15,setpts=PTS-STARTPTS,fps=30\" -an -c:v libx264 -crf 16 -pix_fmt yuv420p noveant_b.mp4 && "
     "ffmpeg -loglevel error -y -i don40.mp4 -vf \"setpts=(4/3)*PTS,fps=30\" -an -c:v libx264 -crf 16 -pix_fmt yuv420p donchery_lento.mp4 && "
     "tar -cf ../zeitlupe.tar noveant_a.mp4 noveant_b.mp4 donchery_lento.mp4 && echo ZL_OK"},
]
r = fila_g4.rodar(jobs, faixas={"3d": 4, "video": 1}, prazo=3600, estagnacao=1500)
falhas = {k: v.get("cauda", "")[-400:] for k, v in r.items() if not k.startswith("_") and v.get("estado") != "ok"}
print("FALHAS", falhas)
if falhas: raise SystemExit("ZEITLUPE_FALHOU")
tl = os.path.join(TMP, "zeitlupe.tar"); canal.baixar(f"{V}/teardown-out/zeitlupe.tar", tl)
with tarfile.open(tl) as tf: tf.extractall(os.path.join(K2, "v1", "public", "aktion"))
print("ZEITLUPE_OK")
