# -*- coding: utf-8 -*-
r"""INSTAGRAM LICOES — o que a curadoria ensina vira regra, mas so' com a aprovacao de quem revisa.

    python motor/instagram_licoes.py --autoteste

    casos(eventos)                         as ocorrencias (ocorrencias.jsonl) agrupadas por defeito
    pedido_destilacao(casos, licoes)       o pedido ao Claude: casos novos -> licoes curtas (ou reforco das que existem)
    ler_destilacao(texto, ...)             a resposta -> {"novas", "reforcos"} ou None
    aplicar(dados, lido, casos)            as licoes novas entram como "proposta"; os casos ficam marcados como lidos
    mudar(dados, id, acao)                 proposta -> ativa (aprovar) -> aposentada; recusar; reativar
    relevantes(licoes, avatar, idioma, tipo, acao)   as ativas que valem para este Reel / take
    lint_fala(fala, licoes)                ⭐ deterministico: a palavra que o Veo pronuncia errado sai da fala
    regras_texto(...) / frases_prompt(...) as licoes de gesto entram nas regras do take; as de prompt, no prompt do Veo
    taxas(eventos) / efeito(licao, ...)    a taxa de defeito por etiqueta ao longo das semanas, e antes/depois de
                                           cada licao (para aposentar a que nao funcionou)

Uma licao: {"id", "tipo": palavra|gesto|prompt, "texto" (pt, para o painel), "regra" (ingles, para o Claude/Veo),
"palavra", "trocar", "escopo": {"avatar", "idioma", "acao"} (vazio = vale para todos), "etiquetas", "evidencias"
(ids das ocorrencias), "n", "estado": proposta|ativa|aposentada|recusada, "criada", "ativada", "aposentada"}.
Fica em data/instagram/aprendizado/licoes.json.

⭐ Nenhuma licao muda prompt sozinha: o Claude so' PROPOE; a regra vale depois que a pessoa aprova no painel Licoes.
⛔ No maximo 4 licoes de gesto nas regras do take e 3 de prompt no Veo: regra demais dilui as que importam.
"""
import datetime as _dt, json, os, re, secrets, sys, threading, time
from collections import Counter

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)
import instagram_curadoria as _cur                                          # noqa: E402
import instagram_roteiro as _rot                                            # noqa: E402

TIPOS = [("palavra", "Palavra"), ("gesto", "Gesto"), ("prompt", "Prompt do Veo")]
IDS_TIPO = {t for t, _ in TIPOS}
ESTADOS = ("proposta", "ativa", "aposentada", "recusada")
MAX_GESTO, MAX_PROMPT, MAX_PALAVRA = 4, 3, 12
AUTO_DESTILAR = 3            # ⭐ casos novos que disparam a destilacao sozinha, depois de uma curadoria
SEMANAS = 8
_trava = threading.Lock()


def _arq(base):
    return os.path.join(base, "aprendizado", "licoes.json")


def carregar(base):
    try:
        d = json.load(open(_arq(base), encoding="utf-8"))
    except (OSError, ValueError):
        d = {}
    return {"licoes": d.get("licoes") or [], "destilados": d.get("destilados") or [], "t": d.get("t") or 0}


def gravar(base, dados):
    os.makedirs(os.path.dirname(_arq(base)), exist_ok=True)
    tmp = _arq(base) + ".tmp"
    with _trava:
        json.dump(dados, open(tmp, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
        os.replace(tmp, _arq(base))


# ── dos eventos aos casos ──
def casos(eventos):
    """Um caso por defeito apontado: o defeito, o take como estava, a correcao do Claude e se a versao nova resolveu."""
    por = {}
    for ev in eventos:
        oc, tipo = ev.get("id"), ev.get("tipo")
        if not oc or tipo not in ("defeito", "correcao", "escolha"): continue
        c = por.setdefault(oc, {"id": oc})
        if tipo == "defeito":
            c.update({k: ev.get(k) for k in ("reel", "take", "avatar", "idioma", "v", "t", "defeito", "fala", "movimento",
                                             "quadro")})
            c["etiquetas"] = ev.get("etiquetas") or []
            c["acao"] = _rot.tipo_acao(ev.get("movimento", ""))
        elif tipo == "correcao":
            c["correcao"] = {k: ev.get(k, "") for k in ("fala", "movimento", "motivo")}
            c["ouvido"] = ev.get("ouvido", "")
        else:
            c["resolveu"] = ev.get("resolveu")
    return [c for c in por.values() if c.get("reel")]


def pendentes(dados, todos):
    lidos = set(dados.get("destilados") or [])
    return [c for c in todos if c["id"] not in lidos]


# ── a destilacao (Claude) ──
def pedido_destilacao(novos, licoes):
    rotulos = dict(_cur.ETIQUETAS)
    linhas = []
    for c in novos:
        d = {"id": c["id"], "avatar": c.get("avatar"), "language": c.get("idioma"), "action_type": c.get("acao") or "",
             "tags": [rotulos.get(e, e) for e in c.get("etiquetas", [])], "reviewer_note_pt": c.get("defeito", ""),
             "line": c.get("fala", ""), "heard_by_speech_recognizer": c.get("ouvido", ""),
             "movement": c.get("movimento", ""), "items_in_frame": c.get("quadro", "")}
        if c.get("correcao"): d["fix_applied"] = c["correcao"]
        if c.get("resolveu") is not None: d["fix_worked"] = c["resolveu"]
        linhas.append(json.dumps(d, ensure_ascii=False))
    existentes = "\n".join(json.dumps({"id": l["id"], "type": l["tipo"], "state": l["estado"], "word": l.get("palavra", ""),
                                       "rule": l.get("regra", ""), "scope": l.get("escopo", {})}, ensure_ascii=False)
                           for l in licoes if l["estado"] != "recusada") or "(none yet)"
    return f"""You maintain the "lessons learned" of a pipeline that makes short vertical videos (Instagram Reels) with
Google Veo: a presenter says one line per 8-second take, generated from a still frame (the same frame opens and closes
the take). A reviewer watches each take and reports defects in Portuguese. Return ONLY JSON.

New defect cases (one JSON per line):
{chr(10).join(linhas)}

Lessons that already exist:
{existentes}

Turn the cases into SHORT, reusable lessons that would prevent the same defect in FUTURE takes. Three types:
- "palavra": a word the voice mispronounces, or an uncommon word the audience will not know. "palavra" is the word
  exactly as written in the line (one word, or two at most); "trocar" is a common word with the same meaning in the
  same language that fits in its place ("" when the best fix is to drop it); "regra" is one short English sentence
  saying why (e.g. 'the voice pronounces it "forinho"').
- "gesto": a rule for writing the take's "movement" (English, at most 25 words, positive phrasing: what she does).
- "prompt": a sentence to add to every Veo prompt (English, at most 20 words, positive phrasing, about the image or
  the audio, never about the line).
Rules:
- Only lessons the cases support; skip a case that teaches nothing general (a one-off glitch).
- Never duplicate an existing lesson: if a case supports one, list it in "reforcos" with the case ids.
- "escopo": "idioma" is always the language for "palavra"; "avatar" only when the problem is specific to that
  presenter; "acao" only when it only happens with that action type (one of: {", ".join(_rot.ACOES)}). Leave the
  others "".
- "texto": the lesson in one short Brazilian Portuguese sentence, for the reviewer to approve.
- "etiquetas": the tag ids the lesson prevents, from: {", ".join(_cur.IDS_ETIQUETA)}.
- "evidencias": the ids of the cases behind it.

JSON format:
{{"novas": [{{"tipo": "palavra", "texto": "...", "palavra": "...", "trocar": "...", "regra": "...",
  "escopo": {{"avatar": "", "idioma": "pt", "acao": ""}}, "etiquetas": ["pronuncia"], "evidencias": ["..."]}}],
 "reforcos": [{{"id": "...", "evidencias": ["..."]}}]}}"""


def _escopo(e, avatares):
    e = e if isinstance(e, dict) else {}
    av, idi, ac = (str(e.get(k) or "").strip() for k in ("avatar", "idioma", "acao"))
    return {"avatar": av if av in avatares else "", "idioma": idi if idi in _rot.IDIOMAS else "",
            "acao": ac if ac in _rot.ACOES else ""}


def _palavra_ok(p):
    return isinstance(p, str) and re.fullmatch(r"[^\W\d_]+([ '-][^\W\d_]+)?", p.strip()) is not None


def ler_destilacao(texto, ids_casos, ids_licoes, avatares=()):
    """A resposta da destilacao -> {"novas": [...], "reforcos": [...]} so' com o que passa na validacao, ou None."""
    m = re.search(r"\{.*\}", texto or "", flags=re.S)
    if not m: return None
    try:
        d = json.loads(m.group(0))
    except ValueError:
        return None
    if not isinstance(d, dict) or not isinstance(d.get("novas", []), list): return None
    ids_casos, avatares = set(ids_casos), set(avatares)
    novas, reforcos = [], []
    for n in d.get("novas") or []:
        if not isinstance(n, dict) or n.get("tipo") not in IDS_TIPO: continue
        ev = [x for x in n.get("evidencias") or [] if x in ids_casos]
        texto_pt, regra = str(n.get("texto") or "").strip(), str(n.get("regra") or "").strip()
        if not ev or not texto_pt: continue
        lic = {"tipo": n["tipo"], "texto": texto_pt[:240], "regra": regra[:300], "escopo": _escopo(n.get("escopo"), avatares),
               "etiquetas": [e for e in n.get("etiquetas") or [] if e in _cur.IDS_ETIQUETA], "evidencias": ev}
        if n["tipo"] == "palavra":
            if not _palavra_ok(n.get("palavra")): continue
            trocar = n.get("trocar") if isinstance(n.get("trocar"), str) else ""
            if trocar.strip() and not _palavra_ok(trocar): continue
            lic.update(palavra=n["palavra"].strip(), trocar=trocar.strip())
        elif not regra:
            continue
        novas.append(lic)
    for r in d.get("reforcos") or []:
        if isinstance(r, dict) and r.get("id") in ids_licoes:
            ev = [x for x in r.get("evidencias") or [] if x in ids_casos]
            if ev: reforcos.append({"id": r["id"], "evidencias": ev})
    return {"novas": novas, "reforcos": reforcos}


def _mesma(a, b):
    if a["tipo"] != b["tipo"]: return False
    if a["tipo"] == "palavra":
        return a.get("palavra", "").lower() == b.get("palavra", "").lower() and \
            (a.get("escopo") or {}).get("idioma") == (b.get("escopo") or {}).get("idioma")
    return re.sub(r"\W+", " ", a.get("regra", "").lower()).strip() == re.sub(r"\W+", " ", b.get("regra", "").lower()).strip()


def _reforcar(lic, ev):
    lic["evidencias"] = list(dict.fromkeys(lic.get("evidencias", []) + ev))
    lic["n"] = len(lic["evidencias"])


def aplicar(dados, lido, novos, agora=None):
    """As licoes novas entram como "proposta" (ou reforcam uma igual que ja' existe); os casos `novos` ficam lidos.
    Devolve as licoes criadas."""
    agora = agora or round(time.time(), 2)
    por_caso = {c["id"]: c for c in novos}
    for r in lido.get("reforcos", []):
        lic = next((l for l in dados["licoes"] if l["id"] == r["id"]), None)
        if lic: _reforcar(lic, r["evidencias"])
    criadas = []
    for n in lido.get("novas", []):
        if n["tipo"] == "palavra" and not n["escopo"]["idioma"]:
            idis = Counter(por_caso[x].get("idioma") for x in n["evidencias"] if x in por_caso)
            n["escopo"]["idioma"] = idis.most_common(1)[0][0] if idis else ""
        igual = next((l for l in dados["licoes"] if l["estado"] != "recusada" and _mesma(l, n)), None)
        if igual:
            _reforcar(igual, n["evidencias"]); continue
        lic = {"id": f"l-{secrets.token_hex(3)}", **n, "n": len(n["evidencias"]), "estado": "proposta", "criada": agora,
               "ativada": 0, "aposentada": 0}
        dados["licoes"].append(lic)
        criadas.append(lic)
    dados["destilados"] = list(dict.fromkeys(dados.get("destilados", []) + list(por_caso)))
    dados["t"] = agora
    return criadas


def mudar(dados, lid, acao, agora=None):
    """acao: aprovar | recusar | aposentar | reativar. Devolve a licao."""
    agora = agora or round(time.time(), 2)
    lic = next((l for l in dados["licoes"] if l["id"] == lid), None)
    if not lic: raise KeyError(lid)
    if acao in ("aprovar", "reativar"):
        if lic["estado"] == "ativa": raise ValueError("a lição já está ativa")
        lic.update(estado="ativa", ativada=agora)
    elif acao == "recusar":
        if lic["estado"] != "proposta": raise ValueError("só uma proposta pode ser recusada")
        lic["estado"] = "recusada"
    elif acao == "aposentar":
        if lic["estado"] != "ativa": raise ValueError("só uma lição ativa pode ser aposentada")
        lic.update(estado="aposentada", aposentada=agora)
    else:
        raise ValueError(f"ação desconhecida: {acao}")
    return lic


def editar(dados, lid, campos, avatares=()):
    """Ajusta uma licao antes (ou depois) de aprovar: texto, regra, palavra, trocar, escopo, etiquetas."""
    lic = next((l for l in dados["licoes"] if l["id"] == lid), None)
    if not lic: raise KeyError(lid)
    novo = dict(lic)
    for k in ("texto", "regra"):
        if k in campos: novo[k] = str(campos[k] or "").strip()
    if lic["tipo"] == "palavra":
        for k in ("palavra", "trocar"):
            if k in campos: novo[k] = str(campos[k] or "").strip()
        if not _palavra_ok(novo.get("palavra")): raise ValueError("a palavra tem de ser uma palavra (ou duas)")
        if novo.get("trocar") and not _palavra_ok(novo["trocar"]): raise ValueError("a troca tem de ser uma palavra (ou duas)")
    elif not novo.get("regra"):
        raise ValueError("a regra (em inglês) não pode ficar vazia")
    if not novo.get("texto"): raise ValueError("o texto da lição não pode ficar vazio")
    if "escopo" in campos: novo["escopo"] = _escopo(campos["escopo"], set(avatares) | {lic["escopo"].get("avatar", "")})
    if "etiquetas" in campos: novo["etiquetas"] = [e for e in campos["etiquetas"] or [] if e in _cur.IDS_ETIQUETA]
    lic.update(novo)
    return lic


# ── a injecao ──
def _vale(l, avatar, idioma, acao):
    e = l.get("escopo") or {}
    return (not e.get("avatar") or e["avatar"] == avatar) and (not e.get("idioma") or e["idioma"] == idioma) and \
        (acao is None or not e.get("acao") or e["acao"] == acao)


def relevantes(licoes, avatar, idioma, tipo=None, acao=None, limite=None):
    """As ativas deste avatar/idioma (e tipo de acao, quando conhecido), as de mais evidencia primeiro."""
    saida = [l for l in licoes if l["estado"] == "ativa" and (tipo is None or l["tipo"] == tipo) and _vale(l, avatar, idioma, acao)]
    saida.sort(key=lambda l: (-l.get("n", 0), -l.get("ativada", 0)))
    return saida[:limite] if limite else saida


def regras_texto(licoes, avatar, idioma):
    """O bloco que entra no fim de regras_take (roteiro e corretor): as palavras a evitar e as licoes de gesto."""
    pal = relevantes(licoes, avatar, idioma, "palavra", limite=MAX_PALAVRA)
    ges = relevantes(licoes, avatar, idioma, "gesto", limite=MAX_GESTO)
    if not (pal or ges): return ""
    linhas = ["- Lessons learned from past defects (mandatory):"]
    for l in pal:
        linhas.append(f'  - Never use the word "{l["palavra"]}" in the "fala"' + (f": {l['regra'].rstrip('.')}" if l.get("regra") else "")
                      + (f'. Say "{l["trocar"]}" instead.' if l.get("trocar") else "."))
    for l in ges:
        acao = (l.get("escopo") or {}).get("acao")
        linhas.append(f"  - {'When the gesture is to ' + acao + ': ' if acao else ''}{l['regra']}".replace("to pegar", "pick up")
                      .replace("to levantar", "lift").replace("to apontar", "point").replace("to tocar", "touch")
                      .replace("to despejar", "pour"))
    return "\n".join(linhas)


def frases_prompt(licoes, avatar, idioma, acao=""):
    """As frases das licoes de prompt para um take (no maximo MAX_PROMPT)."""
    return [l["regra"] for l in relevantes(licoes, avatar, idioma, "prompt", acao=acao, limite=MAX_PROMPT)]


def lint_fala(fala, licoes):
    """⭐ Deterministico (nao depende do Claude obedecer): cada palavra de licao ativa sai da fala, trocada pelo
    "trocar" (ou tirada). Devolve (fala, [{"id", "de", "para"}]). Limpa a virgula dobrada e a palavra repetida que a
    troca pode deixar ("macio, fofinho" -> "macio, macio" -> "macio")."""
    trocas, original = [], fala
    for l in licoes:
        if l.get("tipo") != "palavra" or not l.get("palavra"): continue
        rx = re.compile(r"(?<!\w)" + re.escape(l["palavra"]) + r"(?!\w)", re.I)
        para = l.get("trocar", "")

        def sub(m, para=para):
            return para[:1].upper() + para[1:] if para and m.group(0)[:1].isupper() else para
        fala, k = rx.subn(sub, fala)
        if k: trocas.append({"id": l["id"], "de": l["palavra"], "para": para})
    if trocas:
        fala = re.sub(r"(?i)\b(\w+)(?:,?\s+\1\b)+", r"\1", fala)
        fala = re.sub(r"\s+([,.!?;:])", r"\1", re.sub(r"\s{2,}", " ", fala))
        fala = re.sub(r",(\s*,)+", ",", fala)
        fala = re.sub(r",\s*([.!?])", r"\1", fala).strip(" ,")
        if original[:1].isupper(): fala = fala[:1].upper() + fala[1:]
    return fala, trocas


# ── as taxas (para aposentar o que nao funcionou) ──
def versoes(eventos):
    """{(reel, take, v): {"t", "avatar", "idioma", "licoes", "tags"}} — cada versao gerada e os defeitos dela: os
    apontados a mao + as flags do QA nao dispensadas."""
    vs, qa = {}, {}

    def v(ev, take, ver):
        k = (ev.get("reel"), take, ver)
        return vs.setdefault(k, {"t": ev.get("t", 0), "avatar": ev.get("avatar", ""), "idioma": ev.get("idioma", ""),
                                 "licoes": [], "tags": set()}), k
    for ev in eventos:
        tipo = ev.get("tipo")
        if tipo == "geracao":
            for x in ev.get("versoes") or []:
                d, _ = v(ev, x.get("take"), x.get("v"))
                d["licoes"] = x.get("licoes") or []
        elif tipo == "defeito" and ev.get("v"):
            d, _ = v(ev, ev.get("take"), ev.get("v"))
            d["tags"] |= set(ev.get("etiquetas") or [])
            d["avatar"], d["idioma"] = d["avatar"] or ev.get("avatar", ""), d["idioma"] or ev.get("idioma", "")
        elif tipo == "qa":
            _, k = v(ev, ev.get("take"), ev.get("v"))
            qa[k] = {f.get("etiqueta") for f in ev.get("flags") or []}
        elif tipo == "qa_revisao" and ev.get("acao") == "dispensar":
            qa.get((ev.get("reel"), ev.get("take"), ev.get("v")), set()).discard(ev.get("etiqueta"))
    for k, tags in qa.items(): vs[k]["tags"] |= tags
    return vs


def _semana(t):
    d = _dt.date.fromtimestamp(t)
    return d - _dt.timedelta(days=d.weekday())


def taxas(eventos, semanas=SEMANAS):
    """{"semanas": ["13/10", ...], "versoes": [n, ...], "etiquetas": [{"id", "nome", "taxas": [% | None], "total"}]}
    — por semana, a fracao das versoes geradas com cada defeito."""
    vs = versoes(eventos)
    if not vs: return {"semanas": [], "versoes": [], "etiquetas": []}
    ultima = _semana(time.time())
    primeira = max(min(_semana(x["t"]) for x in vs.values()), ultima - _dt.timedelta(weeks=semanas - 1))
    cols = []
    while primeira <= ultima:
        cols.append(primeira); primeira += _dt.timedelta(weeks=1)
    por = {c: [x for x in vs.values() if _semana(x["t"]) == c] for c in cols}
    etqs = []
    for e, nome in _cur.ETIQUETAS:
        total = sum(1 for x in vs.values() if e in x["tags"])
        if not total: continue
        etqs.append({"id": e, "nome": nome, "total": total,
                     "taxas": [round(100 * sum(1 for x in por[c] if e in x["tags"]) / len(por[c])) if por[c] else None for c in cols]})
    return {"semanas": [c.strftime("%d/%m") for c in cols], "versoes": [len(por[c]) for c in cols], "etiquetas": etqs}


def efeito(lic, vs):
    """Antes x depois de uma licao, nas etiquetas dela (todas, se nao tiver): {"antes": {"n", "taxa"}, "depois": ...}.
    Antes = versoes do mesmo escopo geradas antes de ativar; depois = versoes geradas com a licao aplicada."""
    if not lic.get("ativada"): return None
    e = lic.get("escopo") or {}
    tags = set(lic.get("etiquetas") or [])

    def taxa(lista):
        com = sum(1 for x in lista if (x["tags"] & tags if tags else x["tags"]))
        return {"n": len(lista), "taxa": round(100 * com / len(lista)) if lista else None}
    escopo = [x for x in vs.values() if (not e.get("avatar") or x["avatar"] == e["avatar"])
              and (not e.get("idioma") or x["idioma"] == e["idioma"])]
    return {"antes": taxa([x for x in escopo if x["t"] < lic["ativada"] and lic["id"] not in x["licoes"]]),
            "depois": taxa([x for x in vs.values() if lic["id"] in x["licoes"]])}


def painel(base, eventos=None):
    """Tudo do painel Licoes: as licoes (com antes/depois), quantos casos esperam a destilacao e as taxas."""
    eventos = _cur.ocorrencias(base) if eventos is None else eventos
    dados = carregar(base)
    vs = versoes(eventos)
    return {"licoes": [{**l, "efeito": efeito(l, vs)} for l in sorted(dados["licoes"], key=lambda l: -l.get("criada", 0))],
            "pendentes": len(pendentes(dados, casos(eventos))), "destilado": dados["t"], "taxas": taxas(eventos),
            "tipos": [{"id": t, "nome": n} for t, n in TIPOS], "acoes": list(_rot.ACOES),
            "etiquetas": [{"id": e, "nome": n} for e, n in _cur.ETIQUETAS]}


def _autoteste():
    import tempfile
    ok = True

    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)

    base = tempfile.mkdtemp(prefix="min-ig-lic-")
    agora = time.time()
    evs = [
        {"t": agora - 86400 * 9, "tipo": "geracao", "reel": "r1", "avatar": "tomiko", "idioma": "pt",
         "versoes": [{"take": i, "v": 1, "licoes": []} for i in range(1, 5)]},
        {"t": agora - 86400 * 9, "tipo": "defeito", "id": "oc1", "reel": "r1", "take": 5, "avatar": "tomiko", "idioma": "pt",
         "v": 1, "etiquetas": ["pronuncia"], "defeito": "falou forinho", "fala": "Um pão macio, fofinho, sem glúten.",
         "movimento": "As she speaks, both hands lift the loaf. After the line, she sets it back.", "quadro": "A loaf."},
        {"t": agora - 86400 * 9, "tipo": "correcao", "id": "oc1", "fala": "Um pão macio, sem glúten.", "movimento": "M",
         "motivo": "tirei fofinho", "ouvido": "Um pão macio, forinho, sem glúten."},
        {"t": agora - 86400 * 9, "tipo": "escolha", "id": "oc1", "v": 3, "resolveu": True},
        {"t": agora - 86400 * 9, "tipo": "defeito", "id": "oc2", "reel": "r1", "take": 4, "avatar": "tomiko", "idioma": "pt",
         "v": 1, "etiquetas": ["morph"], "defeito": "a forma andou sozinha", "fala": "Asse.", "movimento": "She slides the tin."},
        {"t": agora - 86400 * 9, "tipo": "qa", "reel": "r1", "take": 2, "v": 1, "flags": [{"etiqueta": "tempo"}]},
        {"t": agora - 86400 * 9, "tipo": "qa_revisao", "reel": "r1", "take": 2, "v": 1, "etiqueta": "tempo", "acao": "dispensar"},
    ]
    cs = casos(evs)
    caso("⭐ casos: um por defeito, com a correcao, o ouvido e se resolveu", [c["id"] for c in cs] == ["oc1", "oc2"]
         and cs[0]["correcao"]["motivo"] == "tirei fofinho" and cs[0]["ouvido"].endswith("glúten.") and cs[0]["resolveu"] is True
         and cs[0]["acao"] == "levantar" and cs[1].get("resolveu") is None)
    dados = carregar(base)
    caso("sem arquivo: vazio, tudo pendente", dados["licoes"] == [] and len(pendentes(dados, cs)) == 2)
    p = pedido_destilacao(cs, [])
    caso("pedido: os casos, as etiquetas e o formato", '"oc1"' in p and "Pronúncia" in p and "forinho" in p
         and '"fix_worked": true' in p and "(none yet)" in p and '"reforcos"' in p and "levantar" in p)
    resp = json.dumps({"novas": [
        {"tipo": "palavra", "texto": "Evitar “fofinho”: a voz diz “forinho”.", "palavra": "fofinho", "trocar": "leve",
         "regra": 'the voice pronounces it "forinho"', "escopo": {"idioma": "", "avatar": "x"}, "etiquetas": ["pronuncia", "zzz"],
         "evidencias": ["oc1", "inventado"]},
        {"tipo": "gesto", "texto": "Soltou o objeto, ele fica parado.", "regra": "After releasing an item, it stays still.",
         "escopo": {"acao": "despejar"}, "etiquetas": ["morph"], "evidencias": ["oc2"]},
        {"tipo": "gesto", "texto": "sem evidencia", "regra": "x", "evidencias": ["nada"]},
        {"tipo": "palavra", "texto": "palavra ruim", "palavra": "duas palavras demais", "evidencias": ["oc1"]},
        {"tipo": "prompt", "texto": "sem regra", "evidencias": ["oc1"]},
        {"tipo": "outro", "texto": "x", "regra": "x", "evidencias": ["oc1"]}],
        "reforcos": [{"id": "nao-existe", "evidencias": ["oc1"]}]})
    lido = ler_destilacao("aqui " + resp, ["oc1", "oc2"], [], ["tomiko"])
    caso("⭐ ler: so' as licoes validas, com evidencia conhecida", lido and [n["tipo"] for n in lido["novas"]] == ["palavra", "gesto"]
         and lido["novas"][0]["evidencias"] == ["oc1"] and lido["novas"][0]["etiquetas"] == ["pronuncia"]
         and lido["novas"][0]["escopo"]["avatar"] == "" and lido["novas"][1]["escopo"]["acao"] == "despejar"
         and lido["reforcos"] == [])
    caso("⛔ ler: lixo = None", ler_destilacao("nada", [], []) is None and ler_destilacao('{"novas": 3}', [], []) is None)
    criadas = aplicar(dados, lido, cs, agora - 86400 * 8)
    caso("⭐ aplicar: entram como proposta; palavra herda o idioma do caso; casos lidos",
         [l["estado"] for l in criadas] == ["proposta"] * 2 and criadas[0]["escopo"]["idioma"] == "pt"
         and pendentes(dados, cs) == [] and criadas[0]["n"] == 1)
    lid_p, lid_g = criadas[0]["id"], criadas[1]["id"]
    caso("⛔ proposta nao entra no prompt", relevantes(dados["licoes"], "tomiko", "pt") == []
         and regras_texto(dados["licoes"], "tomiko", "pt") == "")
    again = ler_destilacao(json.dumps({"novas": [{"tipo": "palavra", "texto": "de novo", "palavra": "Fofinho", "trocar": "",
                                                  "escopo": {"idioma": "pt"}, "evidencias": ["oc9"]}],
                                       "reforcos": [{"id": lid_g, "evidencias": ["oc9"]}]}), ["oc9"], [lid_p, lid_g])
    aplicar(dados, again, [{"id": "oc9", "idioma": "pt"}])
    caso("⭐ licao igual reforca, nao duplica", len(dados["licoes"]) == 2 and dados["licoes"][0]["n"] == 2
         and dados["licoes"][1]["n"] == 2)
    mudar(dados, lid_p, "aprovar", agora - 86400 * 8); mudar(dados, lid_g, "aprovar", agora - 86400 * 8)
    caso("⛔ aprovar de novo / recusar ativa / acao estranha",
         _erro(lambda: mudar(dados, lid_p, "aprovar")) and _erro(lambda: mudar(dados, lid_p, "recusar"))
         and _erro(lambda: mudar(dados, lid_p, "xx")) and _erro(lambda: mudar(dados, "l-0", "aprovar"), KeyError))
    rt = regras_texto(dados["licoes"], "tomiko", "pt")
    caso("⭐ regras: a palavra a evitar com a troca, e o gesto com o tipo de acao",
         'Never use the word "fofinho" in the "fala": the voice pronounces it "forinho". Say "leve" instead.' in rt
         and "When the gesture is pour: After releasing an item, it stays still." in rt)
    caso("⛔ a licao de pt nao vale para o ingles", "fofinho" not in regras_texto(dados["licoes"], "tomiko", "en"))
    caso("⭐ gesto com escopo de acao: so' no take daquela acao", relevantes(dados["licoes"], "t", "pt", "gesto", acao="levantar") == []
         and len(relevantes(dados["licoes"], "t", "pt", "gesto", acao="despejar")) == 1)
    pal = relevantes(dados["licoes"], "tomiko", "pt", "palavra")
    f, tr = lint_fala("Nasce um pão macio, fofinho, sem glúten.", pal)
    caso("⭐ lint: a palavra sai, trocada", f == "Nasce um pão macio, leve, sem glúten." and tr[0]["de"] == "fofinho")
    caso("lint: maiuscula e palavra inteira", lint_fala("Fofinho e fofinhos.", pal)[0] == "Leve e fofinhos.")
    dados["licoes"][0]["trocar"] = "macio"
    caso("⭐ lint: a troca que repete a palavra vizinha nao fica dobrada",
         lint_fala("Um pão macio, fofinho, sem glúten.", pal)[0] == "Um pão macio, sem glúten.")
    dados["licoes"][0]["trocar"] = ""
    caso("lint: sem troca, a palavra sai e a pontuacao fecha", lint_fala("Fofinho, quentinho e bom, fofinho.", pal)[0]
         == "Quentinho e bom.")
    caso("lint: sem licao, nada muda", lint_fala("Um pão fofinho.", []) == ("Um pão fofinho.", []))
    dados["licoes"].append({"id": "l-p", "tipo": "prompt", "regra": "Her hands keep five fingers.", "estado": "ativa",
                            "escopo": {"avatar": "", "idioma": "", "acao": ""}, "n": 1, "ativada": agora})
    caso("frases_prompt: as ativas de prompt", frases_prompt(dados["licoes"], "tomiko", "en") == ["Her hands keep five fingers."])
    caso("⛔ editar: palavra invalida / regra vazia", _erro(lambda: editar(dados, lid_p, {"palavra": "a b c"}))
         and _erro(lambda: editar(dados, lid_g, {"regra": " "})))
    editar(dados, lid_g, {"texto": "Novo texto", "escopo": {"acao": "levantar", "idioma": "xx"}})
    caso("editar: texto e escopo validado", dados["licoes"][1]["texto"] == "Novo texto"
         and dados["licoes"][1]["escopo"] == {"avatar": "", "idioma": "", "acao": "levantar"})
    mudar(dados, lid_g, "aposentar")
    caso("aposentada sai das regras", "levantar" not in regras_texto(dados["licoes"], "t", "pt")
         and dados["licoes"][1]["aposentada"] > 0)
    gravar(base, dados)
    caso("gravar/carregar", carregar(base)["licoes"][0]["id"] == lid_p)

    evs += [{"t": agora, "tipo": "geracao", "reel": "r2", "avatar": "tomiko", "idioma": "pt",
             "versoes": [{"take": i, "v": 1, "licoes": [lid_p]} for i in range(1, 5)]},
            {"t": agora, "tipo": "defeito", "id": "oc3", "reel": "r2", "take": 1, "avatar": "tomiko", "idioma": "pt", "v": 1,
             "etiquetas": ["maos"], "movimento": "x"}]
    vs = versoes(evs)
    caso("⭐ versoes: defeito a mao + QA nao dispensado", vs[("r1", 5, 1)]["tags"] == {"pronuncia"}
         and vs[("r1", 2, 1)]["tags"] == set() and len(vs) == 9)
    tx = taxas(evs)
    pron = next(e for e in tx["etiquetas"] if e["id"] == "pronuncia")
    caso("⭐ taxas: por semana, so' as etiquetas que aparecem", len(tx["semanas"]) >= 2 and sum(tx["versoes"]) == 9
         and pron["taxas"][-1] == 0 and pron["taxas"][0] == 20 and "tempo" not in [e["id"] for e in tx["etiquetas"]])
    ef = efeito(next(l for l in carregar(base)["licoes"] if l["id"] == lid_p), vs)
    caso("⭐ efeito: antes 1 em 5 com pronuncia, depois 0 em 4", ef == {"antes": {"n": 5, "taxa": 20}, "depois": {"n": 4, "taxa": 0}})
    caso("efeito: licao nunca ativada = None", efeito({"id": "x", "ativada": 0}, vs) is None)
    caso("taxas vazias", taxas([]) == {"semanas": [], "versoes": [], "etiquetas": []})
    for ev in evs: _cur.registrar(base, ev)
    pn = painel(base)
    caso("painel: licoes com efeito, pendentes e taxas", len(pn["licoes"]) == 3 and pn["pendentes"] == 1
         and pn["taxas"]["semanas"] and any(l["efeito"] for l in pn["licoes"]))
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


def _erro(fn, tipo=ValueError):
    try:
        fn()
    except tipo:
        return True
    return False


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
