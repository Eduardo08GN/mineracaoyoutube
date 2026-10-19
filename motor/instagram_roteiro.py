# -*- coding: utf-8 -*-
r"""INSTAGRAM ROTEIRO — da fala do Reel de origem aos prompts de cada take (funcoes puras).

    python motor/instagram_roteiro.py --autoteste

    cortar(palavras, idioma)          palavras com tempo (whisper) -> takes de ate' 8 s
    pedido_adaptacao(...)             o pedido ao Claude: traduz/adapta cada take, escreve o movimento e o CTA
    ler_adaptacao(texto, n)           a resposta do Claude -> lista de takes (ou None se veio fora do formato)
    prompt_video(...)                 o prompt do Veo no formato testado (ficha da Tomiko)
    prompt_cena(...)                  o prompt da imagem de um comodo do universo-lar
    PROMPT_OBJETO                     a ancora do take com o livro (duas referencias)

As regras vem da ficha da Tomiko (instacontasac/avatar/tomiko/README.md), que resume o que foi testado
no ow_agente (pedido.py, regras.py, turbo.py) e no projetosweb.
"""
import json, re

# ⭐ os idiomas do seletor da aba. "lingua" entra no prompt da voz; "whisper" e' o codigo da transcricao.
IDIOMAS = {
    "pt": {"nome": "Português (Brasil)", "lingua": "Brazilian Portuguese", "whisper": "pt"},
    "en": {"nome": "Inglês (EUA)", "lingua": "American English", "whisper": "en"},
    "es": {"nome": "Espanhol", "lingua": "Spanish", "whisper": "es"},
    "fr": {"nome": "Francês", "lingua": "French", "whisper": "fr"},
    "de": {"nome": "Alemão", "lingua": "German", "whisper": "de"},
}
# ⛔ palavras por take de 8 s: o limite de 24 do ow_agente e' medido em ingles; o portugues e' mais longo (~18)
PALAVRAS_TAKE = {"pt": 18, "en": 24, "es": 20, "fr": 20, "de": 18}
# ⭐ (18/10, auditoria do Veo) a FALA do take e' medida em tempo: ~5 s falados num take de 8 s, folga nas duas pontas.
#    No run de 18/10 as falas de 18 palavras em pt deram 5,4-7,3 s: no limite, o final corta e o Reel incha.
FALA_S = 5.0
FALA_MAX_PALAVRAS = {"pt": 14, "en": 18, "es": 15, "fr": 15, "de": 13}
MAX_S_TAKE = 8.0
MIN_S_TAKE = 2.0
# ⭐ fim de frase fecha o take so' a partir daqui: take curto custa uma geracao inteira de 8 s do mesmo jeito
FRASE_FECHA_S = 4.5
# ⛔ um take nunca termina numa palavra que pede continuacao ("de", "para", "um"...): o Veo corta no ar
FRACAS = {
    "pt": {"de", "da", "do", "das", "dos", "para", "pra", "um", "uma", "o", "a", "os", "as", "e", "que", "com", "em",
           "no", "na", "por", "se", "mas", "ou", "como", "meu", "minha", "seu", "sua"},
    "en": {"the", "a", "an", "and", "of", "to", "for", "with", "in", "on", "my", "your", "that", "but", "or", "is"},
    "es": {"de", "del", "la", "el", "los", "las", "un", "una", "y", "que", "para", "con", "en", "por", "mi", "tu"},
    "fr": {"de", "du", "des", "la", "le", "les", "un", "une", "et", "que", "pour", "avec", "en", "à", "mon", "ma"},
    "de": {"der", "die", "das", "ein", "eine", "und", "zu", "mit", "für", "von", "in", "auf", "mein", "meine"},
}

# ⭐ (18/10, auditoria: reports/Prompts Veo para takes interpolados.md) a ordem e' a da formula oficial do Veo 3.1:
#    camera, sujeito, acao, audio. A camera travada abre o prompt (sem ela o Veo inventa movimento e corte).
CAMERA = ("Single continuous shot, static locked-off camera holding the exact framing of the frame, "
          "no zoom, no cuts.")
# ⭐ uma acao concreta antes da primeira palavra: o silencio do comeco vira gesto, e a primeira consoante sai inteira
ENTRADA_DA_FALA = "She looks at the camera and takes a small breath, then"
# ⭐ o tempo que sobra depois da fala ganha uma acao silenciosa: tempo vazio e' o que o Veo enche repetindo a linha
FALA_UMA_VEZ = "She says the line once, then stays silent, smiling softly at the camera, until the end of the shot."
SEM_TEXTO_TELA = "Clean frame: no captions, no subtitles, no on-screen text."
# ⛔ porte de MUDANCA_DURANTE_A_FALA (ow_agente pedido.py): com quadros diferentes o Veo segura o primeiro e muda no fim,
#    depois da fala; a montagem apara a cauda e a mudanca (o livro aparecendo) seria cortada.
MUDANCA_DURANTE_A_FALA = (
    "Pace the change between the two frames across the whole shot, in step with the speech: it is already visibly "
    "under way on the first word, about halfway through by the middle of the line, and fully complete on the last "
    "word. Do not hold the first frame and then change at the end.")

# ⛔ porte do PROMPT_OBJETO do ow_agente (motor/idiomas.py): identidade e objeto amarrados cada um a' sua referencia.
PROMPT_OBJETO = (
    "Using the FIRST reference image for the person and the place and the SECOND reference image for the object: "
    "the same person, in the same place, with the same lighting, clothing and framing, now holding up that exact "
    "object toward the camera with BOTH HANDS firmly gripping its edges, at chest height, front facing the viewer. "
    "The object rests in the hands, never floating in front of the person. The object must be the SAME as in the "
    "second reference: same design, same printed text, same colors, same proportions. The person must be the SAME "
    "person as in the first reference: same face, same hair, same body, same clothes. Vertical 9:16 photo, natural "
    "light, no on-screen text of any kind, no caption, no watermark.")

# ⭐ o avatar pronto da Tomiko (fonte canonica: docs/personas/tomiko-hayashi). A foto sobe pela aba.
TOMIKO = {
    "nome": "Tomiko Hayashi",
    "descricao": (
        "Tomiko, a 75-year-old Japanese-Brazilian woman (sansei granddaughter of immigrants, from Londrina, Paraná, "
        "Brazil), petite and slim, about 150 cm tall, short silver hair with a soft side part, warm crinkled smile, "
        "lively attentive eyes, real wrinkles and sun spots. She wears a loose white cotton long-sleeve blouse, an "
        "indigo denim apron with a small white sashiko embroidery square on the chest, charcoal trousers and simple "
        "dark flat shoes."),
    "prefixo": "The same 75-year-old Japanese-Brazilian woman from the frame, same face, hands, clothes and setting.",
    "voz": ("the warm, slow, slightly raspy voice of a 75-year-old woman, {lingua} with a soft Japanese-Brazilian "
            "accent, spoken by the woman in frame"),
    "quem": ("a 75-year-old Japanese-Brazilian grandmother from Londrina who teaches herbs, teas and home "
             "fermentation (umeboshi, miso, tsukemono); calm, patient, warm"),
    "cenas": [
        ("cozinha", "Cozinha da chácara", "Her farmhouse kitchen: dark wood cabinets, open wooden shelves with glass "
         "jars of herbs and ceramic bowls, large brown ceramic fermentation jars, a window with red earth fields outside."),
        ("varanda", "Varanda com plantas", "Her covered wooden porch with potted herbs and medicinal plants along the "
         "railing, a small bamboo bench, warm afternoon light, red earth yard beyond."),
        ("horta", "Horta dos fundos", "Her backyard herb garden: raised wooden beds with basil, shiso and mint, a woven "
         "bamboo trellis, soft morning light, the farmhouse behind."),
        ("sala", "Sala de chá", "A simple farmhouse living room: a low wooden table with a tea set, floor cushions, "
         "a wooden shelf with old photo frames, warm lamp light."),
        ("despensa", "Despensa de fermentados", "A cool pantry with wooden shelves lined with glass jars of pickled "
         "vegetables, umeboshi and miso, dried herbs hanging, soft light from a small window."),
        ("quintal", "Mesa no quintal", "A rustic wooden table under a mango tree in the backyard, a ceramic teapot and "
         "two cups, dappled sunlight through the leaves, red earth around."),
        ("bancada", "Bancada de preparo", "A wooden kitchen counter with a cutting board, fresh ginger and turmeric "
         "roots, dried herbs and a ceramic mortar and pestle, soft window light."),
        ("engawa", "Corredor externo", "A narrow covered wooden veranda along the side of the farmhouse, potted plants "
         "on a low wooden stand, green garden visible, late afternoon light."),
    ],
}


def _limpa(p):
    return re.sub(r"[^\wÀ-ÿ']", "", p.lower())


def cortar(palavras, idioma="pt", max_s=MAX_S_TAKE, max_palavras=None):
    """Palavras com tempo [{"w", "ini", "fim"}] -> takes [{"n", "ini", "fim", "texto"}].

    Fecha o take em fim de frase quando ele ja' tem folego (FRASE_FECHA_S). No limite de tempo/palavras recua para
    o ultimo fim de frase dentro dele, senao para a ultima virgula, senao enquanto a ultima palavra for fraca.
    ⛔ Nenhum take passa de `max_s` nem do limite de palavras do idioma."""
    max_palavras = max_palavras or PALAVRAS_TAKE.get(idioma, 18)
    fracas = FRACAS.get(idioma, set())
    takes, atual = [], []

    def recuo(fim_re):
        for i in range(len(atual) - 1, 0, -1):
            if re.search(fim_re, atual[i - 1]["w"].strip()) and atual[i - 1]["fim"] - atual[0]["ini"] >= MIN_S_TAKE:
                return i
        return 0

    def fechar(ate):
        nonlocal atual
        bloco, atual = atual[:ate], atual[ate:]
        if bloco:
            takes.append({"n": len(takes) + 1, "ini": round(bloco[0]["ini"], 2), "fim": round(bloco[-1]["fim"], 2),
                          "texto": " ".join(p["w"].strip() for p in bloco).strip()})

    for p in palavras:
        if not p.get("w", "").strip(): continue
        if atual and (p["fim"] - atual[0]["ini"] > max_s or len(atual) >= max_palavras):
            corte = recuo(r"[.!?…]$") or recuo(r"[,;:]$")
            if not corte:
                corte = len(atual)
                while corte > 1 and _limpa(atual[corte - 1]["w"]) in fracas: corte -= 1
            fechar(corte)
        atual.append(p)
        if re.search(r"[.!?…]$", p["w"].strip()) and atual[-1]["fim"] - atual[0]["ini"] >= FRASE_FECHA_S:
            fechar(len(atual))
    fechar(len(atual))
    return takes


def pedido_adaptacao(takes, idioma, avatar, cta):
    """O pedido ao Claude: a fala de cada take no idioma de destino, na boca do avatar, + movimento + CTA.

    cta = {"tipo": "bio" | "palavra", "palavra": "umeboshi", "livro": bool}"""
    info = IDIOMAS[idioma]
    lim = FALA_MAX_PALAVRAS.get(idioma, 14)
    if cta.get("tipo") == "palavra":
        regra_cta = (f'The LAST take is the call to action: invite viewers to comment '
                     f'"{cta.get("palavra", "").strip().lower()}," (lowercase, no accent, followed by a comma) to '
                     f'receive the full material. Write it exactly like that inside the line.')
    else:
        regra_cta = ("The LAST take is the call to action: a plain, calm line saying the complete material is at the "
                     "link in the profile. No hype.")
    if cta.get("livro"):
        # ⛔ o quadro final do CTA mostra o livro erguido: aqui NAO ha' volta a' pose (o texto nao contradiz o quadro)
        regra_cta += (" In that last take her book lies on the table in front of her: its \"quadro\" names the book, and "
                      "its \"movimento\" is the whole mechanism, with no return to the starting pose: \"As she speaks, "
                      "she picks up the book from the table with both hands and raises it to chest height, cover "
                      "toward the camera, holding it by the edges.\" then \"She holds it steady until the end of the "
                      "shot.\"")
    linhas = "\n".join(f'{t["n"]}. ({t["fim"] - t["ini"]:.1f} s) {t["texto"]}' for t in takes)
    return f"""You adapt a short vertical video (Instagram Reel) for a new presenter. Return ONLY JSON.

The presenter: {avatar.get("quem") or avatar.get("descricao", "")}
Target language: {info["lingua"]}.

Original takes (speech transcribed from the source video, any language):
{linhas}

Write, for EACH original take, in the same order:
- "fala": what the presenter says in {info["lingua"]}, keeping the meaning, the hook and the rhythm of the original,
  in her own warm voice. At most {lim} words, speakable in about {FALA_S:.0f} seconds at a calm pace. Never end a take on
  a word that asks for continuation (articles, prepositions, conjunctions). No dash characters of any kind inside the
  line. Numbers in words. Prefer common, easy-to-pronounce words: avoid words with a repeated syllable and word
  pairs where a vowel ending meets a vowel start (the voice merges them).
- "quadro": one short English sentence naming the items of this exact step of the line that are in front of her
  (ingredients, bowl, blender, pan, the finished food), concretely. Only the items: never the camera, the framing,
  her face, hair or clothes (the shot itself is copied from the source video).
- "movimento": exactly two short English sentences, in positive phrasing (what she does, never what she does not
  do). The shot starts and ends on the SAME frame, so the action must be reversible.
  1st sentence starts with "As she speaks," and describes ONE slow gesture: name the hand (right hand, left hand
  or both hands), the contact point and the item with the SAME noun used in the "quadro", limited to picking up,
  lifting, holding toward the camera, pointing at or touching. Never pouring, cutting, slicing, sprinkling,
  mixing, opening, peeling or anything that changes an item for good.
  2nd sentence starts with "After the line," and puts the item back in the same spot with her hands resting
  in the starting pose.
If an original take is itself a call to action (comment, follow, share, link), rewrite it as a short closing
line of the content instead: the call to action lives ONLY in the extra take below.
Then add ONE extra take at the end for the call to action, with the same fields. {regra_cta}

Content rules (mandatory):
- Wellness and tradition language: "strengthen", "balance", "well-being". Never promise to cure, treat or heal
  a disease; never attack doctors or medicine; no invented numbers, testimonials or scarcity.
- Present recipes and habits as cooking and tradition, not as remedies.

Also write "legenda_post": the Instagram post caption in {info["lingua"]} (2 to 4 short lines, one emoji at most per
line, ending with the same call to action).

JSON format:
{{"takes": [{{"n": 1, "fala": "...", "quadro": "...", "movimento": "..."}}, ...], "legenda_post": "..."}}"""


def ler_adaptacao(texto, n_origem):
    """A resposta do Claude -> {"takes": [{"n", "fala", "quadro", "movimento", "cta"}], "legenda_post"} ou None.
    ⛔ Fora do formato (sem JSON, takes faltando, campo vazio) = None: quem chama tenta de novo."""
    m = re.search(r"\{.*\}", texto or "", flags=re.S)
    if not m: return None
    try:
        d = json.loads(m.group(0))
    except ValueError:
        return None
    takes = d.get("takes")
    if not isinstance(takes, list) or len(takes) < n_origem + 1: return None
    saida = []
    for i, t in enumerate(takes[:n_origem + 1], 1):
        fala = t.get("fala") if isinstance(t, dict) else None
        mov = t.get("movimento") if isinstance(t, dict) else None
        if not isinstance(fala, str) or not fala.strip() or not isinstance(mov, str) or not mov.strip(): return None
        fala = re.sub(r"\s*[—–]\s*|\s+-\s+", ", ", fala.strip())      # ⛔ o Veo vocaliza o travessao
        quadro = t.get("quadro")
        saida.append({"n": i, "fala": fala, "quadro": quadro.strip() if isinstance(quadro, str) else "",
                      "movimento": mov.strip(), "cta": i == n_origem + 1})
    return {"takes": saida, "legenda_post": str(d.get("legenda_post") or "").strip()}


def voz(avatar, idioma):
    return (avatar.get("voz") or TOMIKO["voz"]).replace("{lingua}", IDIOMAS[idioma]["lingua"])


def prompt_video(avatar, idioma, movimento, fala, muda=False):
    """O prompt de um take: camera travada, quem (so' invariantes), a fala atribuida com o idioma e a voz, o gesto,
    o silencio depois da fala e o audio. ⛔ Com a ancora no quadro, a roupa e o cenario NAO sao descritos de novo: a
    prosa compete com a imagem e as vezes ganha. ⛔ "(no subtitles)" logo depois da fala: a legenda queimada e' o
    defeito mais relatado do Veo com dialogo, e a restricao rende mais colada nela."""
    partes = [CAMERA, avatar.get("prefixo") or TOMIKO["prefixo"]]
    if fala.strip():
        partes += [f'{ENTRADA_DA_FALA} says in {IDIOMAS[idioma]["lingua"]}, in {voz(avatar, idioma)}: '
                   f'"{fala.strip()}" (no subtitles)', movimento.strip(), FALA_UMA_VEZ]
        if muda: partes.append(MUDANCA_DURANTE_A_FALA)
    else:
        partes += [movimento.strip(), "She stays silent."]
    partes += ["Audio: only her voice and quiet room tone, no music.", SEM_TEXTO_TELA]
    return " ".join(p for p in partes if p)


def prompt_cena(avatar, cena):
    """A imagem 9:16 de um comodo do lar, com a foto do avatar como referencia."""
    return (f"Vertical 9:16 photo, smartphone UGC style. Using the reference image for the person: "
            f"{avatar.get('descricao', '').strip()} {cena.strip()} Upper body visible, looking at the camera. "
            f"No text, no captions, no logos, no watermark.")


def prompt_quadro(avatar, lugar, quadro):
    """O quadro de abertura de UM take. Refs: 1a = o quadro do video de origem naquele take, 2a = a foto do avatar.
    ⛔ O angulo, a distancia e a composicao vem SO' do video de origem (cada Reel tem os seus). O comodo entra so'
    pelo TEXTO: a imagem dele como referencia domina o quadro e poe o avatar de corpo inteiro, longe da camera.
    ⭐ Maos e itens EM REPOUSO: o quadro do meio do trecho de origem pode pegar um gesto no ar, e o take comeca e
    termina nesse quadro (com a jarra inclinada nas duas pontas, o gesto reversivel fica impossivel)."""
    return (f"Recreate the shot of the FIRST reference image: the same camera angle, the same camera distance and "
            f"zoom, the same framing and crop, and the same kind of items in the same places of the frame, with her "
            f"hands and the items at rest: nothing held in mid-air, nothing being poured. Replace the person with the person of the SECOND reference image (same face, hair and "
            f"clothes): {avatar.get('descricao', '').strip()} Nothing of the first reference's person stays: not the "
            f"face, the hair, the headwear or the clothes. Change only the setting behind the items to this place: "
            f"{lugar.strip()} {quadro.strip()} Vertical 9:16 photo, smartphone UGC style. "
            f"No text, no captions, no logos, no watermark.")


def proxima_cena(cenas, usos):
    """O comodo do proximo video: entre as aprovadas, a menos usada; no empate, a que esta' ha' mais tempo sem uso.
    usos = {cena_id: [timestamps]}. ⛔ Um comodo por video; a variacao e' de video para video."""
    aprovadas = [c for c in cenas if c.get("estado") == "aprovada"]
    if not aprovadas: return None
    return min(aprovadas, key=lambda c: (len(usos.get(c["id"], [])), max(usos.get(c["id"], [0]))))["id"]


def _autoteste():
    ok = True

    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)

    ws, t = [], 0.0
    frase = ("Você sabia que o gengibre fortalece a digestão de manhã. Minha avó fazia um chá com casca de "
             "limão e mel para o inverno inteiro. E ninguém da família ficava sem energia para trabalhar na roça "
             "de café de Londrina. Comente umeboshi, e eu te mando a receita").split()
    for w in frase:
        ws.append({"w": w, "ini": t, "fim": t + 0.38}); t += 0.42
    tk = cortar(ws, "pt")
    caso("cortar: gera varios takes", len(tk) >= 3)
    caso("⛔ nenhum take passa de 8 s", all(x["fim"] - x["ini"] <= MAX_S_TAKE + 0.01 for x in tk))
    caso("⛔ nenhum take passa de 18 palavras", all(len(x["texto"].split()) <= 18 for x in tk))
    caso("⛔ nenhum take termina em palavra fraca", all(_limpa(x["texto"].split()[-1]) not in FRACAS["pt"] for x in tk[:-1]))
    caso("⭐ no limite, o corte recua para o fim da frase", all(x["texto"].endswith(".") for x in tk[:-1]))
    curtas = [{"w": w, "ini": i * 0.4, "fim": i * 0.4 + 0.35} for i, w in enumerate("Uma frase. Outra frase. Mais uma.".split())]
    caso("⭐ frases curtas se juntam num take so'", len(cortar(curtas, "pt")) == 1)
    caso("pedido: CTA da origem vira fechamento", "the call to action lives ONLY in the extra take" in
         pedido_adaptacao(curtas and [{"n": 1, "ini": 0, "fim": 3, "texto": "x"}], "pt", {}, {"tipo": "bio"}))
    caso("todas as palavras entram", sum(len(x["texto"].split()) for x in tk) == len(frase))

    av = {"quem": TOMIKO["quem"], "prefixo": TOMIKO["prefixo"], "voz": TOMIKO["voz"]}
    ped = pedido_adaptacao(tk, "pt", av, {"tipo": "palavra", "palavra": "Umeboshi", "livro": True})
    caso("pedido: palavra minuscula com virgula", '"umeboshi,"' in ped)
    caso("pedido: livro no CTA, sem volta a' pose", "picks up the book from the table" in ped and "no return" in ped)
    caso("⭐ pedido: fala medida em tempo (pt = 14 palavras, ~5 s)", "At most 14 words, speakable in about 5 seconds" in ped)
    caso("⭐ pedido: movimento reversivel, com a mao e o mesmo substantivo do quadro",
         '"As she speaks,"' in ped and '"After the line,"' in ped and "Never pouring" in ped and "SAME noun" in ped)
    caso("pedido: regra de cura", "Never promise to cure" in ped)

    resp = "aqui: " + json.dumps({"takes": [{"n": i, "fala": f"Fala {i} — com travessão", "movimento": "She smiles."}
                                            for i in range(1, len(tk) + 2)], "legenda_post": "Receita 🍵"})
    a = ler_adaptacao(resp, len(tk))
    caso("ler_adaptacao: le o JSON no meio do texto", a and len(a["takes"]) == len(tk) + 1)
    caso("⛔ ler_adaptacao: travessao sai da fala", a and all("—" not in x["fala"] for x in a["takes"]))
    caso("ler_adaptacao: ultimo take e' o CTA", a and a["takes"][-1]["cta"] and not a["takes"][0]["cta"])
    caso("⛔ ler_adaptacao: take faltando = None", ler_adaptacao(json.dumps({"takes": []}), 3) is None)
    caso("⛔ ler_adaptacao: lixo = None", ler_adaptacao("sem json", 1) is None)

    p = prompt_video(av, "pt", "She lifts a jar of umeboshi.", "Essa conserva atravessa o inverno.")
    caso("⭐ prompt_video: a camera travada abre o prompt", p.startswith(CAMERA))
    caso("⭐ prompt_video: fala atribuida, com idioma, aspas e (no subtitles) colado nela",
         'then says in Brazilian Portuguese, in the warm' in p and '"Essa conserva atravessa o inverno." (no subtitles)' in p)
    caso("⭐ prompt_video: gesto depois da fala, silencio depois e texto limpo no fim",
         p.index("She lifts") > p.index("(no subtitles)") and "stays silent" in p and p.endswith(SEM_TEXTO_TELA))
    caso("prompt_video: o avatar so' por invariantes", "same face, hands" in p and "apron" not in p)
    caso("prompt_video: voz no idioma", "Brazilian Portuguese with a soft Japanese-Brazilian accent" in p)
    caso("⛔ prompt_video: sem 'no text, no logos' (apaga rotulos)", "no logos" not in p)
    caso("⭐ quadros diferentes: a mudanca acontece durante a fala", "in step with the speech" in prompt_video(av, "pt", "x", "y", muda=True)
         and "in step with the speech" not in p)
    caso("prompt_video sem fala", "She stays silent." in prompt_video(av, "en", "She lifts the cup.", "")
         and "says" not in prompt_video(av, "en", "She lifts the cup.", ""))
    caso("voz em ingles", "American English" in voz(av, "en"))
    pc = prompt_cena({"descricao": TOMIKO["descricao"]}, TOMIKO["cenas"][0][2])
    caso("prompt_cena: 9:16 + referencia + comodo", pc.startswith("Vertical 9:16") and "reference image" in pc
         and "fermentation jars" in pc)
    caso("Tomiko: 8 comodos com ids unicos", len({c[0] for c in TOMIKO["cenas"]}) == 8)

    cenas = [{"id": "a", "estado": "aprovada"}, {"id": "b", "estado": "aprovada"}, {"id": "c", "estado": "pronta"}]
    caso("rodizio: a nunca usada primeiro", proxima_cena(cenas, {"a": [10]}) == "b")
    caso("rodizio: empate vai na usada ha' mais tempo", proxima_cena(cenas, {"a": [10], "b": [20]}) == "a")
    caso("⛔ rodizio: so' aprovadas", proxima_cena(cenas, {"a": [1], "b": [1, 2]}) == "a"
         and proxima_cena([{"id": "c", "estado": "pronta"}], {}) is None)
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    import sys
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.exit(0 if _autoteste() else 1)
