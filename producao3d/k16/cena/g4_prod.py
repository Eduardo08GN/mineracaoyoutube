# K16 produção NA G4 pela fila paralela: sobe a cena, builda uma vez, e roda os stills/clipes em paralelo (faixa '3d').
# Uso: python -I g4_prod.py stills <id_batida> [...]    (still no meio de cada batida do plano.json)
#      python -I g4_prod.py video [fatias]               (o vídeo inteiro, fatiado, 10 bits)
import json, os, sys, tarfile
os.environ.setdefault("T2_DONO", "k16"); os.environ.setdefault("TEMP", "D:/tmp")
sys.path.insert(0, r"D:\tracer3d2"); import canal, fila_g4
AQ = os.path.dirname(os.path.abspath(__file__)); K = r"D:\kriegschronik\k16_seekrieg"; V = "/content/teardown"; TMP = os.environ["TEMP"]
modo = sys.argv[1]
FONTE = "/content/fontes/node_modules/@fontsource/barlow-condensed/files/barlow-condensed-latin-600-normal.woff2"   # fonte do mapa (OFL)
plano = json.load(open(os.path.join(AQ, "seekrieg", "plano.json"), encoding="utf-8"))
try: canal.saude()
except SystemExit: canal.ligar()
tar = os.path.join(TMP, "td_k16.tar")
with tarfile.open(tar, "w") as t: t.add(os.path.join(AQ, "seekrieg"), arcname="seekrieg")
canal.subir(tar, f"{V}/maq_k16.tar")
print(canal.exec_vm(f"cd {V} && rm -rf maquinas/seekrieg && tar -xf maq_k16.tar -C maquinas && mkdir -p maquinas/seekrieg/assets teardown-out/k16p && "
                    f"cp /content/k16_assets/*.glb /content/k16_assets/*.hdr maquinas/seekrieg/assets/ && "
                    f"(test -s {FONTE} || (mkdir -p /content/fontes && cd /content/fontes && npm install --no-audit --no-fund @fontsource/barlow-condensed@5 > npm.log 2>&1)) && cp {FONTE} maquinas/seekrieg/assets/barlow_cond_600.woff2 && "
                    f"node sims/build.mjs ./maquinas/seekrieg 2>&1 | tail -2", prazo=900)[-300:])
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

if modo == "video":
    # render final fatiado: N Chromium em paralelo, 1440p (dpr 1.6), 6 subquadros (mesmo obturador no vídeo inteiro), x264 10 bits
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 24
    canal.subir(os.path.join(AQ, "seekrieg", "cfg_final.json"), f"{V}/maquinas/seekrieg/cfg_final.json")
    extra = "--config maquinas/seekrieg/cfg_final.json --size 1600x900 --dpr 1.6 --pixfmt yuv420p10le --crf 15"
    jobs = fila_g4.fatias("k16final", "seekrieg", V, 0, plano["dur"], n, "teardown-out/k16_final_mudo.mp4", extra=extra)
    r = fila_g4.rodar(jobs, faixas={"3d": n}, prazo=7200, estagnacao=1500)
    falhas = [k for k, v in r.items() if not k.startswith("_") and v.get("estado") != "ok"]
    if falhas: raise SystemExit(f"FATIAS_FALHARAM {falhas}: " + r[falhas[0]].get("cauda", "")[-800:])
    dest = os.path.join(K, "render"); os.makedirs(dest, exist_ok=True)
    canal.baixar(f"{V}/teardown-out/k16_final_mudo.mp4", os.path.join(dest, "RENDER_MUDO_NAO_PUBLICAR_k16.mp4"))
    print("VIDEO_OK", r.get("_gpu"))
