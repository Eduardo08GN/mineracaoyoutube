# Narracao de um bloco de motion graphics (uma faixa) e os pontos de sincronia de cada frase -> cues.json
#   python work/video/narrar_mg.py <pasta> <secao>
import json, os, subprocess, sys
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
import voz_wendelin as voz
def dur(a): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",a],capture_output=True,text=True).stdout)
def ff(*a): subprocess.run(["ffmpeg","-v","error","-y",*a],check=True)
pasta, secao = sys.argv[1], int(sys.argv[2])
frases = [f for f in json.load(open(os.path.join(AQUI, "completo", "frases.json"), encoding="utf-8")) if f["secao"] == secao]
T = os.path.join(pasta, "narr"); os.makedirs(T, exist_ok=True)
cues, t, linhas = {}, 0.6, ["file 's0.wav'\n"]
ff("-f","lavfi","-i","anullsrc=r=48000:cl=mono","-t","0.6",os.path.join(T,"s0.wav"))
for i, f in enumerate(frases, 1):
    k = f"F{i}"; w = voz.narrar(f["texto"], os.path.join(T, f"{k}.wav")); cues[k] = round(t, 3)
    gap = 0.42 if f["texto"].endswith((".", "!", "?")) else 0.25
    p = os.path.join(T, f"{k}_p.wav"); ff("-i", w, "-af", f"apad=pad_dur={gap}", p); linhas.append(f"file '{k}_p.wav'\n")
    t += dur(w) + gap
cues["FIM"] = round(t + 1.2, 3)
open(os.path.join(T, "lista.txt"), "w").writelines(linhas)
ff("-f","concat","-safe","0","-i",os.path.join(T,"lista.txt"),"-ac","1","-ar","48000",os.path.join(pasta,"narracao.wav"))
json.dump(cues, open(os.path.join(pasta, "cues.json"), "w"), indent=1)
for i, f in enumerate(frases, 1): print(f"F{i} {cues[f'F{i}']:6.2f}  {f['texto']}")
print("FIM", cues["FIM"])
