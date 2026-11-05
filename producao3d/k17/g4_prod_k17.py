# K17 produção NA G4 (híbrido): cada batida do plano vira um clipe da sua família (K mapa Lorena, S mapa Sena, M máquina,
# B gravura 2.5D), todos em paralelo pela fila; depois a junção na ordem (concat, sem recodificar) e a voz (sem música:
# regra do Kriegsmomente), -14 LUFS. Uso: python -I g4_prod_k17.py [stills|video] [ids...]
import json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "k17"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal, fila_g4
AQ = os.path.dirname(os.path.abspath(__file__)); K = os.path.dirname(AQ); V = "/content/teardown"; TMP = os.environ["TEMP"]
MODO = sys.argv[1] if len(sys.argv) > 1 else "video"; SO = set(sys.argv[2:])
FAM = {"K": "karte", "S": "karte_seine", "M": "maschine", "B": "bild"}
plano = json.load(open(os.path.join(AQ, "plano.json"), encoding="utf-8"))
bat = [b for b in plano["batidas"] if not SO or b["id"] in SO]
try: canal.saude()
except SystemExit: canal.ligar()
tem = canal.exec_vm(f"test -f {V}/.ok -a -d {V}/node_modules/gsap && echo SIM || echo NAO", prazo=60).strip().splitlines()[-1]
if tem != "SIM":
    import subprocess
    subprocess.run([sys.executable, "-I", "D:/reconstruccion/08_prova_teardown/g4_prova.py", "--sem-filme", "--sem-prep"], env=dict(os.environ), timeout=5400)
# configs por batida (o spec inteiro vai no --config)
cfgdir = os.path.join(TMP, "k17_cfg"); os.makedirs(cfgdir, exist_ok=True)
for f in os.listdir(cfgdir): os.remove(os.path.join(cfgdir, f))
for b in bat:
    cf = {"spec": b["spec"], "fps": 24}
    if b["fam"] in ("M", "B"): cf.update({"sub": 6, "obturador": 0.5})
    json.dump(cf, open(os.path.join(cfgdir, f"{b['id']}.json"), "w", encoding="utf-8"), ensure_ascii=False)
tar = os.path.join(TMP, "td_k17.tar")
with tarfile.open(tar, "w") as t:
    for fam in FAM.values(): t.add(os.path.join(AQ, fam), arcname=fam)
    t.add(cfgdir, arcname="k17cfg")
canal.subir(tar, f"{V}/maq_k17.tar")
out = canal.exec_vm(f"cd {V} && for d in {' '.join(FAM.values())}; do rm -rf maquinas/$d; done && rm -rf k17cfg && tar -xf maq_k17.tar && "
                    f"for d in {' '.join(FAM.values())}; do mv $d maquinas/; done && cp /content/lj_assets/sky.hdr /content/lj_assets/storm.hdr maquinas/bild/assets/ && mkdir -p teardown-out/k17 && "
                    f"set -o pipefail; for d in {' '.join(FAM.values())}; do node sims/build.mjs ./maquinas/$d > build_$d.log 2>&1 || {{ tail -5 build_$d.log; exit 1; }}; done && echo BUILD_OK", prazo=1800)
print(out[-800:])
if "BUILD_OK" not in out: raise SystemExit("BUILD_FALHOU")
jobs = []
for b in bat:
    sim = FAM[b["fam"]]
    base = f"{fila_g4.EGL} && node sims/capture.mjs {sim} --config k17cfg/{b['id']}.json --size 1600x900"
    if MODO == "stills":
        tm = round(b["spec"]["dur"] * 0.62, 3)
        jobs.append({"nome": b["id"], "faixa": "3d", "cwd": V, "cmd": f"{base} --dpr 1 --still {tm} --out teardown-out/k17/{b['id']}.png 2>&1 | tail -1"})
    else:
        jobs.append({"nome": b["id"], "faixa": "3d", "cwd": V, "cmd": f"{base} --dpr 1.6 --fps 24 --pixfmt yuv420p --crf 17 --out teardown-out/k17/{b['id']}.mp4 2>&1 | tail -1"})
if MODO == "stills":
    nomes = [b["id"] for b in bat]
    for k in range(0, len(nomes), 20):
        g = nomes[k:k + 20]; n = len(g)
        fc = "".join(f"[{i}:v]scale=384:216,drawtext=text='{x}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[v{i}];" for i, x in enumerate(g))
        jobs.append({"nome": f"folha{k // 20}", "faixa": "video", "cwd": f"{V}/teardown-out/k17", "depois": g,
                     "cmd": "set -o pipefail; ffmpeg -loglevel error -y " + " ".join(f"-i {x}.png" for x in g) + f" -filter_complex \"{fc}" + "".join(f"[v{i}]" for i in range(n))
                            + f"xstack=inputs={n}:layout=" + "|".join(f"{(i % 5) * 384}_{(i // 5) * 216}" for i in range(n)) + f":fill=black\" folha_{k // 20:02d}.jpg"})
else:
    lst = "\\n".join(f"file '{b['id']}.mp4'" for b in bat)
    jobs.append({"nome": "junta", "faixa": "video", "cwd": f"{V}/teardown-out/k17", "depois": [b["id"] for b in bat],
                 "cmd": f"set -o pipefail; printf \"{lst}\\n\" > lista.txt && ffmpeg -loglevel error -y -f concat -safe 0 -i lista.txt -c copy ../k17_mudo.mp4 && echo JUNTO"})
r = fila_g4.rodar(jobs, faixas={"3d": 52, "video": 3}, prazo=7200, estagnacao=1500)
falhas = {k: v.get("cauda", "")[-400:] for k, v in r.items() if not k.startswith("_") and v.get("estado") != "ok"}
print("FALHAS", falhas, "GPU", r.get("_gpu"))
if MODO == "stills":
    canal.exec_vm(f"cd {V}/teardown-out/k17 && tar -cf /content/teardown/res_k17s.tar folha_*.jpg *.png && echo OK", prazo=300)
    dest = os.path.join(K, "out", "prod"); os.makedirs(dest, exist_ok=True); tl = os.path.join(TMP, "res_k17s.tar")
    canal.baixar(f"{V}/res_k17s.tar", tl)
    with tarfile.open(tl) as tf: tf.extractall(dest)
    print("STILLS", dest)
else:
    if falhas: raise SystemExit("CLIPES_FALHARAM")
    dest = os.path.join(K, "render"); os.makedirs(dest, exist_ok=True)
    canal.baixar(f"{V}/teardown-out/k17_mudo.mp4", os.path.join(dest, "RENDER_MUDO_NAO_PUBLICAR_k17.mp4"))
    print("VIDEO_OK")
