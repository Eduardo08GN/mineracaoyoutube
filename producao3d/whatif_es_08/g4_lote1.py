# Lote 1 do video 08 na G4, em paralelo depois de ligar (o navegador so e usado no ligar):
#   A) dados (GHS-POP/ETOPO/NE -> vm_calc -> vm_extra) -> public/dados do batedor (PC e VM)
#   B) alinhamento palavra a palavra da narracao ES (stable-ts large-v3, GPU)
#   C) depois de A: stills do batedor + render do clipe de 16 s (48 Chromes)
import json, os, subprocess, sys, threading, traceback
os.environ.setdefault("T2_DONO", "mar_latam"); os.environ.setdefault("TEMP", "D:/tmp"); os.environ.setdefault("T2_PROJ", "08_mar_latam")
sys.path.insert(0, r"D:\tracer3d2"); import canal
R = os.path.dirname(os.path.abspath(__file__)); DADOS = os.path.join(R, "dados"); PROJ = os.path.join(R, "batedor")
PUB = os.path.join(PROJ, "public", "dados"); os.makedirs(PUB, exist_ok=True)
VMPROJ = f"{canal.REMOTO}/{canal.nome_proj(PROJ)}"
erros = []

def A():
    try:
        canal.exec_vm("mkdir -p /content/mar/saida", prazo=60)
        for n in ("vm_prep.sh", "vm_calc.py", "vm_extra.py", "cidades.json"): canal.subir(os.path.join(DADOS, n), "/content/mar/" + n)
        print(canal.exec_vm("bash /content/mar/vm_prep.sh > /content/mar/prep.log 2>&1; tail -1 /content/mar/prep.log; cd /content/mar && python3 vm_calc.py 2>&1 | tail -2 && python3 vm_extra.py",
                            prazo=3600, estagnacao=1500)[-500:], flush=True)
        ns = ("nivel.f16.bin", "dem.f16.bin", "sombra.png", "pais.png", "pontos.json", "cumes.json", "texturas.json", "resultado.json")
        for n in ns: canal.baixar("/content/mar/saida/" + n, os.path.join(PUB, n))
        canal.exec_vm(f"mkdir -p {VMPROJ}/public/dados && cp " + " ".join(f"/content/mar/saida/{n}" for n in ns) + f" {VMPROJ}/public/dados/", prazo=120)
        print("A_OK", flush=True)
    except BaseException as e: erros.append(("A", e)); traceback.print_exc()

ALINHA = r'''import json, re, sys, stable_whisper
caps = {c["id"]: c for c in json.load(open("roteiro.json", encoding="utf-8"))["kapitel"]}
m = stable_whisper.load_model("large-v3", device="cuda")
norm = lambda s: re.sub(r"[^a-záéíóúüñ0-9 ]", " ", s.lower()).split()
def wer(a, b):
    d = list(range(len(b) + 1))
    for i, x in enumerate(a, 1):
        p, d[0] = d[0], i
        for j, y in enumerate(b, 1): p, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, p + (x != y))
    return d[-1] / max(1, len(a))
out = {}
for k, c in caps.items():
    wav = f"voz/{k}.wav"; r = m.align(wav, c["text"], language="es")
    ws = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in r.segments for w in s.words]
    t = m.transcribe(wav, language="es", verbose=None).text
    out[k] = {"palavras": ws, "transcricao": t, "wer": round(wer(norm(c["text"]), norm(t)), 3)}
    print("ALINHADO", k, len(ws), "wer", out[k]["wer"], flush=True)
json.dump(out, open("alinhamento.json", "w", encoding="utf-8"), ensure_ascii=False); print("ALINHA_OK", flush=True)
'''
def B():
    try:
        V = "/content/mar_alinhar"; tmp = os.path.join(os.environ["TEMP"], "mar_alinhar_vm.py"); open(tmp, "w", encoding="utf-8").write(ALINHA)
        canal.subir(tmp, f"{V}/alinhar.py"); canal.subir(os.path.join(R, "roteiro", "roteiro.json"), f"{V}/roteiro.json")
        caps = json.load(open(os.path.join(R, "roteiro", "roteiro.json"), encoding="utf-8"))["kapitel"]
        for c in caps: canal.subir(os.path.join(R, "voz", c["id"] + ".wav"), f"{V}/voz/{c['id']}.wav")
        out = canal.exec_vm(f"cd {V} && (pip -q install stable-ts > log.txt 2>&1; python alinhar.py >> log.txt 2>&1); grep -E 'ALINHADO|ALINHA_OK|Traceback|Error' log.txt | tail -14", prazo=3000, estagnacao=1500)
        print(out[-1500:], flush=True)
        if "ALINHA_OK" not in out: raise SystemExit("ALINHAR_FALHOU")
        dst = os.path.join(R, "voz", "alinhamento.json"); canal.baixar(f"{V}/alinhamento.json", dst)
        a = json.load(open(dst, encoding="utf-8"))
        for c in caps:
            d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(R, "voz", c["id"] + ".wav")], capture_output=True, text=True).stdout.strip()
            a[c["id"]]["dur"] = round(float(d), 3)
        json.dump(a, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=0); print("B_OK", flush=True)
    except BaseException as e: erros.append(("B", e)); traceback.print_exc()

try: canal.saude()
except SystemExit:
    if not canal.reconectar(): canal.ligar()
ta, tb = threading.Thread(target=A), threading.Thread(target=B); ta.start(); tb.start(); ta.join()
if not any(k == "A" for k, _ in erros):
    try:
        canal.preparar(PROJ)
        canal.stills(PROJ, "b1", [0.5, 2.0, 3.8, 4.6, 6.0, 7.8, 8.6, 10.0, 11.8, 12.5, 14.0, 15.8], escala="0.5")
        canal.render(PROJ, 0, 16, os.path.join(PROJ, "g4", "RENDER_MUDO_NAO_PUBLICAR_batedor08.mp4"))
        print("C_OK", flush=True)
    except BaseException as e: erros.append(("C", e)); traceback.print_exc()
tb.join()
print("LOTE1_FIM", "erros:", [(k, str(e)[:200]) for k, e in erros], flush=True)
