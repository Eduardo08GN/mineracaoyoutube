# -*- coding: utf-8 -*-
r"""SERVIDOR — o nucleo do Minerador por HTTP, para o painel web (o mesmo portao do OW Agente).

    python agente/servidor.py [--porta 8790]       # sem janela: abre no navegador pelo link impresso
    python agente/servidor.py --autoteste

So' escuta em 127.0.0.1. ⛔ Toda rota /api pede a senha da sessao (cabecalho `X-Token` ou `?t=`),
nascida a cada abertura: sem ela, qualquer site aberto no navegador poderia gastar a cota.
E o `Host` tem de ser o deste servidor (DNS rebinding).

Leitura                                   Acoes (POST)
  GET /api/estado                           /api/garimpos                 {sementes, persona, filtros}
  GET /api/personas                         /api/garimpos/{id}/cancelar
  GET /api/garimpos                         /api/oportunidades/{id}/estado {estado}
  GET /api/oportunidades?persona=&estado=   /api/oportunidades/{id}/reescrever
       &garimpo=&ordem=                     /api/radar                    {persona}
  GET /api/oportunidades/{id}               /api/ajustes                  {rpm?, chave?}
  GET /api/matriz
  GET /api/radar?persona=
  GET /api/registro                          /api/oportunidades/{id}/equivalentes {idiomas}
  GET /api/idiomas/{fr|de}
  WS  /api/eventos
O WebSocket manda primeiro {"tipo": "estado", ...} e depois cada evento do nucleo.
"""
import asyncio, os, secrets, socket, sys, threading

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
for _p in (AQUI, os.path.join(RAIZ, "motor")):
    if _p not in sys.path: sys.path.insert(0, _p)

from typing import List, Optional                                           # noqa: E402

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect  # noqa: E402
from fastapi.responses import JSONResponse                                  # noqa: E402
from pydantic import BaseModel                                              # noqa: E402

import nucleo as _nucleo                                                    # noqa: E402

PORTA_PADRAO = 8790
ARQ_LOCK = os.path.join(RAIZ, ".minerador.lock")
ARQ_API = os.path.join(RAIZ, ".minerador_api")
PAINEL = os.path.join(RAIZ, "painel", "app", "dist")


class NovoGarimpo(BaseModel):
    sementes: List[str]
    persona: str
    filtros: dict = {}


class EstadoOp(BaseModel):
    estado: str


class Radar(BaseModel):
    persona: str


class Idiomas(BaseModel):
    idiomas: List[str] = ["fr", "de"]


class Ajustes(BaseModel):
    rpm: Optional[float] = None
    chave: Optional[str] = None


def criar_app(nucleo, token, hosts, painel=PAINEL):
    """O app FastAPI sobre um `Nucleo`. `hosts` = os valores de `Host` aceitos."""
    app = FastAPI(title="Minerador", docs_url=None, redoc_url=None, openapi_url=None)
    clientes = set()                # (loop, fila) de cada WebSocket aberto
    trava = threading.Lock()

    def _para_todos(msg):
        with trava:
            alvos = list(clientes)
        for loop, fila in alvos:
            try:
                loop.call_soon_threadsafe(_por, fila, msg)
            except RuntimeError:     # o loop daquele cliente ja' fechou
                pass

    def _por(fila, msg):
        if fila.full():              # ⭐ cliente lento perde o mais velho, nunca trava o nucleo
            try: fila.get_nowait()
            except asyncio.QueueEmpty: pass
        fila.put_nowait(msg)

    nucleo.ouvir(lambda tipo, dados: _para_todos({"tipo": tipo, **dados}))

    @app.middleware("http")
    async def portao(request: Request, call_next):
        if request.url.path.startswith("/api"):
            if request.headers.get("host", "") not in hosts:
                return JSONResponse({"erro": "host não permitido"}, status_code=403)
            dado = request.headers.get("x-token") or request.query_params.get("t") or ""
            if not secrets.compare_digest(dado, token):
                return JSONResponse({"erro": "sem permissão"}, status_code=403)
        resposta = await call_next(request)
        if not request.url.path.startswith(("/api", "/assets/")):
            resposta.headers["Cache-Control"] = "no-cache"
        return resposta

    @app.exception_handler(KeyError)
    async def _nao_achou(_req, e):
        return JSONResponse({"erro": f"não existe: {e}"}, status_code=404)

    @app.exception_handler(ValueError)
    async def _invalido(_req, e):
        return JSONResponse({"erro": str(e)}, status_code=400)

    # ── leitura ──
    @app.get("/api/estado")
    def estado():
        return nucleo.estado()

    @app.get("/api/personas")
    def personas():
        return nucleo.personas()

    @app.get("/api/garimpos")
    def garimpos():
        return nucleo.garimpos()

    @app.get("/api/oportunidades")
    def oportunidades(persona: str = "", estado: str = "", garimpo: int = 0, ordem: str = "nota"):
        return nucleo.oportunidades(persona=persona, estado=estado, garimpo=garimpo, ordem=ordem)

    @app.get("/api/oportunidades/{oid}")
    def oportunidade(oid: int):
        return nucleo.oportunidade(oid)

    @app.get("/api/matriz")
    def matriz():
        return nucleo.matriz()

    @app.get("/api/radar")
    def radar(persona: str = ""):
        return nucleo.radar(persona)

    @app.get("/api/idiomas/{cod}")
    def idioma(cod: str):
        return nucleo.idioma(cod)

    @app.get("/api/registro")
    def registro():
        return nucleo.registro

    # ── acoes ──
    @app.post("/api/garimpos")
    def novo(c: NovoGarimpo):
        return nucleo.novo_garimpo(c.sementes, c.persona, c.filtros)

    @app.post("/api/garimpos/{gid}/cancelar")
    def cancelar(gid: int):
        return nucleo.cancelar(gid)

    @app.post("/api/oportunidades/{oid}/estado")
    def marcar(oid: int, c: EstadoOp):
        return nucleo.marcar(oid, c.estado)

    @app.post("/api/oportunidades/{oid}/reescrever")
    def reescrever(oid: int):
        if not nucleo.estado()["claude"]:
            raise HTTPException(409, "O Claude Code não está instalado nesta máquina.")
        return nucleo.reescrever(oid)

    @app.post("/api/oportunidades/{oid}/equivalentes")
    def equivalentes(oid: int, c: Idiomas):
        if not nucleo.estado()["claude"]:
            raise HTTPException(409, "O Claude Code não está instalado nesta máquina.")
        return nucleo.gerar_equivalentes(oid, c.idiomas)

    @app.post("/api/radar")
    def rodar_radar(c: Radar):
        return nucleo.rodar_radar(c.persona)

    @app.post("/api/ajustes")
    def ajustes(c: Ajustes):
        return nucleo.salvar_ajustes(rpm=c.rpm, chave=c.chave)

    @app.websocket("/api/eventos")
    async def eventos(ws: WebSocket):
        # ⛔ o middleware HTTP nao cobre WebSocket: o portao e' aqui
        if ws.headers.get("host", "") not in hosts or \
                not secrets.compare_digest(ws.query_params.get("t") or "", token):
            await ws.close(code=4403); return
        await ws.accept()
        fila = asyncio.Queue(maxsize=500)
        par = (asyncio.get_running_loop(), fila)
        with trava: clientes.add(par)
        try:
            await ws.send_json({"tipo": "estado", **nucleo.estado()})
            while True:
                await ws.send_json(await fila.get())
        except WebSocketDisconnect:
            pass
        finally:
            with trava: clientes.discard(par)

    # ⭐ o painel montado (`npm run build` em painel/app). Sem senha: a pagina nao tem dado nenhum.
    if os.path.isdir(painel):
        from fastapi.staticfiles import StaticFiles
        app.mount("/", StaticFiles(directory=painel, html=True), name="painel")
    return app


# ── uma instancia por vez ──────────────────────────────────────────────────────────────

def processo_vivo(pid):
    """O processo `pid` existe? ⛔ Nunca `os.kill(pid, 0)` no Windows: o sinal 0 e' CTRL_C_EVENT."""
    if pid <= 0: return False
    if os.name == "nt":
        import ctypes
        h = ctypes.windll.kernel32.OpenProcess(0x1000, False, pid)        # QUERY_LIMITED_INFORMATION
        if not h: return False
        codigo = ctypes.c_ulong()
        ctypes.windll.kernel32.GetExitCodeProcess(h, ctypes.byref(codigo))
        ctypes.windll.kernel32.CloseHandle(h)
        return codigo.value == 259                                         # STILL_ACTIVE
    try:
        os.kill(pid, 0); return True
    except OSError:
        return False


def travar_instancia(arq=ARQ_LOCK):
    for _ in range(2):
        try:
            fd = os.open(arq, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError:
            try:
                pid = int(open(arq, encoding="utf-8").readline().strip() or 0)
            except (OSError, ValueError):
                pid = 0
            if processo_vivo(pid): return False
            try: os.remove(arq)
            except OSError: return False
            continue
        with os.fdopen(fd, "w", encoding="utf-8") as fh:
            fh.write(f"{os.getpid()}\nMinerador\n{socket.gethostname()}\n")
        return True
    return False


def soltar_instancia(arq=ARQ_LOCK):
    try: os.remove(arq)
    except OSError: pass


def porta_livre(preferida=PORTA_PADRAO):
    for p in (preferida, 0):
        s = socket.socket()
        try:
            s.bind(("127.0.0.1", p)); return s.getsockname()[1]
        except OSError:
            continue
        finally:
            s.close()
    raise OSError("nenhuma porta livre")


def gravar_api(porta, token, arq=ARQ_API):
    """Porta e senha para o Claude Code operar o painel sem clique (como o `.ow_agente_api`)."""
    try:
        open(arq, "w").write(f"{porta}\n{token}\n")
    except OSError:
        pass


def main(argv=None):
    import uvicorn
    argv = sys.argv[1:] if argv is None else argv
    porta = int(argv[argv.index("--porta") + 1]) if "--porta" in argv else PORTA_PADRAO
    if not travar_instancia():
        print("O Minerador já está aberto. Use aquela janela.")
        return 3
    try:
        porta = porta_livre(porta)
        token = secrets.token_urlsafe(24)
        n = _nucleo.Nucleo()
        app = criar_app(n, token, {f"127.0.0.1:{porta}", f"localhost:{porta}"})
        gravar_api(porta, token)
        print(f"Minerador: http://127.0.0.1:{porta}/?t={token}", flush=True)
        uvicorn.run(app, host="127.0.0.1", port=porta, log_level="warning")
        n.encerrar()
    finally:
        soltar_instancia()
    return 0


def _autoteste():
    import tempfile
    from fastapi.testclient import TestClient
    from banco import Banco
    from youtube import YouTube
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    tmp = tempfile.mkdtemp(prefix="min-srv-")
    pagina = os.path.join(tmp, "dist"); os.makedirs(pagina)
    open(os.path.join(pagina, "index.html"), "w", encoding="utf-8").write("<!doctype html><title>Minerador</title>")
    def falso(url):
        if "/search?" in url: return {"items": [{"id": {"videoId": "V1"}}]}
        if "/videos?" in url:
            return {"items": [{"id": "V1", "snippet": {"title": "How to Pick a Sweet Watermelon", "channelId": "C1",
                                                      "publishedAt": "2016-07-01T00:00:00Z"},
                               "statistics": {"viewCount": "16000000"}, "contentDetails": {"duration": "PT2M3S"}}]}
        if "/channels?" in url:
            return {"items": [{"id": "C1", "snippet": {"title": "Daisy", "publishedAt": "2010-01-01T00:00:00Z"},
                               "statistics": {"subscriberCount": "956000"}}]}
        return {}
    b = Banco(os.path.join(tmp, "t.db"))
    n = _nucleo.Nucleo(banco=b, yt=YouTube(b, chave="chave-de-teste-com-mais-de-20", http=falso),
                       reescrever=lambda p, vs: {}, arq_ajustes=os.path.join(tmp, "aj.json"),
                       equivaler=lambda p, ops, idiomas: {})
    tk = "senha-de-teste"
    c = TestClient(criar_app(n, tk, {"testserver"}, painel=pagina))
    h = {"X-Token": tk}

    caso("⛔ sem senha: 403", c.get("/api/estado").status_code == 403)
    caso("⛔ senha errada: 403", c.get("/api/estado", headers={"X-Token": "x"}).status_code == 403)
    caso("⛔ Host de fora (DNS rebinding): 403", c.get("/api/estado", headers={**h, "host": "evil.com"}).status_code == 403)
    e = c.get("/api/estado", headers=h).json()
    caso("estado com cota", e["cota"]["limite"] == 10000)
    caso("⭐ o painel abre sem senha (a pagina nao tem dados)", c.get("/").status_code == 200)
    caso("personas do catalogo", len(c.get("/api/personas", headers=h).json()["personas"]) >= 5)
    caso("⛔ garimpo vazio: 400", c.post("/api/garimpos", headers=h, json={"sementes": [], "persona": "amish"}).status_code == 400)
    caso("oportunidade que nao existe: 404", c.get("/api/oportunidades/999", headers=h).status_code == 404)

    with c.websocket_connect("/api/eventos?t=" + tk) as ws:
        caso("⭐ WebSocket comeca pelo estado", ws.receive_json()["tipo"] == "estado")
        g = c.post("/api/garimpos", headers=h, json={"sementes": ["watermelon"], "persona": "amish",
                                                     "filtros": {"remakes": 0}}).json()
        caso("garimpo criado pela API", g["estado"] == "fila")
        tipos = set()
        for _ in range(40):
            m = ws.receive_json(); tipos.add(m["tipo"])
            if m["tipo"] == "aviso": break
        caso("⭐ o progresso chega ao vivo (log, mudou, aviso)", {"log", "mudou", "aviso"} <= tipos)
    ops = c.get("/api/oportunidades", headers=h).json()
    caso("oportunidade na lista", len(ops) == 1 and ops[0]["receita"] == 80000)
    r = c.post(f"/api/oportunidades/{ops[0]['id']}/estado", headers=h, json={"estado": "salva"})
    caso("salvar pela API", r.json()["estado"] == "salva")
    caso("idioma desconhecido: 404", c.get("/api/idiomas/xx", headers=h).status_code == 404)
    caso("idioma conhecido: lista", c.get("/api/idiomas/fr", headers=h).json() == [])
    caso("⛔ RPM absurdo: 400", c.post("/api/ajustes", headers=h, json={"rpm": 500}).status_code == 400)
    try:
        with c.websocket_connect("/api/eventos?t=errada") as ws:
            ws.receive_json()
        caso("⛔ WebSocket sem senha fecha", False)
    except Exception:                                                      # noqa: BLE001
        caso("⛔ WebSocket sem senha fecha", True)

    lk = os.path.join(tmp, "lock")
    caso("trava: a primeira instancia pega", travar_instancia(lk))
    caso("⛔ trava: a segunda (mesmo processo vivo) nao pega", not travar_instancia(lk))
    open(lk, "w").write("999999\nMinerador\n")
    caso("trava velha (processo morto) sai e a nova pega", travar_instancia(lk))
    soltar_instancia(lk)
    caso("porta livre", 0 < porta_livre(0) < 65536)
    n.encerrar()
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
    sys.exit(main())
