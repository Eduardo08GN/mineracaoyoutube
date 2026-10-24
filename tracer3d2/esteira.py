# Tracer3D 2.0 - esteira: executa as etapas de um video como grafo (DAG), em paralelo, com cache por hash e portoes.
# O Opus e o maestro: define as etapas (esteira.json do projeto), aprova os portoes e recebe o boletim. A esteira so executa.
#   python esteira.py rodar <projeto>            roda tudo que estiver pronto; para em cada portao esperando o OK
#   python esteira.py ok <projeto> <etapa>       o maestro aprova um portao (a esteira segue sozinha)
#   python esteira.py refazer <projeto> <etapa>  invalida a etapa (e as dependentes rodam de novo)
#   python esteira.py status <projeto>
# esteira.json: {"etapas": [{"id", "cmd", "deps": [], "entradas": [globs], "saidas": [caminhos], "portao": false,
#                            "tentativas": 1, "prazo_s": 3600}], "boletim_s": 300}
# Saida (o maestro escuta com Monitor): BOLETIM a cada boletim_s (uma linha), ALERTA na hora, PORTAO quando espera o OK.
import glob, hashlib, json, os, subprocess, sys, threading, time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


def carregar(proj):
    cfg = json.load(open(os.path.join(proj, "esteira.json"), encoding="utf-8"))
    d = os.path.join(proj, ".esteira"); os.makedirs(d, exist_ok=True)
    f = os.path.join(d, "estado.json")
    return cfg, d, f, (json.load(open(f)) if os.path.exists(f) else {})


def assinatura(proj, e):
    h = hashlib.sha1(e["cmd"].encode())
    for g in e.get("entradas", []):
        for f in sorted(glob.glob(os.path.join(proj, g), recursive=True)):
            if os.path.isfile(f):
                st = os.stat(f); h.update(f"{f}|{st.st_size}|{st.st_mtime_ns}".encode())
    return h.hexdigest()


def linha(tag, txt):
    print(f"{time.strftime('%H:%M:%S')} {tag} {txt}", flush=True)


def rodar(proj):
    cfg, d, festado, est = carregar(proj)
    etapas = {e["id"]: e for e in cfg["etapas"]}
    trava = threading.Lock(); vivos = {}

    def salvar():
        with trava: json.dump(est, open(festado, "w"), indent=1)

    def feita(i):
        e = etapas[i]; s = est.get(i, {})
        ok = s.get("estado") == "ok" and s.get("sig") == assinatura(proj, e) and all(os.path.exists(os.path.join(proj, x)) for x in e.get("saidas", []))
        return ok and (not e.get("portao") or os.path.exists(os.path.join(d, f"ok_{i}")))

    def executar(i):
        e = etapas[i]; logf = os.path.join(d, f"{i}.log")
        for t in range(1, e.get("tentativas", 1) + 1):
            est[i] = {"estado": "rodando", "t0": time.time(), "tentativa": t}; salvar()
            with open(logf, "wb") as lg:
                p = subprocess.Popen(e["cmd"], shell=True, cwd=proj, stdout=lg, stderr=subprocess.STDOUT)
                try: rc = p.wait(timeout=e.get("prazo_s", 3600))
                except subprocess.TimeoutExpired:
                    subprocess.run(f"taskkill /T /F /PID {p.pid}", shell=True, capture_output=True); rc = "prazo"
            if rc == 0 and all(os.path.exists(os.path.join(proj, x)) for x in e.get("saidas", [])):
                est[i] = {"estado": "ok", "sig": assinatura(proj, e), "seg": int(time.time() - est[i]["t0"])}; salvar()
                linha("PORTAO" if e.get("portao") else "FEITO", f"{i} ({est[i]['seg']} s)" + (f" -> aprovar: esteira.py ok {proj} {i}" if e.get("portao") else ""))
                return
            cauda = open(logf, encoding="utf-8", errors="replace").read()[-600:].replace("\n", " | ")
            linha("ALERTA", f"{i} falhou (rc={rc}, tentativa {t}/{e.get('tentativas', 1)}): {cauda}")
        est[i] = {"estado": "falhou"}; salvar()

    ultimo_bol = 0
    while True:
        for i, e in etapas.items():
            if i in vivos and not vivos[i].is_alive(): del vivos[i]
            if i in vivos or feita(i) or est.get(i, {}).get("estado") in ("falhou",): continue
            if est.get(i, {}).get("estado") == "ok" and e.get("portao") and est[i].get("sig") == assinatura(proj, e): continue  # esperando OK
            if all(feita(x) for x in e.get("deps", [])):
                vivos[i] = threading.Thread(target=executar, args=(i,), daemon=True); vivos[i].start()
                linha("INICIO", i)
        if time.time() - ultimo_bol >= cfg.get("boletim_s", 300):
            ultimo_bol = time.time(); linha("BOLETIM", resumo(proj, etapas, est, d))
        if not vivos:
            pend = [i for i in etapas if not feita(i)]
            if not pend: linha("FIM", "todas as etapas feitas"); return
            esperando = [i for i in pend if est.get(i, {}).get("estado") == "ok"]
            falhas = [i for i in pend if est.get(i, {}).get("estado") == "falhou"]
            if falhas and not esperando:
                linha("PARADA", f"falharam: {falhas} (corrija e rode 'refazer')"); return
            if esperando and not any(os.path.exists(os.path.join(d, f"ok_{i}")) for i in esperando):
                time.sleep(5); continue      # parada em portao: segue sozinha quando o maestro der o OK
        time.sleep(2)


def resumo(proj, etapas, est, d):
    partes = []
    for i in etapas:
        s = est.get(i, {}).get("estado", "-")
        if s == "rodando": s = f"rodando {int(time.time() - est[i]['t0'])}s"
        if s == "ok" and etapas[i].get("portao") and not os.path.exists(os.path.join(d, f"ok_{i}")): s = "PORTAO"
        partes.append(f"{i}:{s}")
    return " · ".join(partes)


if __name__ == "__main__":
    c, proj = sys.argv[1], sys.argv[2]
    if c == "rodar": rodar(proj)
    elif c == "ok": open(os.path.join(proj, ".esteira", f"ok_{sys.argv[3]}"), "w").write(time.strftime("%c")); print("aprovado", sys.argv[3])
    elif c == "refazer":
        cfg, d, f, est = carregar(proj); est.pop(sys.argv[3], None); json.dump(est, open(f, "w"), indent=1)
        p = os.path.join(d, f"ok_{sys.argv[3]}"); os.path.exists(p) and os.remove(p); print("invalidada", sys.argv[3])
    elif c == "status":
        cfg, d, f, est = carregar(proj); print(resumo(proj, {e["id"]: e for e in cfg["etapas"]}, est, d))
