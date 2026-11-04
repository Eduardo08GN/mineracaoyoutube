# Fila paralela da G4 (04/11/2026): o servidor da VM já roda vários jobs ao mesmo tempo (/exec devolve o id na hora);
# a serialização era só do orquestrador (canal.exec_vm espera cada um). Aqui o PC lança vários jobs, respeitando um limite
# por FAIXA e as dependências, e acompanha todos juntos. O porteiro entre sessões continua valendo (T2_DONO), isto é dentro
# da mesma sessão.
#   faixas: '3d' (stills/clipes do teardown, Chromium+WebGL), 'ia' (alinhamento, Depth Anything, voz), 'video' (encode/mix/legenda)
#   rodar(jobs): jobs = [{nome, faixa, cmd, cwd?, depois?: [nomes]}] -> {nome: {estado, rc, seg, cauda}}
#   fatias(...): os jobs de um render fatiado (N Chromium em paralelo, cada um num intervalo de quadros) + a junção sem recodificar
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import canal

FAIXAS = {"3d": 10, "ia": 2, "video": 4}   # 04/11 (Eduardo): placa de 96 GB com >= 80% em uso nas janelas de produção
META_USO = 0.80
EGL = ("mkdir -p /usr/share/glvnd/egl_vendor.d && echo '{\"file_format_version\":\"1.0.0\",\"ICD\":{\"library_path\":\"/usr/lib64-nvidia/libEGL_nvidia.so.0\"}}' > /usr/share/glvnd/egl_vendor.d/10_nvidia.json && "
       "rm -f /usr/share/glvnd/egl_vendor.d/50_mesa.json && export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH")


def lancar(cmd, cwd=None):
    return canal.req("POST", "/exec", json={"cmd": cmd, "cwd": cwd, "daemon": False}).json()["id"]


def medidor_ini():
    """Amostra a GPU a cada 5 s num arquivo da VM (job daemon), para o resumo de uso do lote."""
    canal.req("POST", "/exec", json={"cmd": "rm -f /content/gpu_uso.csv; nvidia-smi --query-gpu=memory.used,memory.total,utilization.gpu --format=csv,noheader,nounits -l 5 > /content/gpu_uso.csv", "cwd": None, "daemon": True})


def medidor_fim(log=canal.log):
    out = canal.exec_vm("pkill -f '[n]vidia-smi --query-gpu' ; cat /content/gpu_uso.csv", prazo=120)   # [n]: o padrão não casa com o próprio shell
    amostras = []
    for l in out.splitlines():
        p = [x.strip() for x in l.split(",")]
        if len(p) == 3 and all(x.replace(".", "").isdigit() for x in p): amostras.append(tuple(float(x) for x in p))
    if not amostras: log("MEDIDOR sem amostras"); return {}
    tot = amostras[0][1]
    r = {"vram_media": sum(a[0] for a in amostras) / len(amostras) / tot, "vram_pico": max(a[0] for a in amostras) / tot,
         "util_media": sum(a[2] for a in amostras) / len(amostras) / 100, "util_pico": max(a[2] for a in amostras) / 100, "amostras": len(amostras)}
    log("MEDIDOR GPU: VRAM média {vram_media:.0%} pico {vram_pico:.0%} | utilização média {util_media:.0%} pico {util_pico:.0%} ({amostras} amostras)".format(**r)
        + ("" if max(r["vram_media"], r["util_media"]) >= META_USO else f"  ABAIXO DA META {META_USO:.0%}: subir fatias/paralelismo no próximo lote"))
    return r


def rodar(jobs, faixas=None, prazo=7200, estagnacao=900, log=canal.log, medir=True):
    lim = {**FAIXAS, **(faixas or {})}
    if medir: medidor_ini()
    pend, ativos, feitos = list(jobs), {}, {}
    nomes = {j["nome"] for j in jobs}
    for j in jobs:
        for d in j.get("depois", []):
            if d not in nomes: raise SystemExit(f"FILA: dependência desconhecida {d} em {j['nome']}")
    t0 = time.time()
    while pend or ativos:
        for j in list(pend):
            deps = j.get("depois", [])
            if any(feitos.get(d, {}).get("estado") in ("falhou", "pulado") for d in deps):
                pend.remove(j); feitos[j["nome"]] = {"estado": "pulado", "cauda": "dependência falhou"}; log(f"FILA pulou {j['nome']}"); continue
            if any(d not in feitos for d in deps): continue
            if sum(1 for a in ativos.values() if a["faixa"] == j["faixa"]) >= lim.get(j["faixa"], 1): continue
            i = lancar(j["cmd"], j.get("cwd"))
            ativos[i] = {**j, "t": time.time(), "cauda": "", "mudou": time.time()}
            pend.remove(j); log(f"FILA lançou {j['nome']} [{j['faixa']}] job {i}")
        time.sleep(5)
        for i, a in list(ativos.items()):
            try: e = canal.req("GET", "/job", params={"id": i, "n": 1500}).json()
            except (SystemExit, ValueError) as x: log(f"ALERTA fila {a['nome']}: {str(x)[:90]}"); continue
            if e["cauda"] != a["cauda"]: a["cauda"], a["mudou"] = e["cauda"], time.time()
            seg = round(time.time() - a["t"])
            if e["estado"] != "rodando":
                feitos[a["nome"]] = {"estado": "falhou" if e["estado"] == "falhou" else "ok", "rc": e.get("rc"), "seg": seg, "cauda": e["cauda"][-1500:]}
                log(f"FILA {a['nome']} {feitos[a['nome']]['estado']} em {seg}s"); del ativos[i]
            elif time.time() - a["mudou"] > estagnacao or seg > prazo:
                feitos[a["nome"]] = {"estado": "falhou", "seg": seg, "cauda": "ESTAGNADO/PRAZO\n" + e["cauda"][-1200:]}
                log(f"ALERTA fila {a['nome']} estagnado/prazo (o processo pode seguir na VM)"); del ativos[i]
    log(f"FILA concluída em {round(time.time() - t0)}s: " + ", ".join(f"{n}={v['estado']}" for n, v in feitos.items()))
    if medir: feitos["_gpu"] = medidor_fim(log)
    return feitos


def fatias(nome, sim, cwd, ini, fim, n, saida, fps=24, extra="", depois=None):
    """Render fatiado: n jobs de captura em paralelo (faixa '3d'), cada um num intervalo de quadros contíguo (o render(t) é
    puro, então as partes encaixam quadro a quadro), e um job de junção (faixa 'video') com ffmpeg concat sem recodificar."""
    q0, q1 = round(ini * fps), round(fim * fps)
    cortes = [q0 + round((q1 - q0) * k / n) for k in range(n + 1)]
    pasta = f"teardown-out/_fatias_{nome}"
    jobs = []
    for k in range(n):
        a, b = cortes[k] / fps, cortes[k + 1] / fps
        jobs.append({"nome": f"{nome}_p{k}", "faixa": "3d", "cwd": cwd, "depois": list(depois or []),
                     "cmd": f"{EGL} && mkdir -p {pasta} && node sims/capture.mjs {sim} {extra} --fps {fps} --from {a:.6f} --to {b:.6f} --out {pasta}/p{k:02d}.mp4 2>&1 | tail -2"})
    lista = " ".join(f"p{k:02d}.mp4" for k in range(n))
    jobs.append({"nome": f"{nome}_junta", "faixa": "video", "cwd": cwd, "depois": [j["nome"] for j in jobs],
                 "cmd": f"cd {pasta} && rm -f lista.txt && for f in {lista}; do echo \"file '$f'\" >> lista.txt; done && "
                        f"ffmpeg -loglevel error -y -f concat -safe 0 -i lista.txt -c copy ../../{saida} && ffprobe -v error -show_entries format=duration -of csv=p=0 ../../{saida} && echo JUNTOU"})
    return jobs
