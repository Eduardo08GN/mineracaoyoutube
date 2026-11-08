# Radar de notícias quentes por país (doc: docs/radar-noticias-quentes.md).
# Camada 1, detecção sem cota do YouTube: Google Trends (consultas em alta na Pesquisa do YouTube e na web, por país),
#   Trends "Em alta agora" (RSS), Google News RSS, Wikipédia (mais vistas).
# Camada 2, demanda: interesse no YouTube do evento contra âncoras calibradas (Urda, Learjet).
# Camada 3, oferta: YouTube Data API só para os candidatos (vídeos em ES nos últimos 7 dias).
#   python -I -X utf8 radar.py [--paises ES,MX,AR,CO,CL,PE,US] [--sem-oferta] [--saida D:/pesquisa_nichos/radar_quente]
# A chave da API vem do .env local e nunca é impressa.
import argparse, datetime as dt, http.cookiejar, json, os, re, sys, time, unicodedata, urllib.parse, urllib.request
from collections import defaultdict

AQUI = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(AQUI, "..", ".."))
CFG = json.load(open(os.path.join(AQUI, "config.json"), encoding="utf-8"))
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36", "Accept-Language": "es-ES,es;q=0.9,en;q=0.8"}
_cj = http.cookiejar.CookieJar(); _op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(_cj))

def log(*a): print(*a, flush=True)
def get(u, tent=4, pausa=8):
    for i in range(tent):
        try: return _op.open(urllib.request.Request(u, headers=UA), timeout=30).read().decode("utf-8", "replace")
        except urllib.error.HTTPError as e:
            if e.code == 429 and i < tent - 1: time.sleep(pausa * (i + 1)); continue
            raise
def norm(s):
    s = unicodedata.normalize("NFKD", s.lower()); s = "".join(c for c in s if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9ñ ]+", " ", s).strip()

# ---------- Google Trends (sem API oficial aberta: endpoints do site, com cookie e ritmo lento) ----------
_tr_ok = False
def _tr_cookie():
    global _tr_ok
    if not _tr_ok: get("https://trends.google.com/trends/explore?hl=es"); _tr_ok = True; time.sleep(2)
def _tr_json(x): return json.loads(x[x.index("{"):])
def tr_explore(itens, tm, prop, hl="es"):
    _tr_cookie()
    req = {"comparisonItem": [{"keyword": k, "geo": g, "time": tm} for k, g in itens], "category": 0, "property": prop}
    w = _tr_json(get("https://trends.google.com/trends/api/explore?hl=" + hl + "&tz=0&req=" + urllib.parse.quote(json.dumps(req))))
    time.sleep(CFG["pausa_trends"]); return {x["id"]: x for x in w["widgets"]} if len(itens) == 1 else w["widgets"]
def tr_widget(w, tipo, hl="es"):
    u = f"https://trends.google.com/trends/api/widgetdata/{tipo}?hl={hl}&tz=0&req=" + urllib.parse.quote(json.dumps(w["request"])) + "&token=" + w["token"]
    j = _tr_json(get(u)); time.sleep(CFG["pausa_trends"]); return j
def tr_emalta(kw, geo, prop, tm="now 7-d"):
    """Consultas relacionadas em alta (rising) e top para uma semente, num país e numa propriedade (youtube | '' = web)."""
    ws = tr_explore([(kw, geo)], tm, prop, CFG["hl"].get(geo, "es"))
    j = tr_widget(ws["RELATED_QUERIES"], "relatedsearches", CFG["hl"].get(geo, "es"))
    L = j["default"]["rankedList"]; top = L[0]["rankedKeyword"] if L else []; alta = L[1]["rankedKeyword"] if len(L) > 1 else []
    return [(k["query"], k.get("value", 0)) for k in top], [(k["query"], k.get("formattedValue", ""), k.get("value", 0)) for k in alta]
def tr_serie(termos_geo, tm, prop, hl="es"):
    """Interesse ao longo do tempo de até 5 termos na MESMA escala (base para calibrar pelas âncoras)."""
    ws = tr_explore(termos_geo, tm, prop, hl); ts = next(w for w in ws if w["id"] == "TIMESERIES")
    j = tr_widget(ts, "multiline", hl); pts = j["default"]["timelineData"]
    return [max(p["value"][i] for p in pts) for i in range(len(termos_geo))], [sum(p["value"][i] for p in pts) for i in range(len(termos_geo))]

def trends_agora(geo):
    x = get(f"https://trends.google.com/trending/rss?geo={geo}"); out = []
    for it in re.findall(r"<item>(.*?)</item>", x, re.S):
        tit = re.search(r"<title>(.*?)</title>", it).group(1); tr = re.search(r"<ht:approx_traffic>(.*?)<", it)
        nw = re.findall(r"<ht:news_item_title>(.*?)</ht:news_item_title>", it)
        out.append({"termo": tit, "trafego": tr.group(1) if tr else "", "noticias": nw[:2]})
    return out

# ---------- Google News RSS ----------
def gnews(q, geo, dias=2):
    hl, ceid = CFG["gnews"][geo]
    x = get(f"https://news.google.com/rss/search?q={urllib.parse.quote(q + f' when:{dias}d')}&hl={hl}&gl={geo}&ceid={ceid}")
    return [{"titulo": re.sub(r"<.*?>", "", re.search(r"<title>(.*?)</title>", it, re.S).group(1)), "fonte": (re.search(r"<source[^>]*>(.*?)</source>", it) or [None, ""])[1],
             "data": (re.search(r"<pubDate>(.*?)<", it) or [None, ""])[1]} for it in re.findall(r"<item>(.*?)</item>", x, re.S)]

# ---------- Wikipédia ----------
def wiki_top(lang, dia):
    u = f"https://wikimedia.org/api/rest_v1/metrics/pageviews/top/{lang}.wikipedia/all-access/{dia:%Y/%m/%d}"
    return [(a["article"].replace("_", " "), a["views"]) for a in json.loads(get(u))["items"][0]["articles"]]

# ---------- YouTube Data API (só camada 3) ----------
def _chaves():
    env = open(os.path.join(REPO, ".env"), encoding="utf-8").read()
    return [k for k in re.split(r"[,;\s]+", re.search(r"^YOUTUBE_API_KEYS\s*=\s*(.+)$", env, re.M).group(1).strip().strip('"').strip("'")) if k]
def yt(rec, p):
    for tent in range(3):
        for k in _chaves():
            try: return json.load(urllib.request.urlopen("https://www.googleapis.com/youtube/v3/" + rec + "?" + urllib.parse.urlencode({**p, "key": k}), timeout=30))
            except urllib.error.HTTPError as e:
                if e.code in (400, 403): continue
                if e.code == 429: time.sleep(10); continue
                raise
        time.sleep(30)
    return None
def iso_s(d):
    m = re.match(r"PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?", d or ""); return 0 if not m else int(m[1] or 0) * 3600 + int(m[2] or 0) * 60 + int(m[3] or 0)
def oferta(q, geo, chave, dias=7):
    desde = (dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=dias)).strftime("%Y-%m-%dT%H:%M:%SZ")
    r = yt("search", {"part": "snippet", "q": q, "type": "video", "maxResults": 25, "order": "viewCount", "publishedAfter": desde, "regionCode": geo, "relevanceLanguage": CFG["hl"].get(geo, "es")[:2]})
    if not r: return None
    ids = [i["id"]["videoId"] for i in r.get("items", [])]
    if not ids: return {"n": 0, "n_longo": 0, "max": 0, "top": []}
    vs = yt("videos", {"part": "snippet,statistics,contentDetails", "id": ",".join(ids)})["items"]; agora = dt.datetime.now(dt.timezone.utc); L = []
    for v in vs:
        s = v["snippet"]; pub = dt.datetime.fromisoformat(s["publishedAt"].replace("Z", "+00:00")); dur = iso_s(v["contentDetails"].get("duration"))
        L.append({"views": int(v["statistics"].get("viewCount", 0)), "h": round((agora - pub).total_seconds() / 3600), "dur": dur, "canal": s["channelTitle"], "titulo": s["title"],
                  "lang": (s.get("defaultAudioLanguage") or s.get("defaultLanguage") or "?")[:2]})
    toks = [w for w in chave.split() if len(w) > 3] or chave.split()
    L = [x for x in L if any(w in norm(x["titulo"]) for w in toks)]
    if not L: return {"n": 0, "n_longo": 0, "max": 0, "max_longo": 0, "top": []}
    L.sort(key=lambda x: -x["views"]); longos = [x for x in L if x["dur"] >= 240]
    return {"n": len(L), "n_longo": len(longos), "max": L[0]["views"], "max_longo": longos[0]["views"] if longos else 0, "top": L[:5]}

# ---------- agrupamento em eventos ----------
def chave_evento(q, sementes):
    t = [w for w in norm(q).split() if w not in CFG["vazias"] and w not in sementes and len(w) > 2]
    return " ".join(sorted(set(t))[:3])
def perfil(texto):
    n = norm(texto); p = []
    for nome, pal in CFG["perfis"].items():
        if any(re.search(r"\b" + w + r"\b", n) for w in pal): p.append(nome)
    if any(re.search(r"\b" + w + r"\b", n) for w in CFG["fora"]): p = ["fora"]
    return p

def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--paises", default=",".join(CFG["paises"])); ap.add_argument("--sem-oferta", action="store_true")
    ap.add_argument("--saida", default=CFG["saida"]); ap.add_argument("--max-oferta", type=int, default=CFG["max_oferta"]); ap.add_argument("--de-json", help="reaproveita a coleta (camada 1) de um radar_*.json")
    a = ap.parse_args()
    paises = a.paises.split(","); os.makedirs(a.saida, exist_ok=True); agora = dt.datetime.now()
    bruto = {"quando": agora.isoformat(timespec="minutes"), "paises": {}}
    eventos = defaultdict(lambda: {"consultas": [], "paises": set(), "props": set(), "score": 0.0, "noticias": []})
    if a.de_json:
        bruto = json.load(open(a.de_json, encoding="utf-8"))["bruto"]; paises = list(bruto["paises"])
    for g in ([] if a.de_json else paises):
        lang = CFG["hl"].get(g, "es")[:2]; sem = CFG["sementes"][lang]; bp = bruto["paises"][g] = {"emalta": {}, "agora": [], "gnews": {}}
        log(f"== {g}")
        try: bp["agora"] = trends_agora(g)
        except Exception as e: log("  rss falhou", e)
        for s in sem:
            for prop in CFG["propriedades"]:
                try: top, alta = tr_emalta(s, g, prop)
                except Exception as e: log(f"  trends {s}/{prop or 'web'} falhou: {str(e)[:60]}"); continue
                bp["emalta"][f"{s}|{prop or 'web'}"] = {"top": top[:15], "alta": alta[:25]}
            log(f"  {s}: ok")
        for s in CFG["gnews_sementes"][lang]:
            try: bp["gnews"][s] = gnews(s, g)[:40]
            except Exception as e: log("  gnews falhou", e)
    gen = set(CFG["genericas"])
    for g, bp in bruto["paises"].items():
        sem = set(norm(x) for x in CFG["sementes"][CFG["hl"].get(g, "es")[:2]])
        for chave, d in bp["emalta"].items():
            prop = chave.split("|")[1]
            for q, fv, v in d["alta"]:
                k = chave_evento(q, sem)
                if not k or not (set(k.split()) - gen): continue   # só palavras genéricas = resíduo de outro evento
                e = eventos[k]; e["consultas"].append(q); e["paises"].add(g); e["props"].add(prop)
                e["score"] += (5000 if "Aumento" in fv or "Breakout" in fv or "Excelente" in fv else min(int(v or 0), 5000)) / 1000 * (2 if prop == "youtube" else 1)
    # Wikipédia (dia anterior), artigos com palavra de acidente/desastre
    ontem = agora - dt.timedelta(days=1); bruto.setdefault("wiki", {})
    for lang in sorted(set(CFG["hl"][g][:2] for g in paises)):
        if a.de_json: break
        try: bruto["wiki"][lang] = [(t, v) for t, v in wiki_top(lang, ontem)[:400] if perfil(t) and "fora" not in perfil(t)][:30]
        except Exception as e: log("wiki falhou", e)
    # junta notícias aos eventos
    for g, bp in bruto["paises"].items():
        for s, L in bp["gnews"].items():
            for n in L:
                nt = set(norm(n["titulo"]).split())
                for k, e in eventos.items():
                    if all(w in nt for w in k.split()): e["noticias"].append(f'{g}: {n["titulo"]} ({n["fonte"]})')
    # funde chaves do mesmo evento: token específico em comum, ou as duas chaves juntas em >= 2 manchetes ("palm beach" + "florida" + "learjet")
    ks = [k for k in eventos if "fora" not in perfil(" ".join(eventos[k]["consultas"]))]   # tira esporte/política antes de fundir
    pai = {k: k for k in ks}
    def raiz(k):
        while pai[k] != k: pai[k] = pai[pai[k]]; k = pai[k]
        return k
    tok = {k: set(k.split()) - gen for k in ks}
    manchetes = [set(norm(n["titulo"]).split()) for bp in bruto["paises"].values() for L in bp["gnews"].values() for n in L]
    idx = defaultdict(set)   # token -> manchetes que o contêm (índice invertido)
    for j, m in enumerate(manchetes):
        for w in m: idx[w].add(j)
    def nman(ws):
        ws = list(ws); r = set(idx.get(ws[0], ()))
        for w in ws[1:]: r &= idx.get(w, set())
        return len(r)
    por_tok = defaultdict(list)
    for k in ks:
        for w in tok[k]: por_tok[w].append(k)
    for L in por_tok.values():               # token específico em comum
        for k in L[1:]: pai[raiz(k)] = raiz(L[0])
    viz = [k for k in ks if tok[k] and nman(tok[k]) >= 2]
    for i, a1 in enumerate(viz):             # juntas em >= 2 manchetes (só chaves que aparecem em manchetes)
        for a2 in viz[i + 1:]:
            if raiz(a1) != raiz(a2) and nman(tok[a1] | tok[a2]) >= 2: pai[raiz(a1)] = raiz(a2)
    grupos = defaultdict(list)
    for k in ks: grupos[raiz(k)].append(k)
    ev = []
    for membros in grupos.values():
        membros.sort(key=lambda k: -eventos[k]["score"]); C = [eventos[k] for k in membros]
        cons = list(dict.fromkeys(q for e in C for q in e["consultas"])); nots = list(dict.fromkeys(n for e in C for n in e["noticias"]))
        txt = " ".join(cons) + " " + " ".join(nots[:8]); p = perfil(txt)
        if "fora" in p: continue
        ev.append({"evento": " / ".join(membros[:3]), "consultas": cons[:10], "paises": sorted(set().union(*[e["paises"] for e in C])),
                   "props": sorted(set().union(*[e["props"] for e in C])), "score": round(sum(e["score"] for e in C), 1),
                   "n_noticias": len(nots), "noticias": nots[:4], "perfil": p})
    ev.sort(key=lambda x: -(x["score"] + 0.3 * x["n_noticias"]))
    # camada 2: calibração contra as âncoras na mesma escala (Pesquisa do YouTube, último mês)
    for e in ev[:a.max_oferta]:
        e["vs_ancora"] = {}
        for g in e["paises"][:3]:
            anc = CFG["ancoras"].get(g) or CFG["ancoras"]["_"]
            try:
                pico, soma = tr_serie([(e["consultas"][0], g), (anc["termo"], g)], "today 1-m", "youtube", CFG["hl"].get(g, "es"))
                e["vs_ancora"][g] = {"ancora": anc["rotulo"], "razao_pico": round(pico[0] / pico[1], 2) if pico[1] else None}
            except Exception as x: e["vs_ancora"][g] = {"erro": str(x)[:60]}
    # camada 3: oferta no YouTube
    if not a.sem_oferta:
        for e in ev[:a.max_oferta]:
            e["oferta"] = oferta(e["consultas"][0], e["paises"][0], " ".join(sorted(set(e["evento"].replace("/", " ").split()) - gen)))
    nome = agora.strftime("%Y%m%d_%H%M")
    json.dump({"bruto": bruto, "eventos": ev}, open(os.path.join(a.saida, f"radar_{nome}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1, default=list)
    open(os.path.join(a.saida, f"radar_{nome}.md"), "w", encoding="utf-8").write(relatorio(bruto, ev, a.max_oferta))
    log("SAIDA", os.path.join(a.saida, f"radar_{nome}.md"))

def relatorio(bruto, ev, n):
    L = [f"# Radar de notícias quentes, {bruto['quando']}", "", "Score = consultas em alta no Trends (Pesquisa do YouTube vale 2×). Razão de pico = pico do evento / pico da âncora na Pesquisa do YouTube do país, no último mês (1,0 = Urda/Learjet).", "",
         "| # | Evento | Perfil | Países | Score | Notícias | Pico vs âncora | Oferta ES 7 d (longos / máx. longo / máx.) |", "|---|---|---|---|---|---|---|---|"]
    for i, e in enumerate(ev[:60], 1):
        va = "; ".join(f"{g} {v['razao_pico']}× {v['ancora']}" for g, v in (e.get("vs_ancora") or {}).items() if v.get("razao_pico") is not None) or "-"
        of = e.get("oferta") or {}
        L.append(f"| {i} | {e['evento']}<br><sub>{'; '.join(e['consultas'][:3])}</sub> | {','.join(e['perfil']) or '-'} | {','.join(e['paises'])} | {e['score']} | {e['n_noticias']} | "
                 f"{va} | {(str(of.get('n_longo')) + ' / ' + str(of.get('max_longo')) + ' / ' + str(of.get('max'))) if of else '-'} |")
    L += ["", "## Notícias dos eventos do topo", ""]
    for e in ev[:n]:
        L.append(f"- **{e['evento']}**: " + " · ".join(e["noticias"][:3]))
        for t in (e.get("oferta") or {}).get("top", [])[:3]: L.append(f"  - YT {t['views']:,} views, {t['h']} h, {t['dur'] // 60} min, {t['lang']}, {t['canal']}: {t['titulo']}")
    L += ["", "## Em alta agora (RSS do Trends, por país)", ""]
    for g, bp in bruto["paises"].items(): L.append(f"- **{g}**: " + ", ".join(f"{x['termo']} ({x['trafego']})" for x in bp["agora"][:12]))
    L += ["", "## Wikipédia: artigos de acidente/desastre mais vistos ontem", ""]
    for lang, W in bruto.get("wiki", {}).items(): L.append(f"- **{lang}**: " + ", ".join(f"{t} ({v:,})" for t, v in W[:12]))
    return "\n".join(L) + "\n"

if __name__ == "__main__": main()
