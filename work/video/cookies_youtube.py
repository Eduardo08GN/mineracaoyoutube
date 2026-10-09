# Os cookies do YouTube da sessao autorizada (perfil do Dolphin aberto, pela porta de depuracao que o proprio navegador
# grava) num cookies.txt da pasta TEMP — o yt-dlp so' baixa do YouTube logado ("confirme que nao e' um robo").
# ⛔ o arquivo e' segredo: fica so' na pasta temporaria, nunca no projeto nem no git.
#   python work/video/cookies_youtube.py [id-do-perfil]
import json, os, sys, time, urllib.request

SAIDA = os.path.join(os.environ.get("TEMP", "."), "yt_cookies.txt")
PERFIL_PADRAO = "869356248"          # "12 Ivone": a sessao do YouTube que o Eduardo autorizou (08/10)


def exportar(perfil=PERFIL_PADRAO, saida=SAIDA, idade_max_h=3):
    """Devolve o caminho do cookies.txt (renovado se tiver mais de idade_max_h), ou None se o perfil nao esta' aberto."""
    if os.path.exists(saida) and time.time() - os.path.getmtime(saida) < idade_max_h * 3600: return saida
    import websocket
    arq = os.path.join(os.environ["APPDATA"], "dolphin_anty", "browser_profiles", perfil, "data_dir", "DevToolsActivePort")
    try:
        porta = int(open(arq, encoding="utf-8").readline().strip())
        ws_url = json.load(urllib.request.urlopen(f"http://127.0.0.1:{porta}/json/version", timeout=5))["webSocketDebuggerUrl"]
    except (OSError, ValueError):
        return saida if os.path.exists(saida) else None
    ws = websocket.create_connection(ws_url, timeout=10)
    ws.send(json.dumps({"id": 1, "method": "Storage.getCookies"}))
    while True:
        r = json.loads(ws.recv())
        if r.get("id") == 1: break
    ws.close()
    cs = [c for c in r["result"]["cookies"] if c["domain"].lstrip(".").endswith(("youtube.com", "google.com"))]
    with open(saida, "w", encoding="utf-8") as f:
        f.write("# Netscape HTTP Cookie File\n")
        for c in cs:
            dom = c["domain"]
            f.write("\t".join([dom, "TRUE" if dom.startswith(".") else "FALSE", c["path"], "TRUE" if c["secure"] else "FALSE",
                               str(int(c["expires"])) if c.get("expires", -1) > 0 else "0", c["name"], c["value"]]) + "\n")
    return saida


if __name__ == "__main__":
    print(exportar(sys.argv[1] if len(sys.argv) > 1 else PERFIL_PADRAO, idade_max_h=0))
