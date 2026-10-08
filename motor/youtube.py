# -*- coding: utf-8 -*-
r"""YOUTUBE — a YouTube Data API v3, com a cota contada e a busca guardada no dia.

    python motor/youtube.py --autoteste
    python motor/youtube.py --provar          # uma busca de verdade (gasta 100 unidades)

Custos (unidades): search.list = 100 · videos.list = 1 (ate' 50 ids) · channels.list = 1 (ate' 50 ids).
A cota padrao e' 10.000 por dia e zera a meia-noite do Pacifico.

⭐ VARIAS CHAVES (de contas diferentes: a cota e' por projeto do Google): cada uma tem a sua cota
contada; quando uma acaba (pela nossa conta ou porque o Google respondeu quotaExceeded), a chamada
segue na proxima, sem o garimpo perceber. Chave recusada (invalida, API desligada) sai do dia.
⛔ Busca e' cara: a mesma busca no mesmo dia vem do cache (banco), nunca da API de novo.
⛔ Antes de cada chamada a cota e' conferida: o motor para antes de estourar, nao depois.
"""
import datetime as _dt, json, os, re, sys, urllib.error, urllib.parse, urllib.request

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)

import config                                                               # noqa: E402

BASE = "https://www.googleapis.com/youtube/v3/"
COTA_DIA = 10_000
CUSTO = {"search": 100, "videos": 1, "channels": 1}


class ErroYoutube(RuntimeError):
    pass


class CotaEsgotada(ErroYoutube):
    pass


class ChaveInvalida(ErroYoutube):
    pass


def dia_pacifico(agora=None):
    """O dia da cota (America/Los_Angeles). ⭐ Sem a base de fusos no Windows, UTC-8 fixo."""
    agora = agora or _dt.datetime.now(_dt.timezone.utc)
    try:
        from zoneinfo import ZoneInfo
        return agora.astimezone(ZoneInfo("America/Los_Angeles")).date().isoformat()
    except Exception:                                                      # noqa: BLE001
        return (agora - _dt.timedelta(hours=8)).date().isoformat()


def duracao_iso(s):
    """'PT1H2M3S' -> 3723 segundos. Vazio ou estranho -> 0."""
    m = re.fullmatch(r"P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", s or "")
    if not m: return 0
    d, h, mi, se = (int(x or 0) for x in m.groups())
    return d * 86400 + h * 3600 + mi * 60 + se


def _melhor_thumb(th):
    for k in ("maxres", "standard", "high", "medium", "default"):
        if th.get(k, {}).get("url"): return th[k]["url"]
    return ""


def _http_padrao(url):
    try:
        with urllib.request.urlopen(url, timeout=30) as r:
            return json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            corpo = json.loads(e.read().decode("utf-8"))
        except Exception:                                                  # noqa: BLE001
            corpo = {}
        return {"error": corpo.get("error") or {"code": e.code, "message": str(e)}}


class YouTube:
    """`banco` guarda cota e cache. `http(url) -> dict` existe para o autoteste nao sair na rede."""

    def __init__(self, banco, chave=None, http=None, cota_dia=COTA_DIA, chaves=None):
        self.banco = banco
        if chaves is not None: self.chaves = list(chaves)
        elif chave is not None: self.chaves = [chave] if chave else []
        else: self.chaves = config.chaves()
        self.http = http or _http_padrao
        self.cota_dia = cota_dia
        self.ao_trocar = None          # fn(texto): o nucleo poe no registro quando uma chave sai do dia
        # ⭐ o gasto de hoje feito antes da cota por chave existir vai para a primeira chave
        dia = dia_pacifico()
        if self.chaves and not self.banco.tem_cota_por_chave(dia) and self.banco.cota_usada(dia):
            self.banco._x("INSERT OR IGNORE INTO cota_chaves(dia, chave_id, usadas) VALUES(?, ?, ?)",
                          (dia, config.id_chave(self.chaves[0]), self.banco.cota_usada(dia)))

    @property
    def chave(self):
        return self.chaves[0] if self.chaves else ""

    # ── cota ──
    def estado_chaves(self):
        dia = dia_pacifico()
        saida, em_uso = [], None
        for k in self.chaves:
            cid = config.id_chave(k)
            c = self.banco.cota_chave(dia, cid)
            livres = 0 if c["esgotada"] else max(0, self.cota_dia - c["usadas"])
            if em_uso is None and livres > 0: em_uso = cid
            saida.append({"id": cid, "mascara": config.mascarar(k), "usadas": c["usadas"], "limite": self.cota_dia,
                          "livres": livres, "esgotada": bool(c["esgotada"]), "motivo": c["motivo"]})
        for s in saida: s["em_uso"] = s["id"] == em_uso
        return saida

    def cota(self):
        cs = self.estado_chaves()
        usadas = sum(c["usadas"] for c in cs) if cs else self.banco.cota_usada(dia_pacifico())
        return {"dia": dia_pacifico(), "usadas": usadas, "limite": self.cota_dia * max(len(cs), 1),
                "livres": sum(c["livres"] for c in cs), "chaves": cs}

    def cabe(self, unidades):
        return any(c["livres"] >= unidades for c in self.estado_chaves())

    def _avisar(self, texto):
        if self.ao_trocar:
            try: self.ao_trocar(texto)
            except Exception: pass                                         # noqa: BLE001

    def _uma_chamada(self, k, recurso, params):
        """(dados, problema). problema = None | 'cota' | 'recusada:<motivo>'."""
        url = BASE + recurso + "?" + urllib.parse.urlencode({**params, "key": k})
        d = self.http(url)
        self.banco.gastar_cota(dia_pacifico(), CUSTO[recurso], config.id_chave(k))
        if "error" not in d: return d, None
        err = d["error"] or {}
        motivos = {x.get("reason") for x in err.get("errors", [])}
        if motivos & {"quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded"}: return d, "cota"
        if motivos & {"keyInvalid", "keyExpired", "accessNotConfigured", "forbidden", "ipRefererBlocked"} or \
                err.get("code") in (400, 403) and "key" in str(err.get("message", "")).lower():
            return d, "recusada:" + (str(err.get("message", "")) or ",".join(sorted(m for m in motivos if m)))[:120]
        raise ErroYoutube(f"YouTube respondeu {err.get('code')}: {err.get('message', '')[:120]}")

    def _chamar(self, recurso, params):
        if not self.chaves: raise ChaveInvalida("sem chave da YouTube API (Ajustes)")
        custo, dia = CUSTO[recurso], dia_pacifico()
        for k in self.chaves:
            cid = config.id_chave(k)
            c = self.banco.cota_chave(dia, cid)
            if c["esgotada"] or self.cota_dia - c["usadas"] < custo: continue
            d, problema = self._uma_chamada(k, recurso, params)
            if problema is None: return d
            if problema == "cota":
                # ⭐ o Google zerou antes da nossa conta: quase sempre e' chave do MESMO projeto de outra
                cedo = c["usadas"] < self.cota_dia * 0.9
                self.banco.marcar_chave(dia, cid, True, "o Google diz que a cota acabou" +
                                        (" — parece ser do mesmo projeto de outra chave" if cedo else ""))
            else:
                self.banco.marcar_chave(dia, cid, True, "chave recusada: " + problema.split(":", 1)[1])
            self._avisar(f"chave {config.mascarar(k)} saiu do dia ({self.banco.cota_chave(dia, cid)['motivo']}); "
                         "seguindo na próxima")
        if all(self.banco.cota_chave(dia, config.id_chave(k))["motivo"].startswith("chave recusada") for k in self.chaves):
            raise ChaveInvalida("nenhuma chave da YouTube API foi aceita (Ajustes)")
        raise CotaEsgotada(f"as {len(self.chaves)} chave(s) estão sem cota hoje — zera à meia-noite do Pacífico")

    def testar_chave(self, k):
        """(ok, motivo). Uma chamada de 1 unidade, so' com essa chave."""
        try:
            d, problema = self._uma_chamada(k, "videos", {"part": "id", "id": "dQw4w9WgXcQ"})
        except ErroYoutube as e:
            return False, str(e)
        if problema is None: return True, "ok"
        if problema == "cota": return True, "aceita, mas sem cota hoje"
        return False, problema.split(":", 1)[1]

    # ── leitura ──
    def buscar(self, q, antes=None, depois=None, ordem="viewCount", maximo=50, tipo="video",
               duracao=None, idioma="en", regiao="US"):
        """Ids de video (ou canal, com tipo='channel'). Cacheado no dia pela consulta inteira."""
        p = {"part": "id", "q": q, "type": tipo, "order": ordem, "maxResults": min(50, maximo),
             "relevanceLanguage": idioma, "regionCode": regiao}
        if antes: p["publishedBefore"] = f"{antes}T00:00:00Z"
        if depois: p["publishedAfter"] = f"{depois}T00:00:00Z"
        if duracao and tipo == "video": p["videoDuration"] = duracao
        chave = "search:" + json.dumps(p, sort_keys=True)
        dia = dia_pacifico()
        guardado = self.banco.cache_ler(chave, dia)
        if guardado is not None: return guardado
        d = self._chamar("search", p)
        campo = "videoId" if tipo == "video" else "channelId"
        ids = [i["id"][campo] for i in d.get("items", []) if campo in i.get("id", {})]
        self.banco.cache_gravar(chave, dia, ids)
        return ids

    def videos(self, ids):
        """Os videos com estatistica, gravados no banco. Lotes de 50 (1 unidade cada)."""
        saida = []
        for i in range(0, len(ids), 50):
            lote = ids[i:i + 50]
            d = self._chamar("videos", {"part": "snippet,statistics,contentDetails,status", "id": ",".join(lote),
                                        "maxResults": 50})
            for it in d.get("items", []):
                sn, st = it.get("snippet", {}), it.get("statistics", {})
                v = {"id": it["id"], "titulo": sn.get("title", ""), "canal_id": sn.get("channelId", ""),
                     "canal": sn.get("channelTitle", ""), "publicado": (sn.get("publishedAt") or "")[:10],
                     "views": int(st.get("viewCount", 0)), "likes": int(st.get("likeCount", 0)),
                     "comentarios": int(st.get("commentCount", 0)),
                     "duracao": duracao_iso(it.get("contentDetails", {}).get("duration")),
                     "thumb": _melhor_thumb(sn.get("thumbnails", {})), "categoria": sn.get("categoryId", ""),
                     "lingua": (sn.get("defaultAudioLanguage") or sn.get("defaultLanguage") or "").lower(),
                     "kids": bool(it.get("status", {}).get("madeForKids"))}
                self.banco.gravar_video(v)
                saida.append(v)
        return saida

    def canais(self, ids):
        """Os canais com inscritos e data de criacao, gravados no banco."""
        saida = []
        ids = list(dict.fromkeys(i for i in ids if i))
        for i in range(0, len(ids), 50):
            lote = ids[i:i + 50]
            d = self._chamar("channels", {"part": "snippet,statistics", "id": ",".join(lote), "maxResults": 50})
            for it in d.get("items", []):
                sn, st = it.get("snippet", {}), it.get("statistics", {})
                c = {"id": it["id"], "nome": sn.get("title", ""), "inscritos": int(st.get("subscriberCount", 0)),
                     "n_videos": int(st.get("videoCount", 0)), "views": int(st.get("viewCount", 0)),
                     "criado": (sn.get("publishedAt") or "")[:10], "thumb": _melhor_thumb(sn.get("thumbnails", {})),
                     "descricao": (sn.get("description") or "")[:500], "pais": (sn.get("country") or "").upper()}
                self.banco.gravar_canal(c)
                saida.append(c)
        return saida


def _autoteste():
    import tempfile
    from banco import Banco
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)

    caso("duracao ISO", duracao_iso("PT1H2M3S") == 3723 and duracao_iso("PT18M53S") == 1133 and duracao_iso("") == 0)
    caso("dia do Pacifico", dia_pacifico(_dt.datetime(2026, 10, 8, 5, 0, tzinfo=_dt.timezone.utc)) == "2026-10-07")

    chamadas = []
    def falso(url):
        chamadas.append(url)
        if "/search?" in url:
            return {"items": [{"id": {"videoId": "V1"}}, {"id": {"videoId": "V2"}}]}
        if "/videos?" in url:
            return {"items": [{"id": "V1", "snippet": {"title": "How to Pick a Sweet Watermelon", "channelId": "C1",
                                                      "channelTitle": "Daisy", "publishedAt": "2016-07-01T00:00:00Z",
                                                      "thumbnails": {"high": {"url": "h.jpg"}}},
                               "statistics": {"viewCount": "16000000"}, "contentDetails": {"duration": "PT2M3S"}}]}
        if "/channels?" in url:
            return {"items": [{"id": "C1", "snippet": {"title": "Daisy", "publishedAt": "2010-01-01T00:00:00Z"},
                               "statistics": {"subscriberCount": "956000", "videoCount": "300"}}]}
        return {}
    b = Banco(os.path.join(tempfile.mkdtemp(prefix="min-yt-"), "t.db"))
    yt = YouTube(b, chave="teste", http=falso)
    ids = yt.buscar("watermelon", antes="2022-01-01")
    caso("busca devolve ids", ids == ["V1", "V2"])
    caso("⭐ a mesma busca no dia vem do cache (sem gastar)", yt.buscar("watermelon", antes="2022-01-01") == ids
         and len(chamadas) == 1 and yt.cota()["usadas"] == 100)
    caso("publishedBefore vai no formato RFC 3339", "publishedBefore=2022-01-01T00%3A00%3A00Z" in chamadas[0])
    v = yt.videos(ids)
    caso("video com views e duracao", v[0]["views"] == 16_000_000 and v[0]["duracao"] == 123 and v[0]["thumb"] == "h.jpg")
    c = yt.canais(["C1", "C1", ""])
    caso("canal sem repetir id", c[0]["inscritos"] == 956_000 and "id=C1&" in chamadas[-1])
    caso("cota soma 100 + 1 + 1", yt.cota()["usadas"] == 102)

    yt2 = YouTube(b, chave="teste", http=falso, cota_dia=150)
    try:
        yt2.buscar("outra coisa"); caso("⛔ para antes de estourar a cota", False)
    except CotaEsgotada:
        caso("⛔ para antes de estourar a cota", True)
    try:
        YouTube(b, chave="", http=falso).buscar("x"); caso("⛔ sem chave: erro claro", False)
    except ChaveInvalida:
        caso("⛔ sem chave: erro claro", True)
    # ⭐ rotacao: a primeira chave esgota no Google, a segunda e' recusada, a terceira atende
    usadas_por = []
    def tres(url):
        k = urllib.parse.parse_qs(urllib.parse.urlparse(url).query)["key"][0]
        usadas_por.append(k)
        if k == "A": return {"error": {"code": 403, "message": "quota", "errors": [{"reason": "quotaExceeded"}]}}
        if k == "B": return {"error": {"code": 400, "message": "API key not valid", "errors": [{"reason": "keyInvalid"}]}}
        return falso(url)
    b3 = Banco(os.path.join(tempfile.mkdtemp(prefix="min-yt3-"), "t.db"))
    trocas = []
    y3 = YouTube(b3, chaves=["A", "B", "C"], http=tres)
    y3.ao_trocar = trocas.append
    caso("⭐ rotaciona sozinho ate a chave que atende", y3.videos(["V1"])[0]["views"] == 16_000_000 and usadas_por == ["A", "B", "C"])
    est = {c["mascara"]: c for c in y3.cota()["chaves"]}
    caso("⭐ chave esgotada cedo e' marcada como 'mesmo projeto'", "mesmo projeto" in y3.estado_chaves()[0]["motivo"])
    caso("chave recusada sai do dia", y3.estado_chaves()[1]["motivo"].startswith("chave recusada"))
    caso("a que atende fica 'em uso' e o registro ouviu as trocas", y3.estado_chaves()[2]["em_uso"] and len(trocas) == 2)
    caso("cota total soma as chaves", y3.cota()["limite"] == 30000 and y3.cota()["livres"] == 10000 - 1)
    usadas_por.clear(); y3.videos(["V1"])
    caso("⭐ na chamada seguinte vai direto na que funciona", usadas_por == ["C"])
    caso("testar chave: recusada", y3.testar_chave("B")[0] is False and y3.testar_chave("C") == (True, "ok"))
    def cheia(url):
        return {"error": {"code": 403, "message": "quota", "errors": [{"reason": "quotaExceeded"}]}}
    try:
        YouTube(b, chave="k", http=cheia).videos(["x"]); caso("cota do Google esgotada vira CotaEsgotada", False)
    except CotaEsgotada:
        caso("cota do Google esgotada vira CotaEsgotada", True)
    b.fechar()
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


def _provar():
    from banco import Banco
    yt = YouTube(Banco())
    ids = yt.buscar("how to pick a sweet watermelon", antes="2020-01-01", maximo=5)
    for v in yt.videos(ids):
        print(f"{v['views']:>12,}  {v['publicado']}  {v['titulo']}")
    print(yt.cota())


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
    if "--provar" in sys.argv: _provar()
