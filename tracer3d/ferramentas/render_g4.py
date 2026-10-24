# Render completo na G4 ja preparada (servidor de stills no ar), pro-ativo: usa a mesma trava dos stills para falar com o Colab,
# relata a cada 60 s quadros prontos, aborta se o numero de quadros parar por 5 min, baixa e confere o mp4.
#   python render_g4.py <projeto_vm> <quadros> <rotulo> <destino.mp4>
import os, re, subprocess, sys, time
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
G4 = os.environ.get("G4_PY", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "eddie3d", "ferramentas", "g4.py")); TRAVA = "D:/tmp/g4_stills.lock"
VM, N, ROT, DEST = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
def log(*x): print(time.strftime("%H:%M:%S"), *x, flush=True)
def g4(*a, prazo=600):
    while True:
        try: os.mkdir(TRAVA); break
        except FileExistsError: time.sleep(3)
    try: return subprocess.run([sys.executable, G4, *a], capture_output=True, text=True, timeout=prazo, encoding="utf-8", errors="replace",
                               env={**os.environ, "MSYS_NO_PATHCONV": "1"}).stdout
    finally: os.rmdir(TRAVA)
out = g4("rodar", f"bash /content/vm_comum/lancar_render.sh {VM} {N} {ROT} > /content/render_{ROT}.out 2>&1")   # g4.py rodar ja destaca (setsid nohup)
if "disparado" not in out: sys.exit(f"FALHOU disparo: {out[-300:]}")
time.sleep(45)   # prova de vida: o render tem de ter criado a pasta de quadros / log
g4("rodar", f"(ls -d {VM}/frames 2>&1; tail -n 3 /content/render_{ROT}.out 2>&1; tail -n 2 {VM}/status.txt) > /content/st_r.txt 2>&1")
vida = g4("ler", "/content/st_r.txt", "600").split("LER_OK")[0]
if "No such file" in vida.split(chr(10))[0] and "bundle" not in vida: sys.exit(f"FALHOU: render nao comecou: {vida[-400:]}")
log("prova de vida do render:", " | ".join(l for l in vida.strip().splitlines() if l.strip())[-200:])
log("render disparado", N, "quadros")
ult, mudou = -1, time.time()
while True:
    time.sleep(60)
    g4("rodar", f"(tail -n 2 {VM}/status.txt; find {VM}/frames -name '*.jpeg' 2>/dev/null | wc -l) > /content/st_r.txt 2>&1")
    txt = g4("ler", "/content/st_r.txt", "400").split("LER_OK")[0]
    linhas = [l for l in txt.strip().splitlines() if l.strip() and "socket.send" not in l]
    n = int(linhas[-1]) if linhas and linhas[-1].strip().isdigit() else -1
    log(f"BACKLOG render: {n}/{N} quadros | {(linhas[-2] if len(linhas) > 1 else '')[:80]}")
    if f"{ROT}_PRONTO" in txt: break
    if "FALHOU" in txt: sys.exit(f"FALHOU render: {txt[-300:]}")
    if n != ult: ult, mudou = n, time.time()
    elif time.time() - mudou > 300: sys.exit("FALHOU render: quadros parados ha 5 min")
out = g4("baixar", f"{VM}/out/video_crf.mp4", DEST, prazo=3600)
r = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=nb_frames:format=duration", "-of", "csv=p=0", DEST], capture_output=True, text=True).stdout
log("baixado e conferido:", r.strip().replace("\n", " | "), "RENDER_OK")
