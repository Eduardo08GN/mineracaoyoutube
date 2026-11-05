# K17 v2: renderiza os takes 3D de ação NA G4 (teardown, 1920x1080 = 1600x900 @ dpr 1.2, 30 fps), todos em paralelo pela fila,
# e baixa para v1/public/aktion/<take>.mp4. Uso: python -I g4_aktion.py [take ...]
import json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "k17v2"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal, fila_g4
K2 = r"D:\kriegschronik\k17_v2"; A = os.path.join(K2, "aktion"); V = "/content/teardown"; TMP = os.environ["TEMP"]
TAKES = sys.argv[1:] or sorted(f[4:-5] for f in os.listdir(A) if f.startswith("cfg_"))
try: canal.saude()
except SystemExit: canal.ligar()
tem = canal.exec_vm(f"test -f {V}/.ok -a -d {V}/node_modules/gsap && echo SIM || echo NAO", prazo=60).strip().splitlines()[-1]
if tem != "SIM":
    import subprocess
    subprocess.run([sys.executable, "-I", "D:/reconstruccion/08_prova_teardown/g4_prova.py", "--sem-filme", "--sem-prep"], env=dict(os.environ), timeout=5400)
tar = os.path.join(TMP, "td_aktion.tar")
with tarfile.open(tar, "w") as t:
    t.add(A, arcname="aktion", filter=lambda x: None if "dev_stein" in x.name else x)
canal.subir(tar, f"{V}/aktion.tar")
out = canal.exec_vm(f"cd {V} && rm -rf maquinas/aktion && tar -xf aktion.tar && mv aktion maquinas/ && mkdir -p teardown-out/aktion && "
                    "set -o pipefail; node sims/build.mjs ./maquinas/aktion > build_aktion.log 2>&1 || { tail -8 build_aktion.log; exit 1; }; echo BUILD_OK", prazo=1200)
print(out[-600:])
if "BUILD_OK" not in out: raise SystemExit("BUILD_FALHOU")
jobs = [{"nome": tk, "faixa": "3d", "cwd": V,
         "cmd": f"{fila_g4.EGL} && node sims/capture.mjs aktion --config maquinas/aktion/cfg_{tk}.json --size 1600x900 --dpr 1.2 --fps 30 --pixfmt yuv420p --crf 16 --out teardown-out/aktion/{tk}.mp4 2>&1 | tail -1"}
        for tk in TAKES]
r = fila_g4.rodar(jobs, faixas={"3d": 12}, prazo=5400, estagnacao=1500)
falhas = {k: v.get("cauda", "")[-400:] for k, v in r.items() if not k.startswith("_") and v.get("estado") != "ok"}
print("FALHAS", falhas, "GPU", r.get("_gpu"))
ok = [tk for tk in TAKES if tk not in falhas]
canal.exec_vm(f"cd {V}/teardown-out/aktion && tar -cf ../aktion_res.tar " + " ".join(f"{tk}.mp4" for tk in ok) + " && echo OK", prazo=600)
tl = os.path.join(TMP, "aktion_res.tar"); canal.baixar(f"{V}/teardown-out/aktion_res.tar", tl)
dest = os.path.join(K2, "v1", "public", "aktion"); os.makedirs(dest, exist_ok=True)
with tarfile.open(tl) as tf: tf.extractall(dest)
print("AKTION_OK", ok)
if falhas: raise SystemExit("ALGUNS_FALHARAM")
