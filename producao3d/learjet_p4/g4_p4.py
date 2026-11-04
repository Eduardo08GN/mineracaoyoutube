# Learjet parte 4: batedor dos elementos novos NA G4, tudo em paralelo pela fila (faixa '3d'): N stills + 1 clipe por
# tomada + a folha de contato. O PC só orquestra. Reaproveita o preparo da prova (g4_prova.py) quando a VM já o tem.
# Uso: python -I g4_p4.py batedor
import os, sys, tarfile
os.environ.setdefault("T2_DONO", "learjet_p4"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal, fila_g4
AQ = os.path.dirname(os.path.abspath(__file__)); P4 = os.path.dirname(AQ); V = "/content/teardown"; TMP = os.environ["TEMP"]
modo = sys.argv[1] if len(sys.argv) > 1 else "batedor"
try: canal.saude()
except SystemExit: canal.ligar()

# 1) teardown + assets da prova na VM (se a VM for nova, roda o preparo inteiro da prova)
tem = canal.exec_vm(f"test -f {V}/.ok -a -s /content/lj_assets/learjet.glb -a -d {V}/node_modules/n8ao && echo SIM || echo NAO", prazo=60).strip().splitlines()[-1]
if tem != "SIM":
    import subprocess
    r = subprocess.run([sys.executable, "-I", "D:/reconstruccion/08_prova_teardown/g4_prova.py", "--sem-filme"], env=dict(os.environ), timeout=5400)
    if r.returncode: raise SystemExit("PREPARO_FALHOU")

# 2) sobe a cena e builda uma vez
tar = os.path.join(TMP, "td_lj_p4.tar")
with tarfile.open(tar, "w") as t: t.add(os.path.join(AQ, "learjet_p4"), arcname="learjet_p4")
canal.subir(tar, f"{V}/maq_lj_p4.tar")
out = canal.exec_vm(f"cd {V} && rm -rf maquinas/learjet_p4 && tar -xf maq_lj_p4.tar -C maquinas && mkdir -p maquinas/learjet_p4/assets teardown-out/p4 && "
                    f"cp /content/lj_assets/*.glb /content/lj_assets/*.hdr maquinas/learjet_p4/assets/ && rm -f teardown-out/p4/* && "
                    f"node sims/build.mjs ./maquinas/learjet_p4 2>&1 | tail -3 && echo BUILD_OK", prazo=900)
print(out[-600:])
if "BUILD_OK" not in out: raise SystemExit("BUILD_FALHOU")

# 3) o lote: 3 stills por tomada (início/meio/fim da ação) + 1 clipe por tomada, todos ao mesmo tempo
TOMADAS = [("C1_raiox", 0.0, 5.0), ("C2_trim", 5.0, 6.0), ("C3_profundor", 11.0, 6.0), ("A1_altimetros", 17.0, 6.5), ("M1_faixa", 23.5, 6.5)]
CAP = "node sims/capture.mjs learjet_p4 --config maquinas/learjet_p4/cfg_acab.json --size 1600x900"
jobs = []
for nome, t0, d in TOMADAS:
    for j, f in enumerate((0.3, 0.6, 0.92)):
        tm = round(t0 + d * f, 2)
        jobs.append({"nome": f"{nome}_{j}", "faixa": "3d", "cwd": V, "cmd": f"{fila_g4.EGL} && {CAP} --dpr 1.2 --still {tm} --out teardown-out/p4/{nome}_{j}.png 2>&1 | tail -1"})
    jobs.append({"nome": f"{nome}_clip", "faixa": "3d", "cwd": V, "cmd": f"{fila_g4.EGL} && {CAP} --dpr 1 --fps 24 --from {t0} --to {round(t0 + d - 0.01, 2)} --out teardown-out/p4/{nome}.mp4 2>&1 | tail -1"})
pngs = " ".join(f"{n}_{j}.png" for n, _, _ in TOMADAS for j in range(3))
jobs.append({"nome": "folha", "faixa": "video", "cwd": f"{V}/teardown-out/p4", "depois": [j["nome"] for j in jobs if not j["nome"].endswith("_clip")],
             "cmd": f"set -o pipefail; ffmpeg -loglevel error -y $(for f in {pngs}; do echo -i $f; done) -filter_complex \""
                    + "".join(f"[{i}:v]scale=533:300[v{i}];" for i in range(15)) + "".join(f"[v{i}]" for i in range(15)) + "xstack=inputs=15:layout="
                    + "|".join(f"{(i % 3) * 533}_{(i // 3) * 300}" for i in range(15)) + "\" folha_p4.jpg && echo FOLHA_OK"})
r = fila_g4.rodar(jobs, faixas={"3d": len(jobs), "video": 1}, prazo=3600, estagnacao=900)
falhas = {k: v.get("cauda", "")[-300:] for k, v in r.items() if not k.startswith("_") and v.get("estado") != "ok"}
print("FALHAS", falhas, "GPU", r.get("_gpu"))
canal.exec_vm(f"cd {V}/teardown-out/p4 && tar -cf /content/teardown/res_p4.tar * && echo OK", prazo=300)
dest = os.path.join(P4, "out", "batedor"); os.makedirs(dest, exist_ok=True); tl = os.path.join(TMP, "res_p4.tar")
canal.baixar(f"{V}/res_p4.tar", tl)
with tarfile.open(tl) as tf: tf.extractall(dest)
print("BATEDOR", dest, sorted(os.listdir(dest)))
