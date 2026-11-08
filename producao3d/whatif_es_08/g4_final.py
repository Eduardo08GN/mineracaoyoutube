# Lote FINAL do video 08 na G4:
#   1) realinha os capitulos dados (stable-ts ES) e troca no voz/alinhamento.json
#   2) local: plano.py (tempos e ancoras) + legendas.py + tempos da musica no mapa
#   3) render do v1 inteiro (48 Chromes)  ||  em paralelo: mix (voz+trilha+efeitos) + loudnorm na G4
#   4) local: mux -c copy -> entrega/<titulo>.mp4 (o mudo fica como RENDER_MUDO_NAO_PUBLICAR)
# Uso: python g4_final.py 09_eureka
import glob, json, os, subprocess, sys, threading
os.environ.setdefault("T2_DONO", "mar_latam"); os.environ.setdefault("TEMP", "D:/tmp"); os.environ.setdefault("T2_PROJ", "08_mar_latam")
sys.path.insert(0, r"D:\tracer3d2"); import canal
R = os.path.dirname(os.path.abspath(__file__)); caps = sys.argv[1:]
PY = sys.executable
try: canal.saude()
except SystemExit:
    if not canal.reconectar(): canal.ligar()

# 1) realinhar
if caps:
    V = "/content/mar_alinhar"
    ALINHA = open(os.path.join(R, "g4_lote1.py"), encoding="utf-8").read().split("ALINHA = r'''")[1].split("'''")[0]
    ALINHA = ALINHA.replace("for k, c in caps.items():", "for k, c in caps.items():\n    if k not in sys.argv[1:]: continue")
    tmp = os.path.join(os.environ["TEMP"], "mar_realinha_vm.py"); open(tmp, "w", encoding="utf-8").write(ALINHA)
    canal.subir(tmp, f"{V}/realinha.py"); canal.subir(os.path.join(R, "roteiro", "roteiro.json"), f"{V}/roteiro.json")
    for k in caps: canal.subir(os.path.join(R, "voz", k + ".wav"), f"{V}/voz/{k}.wav")
    out = canal.exec_vm(f"cd {V} && (pip -q install stable-ts > log2.txt 2>&1; python realinha.py {' '.join(caps)} >> log2.txt 2>&1); grep -E 'ALINHADO|ALINHA_OK|Traceback' log2.txt | tail -5", prazo=2400, estagnacao=1200)
    print(out[-600:], flush=True)
    if "ALINHA_OK" not in out: raise SystemExit("REALINHAR_FALHOU")
    p = os.path.join(os.environ["TEMP"], "mar_realinha.json"); canal.baixar(f"{V}/alinhamento.json", p)
    dst = os.path.join(R, "voz", "alinhamento.json"); a = json.load(open(dst, encoding="utf-8")); novo = json.load(open(p, encoding="utf-8"))
    for k in caps:
        d = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(R, "voz", k + ".wav")], capture_output=True, text=True).stdout.strip()
        a[k] = {**novo[k], "dur": round(float(d), 3)}; print("REALINHADO", k, a[k]["wer"], a[k]["dur"], flush=True)
    json.dump(a, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=0)

# 2) plano, legendas, tempos da musica
for f in ("ferramentas/plano.py", "ferramentas/legendas.py"):
    print(subprocess.run([PY, os.path.join(R, f)], capture_output=True, text=True, encoding="utf-8").stdout.strip(), flush=True)
ali = json.load(open(os.path.join(R, "voz", "alinhamento.json"), encoding="utf-8")); rot = json.load(open(os.path.join(R, "roteiro", "roteiro.json"), encoding="utf-8"))["kapitel"]
mp = json.load(open(os.path.join(R, "audio", "mapa_g4.json"), encoding="utf-8")); t = 0.6
for c, m in zip(rot, mp["musica"]): d = ali[c["id"]]["dur"]; m["s"], m["e"] = round(t, 2), round(t + d, 2); t += d + 0.7
json.dump(mp, open(os.path.join(R, "audio", "mapa_g4.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
if os.environ.get("SO_PREP"): print("PREP_OK", flush=True); sys.exit(0)
PL = json.load(open(os.path.join(R, "v1", "src", "plano.json"), encoding="utf-8")); DUR = PL["dauer"]
P = os.path.join(R, "v1"); MUDO = os.path.join(R, "render", "RENDER_MUDO_NAO_PUBLICAR_v1.mp4"); os.makedirs(os.path.dirname(MUDO), exist_ok=True)

# 3) render || mix
def mix():
    # a VM e efemera: sobe tudo de novo (voz, trilha limpa, efeitos, plano, mapa, resultado, scripts)
    Vm = "/content/t2/mar_mix"
    canal.exec_vm(f"rm -rf {Vm} && mkdir -p {Vm}/voz {Vm}/pm {Vm}/pe", prazo=60)
    for f in glob.glob(os.path.join(R, "voz", "*.wav")): canal.subir(f, f"{Vm}/voz/{os.path.basename(f)}")
    for f in glob.glob(os.path.join(R, "audio", "pm", "m??.flac")): canal.subir(f, f"{Vm}/pm/{os.path.basename(f)}")
    for f in glob.glob(os.path.join(R, "audio", "pe", "*.flac")): canal.subir(f, f"{Vm}/pe/{os.path.basename(f)}")
    for a, b in ((os.path.join(P, "src", "plano.json"), "plano.json"), (os.path.join(R, "audio", "mapa_g4.json"), "mapa_g4.json"), (os.path.join(P, "public", "dados", "resultado.json"), "resultado.json"),
                 (os.path.join(R, "audio", "mixar_vm.py"), "mixar_vm.py"), (os.path.join(R, "audio", "loud_vm.py"), "loud_vm.py")):
        canal.subir(a, f"{Vm}/{b}")
    print(canal.exec_vm(f"cd {Vm} && pip -q install pyloudnorm soundfile > pip.log 2>&1; python mixar_vm.py {Vm} && python loud_vm.py {Vm}", prazo=1500, estagnacao=900)[-300:], flush=True)
    canal.baixar(f"{Vm}/mix.m4a", os.path.join(R, "audio", "mix.m4a")); print("MIX_OK_BAIXADO", flush=True)
tm = threading.Thread(target=mix if not os.environ.get("SEM_MIX") else (lambda: None)); tm.start()
canal.garantir(P)   # 05/11: preparar de novo derrubava (EADDRINUSE 8766 do daemon de stills ja no ar)
canal.render(P, 0, DUR, MUDO); print("RENDER_OK", flush=True)
tm.join()

# 4) mux
os.makedirs(os.path.join(R, "entrega"), exist_ok=True)
FINAL = os.path.join(R, "entrega", "que_pasaria_si_el_mar_subiera_latinoamerica.mp4")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", MUDO, "-i", os.path.join(R, "audio", "mix.m4a"), "-map", "0:v:0", "-map", "1:a:0", "-c", "copy", "-shortest", FINAL], check=True)
print("ENTREGA", FINAL, subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=codec_type,codec_name,duration", "-of", "csv=p=0", FINAL], capture_output=True, text=True).stdout.replace("\n", " | "), flush=True)
