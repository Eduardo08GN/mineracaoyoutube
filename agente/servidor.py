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
  GET /api/idiomas/{en|fr|de|es}             /api/chaves                   {chaves: [...]}
  GET /api/mapa                              /api/chaves/{id}/remover | /api/chaves/{id}/subir
  GET /api/chaves
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
    idiomas: List[str] = ["en", "fr", "de", "es"]


class Retrato(BaseModel):
    imagem: str
    ext: str = "png"


class Ids(BaseModel):
    ids: Optional[List[str]] = None


class NovoProjeto(BaseModel):
    op_id: int


class Etapa(BaseModel):
    etapa: str


class Secao(BaseModel):
    n: int
    texto: str


class Campos(BaseModel):
    campos: dict


class Chaves(BaseModel):
    chaves: List[str]


class NovoAvatar(BaseModel):
    nome: str = ""
    imagem: str = ""
    ext: str = "png"
    tomiko: bool = False
    persona: str = ""
    idioma: str = ""
    descricao: str = ""
    prefixo: str = ""
    voz: str = ""
    quem: str = ""


class ItemLote(BaseModel):
    avatar: str
    palavra: str = ""


class NovoLote(BaseModel):
    itens: List[ItemLote]
    url: str = ""
    video: str = ""
    ext: str = "mp4"
    legenda: int = 0
    livro: bool = False
    modelo: str = "gratis"


class Imagem(BaseModel):
    imagem: str
    ext: str = "png"


class NovaCena(BaseModel):
    nome: str = ""
    cena: str


class AcaoCena(BaseModel):
    acao: str
    texto: Optional[str] = None


class NovoReel(BaseModel):
    avatar: str
    idioma: str
    url: str = ""
    video: str = ""
    ext: str = "mp4"
    cta: str = "bio"
    palavra: str = ""
    livro: bool = False
    modelo: str = "gratis"
    legenda: int = 0
    camera: str = "fonte"
    ambiente: str = ""


class Take(BaseModel):
    n: int
    fala: Optional[str] = None
    movimento: Optional[str] = None


class Anotacao(BaseModel):
    defeito: str = ""
    etiquetas: List[str] = []


class Versao(BaseModel):
    v: int


class Refazer(BaseModel):
    takes: List[Take]


class RevisaoQA(BaseModel):
    v: int
    etiqueta: str
    acao: str


class AcaoLicao(BaseModel):
    acao: str
    campos: Optional[dict] = None


class Ajustes(BaseModel):
    rpm: Optional[float] = None
    rpms: Optional[dict] = None
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
    def oportunidades(persona: str = "", estado: str = "", garimpo: int = 0, ordem: str = "nota", idioma: str = ""):
        return nucleo.oportunidades(idioma=idioma, persona=persona, estado=estado, garimpo=garimpo, ordem=ordem)

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

    @app.get("/api/personas/{pid}/retrato")
    def retrato(pid: str):
        from fastapi.responses import FileResponse
        return FileResponse(nucleo.caminho_retrato(pid), headers={"Cache-Control": "max-age=86400"})

    @app.post("/api/personas/{pid}/retrato")
    def enviar_retrato(pid: str, c: Retrato):
        return nucleo.retrato_enviar(pid, c.imagem, c.ext)

    @app.get("/api/personas/{pid}/prompt")
    def prompt_retrato(pid: str, copiar: int = 0):
        return nucleo.prompt_retrato(pid, copiar=bool(copiar))

    @app.post("/api/retratos/iniciar")
    def retrato_iniciar(c: Ids):
        return nucleo.retrato_iniciar(c.ids)

    @app.post("/api/retratos/pular")
    def retrato_pular():
        return nucleo.retrato_pular()

    @app.post("/api/retratos/parar")
    def retrato_parar():
        return nucleo.retrato_parar()

    @app.get("/api/mapa")
    def mapa():
        return nucleo.mapa()

    @app.get("/api/chaves")
    def chaves():
        return nucleo.chaves()

    @app.post("/api/chaves")
    def adicionar_chaves(c: Chaves):
        return nucleo.adicionar_chaves(c.chaves)

    @app.post("/api/chaves/{cid}/remover")
    def remover_chave(cid: str):
        return nucleo.remover_chave(cid)

    @app.post("/api/chaves/{cid}/subir")
    def subir_chave(cid: str):
        return nucleo.subir_chave(cid)

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

    @app.post("/api/producao/reavaliar")
    def reavaliar_producao():
        return nucleo.reavaliar_producao()

    # ── a aba Producao (agente/estudio.py) ──
    def _estudio():
        if not nucleo.estudio: raise HTTPException(503, "a produção não está ligada nesta janela")
        return nucleo.estudio

    @app.get("/api/videos")
    def videos():
        return _estudio().lista()

    @app.post("/api/videos")
    def novo_video(c: NovoProjeto):
        return nucleo.produzir(c.op_id)

    @app.get("/api/videos/ajustes")
    def ajustes_estudio():
        return _estudio().ajustes()

    @app.post("/api/videos/ajustes")
    def salvar_ajustes_estudio(c: Campos):
        return _estudio().salvar_ajustes(**c.campos)

    @app.get("/api/videos/pipeline")
    def pipeline_video():
        return _estudio().pipeline()

    @app.post("/api/videos/{pid}/abrir")
    def abrir_video(pid: str):
        try:
            return _estudio().abrir_video(pid)
        except KeyError as e:
            raise HTTPException(404, str(e))

    @app.get("/api/videos/{pid}")
    def video(pid: str):
        return _estudio().projeto(pid)

    @app.post("/api/videos/{pid}/rodar")
    def rodar_etapa(pid: str, c: Etapa):
        return _estudio().rodar(pid, c.etapa)

    @app.post("/api/videos/{pid}/perfil")
    def editar_perfil(pid: str, c: Campos):
        return _estudio().editar_perfil(pid, c.campos)

    @app.post("/api/videos/{pid}/secao")
    def editar_secao(pid: str, c: Secao):
        return _estudio().editar_secao(pid, c.n, c.texto)

    # ── a aba Instagram (agente/instagram.py) ──
    def _ig():
        if not nucleo.instagram: raise HTTPException(503, "a aba Instagram não está ligada nesta janela")
        return nucleo.instagram

    @app.get("/api/instagram")
    def instagram():
        return _ig().tudo()

    @app.post("/api/instagram/ajustes")
    def ig_ajustes(c: Campos):
        return _ig().salvar_ajustes(**c.campos)

    @app.post("/api/instagram/avatares")
    def ig_novo_avatar(c: NovoAvatar):
        return _ig().criar_avatar(c.nome, c.imagem, c.ext, c.descricao, c.prefixo, c.voz, c.quem, c.tomiko,
                                  c.persona, c.idioma)

    @app.post("/api/instagram/lotes")
    def ig_novo_lote(c: NovoLote):
        return _ig().criar_lote([i.model_dump() if hasattr(i, "model_dump") else i.dict() for i in c.itens], c.url,
                                c.video, c.ext, c.legenda, c.livro, c.modelo)

    @app.post("/api/instagram/avatares/{aid}")
    def ig_editar_avatar(aid: str, c: Campos):
        return _ig().editar_avatar(aid, c.campos)

    @app.post("/api/instagram/avatares/{aid}/imagem/{qual}")
    def ig_imagem(aid: str, qual: str, c: Imagem):
        return _ig().enviar_imagem(aid, qual, c.imagem, c.ext)

    @app.get("/api/instagram/avatares/{aid}/imagem/{qual}")
    def ig_ver_imagem(aid: str, qual: str):
        from fastapi.responses import FileResponse
        return FileResponse(_ig().arquivo_avatar(aid, qual), headers={"Cache-Control": "no-cache"})

    @app.post("/api/instagram/avatares/{aid}/pool")
    def ig_pool(aid: str):
        return _ig().gerar_pool(aid)

    @app.post("/api/instagram/avatares/{aid}/cenas")
    def ig_nova_cena(aid: str, c: NovaCena):
        return _ig().adicionar_cena(aid, c.nome, c.cena)

    @app.post("/api/instagram/avatares/{aid}/cenas/{cid}/imagem")
    def ig_cena_imagem(aid: str, cid: str, c: Imagem):
        return _ig().enviar_cena(aid, cid, c.imagem, c.ext)

    @app.post("/api/instagram/avatares/{aid}/cenas/{cid}")
    def ig_cena(aid: str, cid: str, c: AcaoCena):
        return _ig().cena(aid, cid, c.acao, c.texto)

    @app.post("/api/instagram/reels")
    def ig_novo_reel(c: NovoReel):
        return _ig().criar_reel(c.avatar, c.idioma, c.url, c.video, c.ext, c.cta, c.palavra, c.livro, c.modelo,
                                 c.legenda, camera=c.camera, ambiente=c.ambiente)

    @app.get("/api/instagram/reels/{rid}")
    def ig_reel(rid: str):
        return _ig().reel(rid)

    @app.get("/api/instagram/reels/{rid}/arquivo/{qual}")
    def ig_arquivo(rid: str, qual: str):
        from fastapi.responses import FileResponse
        return FileResponse(_ig().arquivo_reel(rid, qual), headers={"Cache-Control": "no-cache"})

    @app.post("/api/instagram/reels/{rid}/rodar")
    def ig_rodar(rid: str, c: Etapa):
        return _ig().rodar(rid, c.etapa)

    # o editor de curadoria (telas/EditorReel.tsx)
    @app.get("/api/instagram/reels/{rid}/editor")
    def ig_editor(rid: str):
        return _ig().editor(rid)

    @app.post("/api/instagram/reels/{rid}/takes/{n}/anotar")
    def ig_anotar(rid: str, n: int, c: Anotacao):
        return _ig().anotar_take(rid, n, c.defeito, c.etiquetas)

    @app.post("/api/instagram/reels/{rid}/takes/{n}/aceitar")
    def ig_aceitar(rid: str, n: int):
        return _ig().aceitar_take(rid, n)

    @app.post("/api/instagram/reels/{rid}/takes/{n}/versao")
    def ig_versao(rid: str, n: int, c: Versao):
        return _ig().escolher_versao(rid, n, c.v)

    @app.post("/api/instagram/reels/{rid}/refazer")
    def ig_refazer(rid: str, c: Refazer):
        return _ig().refazer_takes(rid, [t.model_dump() if hasattr(t, "model_dump") else t.dict() for t in c.takes])

    @app.post("/api/instagram/reels/{rid}/takes/{n}/qa")
    def ig_qa_take(rid: str, n: int, c: RevisaoQA):
        return _ig().qa_take(rid, n, c.v, c.etiqueta, c.acao)

    @app.post("/api/instagram/reels/{rid}/qa")
    def ig_checar(rid: str):
        return _ig().checar_reel(rid)

    # as licoes da curadoria (motor/instagram_licoes.py): o Claude propoe, a pessoa aprova
    @app.get("/api/instagram/licoes")
    def ig_licoes():
        return _ig().licoes()

    @app.post("/api/instagram/licoes/destilar")
    def ig_destilar():
        return _ig().destilar()

    @app.post("/api/instagram/licoes/{lid}")
    def ig_licao(lid: str, c: AcaoLicao):
        return _ig().licao(lid, c.acao, c.campos)

    @app.post("/api/instagram/reels/{rid}/take")
    def ig_take(rid: str, c: Take):
        return _ig().editar_take(rid, c.n, c.fala, c.movimento)

    @app.post("/api/instagram/reels/{rid}/subir")
    def ig_subir(rid: str):
        return _ig().subir(rid)

    @app.post("/api/instagram/reels/{rid}/abrir")
    def ig_abrir(rid: str):
        return _ig().abrir(rid)

    @app.post("/api/instagram/reels/{rid}/apagar")
    def ig_apagar(rid: str):
        return _ig().apagar(rid)

    @app.post("/api/instagram/repo/limpar")
    def ig_limpar():
        return _ig().limpar_repo()

    @app.post("/api/ajustes")
    def ajustes(c: Ajustes):
        return nucleo.salvar_ajustes(rpm=c.rpm, rpms=c.rpms, chave=c.chave)

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
    caso("mapa responde", len(c.get("/api/mapa", headers=h).json()["arquetipos"]) >= 10)
    caso("chaves respondem sem mostrar a chave", "chave-de-teste" not in c.get("/api/chaves", headers=h).text)
    caso("⛔ chave que nao existe: 404", c.post("/api/chaves/naoexiste/remover", headers=h).status_code == 404)
    caso("⛔ colar nada: 400", c.post("/api/chaves", headers=h, json={"chaves": [" "]}).status_code == 400)
    caso("⛔ RPM absurdo: 400", c.post("/api/ajustes", headers=h, json={"rpm": 500}).status_code == 400)
    caso("aba Instagram responde", "avatares" in c.get("/api/instagram", headers=h).json())
    caso("⛔ Instagram: id com ../ = 404",
         c.get("/api/instagram/reels/..%2F..%2Fdata/arquivo/final", headers=h).status_code == 404)
    caso("⛔ Instagram: Reel sem avatar = 404", c.post("/api/instagram/reels", headers=h,
                                                       json={"avatar": "nao-existe", "idioma": "pt"}).status_code == 404)
    caso("⛔ curadoria: editor de Reel que nao existe = 404",
         c.get("/api/instagram/reels/nao-existe/editor", headers=h).status_code == 404
         and c.post("/api/instagram/reels/nao-existe/takes/1/versao", headers=h, json={"v": 2}).status_code == 404)
    caso("⛔ curadoria: refazer sem takes = 400", c.post("/api/instagram/reels/nao-existe/refazer", headers=h,
                                                        json={"takes": []}).status_code == 400)
    caso("⛔ QA: Reel que nao existe = 404", c.post("/api/instagram/reels/nao-existe/takes/1/qa", headers=h,
                                                   json={"v": 1, "etiqueta": "fala", "acao": "dispensar"}).status_code == 404
         and c.post("/api/instagram/reels/nao-existe/qa", headers=h).status_code == 404)
    li = c.get("/api/instagram/licoes", headers=h).json()
    caso("licoes respondem", isinstance(li.get("licoes"), list) and "taxas" in li and "pendentes" in li)
    caso("⛔ licoes: licao que nao existe = 404", c.post("/api/instagram/licoes/l-nada", headers=h,
                                                        json={"acao": "aprovar"}).status_code == 404)
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
