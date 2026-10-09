# A narracao do hack (uma faixa) e os pontos de sincronia de cada frase (CUES do hack.html).
import json, os, subprocess, sys
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, os.path.dirname(AQUI))
import voz_wendelin as voz
def dur(a): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",a],capture_output=True,text=True).stdout)
def ff(*a): subprocess.run(["ffmpeg","-v","error","-y",*a],check=True)
d = json.load(open(os.path.join(AQUI, "hack.json"), encoding="utf-8"))
T = os.path.join(AQUI, "narr"); os.makedirs(T, exist_ok=True)
cues, t, linhas = {}, 0.6, []
ff("-f","lavfi","-i","anullsrc=r=48000:cl=mono","-t","0.6",os.path.join(T,"s0.wav")); linhas.append("file 's0.wav'\n")
for i, (k, txt) in enumerate(d["frases"]):
    w = voz.narrar(txt, os.path.join(T, f"{k}.wav")); cues[k] = round(t, 3)
    gap = 0.45 if k in ("H2", "H5", "H7", "H9", "H11", "H12") else 0.28
    p = os.path.join(T, f"{k}_p.wav"); ff("-i", w, "-af", f"apad=pad_dur={gap}", p); linhas.append(f"file '{k}_p.wav'\n")
    t += dur(w) + gap
cues["FIM"] = round(t + 1.0, 3)
open(os.path.join(T, "lista.txt"), "w").writelines(linhas)
ff("-f","concat","-safe","0","-i",os.path.join(T,"lista.txt"),"-ac","1","-ar","48000",os.path.join(AQUI,"hack_narracao.wav"))
json.dump(cues, open(os.path.join(AQUI, "cues.json"), "w"), indent=1); print(cues)
