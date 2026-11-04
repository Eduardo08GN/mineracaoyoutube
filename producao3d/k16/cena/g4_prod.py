# K16 produção NA G4 pela fila paralela: sobe a cena, builda uma vez, e roda os stills/clipes em paralelo (faixa '3d').
# Uso: python -I g4_prod.py stills <id_batida> [...]    (still no meio de cada batida do plano.json)
#      python -I g4_prod.py video [fatias]               (o vídeo inteiro, fatiado, 10 bits)
import json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "k16"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal, fila_g4
AQ = os.path.dirname(os.path.abspath(__file__)); K = r"D:\kriegschronik\k16_seekrieg"; V = "/content/teardown"; TMP = os.environ["TEMP"]
modo = sys.argv[1]
plano = json.load(open(os.path.join(AQ, "seekrieg", "plano.json"), encoding="utf-8"))
try: canal.saude()
except SystemExit: canal.ligar()
tar = os.path.join(TMP, "td_k16.tar")
with tarfile.open(tar, "w") as t: t.add(os.path.join(AQ, "seekrieg"), arcname="seekrieg")
canal.subir(tar, f"{V}/maq_k16.tar")
print(canal.exec_vm(f"cd {V} && rm -rf maquinas/seekrieg && tar -xf maq_k16.tar -C maquinas && mkdir -p maquinas/seekrieg/assets teardown-out/k16p && "
                    f"cp /content/k16_assets/*.glb /content/k16_assets/*.hdr maquinas/seekrieg/assets/ && node sims/build.mjs ./maquinas/seekrieg 2>&1 | tail -2", prazo=900)[-300:])
CFG = "--config maquinas/seekrieg/cfg_producao.json --size 1600x900"
if modo == "stills":
    B = {b["id"]: b for b in plano["batidas"]}
    jobs = []
    for i in sys.argv[2:]:
        b = B[i]; tm = round((b["v0"] + b["v1"]) / 2, 3)
        jobs.append({"nome": i, "faixa": "3d", "cwd": V, "cmd": f"{fila_g4.EGL} && node sims/capture.mjs seekrieg {CFG} --dpr 1.2 --still {tm} --out teardown-out/k16p/{i}.png 2>&1 | tail -1"})
    r = fila_g4.rodar(jobs)
    out = canal.exec_vm(f"cd {V}/teardown-out/k16p && tar -cf /content/teardown/res_k16p.tar *.png && echo OK", prazo=300)
    dest = os.path.join(K, "out", "prod"); os.makedirs(dest, exist_ok=True); tl = os.path.join(TMP, "k16p.tar")
    canal.baixar(f"{V}/res_k16p.tar", tl)
    with tarfile.open(tl) as tf: tf.extractall(dest)
    print("STILLS", dest, {k: v.get("estado") for k, v in r.items() if not k.startswith("_")}, r.get("_gpu"))
