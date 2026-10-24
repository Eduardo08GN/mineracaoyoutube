# Tracer3D 2.0 - daemon da VM (G4). Sobe uma vez por sessao (canal.py ligar) e atende o PC por HTTP pela porta-proxy do
# Colab (google.colab.kernel.proxyPort): ~0,2 s por pedido, sem celulas, sem dialogos. So stdlib.
#   GET  /saude                         estado, GPU, jobs, ocioso
#   PUT  /arq?c=<caminho>&o=<offset>    grava o corpo no arquivo (o=0 trunca); pedacos de ate 16 MB
#   GET  /arq?c=<caminho>&o=&n=         le um pedaco
#   POST /faltam {raiz, arquivos:{rel: sha1}}   -> lista dos que faltam/mudaram (sincronizacao por diferenca)
#   POST /exec   {cmd, cwd}             -> {id}; roda em segundo plano, log em /content/t2/jobs/<id>.log
#   GET  /job?id=                       -> {estado, rc, seg, cauda}
#   POST /stills {proj, quadros, escala} -> tar com os JPGs (repassa ao stills_quente.mjs, Chrome sempre aberto)
#   POST /desligar                      -> libera a G4 (runtime.unassign)
# Vigia proprio (decide; a thread VIGIA_T2 no kernel executa o unassign): ocioso = nenhum pedido de trabalho e nenhum job rodando (jobs daemon nao contam). Chrome quente NAO conta como atividade
# (o vigia antigo contava processos e manteria a G4 ligada para sempre).
import hashlib, http.server, io, json, os, socketserver, subprocess, tarfile, threading, time, urllib.parse, urllib.request, uuid

BASE = os.environ.get("T2_BASE", "/content/t2"); JOBS = f"{BASE}/jobs"; os.makedirs(JOBS, exist_ok=True)
PORTA = int(os.environ.get("T2_PORTA", "8765")); OCIOSO_MAX = int(os.environ.get("T2_OCIOSO_MIN", "20")) * 60
estado = {"ini": time.time(), "ultimo": time.time(), "jobs": {}}
trava = threading.Lock(); _sha = {}


def sha1(f):
    st = os.stat(f); k = (f, st.st_size, st.st_mtime_ns)
    if k not in _sha:
        h = hashlib.sha1()
        with open(f, "rb") as a:
            for b in iter(lambda: a.read(1 << 20), b""): h.update(b)
        _sha[k] = h.hexdigest()
    return _sha[k]


def gpu():
    try:
        return subprocess.run(["nvidia-smi", "--query-gpu=utilization.gpu,memory.used", "--format=csv,noheader,nounits"],
                              capture_output=True, text=True, timeout=5).stdout.strip()
    except Exception: return "?"


def rodando(daemons=False):
    return [i for i, j in estado["jobs"].items() if j["p"].poll() is None and (daemons or not j["daemon"])]


def exec_job(cmd, cwd, daemon=False):
    i = uuid.uuid4().hex[:8]; log = open(f"{JOBS}/{i}.log", "wb")
    p = subprocess.Popen(["bash", "-lc", cmd], cwd=cwd or BASE, stdout=log, stderr=subprocess.STDOUT, start_new_session=True)
    estado["jobs"][i] = {"p": p, "t0": time.time(), "cmd": cmd[:120], "daemon": daemon}
    return i


def cauda(i, n=3000):
    f = f"{JOBS}/{i}.log"
    with open(f, "rb") as a:
        a.seek(max(0, os.path.getsize(f) - n)); return a.read().decode("utf-8", "replace")


def vigia():
    while True:
        time.sleep(30)
        if rodando(): estado["ultimo"] = time.time()
        ocioso = time.time() - estado["ultimo"]
        open(f"{BASE}/ocioso.txt", "w").write(str(int(ocioso)))
        if ocioso > OCIOSO_MAX: desligar()


def desligar():
    # runtime.unassign() so funciona dentro do kernel do Colab: quem desliga e a thread VIGIA_T2 do kernel (canal.py ligar),
    # que le este arquivo e o ocioso.txt a cada 10 s
    open(f"{BASE}/DESLIGAR", "w").write(str(time.time()))


class H(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _resp(self, corpo, tipo="application/json", cod=200):
        if not isinstance(corpo, bytes): corpo = json.dumps(corpo).encode()
        self.send_response(cod); self.send_header("Content-Type", tipo); self.send_header("Content-Length", str(len(corpo)))
        self.send_header("Cache-Control", "no-store"); self.end_headers(); self.wfile.write(corpo)

    def _corpo(self):
        n = int(self.headers.get("Content-Length", 0)); b = io.BytesIO()
        while b.tell() < n: b.write(self.rfile.read(min(1 << 20, n - b.tell())))
        return b.getvalue()

    def _q(self):
        u = urllib.parse.urlparse(self.path); return u.path, {k: v[0] for k, v in urllib.parse.parse_qs(u.query).items()}

    def log_message(self, *a): pass

    def do_GET(self):
        rota, q = self._q()
        try:
            if rota == "/saude":
                self._resp({"ok": True, "uptime": int(time.time() - estado["ini"]), "ocioso": int(time.time() - estado["ultimo"]),
                            "gpu": gpu(), "rodando": rodando(), "daemons": [i for i in rodando(True) if i not in rodando()], "stills": os.path.exists(f"{BASE}/stills.pronto")})
                return
            estado["ultimo"] = time.time()
            if rota == "/arq":
                with open(q["c"], "rb") as a:
                    a.seek(int(q.get("o", 0))); self._resp(a.read(int(q.get("n", 16 << 20))), "application/octet-stream")
            elif rota == "/job":
                j = estado["jobs"][q["id"]]; rc = j["p"].poll()
                self._resp({"estado": "rodando" if rc is None else ("ok" if rc == 0 else "falhou"), "rc": rc,
                            "seg": int(time.time() - j["t0"]), "cauda": cauda(q["id"], int(q.get("n", 3000)))})
            elif rota == "/tam":
                self._resp({"tam": os.path.getsize(q["c"]) if os.path.exists(q["c"]) else -1})
            else: self._resp({"erro": "rota"}, cod=404)
        except Exception as e: self._resp({"erro": repr(e)[:500]}, cod=500)

    def do_PUT(self):
        estado["ultimo"] = time.time(); rota, q = self._q()
        try:
            c = q["c"]; o = int(q.get("o", 0)); dados = self._corpo()
            os.makedirs(os.path.dirname(c), exist_ok=True)
            with open(c, "r+b" if o and os.path.exists(c) else "wb") as a:
                a.seek(o); a.write(dados)
            self._resp({"ok": True, "tam": os.path.getsize(c)})
        except Exception as e: self._resp({"erro": repr(e)[:500]}, cod=500)

    def do_POST(self):
        estado["ultimo"] = time.time(); rota, q = self._q()
        try:
            d = json.loads(self._corpo() or b"{}")
            if rota == "/faltam":
                r = d["raiz"]
                self._resp({"faltam": [k for k, h in d["arquivos"].items()
                                       if not os.path.isfile(os.path.join(r, k)) or sha1(os.path.join(r, k)) != h]})
            elif rota == "/exec": self._resp({"id": exec_job(d["cmd"], d.get("cwd"), d.get("daemon", False))})
            elif rota == "/stills":
                with urllib.request.urlopen(urllib.request.Request("http://127.0.0.1:8766/render", json.dumps(d).encode(),
                                                                   {"Content-Type": "application/json"}), timeout=1800) as r:
                    res = json.loads(r.read())
                b = io.BytesIO()
                with tarfile.open(fileobj=b, mode="w") as t:
                    for f in res.get("feitos", []): t.add(f, os.path.basename(f))
                    info = json.dumps(res).encode(); ti = tarfile.TarInfo("resumo.json"); ti.size = len(info); t.addfile(ti, io.BytesIO(info))
                self._resp(b.getvalue(), "application/x-tar")
            elif rota == "/desligar":
                self._resp({"ok": True}); threading.Timer(1, desligar).start()
            else: self._resp({"erro": "rota"}, cod=404)
        except Exception as e: self._resp({"erro": repr(e)[:800]}, cod=500)


class S(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True; allow_reuse_address = True


if __name__ == "__main__":
    threading.Thread(target=vigia, daemon=True).start()
    S(("0.0.0.0", PORTA), H).serve_forever()
