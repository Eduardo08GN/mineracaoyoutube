# -*- coding: utf-8 -*-
r"""YOUTUBE — a YouTube Data API v3, com a cota contada e a busca guardada no dia.

    python motor/youtube.py --autoteste
    python motor/youtube.py --provar          # uma busca de verdade (gasta 100 unidades)

Custos (unidades): search.list = 100 · videos.list = 1 (ate' 50 ids) · channels.list = 1 (ate' 50 ids).
A cota padrao e' 10.000 por dia e zera a meia-noite do Pacifico.

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

    def __init__(self, banco, chave=None, http=None, cota_dia=COTA_DIA):
        self.banco = banco
        self.chave = chave if chave is not None else config.chave_youtube()
        self.http = http or _http_padrao
        self.cota_dia = cota_dia

    # ── cota ──
    def cota(self):
        dia = dia_pacifico()
        usadas = self.banco.cota_usada(dia)
        return {"dia": dia, "usadas": usadas, "limite": self.cota_dia, "livres": max(0, self.cota_dia - usadas)}

    def cabe(self, unidades):
        return self.cota()["livres"] >= unidades

    def _chamar(self, recurso, params):
        if not self.chave: raise ChaveInvalida("sem chave da YouTube API (Ajustes)")
        custo = CUSTO[recurso]
        if not self.cabe(custo): raise CotaEsgotada("a cota de hoje acabou — volta depois da meia-noite do Pacífico")
        url = BASE + recurso + "?" + urllib.parse.urlencode({**params, "key": self.chave})
        d = self.http(url)
        self.banco.gastar_cota(dia_pacifico(), custo)
        if "error" in d:
            err = d["error"] or {}
            motivos = {x.get("reason") for x in err.get("errors", [])}
            if "quotaExceeded" in motivos or "dailyLimitExceeded" in motivos:
                raise CotaEsgotada("a cota de hoje acabou — volta depois da meia-noite do Pacífico")
            if "keyInvalid" in motivos or err.get("code") in (400, 403) and "API key" in str(err.get("message")):
                raise ChaveInvalida("a chave da YouTube API não foi aceita")
            raise ErroYoutube(f"YouTube respondeu {err.get('code')}: {err.get('message', '')[:120]}")
        return d

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
