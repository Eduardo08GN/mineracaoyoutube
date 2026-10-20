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
    "es": {"nome": "Espanhol (LATAM)", "lingua": "Mexican Spanish", "whisper": "es"},
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
ENTRADA_DA_FALA = "For the first second she stays silent, looking at the camera, then"
# ⭐ (20/10, Eduardo: "os objetos estao mudando pra outros como magica na mao dela"; o copo virou amassador)
OBJETOS_FIXOS = ("Every object keeps its identity from the first to the last frame: nothing turns into another object, "
                 "appears from nowhere or disappears.")
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
    "idioma": "pt", "cta": "eu quero", "genero": "f",
    "mundo": ("her small farm (chácara) near Londrina, Paraná, Brazil: rustic dark wood, ceramic fermentation jars, "
              "potted herbs, red earth, warm natural light"),
}

# ⭐⭐ (19/10, ordem do Eduardo) um avatar por mercado, cada um com o seu universo-lar: um video-fonte vira 3 Reels.
#    Fichas canonicas em docs/personas/<id>. O arquetipo e' o mesmo (quem cura pela tradicao e pela cozinha), vestido
#    na cultura de cada mercado. ⛔ Nada de xama indigena: apropriacao e reacao contraria (mesmo motivo da Cherokee).
CUCA = {
    "nome": "Doña Cuca Morales",
    "descricao": (
        "Doña Refugio 'Cuca' Morales, a 79-year-old mestiza Mexican grandmother from Atlixco, Puebla, short and sturdy, "
        "sun-weathered brown skin, long grey hair in a single thick braid, deep laugh wrinkles, sharp warm motherly "
        "eyes, strong quick hands. She wears a simple printed cotton dress, a red-and-white checkered apron with a front "
        "pocket, a small gold Virgin of Guadalupe medal on a thin chain, and a dark woven rebozo shawl over her "
        "shoulders."),
    "prefixo": "The same 79-year-old Mexican grandmother from the frame, same face, braid, hands, clothes and setting.",
    "voz": ("the warm, lively, slightly husky voice of a 79-year-old grandmother, {lingua} with a soft Mexican accent "
            "from Puebla, spoken by the woman in frame"),
    "quem": ("a 79-year-old Mexican grandmother herbalist (yerbera) from Atlixco, Puebla, who sells herbs at the Sunday "
             "market and teaches the remedies of the kitchen: teas, syrups (jarabes) and broths; Catholic, warm, funny "
             "and motherly: 'la salud empieza en la cocina de la abuela'"),
    "cenas": [
        ("cocina", "Cozinha da avó", "Her rustic Mexican kitchen: blue-and-white Talavera tiles, clay pots hanging on "
         "the wall, a stone molcajete and bunches of dried herbs on a wooden table, a small home altar shelf with a "
         "Virgin of Guadalupe picture and a candle, morning light from a small window."),
        ("patio", "Pátio com vasos", "Her sunny back patio: herbs growing in painted tin cans and clay pots along a "
         "colorful wall, bougainvillea, a couple of hens in the background, warm light."),
        ("mercado", "Banca do mercado", "Her herb stall at the Sunday market in Atlixco: bundles of fresh herbs, baskets "
         "of dried chamomile and cinnamon sticks, hand-written cardboard price signs, colorful papel picado overhead."),
        ("huerta", "Horta do quintal", "Her small backyard garden: rows of mint, epazote and aloe vera, a weathered "
         "wooden fence, a clay water jar, warm late-afternoon light."),
        ("comedor", "Mesa da sala", "A simple dining table with a flowered oilcloth, clay mugs of café de olla, a basket "
         "of pan dulce, family photos and a crucifix on the wall."),
        ("fogon", "Fogão a lenha", "An outdoor wood-fired stove (fogón) under a tin roof, a big clay pot simmering, "
         "firewood stacked beside it, soft smoke in the light."),
        ("alacena", "Armário de remédios", "A wooden cupboard with recycled glass bottles of syrup, small jars of "
         "ointment, dried herbs in paper bags with hand-written labels, soft light."),
        ("corredor", "Varanda de adobe", "A covered corridor of an old adobe house with terracotta floor tiles, potted "
         "ferns and geraniums, a wooden chair with a woven palm seat."),
    ],
    "idioma": "es", "cta": "libro", "genero": "f",
    "mundo": ("her humble home in Atlixco, Puebla, Mexico: Talavera tiles, clay pots, painted tin planters, colorful "
              "walls, warm light"),
}

WENDELIN = {
    "nome": "Bruder Wendelin",
    "descricao": (
        "Bruder Wendelin, an 80-year-old Benedictine monk from a small monastery in the Allgäu, Bavaria, tall and thin, "
        "slightly stooped, monastic tonsure with a crown of white hair, short grey beard, serene kind eyes, large "
        "weathered hands with garden soil in the creases. He wears a black Benedictine habit with scapular and a plain "
        "natural linen work apron over it, and simple leather sandals."),
    "prefixo": "The same 80-year-old Benedictine monk from the frame, same face, tonsure, hands, habit and setting.",
    "voz": ("the calm, low, slow voice of an 80-year-old monk, {lingua} with a soft southern Bavarian (Allgäu) "
            "warmth, spoken by the monk in frame"),
    "quem": ("an 80-year-old Benedictine monk who has tended the walled herb garden of a small Allgäu monastery for "
             "over 40 years, following the monastic medicine of the brothers and Saint Hildegard of Bingen; calm, "
             "humble, unhurried: 'I only pass on what was passed to me'"),
    "cenas": [
        ("klostergarten", "Horta do mosteiro", "The walled monastery herb garden: raised beds of sage, thyme, lemon "
         "balm, calendula and lavender, old stone walls, a wooden gate, the Alps faint in the distance, soft morning light."),
        ("kreuzgang", "Claustro", "The monastery cloister: stone arches, a small central garden with a well, a wooden "
         "bench, quiet diffuse light."),
        ("apotheke", "Botica do mosteiro", "The old monastery apothecary: wooden shelves with amber glass tincture "
         "bottles and labeled jars, a brass scale, dried herb bundles, a leather-bound garden notebook on the counter."),
        ("kueche", "Cozinha do mosteiro", "The monastery kitchen: a big scrubbed wooden table, copper pots, a tiled "
         "stove, bowls of herbs and vegetables from the garden, light from a deep stone window."),
        ("bibliothek", "Biblioteca", "A quiet monastery library with old books, a wooden lectern, a window onto the "
         "garden, warm lamp light."),
        ("gewaechshaus", "Estufa", "A small old glasshouse in the monastery garden with seedlings in clay pots, a "
         "wooden potting bench and garden tools."),
        ("kraeuterboden", "Sótão das ervas", "The drying loft under the roof beams: bundles of herbs hanging to dry, "
         "linen sachets, wooden crates, warm light through small windows."),
        ("bank", "Banco no jardim", "A wooden bench against the sunny garden wall, a wicker basket of freshly cut herbs "
         "beside him, bees on the lavender."),
    ],
    "idioma": "de", "cta": "Buch", "genero": "m",
    "mundo": ("his small Benedictine monastery in the Allgäu, Bavaria: old stone walls, a walled herb garden, simple "
              "wooden furniture, the Alps in the distance, soft light"),
}

# ⭐⭐ (19/10, ordem do Eduardo) a segunda conta em pt-BR, no nicho de horta e plantio (substitui o espanhol e o
#    alemao). Colono italiano da serra capixaba: longe do gaucho que domina o nicho (Bento Silveira).
BEPPE = {
    "nome": "Nonno Beppe",
    "descricao": (
        "Nonno Beppe (Giuseppe Bortolini), a 72-year-old Italian-Brazilian farmer, grandson of immigrants from Veneto, "
        "from Venda Nova do Imigrante in the mountains of Espírito Santo, Brazil, stocky and strong, sun-tanned weathered "
        "face, thick white moustache, bushy grey eyebrows, cheerful twinkling eyes, large rough hands with soil in the "
        "creases. He wears a flat grey wool cap, a light blue button-up cotton shirt with the sleeves rolled up, brown "
        "suspenders, dark work trousers and worn leather boots."),
    "prefixo": ("The same 72-year-old Italian-Brazilian farmer from the frame, same face, moustache, cap, hands, clothes "
                "and setting."),
    "voz": ("the warm, slightly raspy, cheerful voice of a 72-year-old man, {lingua} with a soft Italian accent from "
            "the Italian colony of Espírito Santo, spoken by the man in frame"),
    "quem": ("a 72-year-old Italian-Brazilian farmer (colono) from Venda Nova do Imigrante, Espírito Santo, who teaches "
             "vegetable gardening, saved seeds, natural compost and the preserves of the harvest; cheerful, proud of "
             "his garden, practical, and lets slip an Italian word now and then ('mangia', 'bello', 'porca miséria')"),
    "cenas": [
        ("horta", "Horta em fileiras", "His vegetable garden in neat straight rows: staked tomatoes, lettuce, cabbage and "
         "herbs, a wooden fence, the green mountains of Espírito Santo behind, soft morning light."),
        ("parreiral", "Parreiral", "A grape pergola heavy with green and purple grapes over a stone path, old wooden "
         "posts, dappled sunlight."),
        ("adega", "Adega", "A small cool cellar with straw-covered wine demijohns, wooden barrels, shelves of preserves "
         "in glass jars, braids of garlic hanging, warm dim light."),
        ("cozinha", "Cozinha com fogão a lenha", "A farmhouse kitchen with a wood-fired stove, a copper polenta pot, a "
         "long wooden table with a red checkered cloth, braids of onions hanging by the window."),
        ("galpao", "Galpão de ferramentas", "A wooden tool shed with hoes, rakes and a wheelbarrow, saved seeds in "
         "labeled glass jars and paper envelopes on a workbench."),
        ("sementeira", "Sementeira", "A seedling nursery: trays of young seedlings on wooden benches under a shade "
         "cloth, a metal watering can, potting soil."),
        ("varanda", "Varanda da casa", "The covered veranda of an old colonial farmhouse with a wooden bench, a basket "
         "of fresh vegetables and red geraniums in pots."),
        ("pomar", "Pomar", "A small orchard with lemon, orange and fig trees, hens pecking around, a wooden crate of "
         "picked fruit."),
    ],
    "idioma": "pt", "cta": "livro", "genero": "m",
    "mundo": ("his family farm (sítio) in the green mountains of Espírito Santo, Brazil, built by Italian immigrants: "
              "old wooden colonial buildings, stone walls, rows of vegetables, mountains in the background, natural light"),
}

PERSONAS = {"tomiko": TOMIKO, "beppe": BEPPE, "cuca": CUCA, "wendelin": WENDELIN}


def genero(texto, avatar):
    """As regras e os prompts em ingles foram escritos para uma mulher ("she", "her hands"): com avatar homem, viram
    "he"/"his". ⛔ So' no texto em INGLES escrito por nos (regras, movimento, quadro): nunca na fala, que esta' no
    idioma do Reel ("her" e' palavra em alemao: "komm her")."""
    if not avatar or avatar.get("genero") != "m": return texto
    for a, b in ((r"\bof her\b", "of him"), (r"\bto her\b", "to him"), (r"\bShe\b", "He"), (r"\bshe\b", "he"),
                 (r"\bHer\b", "His"), (r"\bher\b", "his"), (r"\bwoman\b", "man"), (r"\bgrandmother\b", "old man")):
        texto = re.sub(a, b, texto)
    return texto


def mundo(avatar, cena=""):
    """⭐⭐ (19/10, ordem do Eduardo) o ambiente de cada take vem do VIDEO-FONTE (o canteiro, o tanque de peixes, a
    cozinha); o universo do avatar entra so' como estilo: "o mundo dele". Sem ficha, vale o texto do comodo."""
    base = PERSONAS.get(avatar.get("persona", ""), {})
    return avatar.get("mundo") or base.get("mundo") or cena


def prompt_retrato(persona):
    """O retrato-ancora de um avatar novo (sem referencia): a pessoa da ficha no primeiro comodo do lar dela.
    `persona` = a ficha (comodos em tuplas) ou o avatar ja' criado (comodos em dicts)."""
    c0 = persona["cenas"][0] if persona.get("cenas") else ""
    lugar = c0.get("cena", "") if isinstance(c0, dict) else (c0[2] if c0 else "")
    return (f"Vertical 9:16 photo, smartphone UGC style, natural light, realistic skin texture. "
            f"{persona['descricao'].strip()} {lugar} Upper body and hands visible, looking at the "
            f"camera with a warm, natural expression, as if about to explain a family recipe. "
            f"No text, no captions, no logos, no watermark.")


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


def regra_cta(cta, avatar=None):
    """A regra do take do CTA (o mesmo texto no roteiro e no corretor da curadoria)."""
    if cta.get("tipo") == "palavra":
        regra = (f'The call to action invites viewers to comment '
                 f'"{cta.get("palavra", "").strip().lower()}," (lowercase, no accent, followed by a comma) to '
                 f'receive the full material. Write it exactly like that inside the line. Do not say where or how '
                 f'it is sent (no DM, direct, inbox).')
    else:
        regra = ("The call to action is a plain, calm line saying the complete material is at the link in the "
                 "profile. No hype.")
    if cta.get("livro"):
        # ⛔ o quadro final do CTA mostra o livro erguido: aqui NAO ha' volta a' pose (o texto nao contradiz o quadro)
        regra += (" In that last take her book lies on the table in front of her: its \"quadro\" names the book, and "
                  "its \"movimento\" is the whole mechanism, with no return to the starting pose: \"As she speaks, "
                  "she picks up the book from the table with both hands and raises it to chest height, cover "
                  "toward the camera, holding it by the edges.\" then \"She holds it steady until the end of the "
                  "shot.\"")
    return genero(regra, avatar)


# ⭐ (19/10, ordem do Eduardo) a fala e' no idioma POPULAR de quem assiste, nunca a traducao literal: "quase ninguem
#    sabe o que e' arroz demolhado". Exemplos do que ja' saiu errado, para o Claude calibrar o registro.
POPULAR = {
    "pt": ' In Brazilian Portuguese: "arroz deixado de molho", not "arroz demolhado"; "cominho", not "nigela"; '
          '"bater no liquidificador", "forma de pão", "colherada", "um tiquinho", the way a Brazilian grandmother talks.',
    "es": ' In Mexican Spanish: "licuadora", not "batidora"; "jugo", not "zumo"; "piña", "una cucharadita", "un vasito '
          'de agua", "comino negro", not "nigella"; the way a Mexican grandmother talks in her kitchen, with "mijita" '
          'and "fíjate" when it fits.',
    "de": ' In German: plain everyday words ("Mixer", "ein Glas Wasser", "ein Teelöffel", "Schwarzkümmel"), never '
          'Latin or clinical terms; the calm, simple way an old monk explains things in the monastery kitchen. German '
          'law forbids healing claims: never "heilt", "entgiftet", "gegen <Krankheit>" or "wirkt bei"; only tradition '
          'and well-being ("tut gut", "stärkt", "für das Wohlbefinden", "so haben es die Brüder gemacht").',
}


def regras_take(idioma, extras="", avatar=None):
    """As regras de "fala", "quadro" e "movimento" de um take: as mesmas no roteiro e no corretor da curadoria.
    `extras` = as licoes ativas (motor/instagram_licoes.py: regras_texto), acrescentadas no fim."""
    lingua, lim = IDIOMAS[idioma]["lingua"], FALA_MAX_PALAVRAS.get(idioma, 14)
    return genero(f"""- "fala": what the presenter says in {lingua}: what the ORIGINAL line says, sentence by sentence and in the
  same order, with the same facts, claims, hook and rhythm. Only the wording changes, never the content: do not add
  any idea, benefit, sentence or persona color that the original line does not have (no "tradition", "grandma",
  "family", "balance", "strengthen" unless the original says it), and do not soften, swap or drop a claim of the
  original. At most {lim} words, speakable in about {FALA_S:.0f} seconds at a calm pace. Never end a take on
  a word that asks for continuation (articles, prepositions, conjunctions). No dash characters of any kind inside the
  line. Numbers in words. Prefer common, easy-to-pronounce words: avoid words with a repeated syllable and word
  pairs where a vowel ending meets a vowel start (the voice merges them).
  Write it in the everyday spoken {lingua} of ordinary people, the popular register a common person uses at home
  and in the kitchen: never formal, technical, literary or rare words, even when they are the literal translation
  of the original.{POPULAR.get(idioma, "")}
  Keep every ingredient, quantity, temperature and time said in the original line: to fit the time, cut filler
  words, never a recipe item. Convert units to the ones used in the target country (400 Fahrenheit is "two
  hundred degrees" Celsius in Brazil, Mexico and Germany). Never promise something "free" unless the material
  below is free.
- "quadro": one short English sentence naming the items of this exact step and where they are at the START of
  the step, in front of her (ingredients, bowl, blender, pan, the finished food), concretely. Every item and tool
  she uses in the step is named here for what it really is in the source (a drinking glass used to smash potatoes
  is "a drinking glass", never "a masher"), and the SAME noun is used in "quadro_fim" and "movimento": nothing
  turns into another item, appears or disappears. Never add an item the source does not show (no phone, no
  screen). Only the items and
  her hands: never the camera, the framing, her face, hair or clothes (the shot itself is copied from the source).
- "quadro_fim": one short English sentence with the SAME items at the END of the step, after the action is done
  (e.g. "the salt is inside the blender jar and the small dish is empty in her right hand"). If the step has no
  physical action (she only talks or shows something), repeat the "quadro".
- "movimento": exactly two short English sentences, in positive phrasing (what she does, never what she does not
  do). The original line says what is being done in the source video: she does THAT action for real and
  completely, exactly as the source does it (if the source pours the salt into the blender, she pours it in;
  never a half gesture that only lifts the item and puts it back). When she cuts, copy the source cut: which hand
  holds the item and how, the knife direction (across the carrot into round slices, or along it into sticks) and
  that each stroke of the knife makes exactly one piece, the pieces piling up one by one (nothing appears, splits
  or multiplies on its own).
  1st sentence starts with "As she speaks," and describes the whole action from the "quadro" state to the
  "quadro_fim" state: name the hand (right hand, left hand or both hands), the contact point, the item with the
  SAME noun used in the "quadro", and what happens to it (it falls into, is poured into, is sprinkled over...).
  One continuous, slow action.
  2nd sentence starts with "By the last word," and states the "quadro_fim" result, with her looking at the
  camera.""", avatar) + (f"\n{extras.rstrip()}" if extras.strip() else "")


REGRAS_CONTEUDO = """Content rules (mandatory):
- Wellness and tradition language: "strengthen", "balance", "well-being". Never promise to cure, treat or heal
  a disease; never attack doctors or medicine; no invented numbers, testimonials or scarcity.
- Keep the original's own claims as the original says them (that is not a cure promise); add nothing of your own."""


def texto_quadros(quadros):
    """⭐⭐ (20/10) o Claude so' via a TRANSCRICAO e adivinhava os objetos (um celular no "me segue", um amassador no
    lugar do copo): agora ele le os quadros do video de origem (o inicio e o fim de cada take) antes de escrever.
    quadros = {n: (inicio.jpg, fim.jpg)}"""
    if not quadros: return ""
    linhas = "\n".join(f"- take {n}: start {a} ; end {b}" for n, (a, b) in sorted(quadros.items()))
    return f"""
Frames of the source video (open each one with the Read tool BEFORE writing; they are the truth about what is on
screen in each take: the items, the tools, the hands, the action from start to end):
{linhas}
"quadro", "quadro_fim" and "movimento" describe what these frames show, never what the speech suggests.
"""


def pedido_adaptacao(takes, idioma, avatar, cta, extras="", quadros=None):
    """O pedido ao Claude: a fala de cada take no idioma de destino, na boca do avatar, + movimento + CTA.

    cta = {"tipo": "bio" | "palavra", "palavra": "umeboshi", "livro": bool}; quadros = {n: (inicio, fim)}"""
    info = IDIOMAS[idioma]
    linhas = "\n".join(f'{t["n"]}. ({t["fim"] - t["ini"]:.1f} s) {t["texto"]}' for t in takes)
    return f"""You adapt a short vertical video (Instagram Reel) for a new presenter. Return ONLY JSON.

The presenter: {avatar.get("quem") or avatar.get("descricao", "")}
Target language: {info["lingua"]}.

Original takes (speech transcribed from the source video, any language):
{linhas}
{texto_quadros(quadros)}
Write, for EACH original take, in the same order:
{regras_take(idioma, extras, avatar)}
Mark each take with "cta": false, except the call to action.
If original takes are the call to action (comment a word, get a guide or recipes by DM, follow first), they stay
the call to action of this video, translated just as faithfully, with only two swaps: the word to comment becomes
the word below, and what is sent becomes the material below. Mark those takes "cta": true and do NOT add any take.
Only when no original take is a call to action, add ONE extra take at the end for it, with "cta": true and the
same fields. {regra_cta(cta, avatar)}

{REGRAS_CONTEUDO}

Also write "legenda_post": the Instagram post caption in {info["lingua"]} (2 to 4 short lines, one emoji at most per
line, ending with the same call to action).

JSON format:
{{"takes": [{{"n": 1, "fala": "...", "quadro": "...", "quadro_fim": "...", "movimento": "...", "cta": false}}, ...],
 "legenda_post": "..."}}"""


def ler_adaptacao(texto, n_origem):
    """A resposta do Claude -> {"takes": [{"n", "fala", "quadro", "movimento", "cta"}], "legenda_post"} ou None.
    ⭐ (20/10) o CTA da fonte vira o nosso CTA, traduzido: entao vem 1 take por take de origem (os do CTA marcados
    "cta") ou, sem CTA na fonte, 1 a mais no fim. Sem nenhum marcado, o ultimo e' o CTA.
    ⛔ Fora do formato (sem JSON, takes faltando, campo vazio) = None: quem chama tenta de novo."""
    m = re.search(r"\{.*\}", texto or "", flags=re.S)
    if not m: return None
    try:
        d = json.loads(m.group(0))
    except ValueError:
        return None
    takes = d.get("takes")
    if not isinstance(takes, list) or len(takes) < n_origem: return None
    takes = takes[:n_origem + 1]
    saida = []
    for i, t in enumerate(takes, 1):
        fala = t.get("fala") if isinstance(t, dict) else None
        mov = t.get("movimento") if isinstance(t, dict) else None
        if not isinstance(fala, str) or not fala.strip() or not isinstance(mov, str) or not mov.strip(): return None
        fala = re.sub(r"\s*[—–]\s*|\s+-\s+", ", ", fala.strip())      # ⛔ o Veo vocaliza o travessao
        quadro, quadro_fim = t.get("quadro"), t.get("quadro_fim")
        quadro = quadro.strip() if isinstance(quadro, str) else ""
        saida.append({"n": i, "fala": fala, "quadro": quadro,
                      "quadro_fim": quadro_fim.strip() if isinstance(quadro_fim, str) and quadro_fim.strip() else quadro,
                      "movimento": mov.strip(), "cta": t.get("cta") is True or i == n_origem + 1})
    if not any(t["cta"] for t in saida): saida[-1]["cta"] = True
    return {"takes": saida, "legenda_post": str(d.get("legenda_post") or "").strip()}


# ⭐ o tipo de acao do take (escopo das licoes de gesto): o verbo da 1a frase do "movimento"
ACOES = {
    "pegar": r"\b(pick|picks|picking|grab|grabs|take|takes)\b",
    "levantar": r"\b(lift|lifts|raise|raises|hold|holds|show|shows|turn|turns)\b",
    "apontar": r"\b(point|points|gesture|gestures|open|opens|bring|brings)\b",
    "tocar": r"\b(touch|touches|rest|rests|lay|lays|tap|taps)\b",
    "despejar": r"\b(pour|pours|sprinkle|sprinkles|scatter|scatters|spoon|spoons|slide|slides|dust|dusts)\b",
}


def tipo_acao(movimento):
    """O tipo de acao do take ("pegar", "levantar"...) ou "" (sem verbo conhecido)."""
    frase = re.split(r"(?<=[.!?])\s", (movimento or "").strip().lower())[0]
    achados = [(m.start(), a) for a, rx in ACOES.items() for m in [re.search(rx, frase)] if m]
    return min(achados)[1] if achados else ""


def voz(avatar, idioma):
    return (avatar.get("voz") or TOMIKO["voz"]).replace("{lingua}", IDIOMAS[idioma]["lingua"])


def prompt_video(avatar, idioma, movimento, fala, muda=False, extras=()):
    """O prompt de um take: camera travada, quem (so' invariantes), a fala atribuida com o idioma e a voz, o gesto,
    o silencio depois da fala e o audio. `extras` = frases das licoes ativas do tipo "prompt" (no maximo 3), antes
    do audio. ⛔ Com a ancora no quadro, a roupa e o cenario NAO sao descritos de novo: a
    prosa compete com a imagem e as vezes ganha. ⛔ "(no subtitles)" logo depois da fala: a legenda queimada e' o
    defeito mais relatado do Veo com dialogo, e a restricao rende mais colada nela."""
    partes = [CAMERA, avatar.get("prefixo") or TOMIKO["prefixo"]]
    if fala.strip():
        partes += [genero(f'{ENTRADA_DA_FALA} says in {IDIOMAS[idioma]["lingua"]}, in {voz(avatar, idioma)}: ', avatar)
                   + f'"{fala.strip()}" (no subtitles)', genero(movimento.strip(), avatar), OBJETOS_FIXOS,
                   genero(FALA_UMA_VEZ, avatar)]
        if muda: partes.append(MUDANCA_DURANTE_A_FALA)
    else:
        partes += [genero(movimento.strip(), avatar), genero("She stays silent.", avatar)]
    partes += [e.strip() for e in extras if e.strip()]
    partes += [genero("Audio: only her voice and quiet room tone, no music.", avatar), SEM_TEXTO_TELA]
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
    return genero(f"Recreate the shot of the FIRST reference image: the same camera angle, the same camera distance and "
            f"zoom, the same framing and crop, the person at the SAME size in the frame (a close-up of head, chest and "
            f"hands stays a close-up: never a full-body or wide shot), and the same kind of items in the same places of the frame, as they are "
            f"at the START of the step (nothing being poured yet). Each item and tool keeps the SAME orientation and "
            f"direction as in the FIRST reference (a carrot lying left to right stays left to right, the knife blade "
            f"crosses it at the same angle, a jar handle points the same side), and whatever is already cut or done "
            f"there stays done. Replace the person with the person of the SECOND reference image (same face, hair and "
            f"clothes): {avatar.get('descricao', '').strip()} Nothing of the first reference's person stays: not the "
            f"face, the hair, the headwear or the clothes. Keep the kind of place and setting of the FIRST reference "
            f"image (what is around and behind the items: a kitchen stays a kitchen, a garden bed stays a garden bed, a "
            f"chicken coop stays a chicken coop), restyled as part of {lugar.strip()} {quadro.strip()} Vertical 9:16 photo, smartphone UGC style. "
            f"No text, no captions, no logos, no watermark.", avatar)


def prompt_quadro_fim(avatar, lugar, quadro_fim):
    """O quadro FINAL de um take: o fim do mesmo passo no video de origem, com a mesma pessoa, lugar e luz do quadro
    de abertura. Refs: 1a = o quadro do video de origem no FIM do trecho, 2a = o quadro de abertura ja' gerado,
    3a = a foto do avatar. ⭐⭐ (19/10, ordem do Eduardo) com o mesmo quadro nas duas pontas o Veo nao completa a
    acao (o sal nao cai no liquidificador): o take vai do quadro de abertura a este, e a acao acontece de verdade."""
    return genero(f"Recreate the shot of the FIRST reference image, which is the END of the same step: the same camera "
                  f"angle, distance, framing and crop. Everything else stays exactly as in the SECOND reference image (the "
                  f"opening frame of this same shot): the same person, the same clothes, the same place and light, the same "
                  f"items in the same places, except what the action changed: {quadro_fim.strip()} The person is the "
                  f"person of the THIRD reference image (same face, hair and clothes): {avatar.get('descricao', '').strip()} "
                  f"Nothing of the first reference's person stays: not the face, the hair, the headwear or the clothes. "
                  f"It is part of {lugar.strip()} Vertical 9:16 photo, smartphone UGC style. "
                  f"No text, no captions, no logos, no watermark.", avatar)


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
    ped = pedido_adaptacao([{"n": 1, "ini": 0, "fim": 3, "texto": "x"}], "pt", {}, {"tipo": "bio"})
    caso("⭐ pedido: a fala e' a do original (nada acrescentado) e o CTA da fonte vira o nosso, sem take a mais",
         "sentence by sentence" in ped and "do NOT add any take" in ped and "Only the wording changes" in ped)
    d3 = [{"fala": f"f{i}", "quadro": "q", "movimento": "m", "cta": i >= 2} for i in (1, 2, 3)]
    l3 = ler_adaptacao(json.dumps({"takes": d3}), 3)
    caso("⭐ ler_adaptacao: CTA da fonte = os takes marcados, sem take a mais", [t["cta"] for t in l3["takes"]] == [False, True, True])
    l4 = ler_adaptacao(json.dumps({"takes": [{**x, "cta": False} for x in d3]}), 3)
    caso("ler_adaptacao: nenhum marcado, o ultimo e' o CTA", [t["cta"] for t in l4["takes"]] == [False, False, True])
    caso("todas as palavras entram", sum(len(x["texto"].split()) for x in tk) == len(frase))

    av = {"quem": TOMIKO["quem"], "prefixo": TOMIKO["prefixo"], "voz": TOMIKO["voz"]}
    ped = pedido_adaptacao(tk, "pt", av, {"tipo": "palavra", "palavra": "Umeboshi", "livro": True})
    caso("pedido: palavra minuscula com virgula", '"umeboshi,"' in ped)
    caso("pedido: livro no CTA, sem volta a' pose", "picks up the book from the table" in ped and "no return" in ped)
    caso("⭐ pedido: fala medida em tempo (pt = 14 palavras, ~5 s)", "At most 14 words, speakable in about 5 seconds" in ped)
    caso("⭐ pedido: fala no idioma popular, com os exemplos do pt-BR", "everyday spoken Brazilian Portuguese" in ped
         and '"arroz deixado de molho", not "arroz demolhado"' in ped
         and "everyday spoken German" in regras_take("de") and "demolhado" not in regras_take("de"))
    caso("⭐ pedido: ingrediente, quantidade, temperatura e tempo nunca saem da fala",
         "Keep every ingredient, quantity, temperature and time" in ped)
    caso("⭐ pedido: a acao COMPLETA como no video de origem, do quadro ao quadro_fim, com a mao e o mesmo substantivo",
         '"As she speaks,"' in ped and '"By the last word,"' in ped and "completely, exactly as the source" in ped
         and "never a half gesture" in ped and '"quadro_fim"' in ped and "SAME noun" in ped and "Never pouring" not in ped)
    lq = ler_adaptacao(json.dumps({"takes": [{"fala": "a", "quadro": "Q1", "quadro_fim": "Q2", "movimento": "m"},
                                             {"fala": "b", "quadro": "Q3", "movimento": "m"}]}), 1)
    caso("ler: quadro_fim lido; sem ele, vale o quadro (passo sem acao)",
         lq["takes"][0]["quadro_fim"] == "Q2" and lq["takes"][1]["quadro_fim"] == "Q3")
    pf = prompt_quadro_fim(WENDELIN, "garden", "the salt is inside the blender jar")
    caso("⭐ mundo: o universo da ficha (Beppe no sitio capixaba); sem ficha, o texto do comodo",
         "Espírito Santo" in mundo({"persona": "beppe"}) and mundo({}, "a kitchen") == "a kitchen"
         and mundo({"persona": "beppe", "mundo": "outro"}) == "outro")
    pq = prompt_quadro(BEPPE, mundo({"persona": "beppe"}), "Seed potatoes in a black bucket.")
    caso("⭐ o lugar do quadro vem do video-fonte, refeito no mundo do avatar (nao o comodo sorteado)",
         "Keep the kind of place and setting of the FIRST reference" in pq and "restyled as part of his family farm" in pq
         and "Change only the setting" not in pq)
    caso("⭐ quadro final: enquadramento do fim da origem, o resto do quadro de abertura, e o resultado da acao",
         "END of the same step" in pf and "SECOND reference image (the" in pf and "the salt is inside the blender jar" in pf
         and "THIRD reference" in pf and " she " not in pf)
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
    pe = prompt_video(av, "pt", "She lifts a jar.", "Fala.", extras=["Her hands stay with five fingers.", " "])
    caso("⭐ prompt_video: licoes do tipo prompt antes do audio",
         pe.index("Her hands stay with five fingers.") < pe.index("Audio:") and "  " not in pe)
    caso("⭐ regras_take: licoes no fim; sem licao, o texto de sempre", regras_take("pt", "- LICAO X").endswith("- LICAO X")
         and regras_take("pt", "  ") == regras_take("pt") and "LICAO X" in pedido_adaptacao(tk, "pt", av, {}, "- LICAO X"))
    caso("tipo_acao: o verbo da 1a frase", tipo_acao("As she speaks, both hands lift the loaf. After the line, she "
                                                     "sets it back.") == "levantar"
         and tipo_acao("She sprinkles a pinch of salt and presses the lid.") == "despejar" and tipo_acao("She smiles.") == "")
    caso("voz em ingles", "American English" in voz(av, "en"))
    caso("⭐ personas: Tomiko e Beppe (pt), Cuca (es) e Wendelin (de), cada uma com 8 comodos, CTA e genero",
         {k: (p["idioma"], p["cta"], p["genero"], len(p["cenas"])) for k, p in PERSONAS.items()}
         == {"tomiko": ("pt", "eu quero", "f", 8), "beppe": ("pt", "livro", "m", 8), "cuca": ("es", "libro", "f", 8),
             "wendelin": ("de", "Buch", "m", 8)}
         and all(len({c[0] for c in p["cenas"]}) == 8 for p in PERSONAS.values()))
    pw = prompt_video(WENDELIN, "de", "As she speaks, her right hand lifts the jar.", "Komm her, ich zeige es dir.")
    caso("⭐ genero: o monge vira 'he/his' no texto nosso, e a fala em alemao fica intacta",
         "he stays silent, looking at the camera" in pw and "As he speaks, his right hand" in pw and '"Komm her, ich zeige es dir."' in pw
         and "only his voice" in pw and "She " not in pw)
    caso("genero: as regras do take do monge no masculino; as da Tomiko como estavam",
         '"As he speaks,"' in regras_take("de", avatar=WENDELIN) and '"As she speaks,"' in regras_take("pt", avatar=TOMIKO)
         and regras_take("pt") == regras_take("pt", avatar=TOMIKO))
    pd = pedido_adaptacao(tk, "de", WENDELIN, {"tipo": "palavra", "palavra": "Buch"})
    pb = pedido_adaptacao(tk, "pt", BEPPE, {"tipo": "palavra", "palavra": "livro"})
    caso("⭐ Beppe: pt popular, no masculino ('the way a Brazilian old man talks') e o colono como apresentador",
         "everyday spoken Brazilian Portuguese" in pb and "Brazilian old man" in pb and "grandmother" not in pb
         and '"As he speaks,"' in pb and "Italian-Brazilian farmer" in pb and '"livro,"' in pb)
    caso("⭐ pedido em alemao: popular, sem promessa de cura e com o CTA na lingua", "everyday spoken German" in pd
         and '"heilt"' in pd and '"buch,"' in pd)
    caso("pedido em espanhol mexicano", "Mexican Spanish" in pedido_adaptacao(tk, "es", CUCA, {}) and '"licuadora"' in pedido_adaptacao(tk, "es", CUCA, {}))
    caso("retrato-ancora: a pessoa da ficha no primeiro comodo", CUCA["descricao"] in prompt_retrato(CUCA)
         and CUCA["cenas"][0][2] in prompt_retrato(CUCA) and "No text" in prompt_retrato(CUCA))
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
