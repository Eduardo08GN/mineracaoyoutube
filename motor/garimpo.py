# -*- coding: utf-8 -*-
r"""GARIMPO — uma rodada de mineracao: sementes -> virais antigos -> nota -> remakes -> titulos.

    python motor/garimpo.py --autoteste

Passos (cada um avisa o painel por `etapa` e `diz`):
    1. buscar     cada semente na API, so' videos ANTES da data de corte, por views
    2. medir      views, duracao e inscritos do canal; tira short, tira o que ja' tem a persona
    3. produzir?  o Claude olha os titulos: o que nao da' para refazer com avatar + b-roll gerado sai
                  (fica gravado como "inviavel", com o motivo) antes de gastar cota checando remake
    3. pontuar    outlier + nota previa; grava as oportunidades
    4. remakes    para as melhores: alguem ja' remakou com a persona depois de 2023?
    5. reescrever o Claude escreve os titulos, o tema, o angulo do produto e o encaixe
    6. nota final (+ a fome: o vao de oferta)
    7. equivalentes as melhores em frances e alemao: titulo local, busca nativa, demanda e oferta la'

⛔ `cancelado()` e' olhado entre cada passo caro: cancelar nunca deixa a cota correndo.
"""
import os, sys

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)

import persona as _persona                                                  # noqa: E402
import producao as _producao                                                # noqa: E402
import score as _score                                                      # noqa: E402
from youtube import CUSTO                                                   # noqa: E402

# ⛔ clipe de musica nao e' tutorial: "things mechanics don't want you to know" trouxe Mike + The
# Mechanics e Foreigner (medido em 08/10)
CATEGORIAS_FORA = {"10"}

# ⛔ cada mercado aceita a sua lingua de audio e os seus paises de canal (catalogo.PAISES).
# "cooking for a large family" trouxe receitas de vila indianas (Mutton Biryani, 111 M) como
# oportunidade Hutterite: o video nao declarava lingua, o canal declarava IN (medido em 08/10).
LINGUAS_OK = _persona.IDIOMAS["en"]["linguas"]
PAISES_OK = _persona.IDIOMAS["en"]["paises"]


def publico_ok(v, pais="", idioma="en"):
    """O video fala com o publico daquele mercado? Lingua do audio, pais do canal, sem escrita indiana
    no titulo e nao e' feito para criancas (paga pouco e nao vende produto: Ryan's World)."""
    P = _persona.IDIOMAS[idioma]
    if (v.get("lingua") or "").lower() not in P["linguas"]: return False
    if (pais or "").upper() not in P["paises"] or v.get("kids"): return False
    return not any("\u0900" <= ch <= "\u0dff" for ch in v.get("titulo", ""))

FILTROS_PADRAO = {
    "antes": "2022-01-01",      # o viral precisa ser da era antes da IA
    "min_views": 1_000_000,
    "min_duracao": 120,         # segundos: tira shorts e cortes
    "remakes": 6,               # quantas das melhores checam remake (101 unidades cada)
    "reescrever": 12,           # quantas das melhores vao para o Claude
    "remake_depois": "2023-01-01",
    "equivalentes": 2,          # quantas das melhores ganham equivalente em cada mercado (102 unidades cada)
    "idiomas": "en,fr,de,es",   # os mercados das equivalencias (o de origem sai sozinho)
}


class Cancelado(Exception):
    pass


def _seis_meses():
    import datetime as _dt
    return (_dt.date.today() - _dt.timedelta(days=183)).isoformat()


def filtros_completos(f):
    out = dict(FILTROS_PADRAO)
    for k, v in (f or {}).items():
        if k in out and v not in (None, ""): out[k] = type(FILTROS_PADRAO[k])(v)
    return out


def custo_estimado(n_sementes, filtros=None, origem="en"):
    """Unidades da API que um garimpo gasta no maximo (o cache do dia pode baixar)."""
    f = filtros_completos(filtros)
    por_semente = CUSTO["search"] + CUSTO["videos"] + CUSTO["channels"]
    busca = CUSTO["search"] + CUSTO["videos"]
    return (n_sementes * por_semente + f["remakes"] * busca
            + f["equivalentes"] * len(idiomas_de(f, origem)) * (busca + CUSTO["channels"]))


def idiomas_de(f, origem="en"):
    """Os mercados de destino das equivalencias, sem o de origem."""
    return [k.strip() for k in str(f.get("idiomas") or "").split(",")
            if k.strip() in _persona.IDIOMAS and k.strip() != origem]


def medir_equivalente(yt, p, eq, idioma, hoje=None, local=None):
    """Busca a consulta nativa no pais do idioma (por views, sem data) e mede la':
    demanda (o maior viral nativo), oferta recente (top 50 publicados nos ultimos 12 meses) e
    quantos ja' trazem a persona. ⭐ Persona ausente + demanda alta = vao aberto naquele idioma."""
    import datetime as _dt
    I = _persona.IDIOMAS[idioma]
    ids = yt.buscar(eq["consulta"], ordem="viewCount", maximo=50, idioma=I["idioma"], regiao=I["regiao"])
    vids = [v for v in (yt.videos(ids) if ids else []) if v["duracao"] >= 60]
    pais = {c["id"]: c.get("pais", "") for c in (yt.canais([v["canal_id"] for v in vids]) if vids else [])}
    vids = [v for v in vids if publico_ok(v, pais.get(v["canal_id"], ""), idioma)]
    corte = ((hoje or _dt.date.today()) - _dt.timedelta(days=365)).isoformat()
    local = local or p
    marcas = {w.lower() for w in [eq.get("persona_local") or ""] + list(local.get("assinatura") or [])
              + list(p.get("assinatura") or []) if w}
    com = [v for v in vids if any(m in v["titulo"].lower() for m in marcas)]
    vids.sort(key=lambda v: -v["views"])
    top = [{k: v[k] for k in ("id", "titulo", "views", "publicado", "canal", "thumb")} for v in vids[:4]]
    return {**eq, "demanda": vids[0]["views"] if vids else 0,
            "oferta_recente": sum(v["publicado"] >= corte for v in vids), "com_persona": len(com), "top": top}


def gerar_equivalentes(banco, yt, p, ops, idiomas, diz=print, checar=lambda: None, equivaler=None):
    """ops = [{oid, video_id, titulo, remake}]. Grava e devolve quantos equivalentes mediu."""
    equivaler = equivaler or _persona.equivalentes
    idiomas = [k for k in idiomas if k in _persona.IDIOMAS and k != p.get("idioma", "en")]
    if not ops or not idiomas: return 0
    try:
        locais = equivaler(p, [{"id": o["video_id"], "titulo": o["titulo"], "remake": o.get("remake", "")} for o in ops], idiomas)
    except Exception as e:                                                 # noqa: BLE001
        diz(f"⚠ equivalências falharam: {e}"); return 0
    n = 0
    for o in ops:
        for k, eq in (locais.get(o["video_id"]) or {}).items():
            checar()
            if not yt.cabe(CUSTO["search"] + CUSTO["videos"] + CUSTO["channels"]):
                diz("⚠ cota baixa: parei as equivalências"); return n
            local, importada = _persona.local_de(p, k)
            m = medir_equivalente(yt, p, eq, k, local=local)
            banco.gravar_equivalente(o["oid"], k, {**m, "persona": local["id"], "importada": importada})
            n += 1
            diz(f"{_persona.IDIOMAS[k]['sigla']} “{eq['consulta']}”: viral nativo {m['demanda']:,} views · "
                f"{m['com_persona']} com a persona")
    return n


def equivalentes_uma(banco, yt, oid, idiomas, equivaler=None, diz=lambda *_: None):
    """O botao "gerar FR/DE" do detalhe."""
    o = banco.oportunidade(oid)
    if not o: raise KeyError(oid)
    p = _persona.persona(o["persona"])
    return gerar_equivalentes(banco, yt, p, [{"oid": oid, "video_id": o["video_id"], "titulo": o["titulo"],
                                             "remake": (o["titulos"] or [""])[0]}], idiomas, diz=diz, equivaler=equivaler)


def checar_remakes(yt, p, video, depois):
    """[{id, titulo, views, publicado, canal}] de remakes com a persona feitos depois de `depois`."""
    P = _persona.IDIOMAS[p.get("idioma", "en")]
    q = f'{p.get("busca") or p["nome"]} {_persona.palavras_chave(video["titulo"])}'
    ids = [i for i in yt.buscar(q, depois=depois, ordem="relevance", maximo=10, idioma=P["idioma"], regiao=P["regiao"])
           if i != video["id"]]
    chaves = _persona.palavras_chave(video["titulo"]).split()
    # ⛔ a busca devolve qualquer video da persona: so' conta como remake se repetir o miolo do titulo
    # (medido em 08/10: "10 Interesting Insects" ganhou 8 "remakes" Amish que nao eram sobre insetos)
    minimo = max(1, (len(chaves) + 1) // 2)
    achados = []
    for v in yt.videos(ids) if ids else []:
        t = v["titulo"].lower()
        if _persona.ja_tem_persona(v["titulo"], p) and sum(k in t for k in chaves) >= minimo:
            achados.append({k: v[k] for k in ("id", "titulo", "views", "publicado", "canal")})
    return sorted(achados, key=lambda r: -r["views"])


def rodar(g, banco, yt, diz=print, etapa=lambda *_: None, cancelado=lambda: False, reescrever=None, equivaler=None,
          avaliar=None):
    """Roda o garimpo `g` (dict do banco). Devolve o numero de oportunidades achadas."""
    reescrever = reescrever or _persona.reescrever
    avaliar = avaliar or _producao.avaliar
    f = filtros_completos(g.get("filtros"))
    p = _persona.persona(g["persona"])
    origem = p.get("idioma", "en")
    P = _persona.IDIOMAS[origem]
    gid = g["id"]

    def checar():
        if cancelado(): raise Cancelado()

    # 1. buscar
    ids = []
    for i, s in enumerate(g["sementes"], 1):
        checar()
        etapa(f"buscando “{s}” ({i}/{len(g['sementes'])})")
        novos = yt.buscar(s, antes=f["antes"], ordem="viewCount", maximo=50, idioma=P["idioma"], regiao=P["regiao"])
        diz(f"“{s}”: {len(novos)} vídeos antes de {f['antes'][:4]}")
        ids += [(x, s) for x in novos]
    semente_de = {}
    for x, s in ids: semente_de.setdefault(x, s)

    # 2. medir
    checar()
    etapa("medindo views e canais")
    videos = yt.videos(list(semente_de))
    pais = {c["id"]: c.get("pais", "") for c in yt.canais([v["canal_id"] for v in videos])}
    bons = [v for v in videos if v["views"] >= f["min_views"] and v["duracao"] >= f["min_duracao"]
            and not _persona.tem_alguma_persona(v["titulo"], p, origem) and v.get("categoria") not in CATEGORIAS_FORA
            and publico_ok(v, pais.get(v["canal_id"], ""), origem)]
    diz(f"{len(bons)} de {len(videos)} passaram no filtro (≥ {f['min_views']:,} views, ≥ {f['min_duracao']}s)")

    # 3. da' para produzir? (antes de gastar cota com remake)
    checar()
    avaliacao = {}
    if bons:
        etapa(f"Claude conferindo se dá para produzir ({len(bons)} vídeos)")
        try:
            avaliacao = avaliar([{"id": v["id"], "titulo": v["titulo"]} for v in bons])
        except Exception as e:                                             # noqa: BLE001
            diz(f"⚠ checagem de produção falhou ({e}): nenhum vídeo eliminado")
    fora = _producao.inviaveis(bons, avaliacao)

    # 3. pontuar
    etapa("pontuando")
    ops = []
    for v in bons:
        c = banco.canal(v["canal_id"]) or {}
        out = _score.outlier(v["views"], c.get("inscritos", 0))
        nota = _score.nota(v["views"], c.get("inscritos", 0), v["publicado"])
        oid = banco.gravar_oportunidade({"video_id": v["id"], "persona": p["id"], "garimpo_id": gid,
                                         "semente": semente_de[v["id"]], "outlier": out, "nota": nota})
        if v["id"] in fora:
            banco.atualizar_oportunidade(oid, estado="inviavel", producao=avaliacao[v["id"]]["motivo"])
            continue
        ops.append({"oid": oid, "v": v, "inscritos": c.get("inscritos", 0), "nota": nota})
    ops.sort(key=lambda o: -o["nota"])
    banco.atualizar_garimpo(gid, achados=len(ops))
    if fora: diz(f"{len(fora)} eliminadas: não dá para refazer só com avatar + b-roll gerado")
    diz(f"{len(ops)} oportunidades gravadas")

    # 4. remakes
    remakes = {}
    for i, o in enumerate(ops[:f["remakes"]], 1):
        checar()
        if not yt.cabe(CUSTO["search"] + CUSTO["videos"]):
            diz("⚠ cota baixa: parei de checar remakes"); break
        etapa(f"checando remakes ({i}/{min(len(ops), f['remakes'])})")
        r = checar_remakes(yt, p, o["v"], f["remake_depois"])
        remakes[o["oid"]] = r
        banco.atualizar_oportunidade(o["oid"], n_remakes=len(r), remakes=r[:5])
        if r: diz(f"“{o['v']['titulo'][:50]}”: {len(r)} remake(s) com {p['nome']}")

    # 5. reescrever
    checar()
    alvo = ops[:f["reescrever"]]
    reescritos = {}
    if alvo:
        etapa(f"Claude reescrevendo {len(alvo)} títulos")
        # ⭐ uma segunda tentativa: em 08/10 o Old Mechanic voltou com 0 titulos (resposta sem JSON)
        for tentativa in (1, 2):
            try:
                reescritos = reescrever(p, [o["v"] for o in alvo])
            except Exception as e:                                         # noqa: BLE001
                diz(f"⚠ reescrita falhou: {e}"); break
            if reescritos or tentativa == 2: break
            diz("⚠ o Claude respondeu sem títulos: tentando de novo")
        diz(f"Claude reescreveu {len(reescritos)} títulos para {p['nome']}")

    # 6. nota final (com a saturacao da persona, se o radar ja' rodou)
    sat = banco.saturacao(p["id"], _seis_meses())
    for o in ops:
        r = reescritos.get(o["v"]["id"])
        n_rem = len(remakes[o["oid"]]) if o["oid"] in remakes else -1
        enc = r["encaixe"] if r else -1
        campos = {"nota": _score.nota(o["v"]["views"], o["inscritos"], o["v"]["publicado"], n_rem, enc,
                                      canais_novos=sat)}
        if r: campos.update(titulos=r["titulos"], tema=r["tema"], angulo=r["angulo"], encaixe=enc)
        banco.atualizar_oportunidade(o["oid"], **campos)
        o["final"], o["remake"] = campos["nota"], (r["titulos"][0] if r and r["titulos"] else "")

    # 7. equivalentes em frances e alemao
    idiomas = idiomas_de(f, origem)
    alvo_eq = sorted(ops, key=lambda o: -o["final"])[:f["equivalentes"]]
    if idiomas and alvo_eq:
        checar()
        etapa(f"equivalentes em {', '.join(_persona.IDIOMAS[k]['sigla'] for k in idiomas)}")
        gerar_equivalentes(banco, yt, p, [{"oid": o["oid"], "video_id": o["v"]["id"], "titulo": o["v"]["titulo"],
                                           "remake": o["remake"]} for o in alvo_eq], idiomas, diz=diz, checar=checar,
                           equivaler=equivaler)
    return len(ops)


def reescrever_uma(banco, oid, reescrever=None):
    """Reescreve uma oportunidade so' (botao do detalhe)."""
    reescrever = reescrever or _persona.reescrever
    o = banco.oportunidade(oid)
    if not o: raise KeyError(oid)
    p = _persona.persona(o["persona"])
    r = reescrever(p, [{"id": o["video_id"], "views": o["views"], "titulo": o["titulo"]}]).get(o["video_id"])
    if not r: raise RuntimeError("o Claude não devolveu títulos")
    nota = _score.nota(o["views"], o["inscritos"] or 0, o["publicado"], o["n_remakes"], r["encaixe"],
                       canais_novos=banco.saturacao(p["id"], _seis_meses()))
    banco.atualizar_oportunidade(oid, titulos=r["titulos"], tema=r["tema"], angulo=r["angulo"],
                                 encaixe=r["encaixe"], nota=nota)
    return banco.oportunidade(oid)


def _autoteste():
    import tempfile
    from banco import Banco
    from youtube import YouTube
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)

    VIDS = {
        "V1": ("How to Pick a Sweet Watermelon", "C1", 16_000_000, "PT2M3S", "2016-07-01"),
        "V2": ("Watermelon short", "C1", 9_000_000, "PT45S", "2019-07-01"),
        "V3": ("Tiny watermelon video", "C2", 20_000, "PT5M", "2018-01-01"),
        "V4": ("Watermelon... The Old AMISH Way", "C3", 4_300_000, "PT18M53S", "2021-06-01"),
        "R1": ("How to Pick a Sweet Watermelon - Amish Secret", "C3", 300_000, "PT10M", "2025-07-01"),
    }
    def falso(url):
        if "/search?" in url:
            return {"items": [{"id": {"videoId": i}} for i in (["R1"] if "publishedAfter" in url else ["V1", "V2", "V3", "V4"])]}
        if "/videos?" in url:
            import urllib.parse as up
            ids = up.parse_qs(up.urlparse(url).query)["id"][0].split(",")
            return {"items": [{"id": i, "snippet": {"title": VIDS[i][0], "channelId": VIDS[i][1], "channelTitle": "c",
                                                    "publishedAt": VIDS[i][4] + "T00:00:00Z", "thumbnails": {}},
                               "statistics": {"viewCount": str(VIDS[i][2])}, "contentDetails": {"duration": VIDS[i][3]}}
                              for i in ids if i in VIDS]}
        if "/channels?" in url:
            return {"items": [{"id": c, "snippet": {"title": c, "publishedAt": "2010-01-01T00:00:00Z"},
                               "statistics": {"subscriberCount": "956000"}} for c in ("C1", "C2", "C3")]}
        return {}
    b = Banco(os.path.join(tempfile.mkdtemp(prefix="min-gar-"), "t.db"))
    yt = YouTube(b, chave="k", http=falso)
    gid = b.novo_garimpo(["watermelon"], "amish", {"remakes": 2, "reescrever": 5})
    falas = []
    def claude(p, vs):
        return {v["id"]: {"titulos": [v["titulo"] + "... The Old AMISH Way"], "tema": "jardim",
                          "angulo": "manual de horta", "encaixe": 9} for v in vs}
    def equiv(p, ops, idiomas):
        return {o["id"]: {k: {"titulo": f"{k} remake", "consulta": f"pasteque {k}", "persona_local": "amish"}
                          for k in idiomas} for o in ops}
    sim = lambda vs: {v["id"]: {"produzivel": True, "motivo": "ok"} for v in vs}
    n = rodar(b.garimpo(gid), b, yt, diz=falas.append, reescrever=claude, equivaler=equiv, avaliar=sim)
    ops = b.oportunidades()
    eqs = b.equivalentes(ops[0]["id"])
    caso("⭐ equivalentes FR, DE e ES medidos na melhor", set(eqs) == {"fr", "de", "es"} and eqs["de"]["demanda"] == 16_000_000)
    caso("equivalente conta o que ja' tem a persona la'", eqs["fr"]["com_persona"] == 1 and eqs["fr"]["top"][0]["id"] == "V1")
    caso("⭐ so' o viral longo e sem persona vira oportunidade (sem short, sem pequeno, sem remake)",
         n == 1 and ops[0]["video_id"] == "V1")
    caso("⭐ o remake de 2025 foi achado", ops[0]["n_remakes"] == 1 and ops[0]["remakes"][0]["id"] == "R1")
    caso("titulos e tema do Claude gravados", ops[0]["titulos"][0].endswith("AMISH Way") and ops[0]["tema"] == "jardim")
    caso("garimpo conta achados", b.garimpo(gid)["achados"] == 1)
    caso("registro fala com a pessoa", any("passaram no filtro" in f for f in falas))
    custo = custo_estimado(1, {"remakes": 2})
    caso("⛔ audio em hindi ou ingles da India fica fora", not publico_ok({"titulo": "x", "lingua": "hi"})
         and not publico_ok({"titulo": "x", "lingua": "en-in"}) and publico_ok({"titulo": "x", "lingua": "en-US"}))
    caso("⛔ canal da India fica fora, dos EUA entra", not publico_ok({"titulo": "x"}, "IN") and publico_ok({"titulo": "x"}, "US"))
    caso("⛔ feito para criancas fica fora", not publico_ok({"titulo": "x", "kids": True}, "US"))
    caso("⛔ titulo em devanagari fica fora", not publico_ok({"titulo": "खाना recipe", "lingua": ""}))
    caso("custo conta as equivalencias (3 mercados alem da origem)", custo == 102 + 2 * 101 + 2 * 3 * 102
         and custo_estimado(1, {"remakes": 2, "idiomas": ","}) == 304)
    caso("⭐ o mercado de origem nao entra nas equivalencias", idiomas_de({"idiomas": "en,fr,de,es"}, "fr") == ["en", "de", "es"])
    caso("⭐ publico frances aceita canal FR e recusa US", publico_ok({"titulo": "x", "lingua": "fr"}, "FR", "fr")
         and not publico_ok({"titulo": "x"}, "US", "fr"))
    caso(f"custo estimado ({custo}) cobre o gasto real ({yt.cota()['usadas']})", custo >= yt.cota()["usadas"])

    gid2 = b.novo_garimpo(["x"], "amish", {})
    try:
        rodar(b.garimpo(gid2), b, yt, diz=lambda *_: None, cancelado=lambda: True, avaliar=sim); caso("⛔ cancelar para", False)
    except Cancelado:
        caso("⛔ cancelar para antes de gastar", True)

    def quebra(p, vs): raise RuntimeError("o login do Claude Code desta máquina venceu")
    gid3 = b.novo_garimpo(["watermelon"], "mennonite", {"remakes": 0, "equivalentes": 0})
    falas.clear()
    def quebra_av(vs): raise RuntimeError("o Claude Code atingiu o limite de uso")
    rodar(b.garimpo(gid3), b, yt, diz=falas.append, reescrever=quebra, avaliar=quebra_av)
    caso("⭐ Claude fora do ar nao derruba o garimpo nem elimina ninguem", any("reescrita falhou" in f for f in falas)
         and any("checagem de produção falhou" in f for f in falas) and len(b.oportunidades(persona="mennonite")) == 1)
    nao = lambda vs: {v["id"]: {"produzivel": False, "motivo": "o valor é ver a melancia real"} for v in vs}
    gid4 = b.novo_garimpo(["watermelon"], "hutterite", {"remakes": 2, "equivalentes": 0})
    falas.clear()
    antes = yt.cota()["usadas"]
    n4 = rodar(b.garimpo(gid4), b, yt, diz=falas.append, reescrever=claude, avaliar=nao)
    inv = b.oportunidades(persona="hutterite", estado="inviavel")
    caso("⭐ inviavel sai da lista, fica gravado com o motivo", n4 == 0 and b.oportunidades(persona="hutterite") == []
         and inv and inv[0]["producao"] == "o valor é ver a melancia real")
    caso("⭐ inviavel nao gasta cota checando remake", yt.cota()["usadas"] - antes <= custo_estimado(1, {"remakes": 0, "equivalentes": 0})
         and any("eliminadas" in f for f in falas))
    o = reescrever_uma(b, b.oportunidades(persona="mennonite")[0]["id"], reescrever=claude)
    caso("reescrever uma so'", o["titulos"] and o["encaixe"] == 9)
    caso("gerar equivalente de uma so'", equivalentes_uma(b, yt, o["id"], ["de"], equivaler=equiv) == 1
         and "de" in b.equivalentes(o["id"]))
    b.fechar()
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
