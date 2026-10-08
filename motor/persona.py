# -*- coding: utf-8 -*-
r"""PERSONA — o catalogo de personas e temas, e a reescrita dos titulos pelo Claude Code da maquina.

    python motor/persona.py --autoteste
    python motor/persona.py --provar           # uma reescrita de verdade pelo `claude -p`

O tweak do "Elias Yoder": o titulo viral antigo continua o mesmo pedido de busca, so' ganha a
persona ("How to Pick a Sweet Watermelon" -> "How to Pick a Sweet Watermelon... The Old AMISH Way").

⭐ Quem reescreve e' o `claude -p` desta maquina (o mesmo jeito do OW Agente): nenhuma chave extra.
⛔ O pedido vai pela ENTRADA PADRAO, nunca como argumento: com o `claude.cmd` do npm, o cmd.exe
corta o argumento na primeira quebra de linha (licao do OW Agente, 22/09).
⛔ Sem o `claude`, a reescrita nao inventa: a oportunidade fica sem titulos e o painel diz o motivo.
"""
import json, os, re, shutil, subprocess, sys, tempfile

PERSONAS = [
    {"id": "amish", "assinatura": ["amish"], "nome": "Amish", "marca": "AMISH",
     "quem": "an Amish man from Lancaster County: plain living, no grid dependence, old farm wisdom"},
    {"id": "mennonite", "assinatura": ["mennonite"], "nome": "Mennonite", "marca": "MENNONITE",
     "quem": "a Mennonite homemaker/farmer: frugal, from-scratch, faith and community"},
    {"id": "appalachian", "assinatura": ["appalachian", "appalachia"], "nome": "Appalachian", "marca": "APPALACHIAN",
     "quem": "an old Appalachian mountain man/granny: hollers, foraging, folk remedies, making do"},
    {"id": "depression", "assinatura": ["great depression", "1930s", "depression era"], "nome": "Depression-era Grandma", "marca": "1930s",
     "quem": "a grandmother who lived through the Great Depression: waste nothing, stretch every dollar"},
    {"id": "old-farmer", "assinatura": ["old farmer"], "nome": "Old Farmer", "marca": "OLD FARMER",
     "quem": "an 80-year-old Midwest farmer: 60 years of harvests, weather lore, soil and livestock"},
    {"id": "pioneer", "assinatura": ["pioneer", "1800s"], "nome": "1800s Pioneer", "marca": "PIONEER",
     "quem": "frontier pioneer knowledge from the 1800s: homesteading with no stores and no electricity"},
    {"id": "okinawan", "assinatura": ["okinawa", "okinawan"], "nome": "Okinawan Centenarian", "marca": "OKINAWAN",
     "quem": "an Okinawan 100-year-old: longevity habits, food, garden, purpose (ikigai)"},
    {"id": "monk", "assinatura": ["monk", "monks"], "nome": "Monk", "marca": "MONK",
     "quem": "a monastery monk: discipline, simple food, herbal gardens, quiet craftsmanship"},
    {"id": "barn-finds", "assinatura": ["barn find", "barn finds"], "nome": "Barn Finds Picker", "marca": "BARN FIND",
     "quem": "an old rural picker who digs through barns and attics: forgotten objects worth real money, junk vs treasure"},
    {"id": "cowboy", "assinatura": ["cowboy", "cowboys"], "nome": "Old Cowboy", "marca": "COWBOY",
     "quem": "an old ranch cowboy: self-reliance, horses, cattle, outdoor survival, fixing anything"},
    # ── as apostas de 08/10 (docs/apostas.md) ──
    {"id": "old-mechanic", "assinatura": ["old mechanic", "year old mechanic", "old-timer mechanic"],
     "nome": "Old Mechanic", "marca": "OLD MECHANIC",
     "quem": "an 81-year-old small-town mechanic: 60 years under the hood, what dealers won't tell you, keep old cars running cheap"},
    {"id": "hutterite", "assinatura": ["hutterite", "hutterites"], "nome": "Hutterite", "marca": "HUTTERITE",
     "quem": "a Hutterite colony elder (plain communal farmers, cousins of the Amish): big-batch cooking, food storage, colony farming"},
    {"id": "shaker", "assinatura": ["the shakers", "shaker way", "old shaker"], "nome": "Shaker", "marca": "SHAKER",
     "quem": "a Shaker craftsman: simple furniture, herb gardens, order and thrift, 'hands to work, hearts to God'"},
    {"id": "sleep-farm", "assinatura": ["fall asleep", "sleep to", "for sleep", "sleep stories"],
     "nome": "Farm Stories to Sleep", "marca": "FALL ASLEEP",
     "quem": "a slow, warm old farm storyteller for long sleep videos (1-3 hours): calm lessons from the old ways, lean-back TV viewing"},
    {"id": "victory-garden", "assinatura": ["1940s", "victory garden", "wartime", "ration", "rationing"],
     "nome": "1940s Victory Garden Grandma", "marca": "1940s",
     "quem": "a grandmother who kept a WWII victory garden: rationing recipes, growing food in any yard, making do"},
    {"id": "old-electrician", "assinatura": ["old electrician", "lineman", "old electrician's"],
     "nome": "Old Electrician", "marca": "OLD ELECTRICIAN",
     "quem": "a retired lineman/electrician with 50 years of house calls: what fails in a home, hidden dangers, cheap fixes"},
]

TEMAS = ["jardim", "cozinha", "sobrevivência", "economia doméstica", "remédios caseiros",
         "casa e reparos", "animais e fazenda", "carros", "dinheiro", "saúde e longevidade", "outro"]

# ⭐ a mesma oportunidade em outro idioma: a demanda nativa existe, a oferta com persona quase nao
IDIOMAS = {
    "fr": {"nome": "Francês", "sigla": "FR", "idioma": "fr", "regiao": "FR", "lingua": "French (France)"},
    "de": {"nome": "Alemão", "sigla": "DE", "idioma": "de", "regiao": "DE", "lingua": "German (Germany)"},
}


def persona(pid):
    """A persona do catalogo, ou uma livre (o texto digitado vira o nome e a marca)."""
    for p in PERSONAS:
        if p["id"] == pid: return p
    nome = (pid or "").strip()
    return {"id": nome.lower(), "nome": nome, "marca": nome.upper(), "quem": nome, "assinatura": [nome.lower()]}


def ja_tem_persona(titulo, p):
    """O titulo ja' traz a persona? (ai' nao e' o original, e' um remake)"""
    t = titulo.lower()
    return any(re.search(r"\b" + re.escape(w) + r"\b", t) for w in p.get("assinatura") or [p["nome"].lower()])


def tem_alguma_persona(titulo, atual=None):
    """O titulo ja' e' remake de QUALQUER persona do catalogo (ou da atual, se for livre)?"""
    return any(ja_tem_persona(titulo, p) for p in PERSONAS + ([atual] if atual else []))


def palavras_chave(titulo, n=6):
    """O miolo do titulo para buscar remakes: sem numeros, emojis e palavras vazias."""
    vazias = {"how", "to", "the", "a", "an", "and", "or", "of", "in", "on", "for", "with", "your", "you", "my", "is",
              "are", "this", "that", "it", "do", "dont", "don't", "never", "ever", "will", "what", "why", "best",
              "ways", "way", "tips", "easy", "simple", "every", "most", "from", "into", "at", "be", "can", "should"}
    ws = [w for w in re.findall(r"[A-Za-z']+", titulo.lower()) if w not in vazias and len(w) > 2]
    return " ".join(list(dict.fromkeys(ws))[:n])


INSTRUCAO = """You are a YouTube packaging strategist for faceless/persona channels aimed at US audiences aged 45+.

PERSONA: {quem}
PERSONA TAG for titles: {marca}

For each OLD viral video below, write the remake the way the "Elias Yoder / Amish" channels do:
keep the exact search intent and the original hook words, and add the persona angle
(e.g. "How to Pick a Sweet Watermelon" -> "How to Pick a Sweet Watermelon... The Old AMISH Way").

The formula that works for these channels: a nostalgic niche people feel something about, a curiosity gap
("You Already Have This", "Grandma Never Wrote This Down", "Nobody Does This Anymore"), and when it fits
a big number (7, 10, 25, 40) told by a warm old voice.

For each item return:
- "id": the same id
- "titulos": 3 English titles, max 75 chars each: the first one closest to the original + persona,
  the second with a curiosity gap, the third with a big number
- "tema": one of {temas}
- "angulo": ONE sentence in Brazilian Portuguese: what digital product (ebook/manual/course) this audience would buy after this video
- "encaixe": 0-10, how naturally this persona owns this topic AND leads to selling that product

Answer with JSON only, no prose, no code fences: {{"itens": [ ... ]}}

VIDEOS:
{lista}"""


def montar_pedido(p, videos):
    lista = "\n".join(f'- id={v["id"]} | {v["views"]:,} views | "{v["titulo"]}"' for v in videos)
    return INSTRUCAO.format(quem=p["quem"], marca=p["marca"], temas=json.dumps(TEMAS, ensure_ascii=False), lista=lista)


def interpretar(texto):
    """{id: {...}} do que o modelo respondeu. Tolera cerca de codigo e texto em volta do JSON."""
    t = (texto or "").strip()
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", t)
    ini, fim = t.find("{"), t.rfind("}")
    if ini < 0 or fim < ini: return {}
    try:
        d = json.loads(t[ini:fim + 1])
    except ValueError:
        return {}
    saida = {}
    for it in d.get("itens", []) if isinstance(d, dict) else []:
        if not isinstance(it, dict) or not it.get("id"): continue
        tema = it.get("tema") if it.get("tema") in TEMAS else "outro"
        try:
            enc = max(0.0, min(10.0, float(it.get("encaixe", -1))))
        except (TypeError, ValueError):
            enc = -1
        titulos = [str(x).strip() for x in (it.get("titulos") or []) if str(x).strip()][:5]
        saida[str(it["id"])] = {"titulos": titulos, "tema": tema, "angulo": str(it.get("angulo") or "").strip(),
                                "encaixe": enc}
    return saida


# ── o Claude Code desta maquina ──
_ONDE_CLAUDE = (("~/.local/bin/claude.exe", "~/.local/bin/claude"),
                ("%LOCALAPPDATA%/Programs/claude/claude.exe",),
                ("%APPDATA%/npm/claude.cmd", "%APPDATA%/npm/claude"))
_DO_HOSPEDEIRO = ("CLAUDECODE", "ANTHROPIC_BASE_URL", "USE_LOCAL_OAUTH", "USE_STAGING_OAUTH")


def binario():
    achado = shutil.which("claude")
    if achado: return achado
    for grupo in _ONDE_CLAUDE:
        for bruto in grupo:
            c = os.path.expandvars(os.path.expanduser(bruto.replace("/", os.sep)))
            if os.path.isfile(c): return c
    return None


def ambiente_limpo():
    """⛔ A janela pode ter sido aberta de dentro de uma sessao do Claude Code: o filho nao herda isso."""
    return {k: v for k, v in os.environ.items()
            if k not in _DO_HOSPEDEIRO and (not k.startswith("CLAUDE_CODE_") or k == "CLAUDE_CODE_GIT_BASH_PATH")}


def chamar_claude(pedido, timeout=300):
    """Texto cru da resposta. Levanta RuntimeError com o motivo em portugues."""
    exe = binario()
    if not exe: raise RuntimeError("o Claude Code não está instalado nesta máquina")
    extra = {"creationflags": 0x08000000} if os.name == "nt" else {}       # CREATE_NO_WINDOW
    cmd = [exe, "-p", "--output-format", "json"]
    modelo = os.environ.get("MINERADOR_MODELO")
    if modelo: cmd += ["--model", modelo]
    r = subprocess.run(cmd, cwd=tempfile.gettempdir(), env=ambiente_limpo(), input=pedido, capture_output=True,
                       text=True, encoding="utf-8", errors="replace", timeout=timeout, **extra)
    try:
        d = json.loads(r.stdout or "")
    except ValueError:
        d = None
    if r.returncode != 0 or (isinstance(d, dict) and d.get("is_error")):
        status = d.get("api_error_status") if isinstance(d, dict) else None
        if status == 401: raise RuntimeError("o login do Claude Code desta máquina venceu")
        if status == 429: raise RuntimeError("o Claude Code atingiu o limite de uso — tente mais tarde")
        msg = (d.get("result") if isinstance(d, dict) else "") or r.stderr or r.stdout
        raise RuntimeError(f"o Claude Code falhou: {str(msg).strip()[:140]}")
    return (d.get("result") or "") if isinstance(d, dict) else (r.stdout or "")


INSTRUCAO_EQUIV = """You localize winning YouTube packaging for native audiences in other countries (not literal translation).

PERSONA: {quem}

For each video below and for each target language in {linguas}, return:
- "titulo": the remake title transcreated for natives of that country (persona angle kept, max 75 chars)
- "consulta": the 2-5 word search query natives would actually type for the ORIGINAL topic, WITHOUT the persona
- "persona_local": how natives write the persona word (e.g. Amish -> "Amish" in German, "amish" in French)

Answer with JSON only, no prose, no code fences:
{{"itens": [{{"id": "...", "fr": {{"titulo": "...", "consulta": "...", "persona_local": "..."}}, "de": {{...}}}}]}}

VIDEOS:
{lista}"""


def montar_pedido_equiv(p, ops, idiomas):
    lista = "\n".join(f'- id={o["id"]} | original "{o["titulo"]}" | remake "{o.get("remake") or ""}"' for o in ops)
    linguas = ", ".join(f'{k} = {IDIOMAS[k]["lingua"]}' for k in idiomas)
    return INSTRUCAO_EQUIV.format(quem=p["quem"], linguas=linguas, lista=lista)


def interpretar_equiv(texto, idiomas):
    """{id: {idioma: {titulo, consulta, persona_local}}}. So' entra idioma pedido e com consulta."""
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", (texto or "").strip())
    ini, fim = t.find("{"), t.rfind("}")
    if ini < 0 or fim < ini: return {}
    try:
        d = json.loads(t[ini:fim + 1])
    except ValueError:
        return {}
    saida = {}
    for it in d.get("itens", []) if isinstance(d, dict) else []:
        if not isinstance(it, dict) or not it.get("id"): continue
        por = {}
        for k in idiomas:
            e = it.get(k)
            if isinstance(e, dict) and str(e.get("consulta") or "").strip():
                por[k] = {"titulo": str(e.get("titulo") or "").strip(), "consulta": str(e["consulta"]).strip(),
                          "persona_local": str(e.get("persona_local") or "").strip()}
        if por: saida[str(it["id"])] = por
    return saida


def equivalentes(p, ops, idiomas, chamar=None):
    """ops = [{id, titulo, remake}] -> {id: {idioma: {...}}} num pedido so'."""
    idiomas = [k for k in idiomas if k in IDIOMAS]
    if not ops or not idiomas: return {}
    return interpretar_equiv((chamar or chamar_claude)(montar_pedido_equiv(p, ops, idiomas)), idiomas)


def reescrever(p, videos, chamar=None):
    """{id: {titulos, tema, angulo, encaixe}} para uma lista de videos (um pedido so')."""
    if not videos: return {}
    return interpretar((chamar or chamar_claude)(montar_pedido(p, videos)))


def _autoteste():
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    am = persona("amish")
    caso("persona do catalogo", am["marca"] == "AMISH")
    caso("persona livre vira nome e marca", persona("Navy Seal")["marca"] == "NAVY SEAL")
    caso("⭐ titulo que ja' e' remake e' reconhecido", ja_tem_persona("How to Pick... The Old AMISH Way", am))
    caso("titulo original nao e' remake", not ja_tem_persona("How to Pick a Sweet Watermelon", am))
    caso("⭐ remake de outra persona tambem nao e' original", tem_alguma_persona("Old Monk Bread Secret"))
    caso("persona livre reconhece o proprio nome", ja_tem_persona("Navy Seal Knot", persona("Navy Seal")))
    caso("palavras-chave tiram o vazio", palavras_chave("How to Pick a Sweet Watermelon") == "pick sweet watermelon")
    pedido = montar_pedido(am, [{"id": "V1", "views": 16_000_000, "titulo": "How to Pick a Sweet Watermelon"}])
    caso("pedido traz persona, id e views", "AMISH" in pedido and "id=V1" in pedido and "16,000,000" in pedido)
    resposta = '```json\n{"itens": [{"id": "V1", "titulos": ["How to Pick a Sweet Watermelon... The Old AMISH Way"], ' \
               '"tema": "jardim", "angulo": "Manual de horta amish", "encaixe": 9}]}\n```'
    r = reescrever(am, [{"id": "V1", "views": 1, "titulo": "x"}], chamar=lambda _p: resposta)
    caso("⭐ resposta com cerca de codigo e' lida", r["V1"]["encaixe"] == 9 and r["V1"]["tema"] == "jardim")
    caso("tema fora da lista vira 'outro'", interpretar('{"itens":[{"id":"a","tema":"xyz"}]}')["a"]["tema"] == "outro")
    caso("encaixe fora de 0-10 e' cortado", interpretar('{"itens":[{"id":"a","encaixe":42}]}')["a"]["encaixe"] == 10)
    caso("resposta sem JSON: vazio, sem quebrar", interpretar("desculpe, não consigo") == {})
    caso("lista vazia nao chama o Claude", reescrever(am, [], chamar=lambda _p: 1 / 0) == {})
    eq = '{"itens":[{"id":"V1","fr":{"titulo":"Choisir une pastèque… à la façon AMISH","consulta":"choisir une pastèque",' \
         '"persona_local":"amish"},"de":{"titulo":"x","consulta":""},"es":{"consulta":"x"}}]}'
    r = equivalentes(am, [{"id": "V1", "titulo": "How to Pick", "remake": "…"}], ["fr", "de", "xx"], chamar=lambda _p: eq)
    caso("⭐ equivalente FR lido", r["V1"]["fr"]["consulta"] == "choisir une pastèque")
    caso("⛔ idioma sem consulta ou nao pedido fica de fora", "de" not in r["V1"] and "es" not in r["V1"])
    caso("pedido de equivalencia cita as linguas", "German (Germany)" in montar_pedido_equiv(am, [{"id": "a", "titulo": "t"}], ["de"]))
    caso("⭐ as apostas estao no catalogo", {"old-mechanic", "hutterite", "shaker", "sleep-farm", "victory-garden",
                                             "old-electrician"} <= {x["id"] for x in PERSONAS})
    caso("'salt shaker' nao e' remake Shaker", not ja_tem_persona("Salt Shaker Hack", persona("shaker")))
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
    if "--provar" in sys.argv:
        print(json.dumps(reescrever(persona("amish"), [{"id": "V1", "views": 16_000_000,
                                                        "titulo": "How to Pick a Sweet Watermelon"}]), indent=2,
                         ensure_ascii=False))
