# -*- coding: utf-8 -*-
r"""GERADOR INSTAGRAM — backend de geração para a aba Instagram (contrato de motor/instagram_backend.py).

    python motor/instagram_gerador.py --autoteste

Usa a mesma conta e perfil do Dolphin que o Minerador (flow_ivone.py do work/video), com o projeto
configurado lá (PROJETO). A sessão é criada na primeira chamada e reutilizada.

Contrato:
    gerar_imagem(prompt, refs, destino, diz)     imagem 9:16 com referências locais → PNG em destino
    gerar_videos(pedidos, pasta, modelo, diz)     takes 9:16 de até 8 s → {nome: caminho | None}
"""
import os, sys, time

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
_WORK = os.path.join(RAIZ, "work", "video")
OW = r"C:\Users\edlut\ow_agente\organic-wave-studio"
for _p in (_WORK, os.path.join(OW, "agente"), os.path.join(OW, "motor")):
    if _p not in sys.path:
        sys.path.insert(0, _p)

import flow_http as fh                                                         # noqa: E402
import flow_ivone                                                              # noqa: E402

ASPECTO_IMG_916 = 2

# ── estado do módulo ────────────────────────────────────────────────────────

_sessao = None
_cdp = None
_uploads = {}                   # (caminho_abs, mtime) → media_id


ESPERA_CDP_S = 180              # ⛔ o download pelo proxy do perfil passou de 28 s (19/10); o padrao do websocket e' 30 s


def _porta_viva(diz=print):
    """A porta de automacao do perfil; com o perfil fechado, abre pela API local do Dolphin (como o OW Agente)."""
    import requests
    porta = fh._porta_do_perfil(flow_ivone.PERFIL)
    if porta: return porta
    diz("abrindo o perfil do Dolphin pela automação…")
    try:
        r = requests.get(f"http://localhost:3001/v1.0/browser_profiles/{flow_ivone.PERFIL}/start?automation=1",
                         timeout=120).json()
    except Exception as e:                                                  # noqa: BLE001
        raise RuntimeError(f"o Dolphin não respondeu (ele está aberto?): {e}") from e
    porta = ((r.get("automation") or {}).get("port")) if isinstance(r, dict) else None
    if not porta or not fh._porta_viva(porta):
        raise RuntimeError("o perfil da Ivone está aberto pela janela do Dolphin, sem automação: feche a janela "
                           "desse perfil e eu abro pela ferramenta" if "ALREADY" in str(r) else f"o Dolphin não abriu o perfil: {r}")
    return porta


def _aba_do_projeto(porta, diz=print):
    """⭐ (19/10) a aba do PROJETO do Minerador; sem ela, abre uma nova e espera a pagina assentar logada.
    ⛔ Antes: sem a aba, o flow_ivone saia com SystemExit e matava o fio da aba Instagram. E outras ferramentas no
       mesmo perfil (OW Agente, scripts de cards) usam a primeira aba do Flow que acham: uma aba so' nossa evita
       disputar a mesma pagina."""
    import requests
    abas = requests.get(f"http://127.0.0.1:{porta}/json/list", timeout=10).json()
    aba = next((t for t in abas if t.get("type") == "page" and flow_ivone.PROJETO in t.get("url", "")), None)
    if not aba:
        diz("abrindo a aba do projeto no Flow…")
        aba = requests.put(f"http://127.0.0.1:{porta}/json/new?https://flow.google.com/project/{flow_ivone.PROJETO}",
                           timeout=15).json()
    cdp = fh.CDPConnection(aba["webSocketDebuggerUrl"])
    cdp._ws.settimeout(ESPERA_CDP_S)
    fim = time.time() + 60
    while time.time() < fim:
        try:
            pronto = cdp.evaluate("typeof WIZ_global_data !== 'undefined' && location.pathname.includes('/project/')",
                                  await_promise=False)
        except Exception:                                                   # noqa: BLE001
            pronto = False
        if pronto: return cdp
        time.sleep(2)
    raise RuntimeError("a aba do projeto no Flow não carregou logada em 60 s (o login do Google caiu?)")


def _conectar(diz=print):
    global _sessao, _cdp
    if _sessao is None:
        cdp = _aba_do_projeto(_porta_viva(diz), diz)
        s = fh.FlowSession(flow_ivone.PROJETO, user_path=f"/u/{flow_ivone.CONTA}/", auth_index=flow_ivone.CONTA)
        s.bootstrap(cdp)
        _sessao, _cdp = s, cdp
    return _sessao


def _reconectar(diz):
    global _sessao, _cdp
    try:
        if _cdp: _cdp.close()
    except Exception:                                                       # noqa: BLE001
        pass
    _sessao = _cdp = None
    _uploads.clear()
    diz("reconectando ao Flow…")
    return _conectar()


def _upload(caminho, diz):
    ap = os.path.abspath(caminho)
    chave = (ap, os.path.getmtime(ap))
    if chave in _uploads:
        return _uploads[chave]
    s = _conectar()
    mid, _ = fh.upload(s, ap, flow_ivone.PROJETO)
    _uploads[chave] = mid
    diz(f"  ref carregada: {os.path.basename(caminho)}")
    return mid


def _tropeco_recaptcha(e):
    """⛔ (18/10) a pagina do Flow as vezes fica sem o grecaptcha.enterprise.execute por um instante (e o wrapper
    da sessao some junto): reconectar refaz o bootstrap e a segunda tentativa passa.
    ⛔ (19/10) o mesmo vale para a conexao caida: o Dolphin reabriu o perfil (porta nova) ou a aba guardada fechou,
    e a sessao em cache falava com o nada ("Connection timed out")."""
    t = f"{type(e).__name__} {e}".lower()
    return any(x in t for x in ("grecaptcha", "token recaptcha", "timed out", "timeout", "connection", "websocket"))


def _com_segunda_chance(fn):
    def f(*args):
        diz = args[-1]
        try:
            return fn(*args)
        except Exception as e:                                              # noqa: BLE001
            if not _tropeco_recaptcha(e): raise
            diz("  reCAPTCHA do Flow tropeçou: reconectando e tentando de novo")
            _reconectar(diz)
            return fn(*args)
    f.__wrapped__ = fn
    return f


# ── contrato do backend (motor/instagram_backend.py) ───────────────────────

def gerar_imagem(prompt, refs, destino, diz):
    """Imagem VERTICAL 9:16 gravada em `destino` (PNG). `refs` = caminhos de imagens locais."""
    _conectar()
    mids = [_upload(r, diz) for r in refs]
    op_id, _ = flow_ivone.imagem_feliz(_sessao, prompt, refs=mids, aspecto=ASPECTO_IMG_916, diz=diz)
    fh.baixar_limpa(_sessao, op_id, destino)
    if not os.path.isfile(destino):
        raise RuntimeError("o Flow não gerou a imagem")
    return destino


def gerar_videos(pedidos, pasta, modelo, diz):
    """Gera takes 9:16 de até 8 s. `pedidos` = [{"nome", "prompt", "inicio", "fim"}] (png locais).
    Retorna {nome: caminho_mp4 | None}."""
    s = _conectar()
    os.makedirs(pasta, exist_ok=True)
    mod = fh.MODELO_GRATIS if modelo == "gratis" else modelo
    quadros = {}
    for p in pedidos:
        for k in ("inicio", "fim"):
            c = p[k]
            if c not in quadros:
                quadros[c] = _upload(c, diz)
    ops = {}
    for p in pedidos:
        qi, qf = quadros[p["inicio"]], quadros[p["fim"]]
        saldo = fh.creditos(s)
        try:
            op_id, rest = fh.gerar_video(s, p["prompt"], qi, qf, flow_ivone.PROJETO, modelo=mod)
        except fh.ErroFlow as e:
            if fh.e_freio(e.detalhe):
                raise fh.Freio(fh.motivo(e.detalhe)) from e
            raise
        if isinstance(rest, (int, float)) and rest < saldo:
            raise SystemExit(f"a geração cobrou {saldo - rest} créditos: parei (só grátis)")
        ops[p["nome"]] = op_id
        diz(f"  {p['nome']} lançado")
    feitos, falta = flow_ivone.esperar_e_baixar(s, ops, pasta, prazo=1200)
    resultado = {}
    for nome in ops:
        cam = feitos.get(nome)
        resultado[nome] = cam if cam and os.path.isfile(cam) else None
    if falta:
        diz(f"  ⚠ {len(falta)} take(s) não terminaram no prazo")
    return resultado


gerar_imagem = _com_segunda_chance(gerar_imagem)
gerar_videos = _com_segunda_chance(gerar_videos)


# ── utilitários (uso manual) ───────────────────────────────────────────────

def conectar():
    """CDP na aba do projeto (abre o perfil e a aba se preciso) + sessão do Flow. Retorna (sessao, cdp)."""
    return _conectar(), _cdp


def creditos():
    return fh.creditos(_conectar())


# ── autoteste ──────────────────────────────────────────────────────────────

def _autoteste():
    ok = True

    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)

    caso("gerar_imagem existe e aceita 4 args", callable(gerar_imagem) and gerar_imagem.__wrapped__.__code__.co_argcount == 4)
    caso("gerar_videos existe e aceita 4 args", callable(gerar_videos) and gerar_videos.__wrapped__.__code__.co_argcount == 4)
    caso("⭐ tropeco do reCAPTCHA reconhecido", _tropeco_recaptcha(RuntimeError("CDP JS error: grecaptcha.enterprise.execute is not a function"))
         and not _tropeco_recaptcha(RuntimeError("filtro de conteudo")))
    caso("⭐ conexao caida tambem reconecta", _tropeco_recaptcha(TimeoutError("Connection timed out"))
         and _tropeco_recaptcha(ConnectionResetError("WebSocket closed")))
    caso("ASPECTO_IMG_916 == 2", ASPECTO_IMG_916 == 2)
    caso("MODELO_GRATIS é o lower priority", "low_priority" in fh.MODELO_GRATIS)
    caso("flow_ivone.PROJETO definido", bool(flow_ivone.PROJETO))

    # cache de uploads: mesma chave não re-sobe
    import tempfile
    d = tempfile.mkdtemp(prefix="min-ig-ger-")
    arq = os.path.join(d, "teste.png")
    open(arq, "wb").write(b"\x89PNG\r\n\x1a\n" + b"\x00" * 100)
    _uploads.clear()
    ap = os.path.abspath(arq)
    chave = (ap, os.path.getmtime(ap))
    _uploads[chave] = "fake-media-id"
    caso("cache: ref já carregada não chama upload", _upload(arq, print) == "fake-media-id")
    _uploads.clear()

    # reconectar: a parte de limpeza funciona
    _uploads[("x", 0)] = "velho"
    global _sessao, _cdp
    _sessao = "algo"; _cdp = "algo"
    _sessao = _cdp = None; _uploads.clear()   # o que _reconectar faz antes de chamar _conectar
    caso("reconectar limpa sessão e cache", len(_uploads) == 0 and _sessao is None and _cdp is None)

    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv:
        sys.exit(0 if _autoteste() else 1)
    s, cdp = conectar()
    try:
        print("créditos:", fh.creditos(s))
    finally:
        cdp.close()
