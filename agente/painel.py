# -*- coding: utf-8 -*-
r"""PAINEL — o Minerador numa janela do Windows: o servidor local e o painel web, juntos.

    python agente/painel.py
    python agente/painel.py --autoteste

A janela e' do pywebview (o motor do Edge, WebView2), igual a do OW Agente. O servidor
(`servidor.py`) roda num fio dentro do mesmo processo, so' em 127.0.0.1, e a pagina recebe a
senha da sessao pela URL.

A pagina pede ao Windows, por `window.pywebview.api`:
    abrir_link(url) -> bool     abre no navegador padrao. ⛔ So' YouTube e X: a ponte nunca abre
                                endereco que a pagina inventar.
"""
import json, os, secrets, sys, threading, time
from urllib.parse import urlparse

AQUI = os.path.dirname(os.path.abspath(__file__))
RAIZ = os.path.dirname(AQUI)
for _p in (AQUI, os.path.join(RAIZ, "motor")):
    if _p not in sys.path: sys.path.insert(0, _p)

import nucleo as _nucleo                                                    # noqa: E402
import servidor as _srv                                                     # noqa: E402

ICONE = os.path.join(RAIZ, "painel", "assets", "minerador.ico")
ARQ_JANELA = os.path.join(RAIZ, "data", "_janela.json")
TAMANHO_PADRAO = (1360, 880)
TAMANHO_MINIMO = (980, 640)
HOSTS_LIVRES = {"www.youtube.com", "youtube.com", "m.youtube.com", "youtu.be", "x.com", "www.x.com", "twitter.com"}


def link_permitido(url):
    try:
        u = urlparse(url)
    except ValueError:
        return False
    return u.scheme == "https" and (u.hostname or "").lower() in HOSTS_LIVRES


def ler_janela(arq=ARQ_JANELA):
    """Onde e de que tamanho a pessoa deixou a janela. ⛔ Fora da tela (monitor desligado) volta ao padrao."""
    try:
        g = json.load(open(arq, encoding="utf-8"))
        w, h = int(g["w"]), int(g["h"])
        x, y = g.get("x"), g.get("y")
        if w < TAMANHO_MINIMO[0] or h < TAMANHO_MINIMO[1]: raise ValueError
        if x is not None and (int(x) < -50 or int(y) < -50): x = y = None
        return {"w": w, "h": h, "x": x, "y": y}
    except Exception:                                                      # noqa: BLE001
        return {"w": TAMANHO_PADRAO[0], "h": TAMANHO_PADRAO[1], "x": None, "y": None}


def gravar_janela(g, arq=ARQ_JANELA):
    try:
        os.makedirs(os.path.dirname(arq), exist_ok=True)
        json.dump(g, open(arq, "w", encoding="utf-8"))
    except OSError:
        pass


class Ponte:
    """O que a pagina pede ao Windows."""

    def abrir_link(self, url):
        if not link_permitido(url): return False
        import webbrowser
        webbrowser.open(url)
        return True


def _avisar(texto):
    if os.name == "nt":
        import ctypes
        ctypes.windll.user32.MessageBoxW(None, texto, "Minerador", 0x40)
    else:
        print(texto)


def main(argv=None):
    import uvicorn, webview
    if not os.path.isfile(os.path.join(_srv.PAINEL, "index.html")):
        _avisar("O painel ainda não foi montado. Rode: cd painel/app && npm install && npm run build")
        return 2
    if not _srv.travar_instancia():
        _avisar("O Minerador já está aberto em outra janela.")
        return 3
    servidor = n = None
    try:
        porta = _srv.porta_livre()
        token = secrets.token_urlsafe(24)
        n = _nucleo.Nucleo()
        app = _srv.criar_app(n, token, {f"127.0.0.1:{porta}", f"localhost:{porta}"})
        servidor = uvicorn.Server(uvicorn.Config(app, host="127.0.0.1", port=porta, log_level="warning"))
        threading.Thread(target=servidor.run, daemon=True, name="minerador-servidor").start()
        fim = time.time() + 15
        while not servidor.started and time.time() < fim: time.sleep(0.05)
        if not servidor.started:
            _avisar("O Minerador não conseguiu abrir o painel. Feche e abra de novo.")
            return 2
        _srv.gravar_api(porta, token)
        g = ler_janela()
        janela = webview.create_window(
            "Minerador", f"http://127.0.0.1:{porta}/?t={token}", js_api=Ponte(),
            width=g["w"], height=g["h"], x=g["x"], y=g["y"], min_size=TAMANHO_MINIMO,
            background_color="#060E0D", text_select=True)

        def ao_fechar():
            try:
                gravar_janela({"w": janela.width, "h": janela.height, "x": janela.x, "y": janela.y})
            except Exception:                                              # noqa: BLE001
                pass
        janela.events.closing += ao_fechar

        def ao_mostrar():
            if os.name == "nt" and os.path.exists(ICONE):
                try:
                    from System import Action
                    from System.Drawing import Icon
                    form = janela.native
                    form.Invoke(Action(lambda: setattr(form, "Icon", Icon(ICONE))))
                except Exception:                                          # noqa: BLE001
                    pass
        janela.events.shown += ao_mostrar
        os.environ.setdefault("WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS", "--disable-features=ElasticOverscroll")
        webview.start(gui="edgechromium" if os.name == "nt" else None, private_mode=False,
                      storage_path=os.path.join(os.environ.get("LOCALAPPDATA") or RAIZ, "Minerador", "painel"))
    finally:
        if servidor: servidor.should_exit = True
        if n: n.encerrar()
        _srv.soltar_instancia()
    return 0


def _autoteste():
    import tempfile
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    d = tempfile.mkdtemp(prefix="min-painel-")
    arq = os.path.join(d, "janela.json")
    caso("sem janela gravada: tamanho padrao", ler_janela(arq) == {"w": 1360, "h": 880, "x": None, "y": None})
    gravar_janela({"w": 1500, "h": 900, "x": 40, "y": 30}, arq)
    caso("⭐ a janela volta onde estava", ler_janela(arq) == {"w": 1500, "h": 900, "x": 40, "y": 30})
    gravar_janela({"w": 1500, "h": 900, "x": -3000, "y": 30}, arq)
    caso("⛔ posicao fora da tela volta ao centro", ler_janela(arq)["x"] is None)
    caso("link do YouTube abre", link_permitido("https://www.youtube.com/watch?v=abc"))
    caso("link do X abre", link_permitido("https://x.com/GOATiology"))
    caso("⛔ link de fora nao abre", not link_permitido("https://evil.com/x"))
    caso("⛔ http e file nao abrem", not link_permitido("http://youtube.com") and not link_permitido("file:///C:/x"))
    caso("⛔ truque com @ nao engana", not link_permitido("https://youtube.com@evil.com/"))
    caso("o icone existe", os.path.exists(ICONE))
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
    sys.exit(main())
