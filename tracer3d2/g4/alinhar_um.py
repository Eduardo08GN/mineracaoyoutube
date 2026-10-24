# Realinha so os capitulos dados (ex.: TTS regerado): python alinhar_um.py 08_mathematik_2 [...] -> alinhamento_parcial.json
import json, re, sys, stable_whisper
caps = {c["id"]: c for c in json.load(open("skript_de.json", encoding="utf-8"))["kapitel"]}
m = stable_whisper.load_model("large-v3", device="cuda")
norm = lambda s: re.sub(r"[^a-zäöüß0-9 ]", " ", s.lower()).split()
def wer(a, b):
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, y in enumerate(b, 1): p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (x != y))
    return d[-1] / max(1, len(a))
out = {}
for k in sys.argv[1:]:
    c = caps[k]; wav = f"voz/{k}.wav"
    r = m.align(wav, c["text"], language="de")
    ws = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in r.segments for w in s.words]
    t = m.transcribe(wav, language="de", verbose=None).text
    out[k] = {"palavras": ws, "transcricao": t, "wer": round(wer(norm(c["text"]), norm(t)), 3)}
    print("ALINHADO", k, len(ws), "wer", out[k]["wer"], flush=True)
json.dump(out, open("alinhamento_parcial.json", "w", encoding="utf-8"), ensure_ascii=False)
print("PARCIAL_OK", flush=True)
