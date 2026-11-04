# Prova da stack nova do avião (teardown) NA G4; o PC só orquestra.
# 1) prepara o teardown na VM (uma vez por VM); 2) sobe os prontos brutos e roda prep.mjs (gltf-transform) lá;
# 3) sobe a cena (learjet/), builda e captura a folha das 6 tomadas, 6 quadros cheios 1920x1080 e o filme; 4) baixa.
# Uso: python -I g4_prova.py [--sem-filme] [--sem-prep] [--acabamento]
import json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "prova_lj"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal
AQ = os.path.dirname(os.path.abspath(__file__)); TD = r"D:\pesquisa_nichos\teardown"; V = "/content/teardown"
TMP = os.environ["TEMP"]
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
    canal.subir(os.path.join(TD, "paths.mjs"), f"{V}/paths.mjs")

if "--sem-prep" not in sys.argv:
    tar = os.path.join(TMP, "lj_brutos.tar")
    with tarfile.open(tar, "w") as t:
        t.add(r"D:\reconstruccion\assets\sketchfab\learjet45_chapado", arcname="learjet")   # Learjet 45 do Reconstructed (rammgraffic, CC-BY) com atlas chapado
        t.add(r"D:\reconstruccion\06_greenacres_p2\blender\assets\greenacres_2km.glb", arcname="greenacres_2km.glb")
        t.add(r"D:\reconstruccion\06_greenacres_p2\blender\assets\naip_greenacres_3km.jpg", arcname="naip_greenacres_3km.jpg")
        t.add(r"D:\reconstruccion\07_greenacres_p3\dados\naip\naip_queda.jpg", arcname="naip_queda.jpg")
        q = os.path.join(TMP, "naip_queda.json")
        js = open(os.path.join(AQ, "learjet", "adsb.js"), encoding="utf-8").read()
        json.dump(json.loads(js.split("export const NAIP_QUEDA = ")[1].split(";")[0]), open(q, "w")); t.add(q, arcname="naip_queda.json")
        t.add(os.path.join(AQ, "prep.mjs"), arcname="prep.mjs")
    canal.subir(tar, "/content/lj_brutos.tar")
    out = canal.exec_vm("mkdir -p /content/lj_brutos /content/lj_assets /content/gt && cd /content/lj_brutos && tar -xf ../lj_brutos.tar && "
                        "cd /content/gt && (test -d node_modules/@gltf-transform/functions || npm install --no-audit --no-fund @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions > npm.log 2>&1) && "
                        "cp /content/lj_brutos/prep.mjs . && node prep.mjs /content/lj_brutos /content/lj_assets 2>&1 | tail -8", prazo=1800, estagnacao=600)
    print(out[-800:])
    if "PREP_OK" not in out: raise SystemExit("PREP_FALHOU")

# pacotes prontos da takram (nuvens/atmosfera) + postprocessing na VM, o build.mjs com os loaders novos, STBN e HDRI
canal.subir(os.path.join(TD, "sims", "build.mjs"), f"{V}/sims/build.mjs")
STBN = "https://media.githubusercontent.com/media/takram-design-engineering/three-geospatial/9627216cc50057994c98a2118f3c4a23765d43b9/packages/core/assets/stbn.bin"
tem_hdr = canal.exec_vm("test -f /content/lj_assets/sky.hdr && echo SIM || echo NAO", prazo=60).strip().splitlines()[-1]
if tem_hdr != "SIM": canal.subir("D:/reconstruccion/06_greenacres_p2/blender/assets/kloofendal_overcast_puresky_4k.hdr", "/content/lj_assets/sky.hdr")
# 04/11: takram fora (reprovado); só n8ao + postprocessing, numa chamada (npm --no-save apaga o que foi instalado antes sem salvar)
out = canal.exec_vm(f"cd {V} && (test -d node_modules/n8ao -a -d node_modules/postprocessing -a -d node_modules/gsap || npm install --no-audit --no-fund --legacy-peer-deps --no-save n8ao@2.0.1 postprocessing@6.39.6 gsap@3.13.0 > npm_n8ao.log 2>&1) && "
                    f"(test -s /content/lj_assets/storm.hdr || curl -sL -o /content/lj_assets/storm.hdr https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/wasteland_clouds_puresky_2k.hdr) && "
                    f"ls node_modules/n8ao > /dev/null && ls -la /content/lj_assets && echo TAKRAM_OK", prazo=1200, estagnacao=600)
print(out[-900:])
if "TAKRAM_OK" not in out: raise SystemExit("TAKRAM_FALHOU")
tar = os.path.join(TMP, "td_learjet.tar")
with tarfile.open(tar, "w") as t: t.add(os.path.join(AQ, "learjet"), arcname="learjet")
canal.subir(tar, f"{V}/maq_learjet.tar")
TS = [2.2, 6.7, 11.4, 15.3, 17.1, 21.4, 24.5]   # uma por tomada (A, B, C, D brilho, D solta, E); a F (mapa) vai para o Remotion
caps = " && ".join(f"node sims/capture.mjs learjet --size 1600x900 --dpr 1.2 --still {s} --out teardown-out/lj_{s}.png 2>&1 | tail -2" for s in TS)
# teste A/B: as mesmas tomadas com o Learjet 45 do Sketchfab (o do Reconstructed) na receita nova
caps_sf = " && ".join(f"node sims/capture.mjs learjet --config maquinas/learjet/cfg_sf.json --size 1600x900 --dpr 1.2 --still {s} --out teardown-out/lj_sf_{s}.png 2>&1 | tail -1" for s in (2.2, 6.7, 24.5))
filme = "" if "--sem-filme" in sys.argv else " && node sims/capture.mjs learjet --size 1600x900 --dpr 1.2 --out teardown-out/lj_filme.mp4 2>&1 | tail -3"
# batedor de acabamento (04/11): ANTES = o atual (60 fps, 1 amostra, 8 bits); DEPOIS = 24 fps, obturador de 180° com
# 12 subquadros (motion blur + supersampling), grão fino, vinheta leve, x264 10 bits. Trechos: mergulho e soltura do profundor.
if "--acabamento" in sys.argv:
    CA = "--config maquinas/learjet/cfg_acab.json --fps 24 --pixfmt yuv420p10le --crf 14"
    pares = []
    for nome, a0, a1 in (("mergulho", 9.0, 13.5), ("profundor", 13.5, 17.5)):
        pares.append(f"node sims/capture.mjs learjet --size 1600x900 --dpr 1.2 --from {a0} --to {a1} --out teardown-out/lj_acab_{nome}_antes.mp4 2>&1 | tail -1")
        pares.append(f"node sims/capture.mjs learjet {CA} --size 1600x900 --dpr 1.2 --from {a0} --to {a1} --out teardown-out/lj_acab_{nome}_depois.mp4 2>&1 | tail -1")
        # lado a lado (antes | depois) em 24 fps, para o Eduardo ver
        pares.append(f"ffmpeg -loglevel error -y -i teardown-out/lj_acab_{nome}_antes.mp4 -i teardown-out/lj_acab_{nome}_depois.mp4 -filter_complex "
                     f"\"[0:v]fps=24,scale=960:-2[a];[1:v]scale=960:-2[b];[a][b]hstack\" -c:v libx264 -crf 16 -pix_fmt yuv420p teardown-out/lj_acab_{nome}_lado.mp4")
    for st in (11.4, 15.3):
        pares.append(f"node sims/capture.mjs learjet --size 1600x900 --dpr 1.2 --still {st} --out teardown-out/lj_acab_{st}_antes.png 2>&1 | tail -1")
        pares.append(f"node sims/capture.mjs learjet --config maquinas/learjet/cfg_acab.json --size 1600x900 --dpr 1.2 --still {st} --out teardown-out/lj_acab_{st}_depois.png 2>&1 | tail -1")
    caps, caps_sf, filme = " && ".join(pares), "true", ""
    TS = [11.4]
cmd = (f"cd {V} && mkdir -p maquinas teardown-out && rm -rf maquinas/learjet && tar -xf maq_learjet.tar -C maquinas && mkdir -p maquinas/learjet/assets && "
       f"cp /content/lj_assets/*.glb /content/lj_assets/*.hdr maquinas/learjet/assets/ && mkdir -p /usr/share/glvnd/egl_vendor.d && echo '{{\"file_format_version\":\"1.0.0\",\"ICD\":{{\"library_path\":\"/usr/lib64-nvidia/libEGL_nvidia.so.0\"}}}}' > /usr/share/glvnd/egl_vendor.d/10_nvidia.json && rm -f /usr/share/glvnd/egl_vendor.d/50_mesa.json && export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH && "
       f"node sims/build.mjs ./maquinas/learjet 2>&1 | tail -3 && "
       f"node sims/capture.mjs learjet --size 1600x900 --dpr 0.6 --stills {','.join(map(str, TS))} --cols 3 --out teardown-out/lj_folha.png 2>&1 | tail -3 && {caps} && {caps_sf}{filme}; "
       f"cd teardown-out && ls -la lj_* && tar -cf /content/teardown/res_lj.tar lj_*.png $(ls lj_filme.mp4 lj_acab_*.mp4 2>/dev/null) && echo FEITO")
out = canal.exec_vm(cmd, prazo=3600, estagnacao=900); print(out[-2500:])
if "FEITO" not in out: raise SystemExit("CAPTURA_FALHOU")
dest = os.path.join(AQ, "out"); os.makedirs(dest, exist_ok=True); t = os.path.join(TMP, "lj_res.tar")
canal.baixar(f"{V}/res_lj.tar", t)
with tarfile.open(t) as tf: tf.extractall(dest)
canal.log("MARCO PROVA_LJ", dest)
