# K16: alinha NA G4 os capitulos dados (stable-ts large-v3, alemao) e troca a entrada deles em voz/alinhamento.json (com `dur`).
# Uso: python -I g4_alinhar_um.py 07_entorno [...]
import json, os, subprocess, sys
os.environ.setdefault("T2_DONO", "k16"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); V = "/content/k16_alinhar"; ids = sys.argv[1:]
VM = r'''import json, re, sys, stable_whisper
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
    c = caps[k]; wav = f"voz/{k}.wav"; r = m.align(wav, c["text"], language="de")
    ws = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in r.segments for w in s.words]
    t = m.transcribe(wav, language="de", verbose=None).text
    out[k] = {"palavras": ws, "transcricao": t, "wer": round(wer(norm(c["text"]), norm(t)), 3)}
    print("ALINHADO", k, len(ws), "wer", out[k]["wer"], flush=True)
json.dump(out, open("parcial.json", "w", encoding="utf-8"), ensure_ascii=False); print("PARCIAL_OK", flush=True)
'''
try: canal.saude()
except SystemExit: canal.ligar()
tmp = os.path.join(os.environ["TEMP"], "p3_alinhar_vm.py"); open(tmp, "w", encoding="utf-8").write(VM)
canal.subir(tmp, f"{V}/alinhar.py"); canal.subir(os.path.join(R, "roteiro", "skript_de.json"), f"{V}/skript_de.json")
for k in ids: canal.subir(os.path.join(R, "voz", k + ".wav"), f"{V}/voz/{k}.wav")
out = canal.exec_vm(f"cd {V} && (pip -q install stable-ts > log.txt 2>&1; python alinhar.py {' '.join(ids)} >> log.txt 2>&1); grep -E 'ALINHADO|PARCIAL_OK|Traceback|Error' log.txt | tail -12", prazo=2400, estagnacao=1200)
print(out[-1200:])
if "PARCIAL_OK" not in out: raise SystemExit("ALINHAR_FALHOU")
p = os.path.join(os.environ["TEMP"], "p3_parcial.json"); canal.baixar(f"{V}/parcial.json", p)
dst = os.path.join(R, "voz", "alinhamento.json"); a = json.load(open(dst, encoding="utf-8")) if os.path.exists(dst) else {}; novo = json.load(open(p, encoding="utf-8"))
for k in ids:
    d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(R, "voz", k + ".wav")], capture_output=True, text=True).stdout.strip()
    a[k] = {**novo[k], "dur": round(float(d), 3)}; print("WER", k, a[k]["wer"], "dur", a[k]["dur"], "palavras", len(a[k]["palavras"]))
json.dump(a, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=0); canal.log("MARCO K16_ALINHADO", ids)
