# K16 Seekrieg: cena no teardown NA G4; o PC só orquestra (mesmo esqueleto do g4_prova.py do Learjet).
# Uso: python -I g4_k16.py <modo> [--sem-prep] [--clip]
#   diag    : still de diagnóstico do navio (cada material numa cor, 4 vistas + folha)
#   batedor : stills do batedor (definidos no film.js pelo TS do modo)
import json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "k16"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
AQ = os.path.dirname(os.path.abspath(__file__)); TD = r"D:\pesquisa_nichos\teardown"; V = "/content/teardown"
K = r"D:\kriegschronik\k16_seekrieg"; TMP = os.environ["TEMP"]
MODO = sys.argv[1] if len(sys.argv) > 1 else "diag"
try: canal.saude()
except SystemExit: canal.ligar()

ok = canal.exec_vm(f"test -f {V}/.ok && echo SIM || echo NAO", prazo=60).strip().splitlines()[-1]
if ok != "SIM":
    tar = os.path.join(TMP, "teardown_repo.tar")
    with tarfile.open(tar, "w") as t:
        for d in os.listdir(TD):
            if d not in (".git", "node_modules", "teardown-out"): t.add(os.path.join(TD, d), arcname=d)
    canal.subir(tar, f"{V}/repo.tar")
    out = canal.exec_vm(f"mkdir -p {V} && cd {V} && tar -xf repo.tar && (npm install --no-audit --no-fund > npm.log 2>&1) && (npx playwright install --with-deps chromium > pw.log 2>&1) && touch .ok && echo PRONTO", prazo=1800, estagnacao=900)
    if "PRONTO" not in out: raise SystemExit("TEARDOWN_SETUP_FALHOU " + out[-600:])
else:
    for f in ("paths.mjs", os.path.join("sims", "build.mjs"), os.path.join("sims", "capture.mjs")):
        canal.subir(os.path.join(TD, f), f"{V}/{f.replace(os.sep, '/')}")

if "--sem-prep" not in sys.argv:
    tar = os.path.join(TMP, "k16_brutos.tar")
    with tarfile.open(tar, "w") as t:
        t.add(os.path.join(K, "assets", "sketchfab", "hdms_danmark_e8abf7"), arcname="navio")
        t.add(os.path.join(AQ, "prep_k16.mjs"), arcname="prep_k16.mjs")
    canal.subir(tar, "/content/k16_brutos.tar")
    out = canal.exec_vm("mkdir -p /content/k16_brutos /content/k16_assets /content/gt && cd /content/k16_brutos && tar -xf ../k16_brutos.tar && "
                        "cd /content/gt && (test -d node_modules/@gltf-transform/functions || npm install --no-audit --no-fund @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions > npm.log 2>&1) && "
                        "cp /content/k16_brutos/prep_k16.mjs . && node prep_k16.mjs /content/k16_brutos /content/k16_assets 2>&1 | tail -5", prazo=1800, estagnacao=600)
    print(out[-800:])

tem_hdr = canal.exec_vm("test -f /content/k16_assets/sky.hdr && echo SIM || echo NAO", prazo=60).strip().splitlines()[-1]
if tem_hdr != "SIM": canal.subir("D:/reconstruccion/06_greenacres_p2/blender/assets/kloofendal_overcast_puresky_4k.hdr", "/content/k16_assets/sky.hdr")
out = canal.exec_vm(f"cd {V} && (test -d node_modules/n8ao -a -d node_modules/postprocessing -a -d node_modules/gsap || npm install --no-audit --no-fund --legacy-peer-deps --no-save n8ao@2.0.1 postprocessing@6.39.6 gsap@3.13.0 > npm_n8ao.log 2>&1) && "
                    f"(test -s /content/k16_assets/storm.hdr || curl -sL -o /content/k16_assets/storm.hdr https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/wasteland_clouds_puresky_2k.hdr) && "
                    f"ls node_modules/n8ao > /dev/null && ls -la /content/k16_assets && echo DEPS_OK", prazo=1200, estagnacao=600)
print(out[-600:])
if "DEPS_OK" not in out: raise SystemExit("DEPS_FALHOU")

tar = os.path.join(TMP, "td_k16.tar")
with tarfile.open(tar, "w") as t: t.add(os.path.join(AQ, "seekrieg"), arcname="seekrieg")
canal.subir(tar, f"{V}/maq_k16.tar")
EGL = ("mkdir -p /usr/share/glvnd/egl_vendor.d && echo '{\"file_format_version\":\"1.0.0\",\"ICD\":{\"library_path\":\"/usr/lib64-nvidia/libEGL_nvidia.so.0\"}}' > /usr/share/glvnd/egl_vendor.d/10_nvidia.json && "
       "rm -f /usr/share/glvnd/egl_vendor.d/50_mesa.json && export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH")
TS = {"diag": [0.5, 1.5, 2.5, 3.5], "batedor": [2.0, 6.0, 10.0, 14.5]}[MODO]
CFG = f"--config maquinas/seekrieg/cfg_{MODO}.json"
caps = " && ".join(f"node sims/capture.mjs seekrieg {CFG} --size 1600x900 --dpr 1.2 --still {s} --out teardown-out/k16_{MODO}_{s}.png 2>&1 | tail -1" for s in TS)
folha = f"node sims/capture.mjs seekrieg {CFG} --size 1600x900 --dpr 0.6 --stills {','.join(map(str, TS))} --cols 2 --out teardown-out/k16_{MODO}_folha.png 2>&1 | tail -2"
# --clip: o movimento (chegada/saída, zoom, troca de ângulo) não aparece em still; vídeo 24 fps com subquadros e 10 bits
if "--clip" in sys.argv:
    caps += f" && node sims/capture.mjs seekrieg --config maquinas/seekrieg/cfg_{MODO}_clip.json --fps 24 --pixfmt yuv420p10le --crf 16 --size 1600x900 --dpr 1.2 --out teardown-out/k16_{MODO}_clip.mp4 2>&1 | tail -1"
cmd = (f"cd {V} && mkdir -p maquinas teardown-out && rm -rf maquinas/seekrieg teardown-out/k16_* && tar -xf maq_k16.tar -C maquinas && mkdir -p maquinas/seekrieg/assets && "
       f"cp /content/k16_assets/*.glb /content/k16_assets/*.hdr maquinas/seekrieg/assets/ && {EGL} && "
       f"node sims/build.mjs ./maquinas/seekrieg 2>&1 | tail -3 && {folha} && {caps}; "
       f"cd teardown-out && ls -la k16_* && tar -cf /content/teardown/res_k16.tar k16_*.png $(ls k16_*.mp4 2>/dev/null) && echo FEITO")
out = canal.exec_vm(cmd, prazo=3600, estagnacao=900); print(out[-2500:])
if "FEITO" not in out: raise SystemExit("CAPTURA_FALHOU")
dest = os.path.join(K, "out"); os.makedirs(dest, exist_ok=True); t = os.path.join(TMP, "k16_res.tar")
canal.baixar(f"{V}/res_k16.tar", t)
with tarfile.open(t) as tf: tf.extractall(dest)
canal.log("MARCO K16", MODO, dest)
