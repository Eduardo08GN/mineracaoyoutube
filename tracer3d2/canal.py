# Tracer3D 2.0 - canal PC <-> G4 por HTTP (porta-proxy do Colab). Substitui as celulas digitadas no Colab (~1-2 min por
# comando, uma por vez) por pedidos HTTP (~0,2 s, em paralelo). A unica celula da sessao e a que sobe o servidor.
#   python canal.py ligar                         liga a G4 (g4.py, com vigia) e sobe o servidor + vigia proprio
#   python canal.py preparar <projeto v1>         sincroniza o projeto por diferenca, npm na VM, sobe os stills quentes
#   python canal.py stills <projeto v1> <pasta> <seg> [<seg> ...]   [ESCALA=0.5]
#   python canal.py exec "<cmd>" [cwd] [prazo_s]  roda na VM com batimento e corte por estagnacao
#   python canal.py render <projeto v1> <ini_s> <fim_s> <destino.mp4>   (mp4 MUDO: nome tem que dizer isso)
#   python canal.py garantir <projeto v1>       religa/prepara se a G4 caiu (stills chama sozinho)
#   python canal.py sync <projeto v1> [itens]     sobe o que mudou (ex.: public depois de adicionar dados)
#   python canal.py baixar <remoto> <local> | subir <local> <remoto> | saude | desligar
import base64, hashlib, io, json, os, subprocess, sys, tarfile, threading, time
from concurrent.futures import ThreadPoolExecutor
import requests

COLAB_DIR = os.environ.get("COLAB_DIR", os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "eddie3d", "ferramentas")); sys.path.insert(0, COLAB_DIR); sys.stdout.reconfigure(encoding="utf-8", errors="replace")
AQUI = os.path.dirname(os.path.abspath(__file__))
TMP = os.environ.get("T2_TMP", "D:/tmp")   # nunca no C: (disco cheio)
ESTADO = f"{TMP}/t2_canal.json"; CACHE_SHA = f"{TMP}/t2_sha.json"
G4 = os.environ.get("G4_PY", os.path.join(sys.path[0], "g4.py"))
PEDACO = 16 << 20
REMOTO = "/content/t2/proj"
ITENS = ["src", "public", "package.json", "remotion.config.ts", "tsconfig.json"]


def log(*a): print(time.strftime("%H:%M:%S"), *a, flush=True)


# ---------- transporte ----------
def _estado():
    return json.load(open(ESTADO)) if os.path.exists(ESTADO) else {}


def renovar_cookies():
    """A URL do proxy so abre com a sessao Google do navegador: abre uma aba nela e copia os cookies para o requests."""
    import colab
    from playwright.sync_api import sync_playwright
    e = _estado()
    with sync_playwright() as p:
        nb = colab.aba(p); pg = nb.context.new_page()
        try:
            pg.goto(e["url"], timeout=60000)
            e["cookies"] = {c["name"]: c["value"] for c in nb.context.cookies([e["url"]])}
        finally: pg.close()
    json.dump(e, open(ESTADO, "w"))
    return e


def req(metodo, rota, timeout=120, **kw):
    e = _estado()
    if "url" not in e: raise SystemExit("CANAL_SEM_URL: rode 'python canal.py ligar'")
    for tent in range(3):
        try:
            r = requests.request(metodo, e["url"].rstrip("/") + rota, cookies=e.get("cookies", {}), allow_redirects=False, timeout=timeout, **kw)
        except requests.ConnectionError as x:
            if tent == 2: raise SystemExit(f"CANAL_CAIU: {x}")
            time.sleep(3); continue
        if r.status_code in (301, 302, 303, 307, 401, 403) or "text/html" in r.headers.get("Content-Type", ""):
            e = renovar_cookies(); continue
        if r.status_code >= 500: raise SystemExit(f"VM_ERRO {rota}: {r.text[:800]}")
        return r
    raise SystemExit("CANAL_SEM_ACESSO: o proxy recusou mesmo com cookies novos (G4 desligada?)")


def saude():
    # G4 desligada por ociosidade: o proxy responde com uma pagina que nao e JSON -> tratar como fora do ar (garantir religa)
    try: return req("GET", "/saude", timeout=20).json()
    except ValueError: raise SystemExit("G4_FORA: o proxy respondeu sem JSON (runtime desligado)")


# ---------- arquivos ----------
def subir(local, remoto):
    tam = os.path.getsize(local)
    with open(local, "rb") as a:
        for o in range(0, max(tam, 1), PEDACO):
            a.seek(o); req("PUT", "/arq", params={"c": remoto, "o": o}, data=a.read(PEDACO), timeout=600)


def baixar(remoto, local):
    tam = req("GET", "/tam", params={"c": remoto}).json()["tam"]
    if tam < 0: raise SystemExit(f"NAO_EXISTE na VM: {remoto}")
    os.makedirs(os.path.dirname(os.path.abspath(local)), exist_ok=True); t0 = time.time()
    with open(local + ".parcial", "wb") as a:
        for o in range(0, tam, PEDACO):
            a.write(req("GET", "/arq", params={"c": remoto, "o": o, "n": PEDACO}, timeout=600).content)
            if time.time() - t0 > 60: log(f"BATIMENTO baixar: {o / tam:.0%}"); t0 = time.time()
    os.replace(local + ".parcial", local)
    if os.path.getsize(local) != tam: raise SystemExit("BAIXAR_INCOMPLETO")


def _sha_local(arqs):
    cache = json.load(open(CACHE_SHA)) if os.path.exists(CACHE_SHA) else {}
    out = {}
    for f in arqs:
        st = os.stat(f); k = f"{f}|{st.st_size}|{st.st_mtime_ns}"
        if k not in cache:
            h = hashlib.sha1()
            with open(f, "rb") as a:
                for b in iter(lambda: a.read(1 << 20), b""): h.update(b)
            cache[k] = h.hexdigest()
        out[f] = cache[k]
    json.dump(cache, open(CACHE_SHA, "w"))
    return out


def nome_proj(proj):
    """pasta na VM: <pai>_<projeto> (varios projetos se chamam v1)"""
    p = os.path.normpath(proj); return os.path.basename(os.path.dirname(p)) + "_" + os.path.basename(p)


def sincronizar(proj, itens=ITENS):
    """Sobe so o que falta ou mudou (sha1), 4 em paralelo. Retorna quantos subiram."""
    raiz = f"{REMOTO}/{nome_proj(proj)}"
    arqs = []
    for it in itens:
        p = os.path.join(proj, it)
        if os.path.isfile(p): arqs.append(p)
        for r, _, fs in os.walk(p):
            if "_previews" not in r: arqs += [os.path.join(r, f) for f in fs]
    sha = _sha_local(arqs)
    rel = {os.path.relpath(f, proj).replace("\\", "/"): h for f, h in sha.items()}
    faltam = req("POST", "/faltam", json={"raiz": raiz, "arquivos": rel}, timeout=300).json()["faltam"]
    mb = sum(os.path.getsize(os.path.join(proj, k)) for k in faltam) / 1e6
    if faltam: log(f"sincronizar: {len(faltam)} arquivos, {mb:.1f} MB")
    with ThreadPoolExecutor(4) as ex:
        list(ex.map(lambda k: subir(os.path.join(proj, k), f"{raiz}/{k}"), faltam))
    return raiz, len(faltam)


# ---------- jobs ----------
def exec_vm(cmd, cwd=None, prazo=3600, estagnacao=300, marca=None, daemon=False):
    """Roda na VM e acompanha: batimento a cada 60 s, aborta se o log parar por `estagnacao` s ou passar do prazo."""
    i = req("POST", "/exec", json={"cmd": cmd, "cwd": cwd, "daemon": daemon}).json()["id"]
    t0 = time.time(); bat = t0; ultimo = ""; mudou = t0
    while True:
        time.sleep(5)
        try: j = req("GET", "/job", params={"id": i, "n": 2000}).json()
        except ValueError: raise SystemExit(f"G4_FORA durante o job {i} (runtime caiu: limite de sessao do Colab?)")
        if j["cauda"] != ultimo: ultimo = j["cauda"]; mudou = time.time()
        if j["estado"] != "rodando":
            if j["estado"] == "falhou": raise SystemExit(f"JOB_FALHOU rc={j['rc']}:\n{j['cauda'][-1500:]}")
            return j["cauda"]
        if marca and marca in j["cauda"]: return j["cauda"]
        if time.time() - bat >= 60:
            bat = time.time(); log(f"BATIMENTO exec {j['seg']}s | {(j['cauda'].strip().splitlines() or [''])[-1][:100]}")
        if time.time() - mudou > estagnacao: raise SystemExit(f"JOB_ESTAGNADO ha {estagnacao}s:\n{j['cauda'][-1200:]}")
        if time.time() - t0 > prazo: raise SystemExit(f"JOB_PRAZO {prazo}s:\n{j['cauda'][-1200:]}")


# ---------- sessao ----------
# Roda como thread DENTRO do kernel (unico lugar onde runtime.unassign funciona). Desliga quando o servidor pede
# (DESLIGAR), quando ele registra ociosidade alem do limite, ou quando o servidor morreu (ocioso.txt parado ha 20 min).
VIGIA_KERNEL = """import threading, time, os
def _vigia_t2(limite=20 * 60):
    from google.colab import runtime
    t0 = time.time()
    while True:
        time.sleep(10)
        try:
            if os.path.exists('/content/t2/DESLIGAR'): runtime.unassign()
            f = '/content/t2/ocioso.txt'
            ref = os.path.getmtime(f) if os.path.exists(f) else t0
            if (os.path.exists(f) and int(open(f).read() or 0) > limite) or time.time() - ref > limite: runtime.unassign()
        except Exception: pass
if not any(t.name == 'vigia_t2' for t in threading.enumerate()):
    threading.Thread(target=_vigia_t2, name='vigia_t2', daemon=True).start()
"""

def conectar_runtime():
    """So conecta o runtime pelo botao do Colab (sem o vigia antigo do g4.py: a confirmacao dele travou 14 min em 24/10/2026;
    no 2.0 quem desliga por ociosidade e a vigia_t2 do kernel, instalada pela celula do canal logo em seguida)."""
    import re, colab
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        nb = colab.aba(p); nb.bring_to_front()
        try: colab.limpar(nb)
        except Exception: pass
        if not colab.conectado(nb):
            bt = [e for e in nb.locator("colab-connect-button").all() if e.is_visible()]
            (bt[0] if bt else nb.get_by_text(re.compile(r"^(Conectar|Reconectar|Connect|Reconnect)$")).first).click()
            for k in range(60):
                time.sleep(5)
                if colab.conectado(nb): break
                if k % 6 == 5: log(f"BATIMENTO ligar: conectando ha {(k + 1) * 5}s")
        if not colab.conectado(nb): raise SystemExit("G4_NAO_LIGOU: o runtime nao conectou em 5 min")
    log("runtime conectado")


def ligar():
    import colab
    conectar_runtime()
    arqs = {n: base64.b64encode(open(os.path.join(AQUI, "vm", n), "rb").read()).decode() for n in os.listdir(os.path.join(AQUI, "vm")) if os.path.isfile(os.path.join(AQUI, "vm", n))}
    cod = ("import base64, os, subprocess, time\nos.makedirs('/content/t2/vm', exist_ok=True)\n"
           f"for n, b in {arqs!r}.items(): open('/content/t2/vm/' + n, 'wb').write(base64.b64decode(b))\n"
           "subprocess.Popen('nohup python3 /content/t2/vm/servidor.py > /content/t2/servidor.log 2>&1 &', shell=True); time.sleep(2)\n"
           f"exec(base64.b64decode({base64.b64encode(VIGIA_KERNEL.encode()).decode()!r}).decode())\n"
           "from google.colab.output import eval_js\n"
           "print('URL=' + eval_js('google.colab.kernel.proxyPort(8765, {cache: false})') + '=FIM'); print('CANAL_PRONTO')")
    # colab.rodar travou 2x lendo a saida da celula (24/10/2026, 12 min parado com a celula ja pronta): roda num subprocesso
    # com prazo e, se estourar, le a URL direto do texto da pagina
    cf = f"{TMP}/t2_celula.py"; open(cf, "w", encoding="utf-8").write(cod)
    runner = (f"import sys; sys.path.insert(0, {COLAB_DIR!r}); import colab; "
              f"print(colab.rodar(open({cf!r}, encoding='utf-8').read(), 180, 'CANAL_PRONTO'))")
    try:
        out = subprocess.run([sys.executable, "-c", runner], capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=240).stdout
    except subprocess.TimeoutExpired:
        log("ALERTA rodar travou; lendo a URL direto da pagina"); out = ""
    if "URL=https://" not in out:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p: out = colab.aba(p).inner_text("body")
    # so vale "URL=https://...=FIM" da SAIDA (o codigo da celula tambem contem "URL=" e enganou o plano B em 24/10/2026)
    import re
    m = re.search(r"URL=(https://[^\s=]+)=FIM", out)
    if not m: raise SystemExit("CANAL_SEM_URL:\n" + out[-800:])
    json.dump({"url": m.group(1)}, open(ESTADO, "w"))
    renovar_cookies(); log("canal no ar:", saude())


def preparar(proj):
    """npm na VM em paralelo com a subida do projeto; depois sobe os stills quentes e espera ficarem prontos."""
    raiz = f"{REMOTO}/{nome_proj(proj)}"
    sincronizar(proj, ["package.json", "remotion.config.ts", "tsconfig.json"])
    npm = {}
    th = threading.Thread(target=lambda: npm.update(out=exec_vm(f"bash /content/t2/vm/preparar.sh {raiz}", prazo=1200, estagnacao=600)))
    th.start(); t0 = time.time()
    sincronizar(proj); log(f"projeto na VM em {time.time() - t0:.0f} s; esperando npm")
    th.join()
    if "NPM_OK" not in npm.get("out", ""): raise SystemExit("PREPARAR_FALHOU (npm)")
    exec_vm(f"export LD_LIBRARY_PATH=/usr/lib64-nvidia:$LD_LIBRARY_PATH; node /content/t2/vm/stills_quente.mjs {raiz}",
            cwd=raiz, prazo=900, estagnacao=600, marca="STILLS_QUENTE_PRONTO", daemon=True)
    log("stills quentes prontos")


def garantir(proj):
    """G4 caiu ou nao foi preparada? Religa e prepara sozinho (nunca cai para render local). Trava: so um processo mexe
    no Colab por vez; os outros esperam e reaproveitam."""
    def pronta():
        try: return saude().get("stills")
        except SystemExit: return False
    if pronta(): return
    trava = f"{TMP}/t2_garantir.lock"
    t0 = time.time()
    while True:
        try: os.mkdir(trava); break
        except FileExistsError:
            if time.time() - os.path.getmtime(trava) > 1800: os.rmdir(trava); continue
            if time.time() - t0 > 60 and int(time.time() - t0) % 60 < 5: log("BATIMENTO garantir: outro processo esta religando a G4")
            time.sleep(5)
            if pronta(): return
    try:
        if pronta(): return
        log("ALERTA G4 fora do ar: religando e preparando sozinho")
        try: saude(); vivo = True
        except SystemExit: vivo = False
        if not vivo: ligar()
        preparar(proj)
    finally: os.rmdir(trava)


def stills(proj, pasta, segundos, escala="0.5"):
    fps = json.load(open(os.path.join(proj, "src", "plano.json"), encoding="utf-8")).get("fps", 30)
    garantir(proj)
    sincronizar(proj, ["src"]); t0 = time.time()
    r = req("POST", "/stills", json={"quadros": [round(s * fps) for s in segundos], "escala": float(escala), "tag": pasta}, timeout=1800)
    destino = os.path.join(proj, "teste", pasta); os.makedirs(destino, exist_ok=True)
    with tarfile.open(fileobj=io.BytesIO(r.content)) as t:
        res = json.loads(t.extractfile("resumo.json").read())
        for m in t.getmembers():
            if m.name.endswith(".jpg"):
                q = int(m.name[:-4]); open(os.path.join(destino, f"t{q / fps:07.2f}.jpg"), "wb").write(t.extractfile(m).read())
    log(f"G4: {len(res['feitos'])} stills em {time.time() - t0:.1f} s (bundle {res['bundle_s']:.0f} s) -> {destino}")
    for f in res["falhas"]: print("FALHOU", f)


def render(proj, ini, fim, destino):
    """Render do trecho [ini, fim] (segundos) na G4, sem flicker (vm/render.sh), e download do mp4 MUDO para `destino`."""
    fps = json.load(open(os.path.join(proj, "src", "plano.json"), encoding="utf-8")).get("fps", 30)
    garantir(proj); raiz, _ = sincronizar(proj)
    for n in ("render.sh", "reparar.py"): subir(os.path.join(AQUI, "vm", n), f"/content/t2/vm/{n}")
    q0, q1 = round(ini * fps), round(fim * fps) - 1; t0 = time.time()
    out = exec_vm(f"bash /content/t2/vm/render.sh {raiz} {q0} {q1}", prazo=7200, estagnacao=900)
    if "RENDER_PRONTO" not in out: raise SystemExit("RENDER_FALHOU: " + out[-1500:])
    log(f"render {q1 - q0 + 1} quadros em {time.time() - t0:.0f} s | " + " ".join(l for l in out.splitlines() if l.startswith(("quadros", "trocados"))))
    baixar(f"{raiz}/out/video_crf.mp4", destino); log("baixado:", destino)


def desligar():
    import colab
    from playwright.sync_api import sync_playwright
    try: req("POST", "/desligar", timeout=15)
    except SystemExit: pass
    for _ in range(12):
        time.sleep(5)
        with sync_playwright() as p:
            if not colab.conectado(colab.aba(p)): log("G4 desligada (verificado)"); break
    else:
        print(subprocess.run([sys.executable, G4, "desligar"], capture_output=True, text=True).stdout[-300:])
    if os.path.exists(ESTADO): os.remove(ESTADO)


if __name__ == "__main__":
    c, a = sys.argv[1], sys.argv[2:]
    if c == "ligar": ligar()
    elif c == "preparar": preparar(a[0])
    elif c == "stills": stills(a[0], a[1], [float(s) for s in a[2:]], os.environ.get("ESCALA", "0.5"))
    elif c == "exec": print(exec_vm(a[0], a[1] if len(a) > 1 else None, int(a[2]) if len(a) > 2 else 3600))
    elif c == "render": render(a[0], float(a[1]), float(a[2]), a[3])
    elif c == "baixar": baixar(a[0], a[1])
    elif c == "sync": print(sincronizar(a[0], a[1:] or ITENS))
    elif c == "garantir": garantir(a[0])
    elif c == "subir": subir(a[0], a[1])
    elif c == "saude": print(json.dumps(saude(), indent=1))
    elif c == "desligar": desligar()
