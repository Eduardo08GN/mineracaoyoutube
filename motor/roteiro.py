# -*- coding: utf-8 -*-
r"""ROTEIRO — do viral fonte ao roteiro no molde do Elias Yoder e a' lista de planos de ~4 s.

    python motor/roteiro.py --autoteste

Tres passos, cada um um pedido ao Claude Code desta maquina (`claude -p`):
    1. mecanismo  o que o viral ensina: pontos praticos, numeros, a promessa (em portugues, para o Eduardo ler)
    2. roteiro    o texto falado, na lingua do canal, no molde medido em docs/roteiro-elias-yoder.md
    3. planos     a narracao cortada em trechos de ~4 s na troca de frase (sem o Claude) e, para cada um,
                  a cena do b-roll em ingles + palavras de busca (com o Claude)

⭐ A relacao com o viral fonte e' a do Elias: pega o tema, o mecanismo e a intencao do titulo e REESCREVE no
   molde, expandindo (o viral da melancia tinha ~200 palavras; o video dele, 2.831). Nunca copia frase.
⭐ Proporcoes medidas no Elias: ~10% avatar em tela cheia, ~10% tela dividida, ~80% b-roll, um plano a cada ~4 s.
   Avatar e tela dividida mostram a boca: usam a VOZ DO VEO. O b-roll usa a narracao da MiniMax.
⛔ Saude: so' "traditionell verwendet", nunca "heilt" — a lei alema de propaganda de remedios (HWG) e as
   regras do YouTube punem promessa de cura. O Elias tambem recusa (docs/roteiro-elias-yoder.md).
"""
import json, re, sys, os

AQUI = os.path.dirname(os.path.abspath(__file__))
if AQUI not in sys.path: sys.path.insert(0, AQUI)

# ── quem fala: o perfil de producao de cada persona (editavel no projeto) ──
PERFIS = {
    "kloster-moench": {
        # ⛔ nao "Anselm": colide com o monge real Anselm Grün (17,5 mil inscritos, best-seller). Wendelin e' o
        #    padroeiro dos camponeses e pastores, e nenhum canal usa o nome (checado em 08/10).
        "nome": "Bruder Wendelin",
        "apresentacao": "Ich bin Bruder Wendelin. Ich bin Benediktinermönch und pflege seit über vierzig Jahren "
                        "den Garten unseres kleinen Klosters im Allgäu.",
        "companheiro": "Bruder Konrad, der alte Koch unserer Klosterküche",
        "linhagem": "die Brüder vor mir, die diesen Garten seit Jahrhunderten bestellen, und die Lehre der heiligen Hildegard",
        "tratamento": "Sie",
        "livro": "Das Klostergarten-Buch",
        "site": "bruderwendelin.online",
        "assinatura": "So wird es bis heute in jedem Klostergarten gemacht, der sich erinnert.",
        "despedida": "Gott befohlen, und bis zum nächsten Mal.",
        "cenario_avatar": "an old Benedictine monk in a black habit, white hair, kind face, speaking to camera in a "
                          "simple stone monastery kitchen with a wooden table and a window",
    },
}

LINGUAS = {"de": "German", "en": "English", "fr": "French", "es": "Spanish"}
PALAVRAS_POR_S = {"de": 2.2, "en": 2.5, "fr": 2.6, "es": 2.6}   # fala calma (Elias: 137-167 palavras/min em ingles)
ALVO_PALAVRAS = {"de": 2900, "en": 3200, "fr": 3100, "es": 3100}  # ~20 min


def perfil_de(persona):
    """O perfil de producao da persona; persona sem perfil ganha um generico pelo 'quem'."""
    base = PERFIS.get(persona["id"])
    if base: return dict(base)
    return {"nome": persona["nome"], "apresentacao": f"I am {persona['nome']}.", "companheiro": "",
            "linhagem": "the old folks who taught me", "tratamento": "", "livro": "the book", "site": "[SITE]",
            "assinatura": "", "despedida": "", "cenario_avatar": persona.get("quem", "")}


def _json(texto):
    t = re.sub(r"^```(?:json)?\s*|\s*```$", "", (texto or "").strip())
    ini, fim = t.find("{"), t.rfind("}")
    if ini < 0 or fim < ini: return {}
    try:
        return json.loads(t[ini:fim + 1])
    except ValueError:
        return {}


# ── 1. o mecanismo do viral ──
INSTRUCAO_MECANISMO = """You analyse an old viral YouTube video so it can be remade by a persona channel.

PERSONA THAT WILL REMAKE IT: {quem}

ORIGINAL VIDEO
Title: {titulo}
Channel: {canal} · {views:,} views
Description: {descricao}
What is said in it ({origem}):
{texto}

Return JSON only (no prose, no code fences), all text in Brazilian Portuguese:
{{"resumo": "2 sentences: what the video teaches and why it went viral",
 "pontos": ["each practical point / step / test / tip the video teaches, with exact numbers, quantities, times and names, in the order they appear"],
 "promessa": "the promise the remake should make, in one sentence",
 "itens": <how many numbered items the remake should have, 5 to 12>,
 "lacunas": ["what the original leaves out that the persona could add (history, why it works, mistakes, safety)"]}}
If nothing is said in the video, infer the points from the title and description and say so in "resumo"."""


def montar_mecanismo(persona, fonte):
    texto = (fonte.get("texto") or "").strip()
    return INSTRUCAO_MECANISMO.format(
        quem=persona.get("quem", persona["nome"]), titulo=fonte.get("titulo", ""), canal=fonte.get("canal", ""),
        views=int(fonte.get("views") or 0), descricao=(fonte.get("descricao") or "")[:1500],
        origem=fonte.get("legenda") or "nothing", texto=texto or "(no speech: music only)")


def interpretar_mecanismo(resposta):
    d = _json(resposta)
    pontos = [str(x).strip() for x in d.get("pontos") or [] if str(x).strip()]
    if not pontos: return None
    try:
        itens = max(5, min(12, int(d.get("itens") or len(pontos))))
    except (TypeError, ValueError):
        itens = 7
    return {"resumo": str(d.get("resumo") or "").strip(), "pontos": pontos[:20], "promessa": str(d.get("promessa") or "").strip(),
            "itens": itens, "lacunas": [str(x).strip() for x in d.get("lacunas") or [] if str(x).strip()][:8]}


# ── 2. o roteiro no molde do Elias ──
SECOES = [  # (nome, fracao das palavras) — docs/roteiro-elias-yoder.md, secao 9 (sem a pausa da comunidade)
    ("Szene-Haken", .056), ("Wendung", .034), ("Versprechen und Herkunft", .063), ("Das Buch", .017),
    ("Ehrlicher Rahmen", .028), ("Das Warum", .078), ("Hauptteil A", .26), ("Hauptteil B", .22),
    ("Zusammenfassung", .053), ("Wissenschaft, System, Held", .062), ("Aufgabe der Woche", .053),
    ("Kommentar", .028), ("Nächstes Mal", .025), ("Abschluss", .023),
]

INSTRUCAO_ROTEIRO = """You write the full spoken script of a ~20-minute YouTube video in {lingua}, for a persona channel that remakes old viral videos.
Write it EXACTLY in the style of the "Elias Yoder" Amish channels (measured on 12 of their videos), transposed to this persona.

THE PERSONA (first person, speaking straight to the viewer, address the viewer as "{tratamento}"):
- {nome}. Self-introduction to use once in section 3: "{apresentacao}"
- Companion who appears in stories (the role Esther plays for Elias): {companheiro}
- Lineage of the knowledge: {linhagem}
- Who: {quem}

THE ORIGINAL VIRAL (keep its search intent and teach its mechanism; NEVER copy its sentences; expand ~14x with the persona's world):
Title: "{titulo}" · {views:,} views
What it teaches: {resumo}
Points, in order: {pontos}
Promise for the remake: {promessa}
What the persona can add: {lacunas}
Number of numbered items in the body: {itens}

STRUCTURE — 14 sections, in this order, with these approximate word counts (total ~{total} words):
{secoes}
1 Szene-Haken: a concrete scene in second person and present tense, with a day/season, a place and EXACT prices or quantities; the viewer's failure told in sensory detail.
2 Wendung: "it was not your fault, nobody taught you the whole method"; flip the myth.
3 Versprechen und Herkunft: the number + the names of ALL items said aloud ("By the end of this video you will..."), then the self-introduction, the lineage and years of practice.
4 Das Buch — use this text almost word for word, once in the whole video: "Ein kurzes Wort, bevor ich weitermache. Was in unserem Kloster über die Jahre gesammelt wurde, ist mehr, als in ein Video passt. Ich habe alles in ein Buch geschrieben: {livro}, zu finden auf {site}. Das Buch ist die lange Fassung. Wenn Sie es möchten, ist es dort. Ich werde es nicht noch einmal erwähnen."
5 Ehrlicher Rahmen: "let me be straight with you": what this is and what it is not; correct any exaggeration of the title; a safety note when relevant.
6 Das Warum: the mechanism plainly (one or two technical terms, one homely comparison).
7 Hauptteil A and 8 Hauptteil B: the numbered items, each one: spoken label ("Erstens..." / "Punkt drei...") -> what to do with exact measures -> why -> a short story from the monastery or the companion -> contrast with the shop/industry product -> a one-line saying. One myth-vs-truth. Keep the BEST item for the end of Hauptteil B and tease it in section 3 (an open loop closed after 60% of the video).
9 Zusammenfassung: "here is where it all comes together": every item again in telegraphic form.
10 Wissenschaft, System, Held: "the old brothers knew it by feel, today science knows it" (a university or institute, no invented study names); "there is no money in teaching people X, there is a lot of money in selling Y"; it is a system nobody coordinated, NOT a conspiracy; "you can be the one who...".
11 Aufgabe der Woche: what to do this week, with a shopping list and total cost; "this weekend, set aside one afternoon".
12 Kommentar: ask about the viewer's experience AND a memory from their parents/grandparents; "this knowledge gets lost when nobody writes it down; I read every single one".
13 Nächstes Mal: a neighbouring topic, "the natural next step", ask to subscribe so they do not miss it.
14 Abschluss: "Bis dahin," + the method in one imperative sentence + a saying + the signature line "{assinatura}" {despedida}

VOICE RULES (must keep): calm, warm, old; short sentences with fragments; no colloquial contractions (write "gibt es", never "gibt's"); plain honest words ("ehrlich", "schlicht"); exact numbers and prices in euros; the voice must carry ALL the information so the video works as radio.
MUST AVOID: "wie Sie sehen", "schauen Sie hier" or anything that needs a specific image; asking for likes at the start; sponsors; mentioning the book more than once; dates or panic; promising cures or saying a herb heals/cures/treats a disease (say "wird traditionell verwendet bei", "kann wohltuend sein") — German law (HWG) and YouTube forbid it; conspiracy or blaming a named company; modern slang.

OUTPUT FORMAT (plain text, no markdown other than these markers, everything in {lingua}):
TITEL 1: <closest to the original title + the persona angle, max 75 characters>
TITEL 2: <curiosity gap, max 75 characters>
TITEL 3: <with a number, max 75 characters>
MINIATUR-TEXT: <2 to 4 words for the thumbnail>
MINIATUR-OBJEKT: <the single central object the persona holds or points at in the thumbnail, in English>
=== 1 | Szene-Haken ===
<spoken text>
=== 2 | Wendung ===
<spoken text>
... until === 14 | Abschluss ===
"""


def montar_roteiro(persona, perfil, fonte, mec, idioma="de"):
    total = ALVO_PALAVRAS.get(idioma, 3000)
    secoes = "\n".join(f"{i}. {n}: ~{round(total * f / 10) * 10} words" for i, (n, f) in enumerate(SECOES, 1))
    return INSTRUCAO_ROTEIRO.format(
        lingua=LINGUAS.get(idioma, "English"), total=total, secoes=secoes, quem=persona.get("quem", ""),
        titulo=fonte.get("titulo", ""), views=int(fonte.get("views") or 0), resumo=mec.get("resumo", ""),
        pontos=" | ".join(mec.get("pontos") or []), promessa=mec.get("promessa", ""),
        lacunas=" | ".join(mec.get("lacunas") or []), itens=mec.get("itens", 7), **{k: perfil.get(k, "") for k in (
            "nome", "apresentacao", "companheiro", "linhagem", "tratamento", "livro", "site", "assinatura", "despedida")})


def interpretar_roteiro(texto):
    """{titulos, miniatura: {texto, objeto}, secoes: [{n, nome, texto}], palavras} ou None."""
    t = (texto or "").replace("\r", "")
    titulos = [m.strip() for m in re.findall(r"^TITEL \d:\s*(.+)$", t, flags=re.M)][:3]
    mt = re.search(r"^MINIATUR-TEXT:\s*(.+)$", t, flags=re.M)
    mo = re.search(r"^MINIATUR-OBJEKT:\s*(.+)$", t, flags=re.M)
    partes = re.split(r"^===\s*(\d+)\s*\|\s*(.+?)\s*===\s*$", t, flags=re.M)
    secoes = []
    for i in range(1, len(partes) - 2, 3):
        corpo = re.sub(r"\n{3,}", "\n\n", partes[i + 2].strip())
        if corpo: secoes.append({"n": int(partes[i]), "nome": partes[i + 1].strip(), "texto": corpo})
    if len(secoes) < 8: return None
    palavras = sum(len(s["texto"].split()) for s in secoes)
    return {"titulos": titulos, "miniatura": {"texto": mt.group(1).strip() if mt else "", "objeto": mo.group(1).strip() if mo else ""},
            "secoes": secoes, "palavras": palavras}


# ── 3. os planos de ~4 s ──
ALVO_S, MIN_S, MAX_S = 4.0, 2.5, 6.0
_ABREV = re.compile(r"\b(z\. ?B|d\. ?h|u\. ?a|ca|usw|bzw|Dr|St|Nr|vgl|etc|evtl|ggf|inkl|Mr|Mrs|e\.g|i\.e)\.", re.I)
_PONTO = "․"   # "one dot leader": segura o ponto da abreviacao enquanto as frases sao cortadas


def frases(texto):
    """Frases do texto falado (sem quebrar "z. B.", "ca.", "Nr."...); frase longa vira pedacos na virgula."""
    t = _ABREV.sub(lambda m: m.group(0).replace(".", _PONTO), re.sub(r"\s+", " ", texto))
    brutas = [f.strip().replace(_PONTO, ".") for f in re.split(r"(?<=[.!?…:])\s+(?=[A-ZÄÖÜ„\"0-9])", t) if f.strip()]
    saida = []
    for f in brutas:
        if len(f.split()) <= MAX_S * 2.4:
            saida.append(f); continue
        pedacos, atual = [], []
        for parte in re.split(r"(?<=[,;–])\s+", f):
            if atual and len(" ".join(atual + [parte]).split()) > ALVO_S * 2.4:
                pedacos.append(" ".join(atual)); atual = []
            atual.append(parte)
        if atual: pedacos.append(" ".join(atual))
        for p in pedacos:   # ainda grande demais (sem virgula): corta a cada ~12 palavras
            ws = p.split()
            while len(ws) > MAX_S * 2.4:
                saida.append(" ".join(ws[:12])); ws = ws[12:]
            if ws: saida.append(" ".join(ws))
    return saida


def segmentar(secoes, idioma="de", nome_persona=""):
    """[{n, secao, tipo, voz, texto, palavras, dur, inicio}] — trechos de ~4 s que nunca cruzam secao.
    Tipos: avatar (cheio), split (avatar + clipe), broll. Avatar e split levam a voz do Veo; broll, a MiniMax."""
    wps = PALAVRAS_POR_S.get(idioma, 2.4)
    planos = []
    for s in secoes:
        atual = []
        for f in frases(s["texto"]):
            d_atual = len(" ".join(atual).split()) / wps
            d_f = len(f.split()) / wps
            if atual and (d_atual >= ALVO_S or d_atual + d_f > MAX_S):
                planos.append((s, " ".join(atual))); atual = []
            atual.append(f)
        if atual:
            if planos and planos[-1][0] is s and len(" ".join(atual).split()) / wps < MIN_S * 0.6 \
                    and (len(planos[-1][1].split()) + len(" ".join(atual).split())) / wps <= MAX_S + 1.5:
                planos[-1] = (s, planos[-1][1] + " " + " ".join(atual))
            else:
                planos.append((s, " ".join(atual)))
    planos = _juntar_curtos(planos, wps)
    saida, t = [], 0.0
    for i, (s, texto) in enumerate(planos):
        pal = len(texto.split())
        saida.append({"n": i + 1, "secao": s["n"], "secao_nome": s["nome"], "tipo": "broll", "texto": texto,
                      "palavras": pal, "dur": round(pal / wps, 1), "inicio": round(t, 1)})
        t += pal / wps
    _tipos(saida, nome_persona)
    for p in saida: p["voz"] = "minimax" if p["tipo"] == "broll" else "veo"
    return saida


TETO_S = 7.5        # o clipe do Veo tem 8 s: plano de avatar nunca passa disso


def _juntar_curtos(planos, wps):
    """⭐ Plano curto demais ("Zehntens, der Koriander.", "Der Satz:") junta com o SEGUINTE, onde o pensamento
    continua, ou com o anterior — na mesma secao e sem passar de TETO_S. Medido em 08/10: 11 de 263 planos
    tinham menos de 2 s; no Elias nenhum fica abaixo de ~3 s."""
    dur = lambda t: len(t.split()) / wps
    i = 0
    while i < len(planos):
        s, t = planos[i]
        if dur(t) < MIN_S:
            if i + 1 < len(planos) and planos[i + 1][0] is s and dur(t) + dur(planos[i + 1][1]) <= TETO_S:
                planos[i:i + 2] = [(s, t + " " + planos[i + 1][1])]; continue
            if i > 0 and planos[i - 1][0] is s and dur(planos[i - 1][1]) + dur(t) <= TETO_S:
                planos[i - 1:i + 1] = [(s, planos[i - 1][1] + " " + t)]; i -= 1; continue
        i += 1
    return planos


def _tipos(planos, nome_persona=""):
    """O avatar onde o Elias o poe (abertura, apresentacao, livro, comentario, proximo, fecho) e, no resto,
    um plano de avatar ou de tela dividida a cada ~5, alternando: ~10% + ~10%, como medido."""
    if not planos: return
    fixos = {0, len(planos) - 1}
    primeiro = {}
    for i, p in enumerate(planos): primeiro.setdefault(p["secao"], i)
    for sec in (3, 4, 12, 13):                              # promessa/apresentacao, livro, comentario, proximo
        if sec in primeiro: fixos.add(primeiro[sec])
    if nome_persona:
        for i, p in enumerate(planos):
            if nome_persona.split()[-1] in p["texto"]: fixos.add(i); break
    for i in fixos: planos[i]["tipo"] = "avatar"
    # ⭐ (09/10, Eduardo) o monge volta a cada 15-25 s: um plano de avatar/tela dividida a cada ~4 de b-roll (~17 s),
    #    e so' num plano que o Veo consiga falar bem (ate' 16 palavras, sem travessao, sem o nome do personagem) — antes
    #    o take era pulado e o monge sumia por ate' 49 s
    nome = (nome_persona.split()[-1] if nome_persona else "").lower()
    falavel = lambda p: len(p["texto"].split()) <= 16 and "–" not in p["texto"] and (not nome or nome not in p["texto"].lower())  # noqa: E731
    desde, proximo = 0, "split"
    for i, p in enumerate(planos):
        if p["tipo"] != "broll": desde = 0; continue
        desde += 1
        if desde >= 4 and falavel(p) and i + 1 < len(planos) and planos[i + 1]["tipo"] == "broll":
            p["tipo"], proximo, desde = proximo, ("avatar" if proximo == "split" else "split"), 0


def proporcoes(planos):
    total = sum(p["dur"] for p in planos) or 1
    return {t: round(100 * sum(p["dur"] for p in planos if p["tipo"] == t) / total) for t in ("avatar", "split", "broll")}


INSTRUCAO_PLANOS = """You plan the B-ROLL of a faceless persona YouTube video (the "Elias Yoder" style: a new illustrative clip every ~4 seconds, generic footage, no text on screen).
Video: "{titulo}" — persona: {quem}

For each numbered narration chunk below (in {lingua}), describe the ONE shot that illustrates it.
Rules: the shot must match the concrete NOUN of the sentence (the plant, the jar, the tool, the place), not the abstract idea;
generic and easy to find or generate (hands, plants, garden beds, kitchen, monastery, market, old-time scenes); never text, logos or a specific real person;
for chunks of type "split" the shot goes in the right half of a split screen next to the persona.

Return JSON only, no prose: {{"planos": [{{"n": <number>, "cena": "<shot description in English, max 20 words>",
 "camada": "<acao | objeto | lugar | epoca | pessoas>", "busca": "<2-5 English search keywords>"}}]}}
camada: acao = hands doing something (pruning, pouring, cutting); objeto = close-up of a thing or plant; lugar = a place or landscape;
epoca = an old-time / historical scene; pessoas = generic people in an activity (no recognisable faces).

CHUNKS:
{lista}"""


def montar_planos(persona, titulo, planos, idioma="de"):
    lista = "\n".join(f'{p["n"]} [{p["tipo"]}] {p["texto"]}' for p in planos)
    return INSTRUCAO_PLANOS.format(titulo=titulo, quem=persona.get("quem", ""), lingua=LINGUAS.get(idioma, "English"), lista=lista)


def interpretar_planos(texto):
    """{n: {cena, camada, busca}}."""
    saida = {}
    for it in _json(texto).get("planos") or []:
        try:
            n = int(it.get("n"))
        except (TypeError, ValueError):
            continue
        cena = str(it.get("cena") or "").strip()
        if not cena: continue
        cam = str(it.get("camada") or "").strip().lower()
        saida[n] = {"cena": cena[:200], "camada": cam if cam in ("acao", "objeto", "lugar", "epoca", "pessoas") else "objeto",
                    "busca": str(it.get("busca") or "").strip()[:80]}
    return saida


def _autoteste():
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    monge = {"id": "kloster-moench", "nome": "Klostermönch", "quem": "a German Benedictine monk", "idioma": "de"}
    pf = perfil_de(monge)
    caso("perfil do monge com o livro e o site do livro", pf["livro"] and pf["site"] == "bruderwendelin.online")
    caso("persona sem perfil ganha um generico", perfil_de({"id": "x", "nome": "Old Farmer", "quem": "q"})["nome"] == "Old Farmer")
    fonte = {"titulo": "Wie man natürliche Arznei herstellt", "canal": "SWR", "views": 2207331, "texto": "", "descricao": "Salben"}
    pm = montar_mecanismo(monge, fonte)
    caso("⭐ video sem fala: o pedido avisa (music only)", "music only" in pm and "2,207,331" in pm)
    mec = interpretar_mecanismo('```json\n{"resumo": "r", "pontos": ["Spitzwegerich-Salbe", "Andorn-Tinktur"], "itens": 30}\n```')
    caso("mecanismo lido, itens entre 5 e 12", mec["pontos"][1] == "Andorn-Tinktur" and mec["itens"] == 12)
    caso("mecanismo sem pontos: None", interpretar_mecanismo('{"resumo": "x"}') is None)
    pr = montar_roteiro(monge, pf, fonte, mec)
    caso("⭐ pedido do roteiro: alemao, 14 secoes, livro uma vez, trava do HWG", "in German" in pr and "14 Abschluss" in pr
         and "Das Klostergarten-Buch" in pr and "HWG" in pr and "gibt's" in pr)
    texto = "TITEL 1: Klosterarznei selber machen\nTITEL 2: Was die Mönche wussten\nTITEL 3: 7 Kräuter\n" \
            "MINIATUR-TEXT: Vergessenes Wissen\nMINIATUR-OBJEKT: a jar of plantain salve\n" + \
            "".join(f"=== {i} | {n} ===\nDas ist ein Satz. Und noch einer, z. B. mit ca. 3 Euro!\n\n" for i, (n, _) in enumerate(SECOES, 1))
    r = interpretar_roteiro(texto)
    caso("⭐ roteiro lido: 3 titulos, miniatura, 14 secoes", len(r["titulos"]) == 3 and r["miniatura"]["objeto"].startswith("a jar")
         and len(r["secoes"]) == 14 and r["secoes"][13]["nome"] == "Abschluss")
    caso("roteiro sem secoes: None", interpretar_roteiro("TITEL 1: x") is None)
    fs = frases("Nehmen Sie z. B. ca. 3 Blätter. Das reicht! Dann warten Sie.")
    caso("⭐ frases nao quebram em 'z. B.' nem 'ca.'", fs == ["Nehmen Sie z. B. ca. 3 Blätter.", "Das reicht!", "Dann warten Sie."])
    longa = "Wir nehmen die Blätter, waschen sie gründlich unter kaltem Wasser, legen sie auf ein sauberes Tuch, lassen sie zwei Tage trocknen, und dann füllen wir sie in ein dunkles Glas mit gutem Olivenöl aus dem Laden."
    caso("frase longa vira pedacos na virgula", all(len(f.split()) <= 15 for f in frases(longa)) and len(frases(longa)) >= 2)
    import random
    rnd = random.Random(1)
    corpo = " ".join(f"Satz Nummer {i} hat ein paar Worte mehr als nötig." for i in range(400))
    secs = [{"n": i, "nome": n, "texto": corpo if i in (7, 8) else " ".join(corpo.split()[: 60 + rnd.randrange(60)])}
            for i, (n, _) in enumerate(SECOES, 1)]
    secs[2]["texto"] = "Ich bin Bruder Wendelin. " + secs[2]["texto"]
    pl = segmentar(secs, "de", pf["nome"])
    durs = [p["dur"] for p in pl]
    caso(f"⭐ planos de ~4 s ({min(durs)}–{max(durs)} s, media {sum(durs)/len(durs):.1f})", 2.0 <= sum(durs) / len(durs) <= 5.0 and max(durs) <= TETO_S and min(durs) >= MIN_S)
    caso("plano nunca cruza secao", all(pl[i]["secao"] <= pl[i + 1]["secao"] for i in range(len(pl) - 1)))
    pr_ = proporcoes(pl)
    caso(f"⭐ proporcoes como o Elias (avatar {pr_['avatar']}%, split {pr_['split']}%, broll {pr_['broll']}%)",
         5 <= pr_["avatar"] <= 16 and 5 <= pr_["split"] <= 16 and 70 <= pr_["broll"] <= 88)
    caso("abre e fecha no avatar; a apresentacao tambem", pl[0]["tipo"] == "avatar" and pl[-1]["tipo"] == "avatar"
         and any(p["tipo"] == "avatar" and "Wendelin" in p["texto"] for p in pl))
    caso("⭐ avatar e split com a voz do Veo, b-roll com a MiniMax",
         all((p["voz"] == "veo") == (p["tipo"] != "broll") for p in pl))
    caso("nunca dois planos de avatar/split seguidos fora dos fixos",
         sum(1 for a, b in zip(pl, pl[1:]) if a["tipo"] != "broll" and b["tipo"] != "broll") <= 6)
    ip = interpretar_planos('{"planos": [{"n": 1, "cena": "hands tapping a watermelon", "camada": "acao", "busca": "tap watermelon"},'
                            ' {"n": 2, "cena": "x", "camada": "inventada"}, {"n": "y", "cena": "z"}]}')
    caso("planos lidos; camada desconhecida vira objeto", ip[1]["camada"] == "acao" and ip[2]["camada"] == "objeto" and len(ip) == 2)
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
