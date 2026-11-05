# P4 produção NA G4 pela fila paralela: sobe a cena (com plano.json), builda uma vez e roda tudo junto.
# Uso: python -I g4_prod_p4.py stills          (1 still no meio de cada batida, todos em paralelo + folhas de contato)
#      python -I g4_prod_p4.py video [fatias]  (o vídeo inteiro fatiado, 1440p, 6 subquadros, H.264 8 bits)
import json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "learjet_p4"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal, fila_g4
AQ = os.path.dirname(os.path.abspath(__file__)); P4 = os.path.dirname(AQ); V = "/content/teardown"; TMP = os.environ["TEMP"]
modo = sys.argv[1]
plano = json.load(open(os.path.join(AQ, "learjet_p4", "plano.json"), encoding="utf-8"))
try: canal.saude()
except SystemExit: canal.ligar()
tem = canal.exec_vm(f"test -f {V}/.ok -a -s /content/lj_assets/learjet.glb -a -d {V}/node_modules/n8ao && echo SIM || echo NAO", prazo=60).strip().splitlines()[-1]
if tem != "SIM":
    import subprocess
    r = subprocess.run([sys.executable, "-I", "D:/reconstruccion/08_prova_teardown/g4_prova.py", "--sem-filme"], env=dict(os.environ), timeout=5400)
    if r.returncode: raise SystemExit("PREPARO_FALHOU")
tar = os.path.join(TMP, "td_lj_p4.tar")
with tarfile.open(tar, "w") as t: t.add(os.path.join(AQ, "learjet_p4"), arcname="learjet_p4")
canal.subir(tar, f"{V}/maq_lj_p4.tar")
out = canal.exec_vm(f"cd {V} && rm -rf maquinas/learjet_p4 && tar -xf maq_lj_p4.tar -C maquinas && mkdir -p maquinas/learjet_p4/assets teardown-out/p4p && "
                    f"cp /content/lj_assets/*.glb /content/lj_assets/*.hdr maquinas/learjet_p4/assets/ && "
                    f"node sims/build.mjs ./maquinas/learjet_p4 2>&1 | tail -3 && echo BUILD_OK", prazo=900)
print(out[-500:])
if "BUILD_OK" not in out: raise SystemExit("BUILD_FALHOU")

if modo == "stills":
    CAP = "node sims/capture.mjs learjet_p4 --config maquinas/learjet_p4/cfg_producao.json --size 1600x900 --dpr 1"
    canal.exec_vm(f"rm -f {V}/teardown-out/p4p/*", prazo=60)
    dest0 = os.path.join(P4, "out", "prod")
    jobs, nomes = [], []
    so = set(sys.argv[2:])
    for b in plano["batidas"]:
        if so and b["id"] not in so: continue
        tm = round(b["v0"] + (b["v1"] - b["v0"]) * 0.62, 3)
        nomes.append(b["id"])
        jobs.append({"nome": b["id"], "faixa": "3d", "cwd": V, "cmd": f"{fila_g4.EGL} && {CAP} --still {tm} --out teardown-out/p4p/{b['id']}.png 2>&1 | tail -1"})
    # folhas de contato de 20 em 20 (5×4), depois de todos os stills
    for k in range(0, len(nomes), 20):
        grupo = nomes[k:k + 20]; n = len(grupo)
        ins = " ".join(f"-i {g}.png" for g in grupo)
        fc = "".join(f"[{i}:v]scale=384:216,drawtext=text='{g}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v{i}];" for i, g in enumerate(grupo))
        lay = "|".join(f"{(i % 5) * 384}_{(i // 5) * 216}" for i in range(n))
        jobs.append({"nome": f"folha{k // 20}", "faixa": "video", "cwd": f"{V}/teardown-out/p4p", "depois": grupo,
                     "cmd": f"set -o pipefail; ffmpeg -loglevel error -y {ins} -filter_complex \"{fc}{''.join(f'[v{i}]' for i in range(n))}xstack=inputs={n}:layout={lay}:fill=black\" folha_{k // 20:02d}.jpg && echo OK"})
    r = fila_g4.rodar(jobs, faixas={"3d": 48, "video": 4}, prazo=3600, estagnacao=900)
    falhas = {k: v.get("cauda", "")[-300:] for k, v in r.items() if not k.startswith("_") and v.get("estado") != "ok"}
    print("FALHAS", falhas, "GPU", r.get("_gpu"))
    canal.exec_vm(f"cd {V}/teardown-out/p4p && tar -cf /content/teardown/res_p4p.tar folha_*.jpg *.png && echo OK", prazo=300)
    dest = os.path.join(P4, "out", "prod"); os.makedirs(dest, exist_ok=True); tl = os.path.join(TMP, "res_p4p.tar")
    canal.baixar(f"{V}/res_p4p.tar", tl)
    with tarfile.open(tl) as tf: tf.extractall(dest)
    print("STILLS", dest)

if modo == "video":
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 40
    extra = "--config maquinas/learjet_p4/cfg_final.json --size 1600x900 --dpr 1.6 --pixfmt yuv420p --crf 16"
    jobs = fila_g4.fatias("p4final", "learjet_p4", V, 0, plano["dur"], n, "teardown-out/p4_final_mudo.mp4", extra=extra)
    r = fila_g4.rodar(jobs, faixas={"3d": n, "video": 2}, prazo=7200, estagnacao=1500)
    falhas = [k for k, v in r.items() if not k.startswith("_") and v.get("estado") != "ok"]
    if falhas: raise SystemExit(f"FATIAS_FALHARAM {falhas}: " + r[falhas[0]].get("cauda", "")[-800:])
    dest = os.path.join(P4, "render"); os.makedirs(dest, exist_ok=True)
    canal.baixar(f"{V}/teardown-out/p4_final_mudo.mp4", os.path.join(dest, "RENDER_MUDO_NAO_PUBLICAR_p4.mp4"))
    print("VIDEO_OK", r.get("_gpu"))
