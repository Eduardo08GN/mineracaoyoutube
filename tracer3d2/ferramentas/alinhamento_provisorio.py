# Alinhamento PROVISORIO (palavras espalhadas por igual na duracao do wav, ou 132 palavras/min sem wav) para planejar e
# ver stills antes do alinhamento real da G4. plano.py usa voz/alinhamento.json se existir; senao este.
import json, os, subprocess
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
caps = json.load(open(f"{R}/roteiro/skript_de.json", encoding="utf-8"))["kapitel"]
out = {}
for c in caps:
    ws = c["text"].split(); wav = f"{R}/voz/{c['id']}.wav"
    d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", wav], capture_output=True, text=True).stdout or 0) if os.path.exists(wav) else len(ws) / 2.2
    p = d / len(ws)
    out[c["id"]] = {"palavras": [{"w": w, "s": round(i * p, 3), "e": round((i + 0.9) * p, 3)} for i, w in enumerate(ws)], "provisorio": True, "dur": round(d, 2)}
json.dump(out, open(f"{R}/voz/alinhamento_provisorio.json", "w", encoding="utf-8"), ensure_ascii=False)
print("provisorio:", {k: v["dur"] for k, v in out.items()})
