# -*- coding: utf-8 -*-
r"""FONTE — o viral original de um projeto: titulo, descricao, duracao e o que se fala nele (legenda).

    python motor/fonte.py --autoteste
    python motor/fonte.py --ler <video_id>

Nada de baixar o video: so' as informacoes (yt-dlp -J) e UMA legenda, na lingua do video —
a manual se existir, senao a automatica original ("de-orig"), nunca uma traducao automatica.
Video sem fala (so' musica, como o viral da batata em vasos) segue sem texto: o Elias escreveu esse do zero.

⭐ Sessao: sem login primeiro. Se o YouTube pedir "confirme que nao e' robo", tenta de novo com os cookies
do perfil do Dolphin configurado (o navegador precisa estar aberto) — exportados para um arquivo temporario
e APAGADOS no fim. E' o mesmo caminho que o Eduardo autorizou para o estudo do Elias (08/10).
"""
import json, os, re, subprocess, sys, tempfile, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)

# ⛔ 24 mil cortou o viral das 30 ervas no oregano (08/10): o Claude so' viu 14 delas. 80 mil = ~1h30 de fala.
MAX_TEXTO = 80_000          # caracteres da transcricao que vao para o Claude
_EXTRA = {"creationflags": 0x08000000} if os.name == "nt" else {}       # CREATE_NO_WINDOW


class ErroFonte(Exception):
    pass


# ── a sessao do YouTube (perfil do Dolphin aberto) ──
def cookies_do_dolphin(perfil, saida, dominios=("youtube.com", "google.com")):
    """Cookies do YouTube de um perfil do Dolphin aberto, pela porta que o proprio navegador gravou.
    ⛔ Nunca varre portas (o anty.exe tem uma porta que derruba o navegador): so' le DevToolsActivePort."""
    import websocket
    arq = os.path.join(os.environ.get("APPDATA") or "", "dolphin_anty", "browser_profiles", str(perfil), "data_dir",
                       "DevToolsActivePort")
    try:
        porta = int(open(arq, encoding="utf-8").readline().strip())
    except (OSError, ValueError):
        raise ErroFonte(f"o perfil {perfil} do Dolphin não está aberto")
    url = json.load(urllib.request.urlopen(f"http://127.0.0.1:{porta}/json/version", timeout=5))["webSocketDebuggerUrl"]
    ws = websocket.create_connection(url, timeout=10)
    try:
        ws.send(json.dumps({"id": 1, "method": "Storage.getCookies"}))
        while True:
            r = json.loads(ws.recv())
            if r.get("id") == 1: break
    finally:
        ws.close()
    cs = [c for c in r["result"]["cookies"] if c["domain"].lstrip(".").endswith(dominios)]
    with open(saida, "w", encoding="utf-8") as f:
        f.write("# Netscape HTTP Cookie File\n")
        for c in cs:
            d = c["domain"]
            f.write("\t".join([d, "TRUE" if d.startswith(".") else "FALSE", c["path"], "TRUE" if c["secure"] else "FALSE",
                               str(int(c["expires"])) if c.get("expires", -1) > 0 else "0", c["name"], c["value"]]) + "\n")
    return len(cs)


def _ytdlp(args, cookies=None, timeout=180):
    cmd = ["yt-dlp", "--no-warnings", "--js-runtimes", "node", "--remote-components", "ejs:github"]
    if cookies: cmd += ["--cookies", cookies]
    r = subprocess.run(cmd + args, capture_output=True, text=True, encoding="utf-8", errors="replace",
                       timeout=timeout, **_EXTRA)
    return r.returncode, r.stdout, r.stderr


def _robo(erro):
    return any(k in erro for k in ("confirm you", "not a bot", "page needs to be reloaded", "Sign in"))


# ── escolher e ler a legenda ──
def escolher_legenda(info, preferida=""):
    """(chave, automatica?) da legenda a baixar, ou (None, False). Manual na lingua do video > automatica
    original da lingua do video (-orig) > automatica da lingua > qualquer -orig."""
    lingua = (info.get("language") or preferida or "").split("-")[0].lower()
    manuais = info.get("subtitles") or {}
    autos = info.get("automatic_captions") or {}
    for k in manuais:
        if lingua and k.split("-")[0].lower() == lingua: return k, False
    for k in (f"{lingua}-orig", lingua):
        if lingua and k in autos: return k, True
    for k in autos:
        if k.endswith("-orig"): return k, True
    return None, False


def vtt_para_texto(vtt):
    """Texto corrido de um .vtt. A legenda automatica repete cada linha 2-3 vezes (rolagem): sai uma so'."""
    linhas = []
    for l in vtt.splitlines():
        l = l.strip()
        if not l or l.startswith(("WEBVTT", "Kind:", "Language:", "NOTE")) or "-->" in l or l.isdigit(): continue
        l = re.sub(r"<[^>]+>", "", l).replace("&nbsp;", " ").replace("&amp;", "&")
        l = re.sub(r"\[[^\]]{1,20}\]", "", l).strip()          # [Musik], [Applaus]...
        if not l or l in linhas[-3:]: continue
        if linhas and l.startswith(linhas[-1]): l = l[len(linhas[-1]):].strip()
        if l: linhas.append(l)
    return re.sub(r"\s+", " ", " ".join(linhas)).strip()


MAX_AUDIO_S = 90 * 60      # acima disso nao vale transcrever o audio inteiro
_modelo = None


def transcrever(arq, lingua=None):
    """Texto corrido do audio (faster-whisper 'base': ~30x mais rapido que o tempo real na CPU daqui;
    para tirar o mecanismo, a precisao do 'base' basta)."""
    global _modelo
    from faster_whisper import WhisperModel
    if _modelo is None: _modelo = WhisperModel("base", device="cpu", compute_type="int8", cpu_threads=8)
    segs, _ = _modelo.transcribe(arq, language=lingua, vad_filter=True)
    return re.sub(r"\s+", " ", " ".join(s.text.strip() for s in segs)).strip()


def ler(video_id, perfil_dolphin="", preferida=""):
    """{titulo, canal, descricao, duracao, lingua, texto, legenda, sem_fala, com_sessao}."""
    url = f"https://www.youtube.com/watch?v={video_id}"
    tmp = tempfile.mkdtemp(prefix="min-fonte-")
    cookies = None
    try:
        rc, out, err = _ytdlp(["-J", "--skip-download", "--", url])
        if rc != 0 and _robo(err) and perfil_dolphin:
            cookies = os.path.join(tmp, "c.txt")
            cookies_do_dolphin(perfil_dolphin, cookies)
            rc, out, err = _ytdlp(["-J", "--skip-download", "--", url], cookies)
        if rc != 0:
            raise ErroFonte("o YouTube pediu login (confirme que não é robô): abra o perfil do Dolphin" if _robo(err)
                            else f"o yt-dlp falhou: {err.strip()[-200:]}")
        info = json.loads(out)
        chave, auto = escolher_legenda(info, preferida)
        texto, origem = "", ""
        if chave:
            rc, _, err = _ytdlp(["--skip-download", "--write-auto-subs" if auto else "--write-subs", "--sub-langs", chave,
                                 "--sub-format", "vtt", "-o", os.path.join(tmp, "leg.%(ext)s"), "--", url], cookies)
            arqs = [f for f in os.listdir(tmp) if f.endswith(".vtt")]
            if arqs:
                texto = vtt_para_texto(open(os.path.join(tmp, arqs[0]), encoding="utf-8", errors="replace").read())
                origem = "legenda " + chave
        if not texto and int(info.get("duration") or 0) <= MAX_AUDIO_S:
            # ⭐ sem legenda nenhuma (o documentario da SWR de 45 min, 08/10): so' o AUDIO + whisper rapido
            # ⛔ logado, o YouTube as vezes so' oferece o formato 18 (360p com audio): o whisper le o mp4 direto
            rc, _, err = _ytdlp(["-f", "bestaudio[abr<=96]/bestaudio/18/worst", "-o", os.path.join(tmp, "audio.%(ext)s"), "--", url],
                                cookies, timeout=600)
            audios = [f for f in os.listdir(tmp) if f.startswith("audio.")]
            if audios:
                texto = transcrever(os.path.join(tmp, audios[0]), (info.get("language") or preferida or None))
                origem = "whisper"
        return {"titulo": info.get("title", ""), "canal": info.get("channel") or info.get("uploader", ""),
                "descricao": (info.get("description") or "")[:4000], "duracao": int(info.get("duration") or 0),
                "lingua": info.get("language") or preferida or "", "texto": texto[:MAX_TEXTO], "legenda": origem,
                "sem_fala": len(texto.split()) < 40, "com_sessao": bool(cookies)}
    finally:
        for f in os.listdir(tmp):
            try: os.remove(os.path.join(tmp, f))
            except OSError: pass
        try: os.rmdir(tmp)
        except OSError: pass


def _autoteste():
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    info = {"language": "de", "subtitles": {"en": [{}]}, "automatic_captions": {"de-orig": [{}], "de": [{}], "fr": [{}]}}
    caso("⭐ sem manual na lingua: a automatica ORIGINAL (de-orig), nunca a traducao", escolher_legenda(info) == ("de-orig", True))
    caso("manual na lingua do video vence", escolher_legenda({**info, "subtitles": {"de-DE": [{}]}}) == ("de-DE", False))
    caso("lingua desconhecida: qualquer -orig", escolher_legenda({"automatic_captions": {"fr": [{}], "en-orig": [{}]}}) == ("en-orig", True))
    caso("sem legenda nenhuma: nada", escolher_legenda({"language": "de"}) == (None, False))
    vtt = """WEBVTT
Kind: captions
Language: de

00:00:00.000 --> 00:00:02.000
Heute zeige ich euch

00:00:02.000 --> 00:00:04.000
Heute zeige ich euch
wie man <c>Salbei</c> trocknet

00:00:04.000 --> 00:00:06.000
[Musik]
wie man Salbei trocknet
"""
    t = vtt_para_texto(vtt)
    caso("⭐ legenda automatica sem repeticao e sem [Musik]", t == "Heute zeige ich euch wie man Salbei trocknet")
    caso("⛔ pedido de login e' reconhecido", _robo("ERROR: Sign in to confirm you’re not a bot") and not _robo("HTTP 404"))
    try:
        cookies_do_dolphin("perfil-que-nao-existe", os.path.join(tempfile.gettempdir(), "x.txt"))
        caso("⛔ perfil fechado vira erro claro", False)
    except ErroFonte as e:
        caso("⛔ perfil fechado vira erro claro", "não está aberto" in str(e))
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--ler" in sys.argv:
        r = ler(sys.argv[sys.argv.index("--ler") + 1], perfil_dolphin=os.environ.get("MIN_PERFIL_DOLPHIN", ""))
        print(json.dumps({**r, "texto": r["texto"][:600] + "…"}, ensure_ascii=False, indent=1))
        sys.exit()
    sys.exit(0 if _autoteste() else 1)
