# -*- coding: utf-8 -*-
r"""CATALOGO — os paises, os arquetipos e as personas LOCAIS de cada pais.

    python motor/catalogo.py --autoteste

⭐ A persona nao se traduz: se veste. "A avo dos tempos dificeis" e' a Depression-era Grandma nos
EUA, a Memé de l'Occupation na Franca, a Nachkriegs-Oma na Alemanha e a Abuela de la posguerra na
Espanha. Traduzir "Amish" para o frances e' chegar com persona estrangeira num mercado que tem as
suas (medido em 08/10: a avo dos anos 40 ja' tinha 9 videos com persona em frances).

O diagrama de Venn do Eduardo (08/10): cada arquetipo existe num subconjunto dos paises.
    comum a todos (d)        avo-escassez, avo-roca, monge, velho-campones, velho-mecanico, ...
    pares (c, e, ...)        amish (EUA+DE), menonita (EUA+ES), vaqueiro (EUA+ES), pastor-basco (FR+ES)
    exclusivas (a, b, f, g, h) barn-finds, compagnon-du-devoir, ddr-oma, pastor-trashumante, ...

As personas dos EUA moram em persona.py (PERSONAS); aqui ficam as de FR, DE e ES e o mapa
arquetipo -> persona de cada pais.
"""
import sys

# ⭐ o pais e' o mercado: idioma da busca, regiao, publico aceito (lingua do audio e pais do canal)
PAISES = {
    "en": {"nome": "Inglês (EUA)", "sigla": "EN", "bandeira": "🇺🇸", "idioma": "en", "regiao": "US",
           "lingua": "English (US)", "publico": "US audiences aged 45+",
           "linguas": {"", "en", "en-us", "en-gb", "en-ca", "en-au", "en-nz", "en-ie"},
           "paises": {"", "US", "CA", "GB", "AU", "NZ", "IE"}, "rpm": 5.0},
    "fr": {"nome": "Francês", "sigla": "FR", "bandeira": "🇫🇷", "idioma": "fr", "regiao": "FR",
           "lingua": "French (France)", "publico": "French audiences aged 45+",
           "linguas": {"", "fr", "fr-fr", "fr-ca", "fr-be", "fr-ch"},
           "paises": {"", "FR", "BE", "CH", "CA", "LU", "MC"}, "rpm": 3.0},
    "de": {"nome": "Alemão", "sigla": "DE", "bandeira": "🇩🇪", "idioma": "de", "regiao": "DE",
           "lingua": "German (Germany)", "publico": "German-speaking audiences aged 45+",
           "linguas": {"", "de", "de-de", "de-at", "de-ch"},
           "paises": {"", "DE", "AT", "CH", "LI", "LU"}, "rpm": 4.0},
    "es": {"nome": "Espanhol", "sigla": "ES", "bandeira": "🇪🇸", "idioma": "es", "regiao": "ES",
           "lingua": "Spanish (Spain and US Hispanics)", "publico": "Spanish-speaking audiences aged 45+ (Spain and US Hispanics)",
           "linguas": {"", "es", "es-es", "es-us", "es-mx", "es-419"},
           "paises": {"", "ES", "US", "MX"}, "rpm": 2.5},
}

ARQUETIPOS = {
    "avo-escassez": "A avó dos tempos difíceis",
    "avo-roca": "A avó da roça",
    "monge": "O monge",
    "velho-campones": "O velho camponês",
    "velho-mecanico": "O velho mecânico",
    "velho-eletricista": "O velho eletricista",
    "longevidade": "O centenário de Okinawa",
    "dormir": "Histórias para dormir",
    "amish": "Os Amish",
    "menonita": "Os menonitas",
    "hutterita": "Os huteritas",
    "vaqueiro": "O vaqueiro",
    "pastor-basco": "O pastor basco",
}

# as personas dos EUA (persona.PERSONAS) -> arquetipo; as que nao estao aqui sao exclusivas
ARQUETIPO_DOS_EUA = {
    "depression": "avo-escassez", "appalachian": "avo-roca", "monk": "monge", "old-farmer": "velho-campones",
    "old-mechanic": "velho-mecanico", "old-electrician": "velho-eletricista", "okinawan": "longevidade",
    "sleep-farm": "dormir", "amish": "amish", "mennonite": "menonita", "hutterite": "hutterita", "cowboy": "vaqueiro",
}

# ⛔ assinatura ESPECIFICA: e' ela que diz se um titulo ja' e' remake. "abuela" sozinha marcaria
# meio YouTube espanhol como remake; "abuela del pueblo" nao.
LOCAIS = [
    # ── Franca ──
    {"id": "meme-occupation", "idioma": "fr", "arquetipo": "avo-escassez", "nome": "Mémé de l'Occupation", "marca": "1940",
     "busca": "recettes temps de guerre", "assinatura": ["occupation", "tickets de rationnement", "temps de guerre"],
     "quem": "a French grandmother who lived the German Occupation (1940-44): rationing tickets, rutabagas, making do with nothing"},
    {"id": "meme-campagne", "idioma": "fr", "arquetipo": "avo-roca", "nome": "Mémé de la campagne", "marca": "MÉMÉ",
     "busca": "mémé recette campagne", "assinatura": ["mémé", "grand-mère de la campagne"],
     "quem": "an old French country grandmother (mémé) from a farm in the Auvergne: kitchen garden, preserves, old remedies"},
    {"id": "moine-trappiste", "idioma": "fr", "arquetipo": "monge", "nome": "Moine trappiste", "marca": "MOINE",
     "busca": "moine abbaye", "assinatura": ["moine", "moines", "trappiste", "abbaye"],
     "quem": "a Trappist monk from a French abbey: cheese, beer, bread, herb garden, silence and order"},
    {"id": "vieux-paysan", "idioma": "fr", "arquetipo": "velho-campones", "nome": "Vieux paysan", "marca": "VIEUX PAYSAN",
     "busca": "vieux paysan", "assinatura": ["vieux paysan", "paysan d'autrefois"],
     "quem": "an 85-year-old French peasant farmer: 70 harvests, weather lore, soil, animals, nothing wasted"},
    {"id": "vieux-mecano", "idioma": "fr", "arquetipo": "velho-mecanico", "nome": "Vieux mécano", "marca": "VIEUX MÉCANO",
     "busca": "vieux mécano", "assinatura": ["vieux mécano", "vieux garagiste"],
     "quem": "an old village garagiste (mécano) with 60 years of Peugeots and Renaults: what garages won't tell you"},
    {"id": "vieil-electricien", "idioma": "fr", "arquetipo": "velho-eletricista", "nome": "Vieil électricien", "marca": "VIEIL ÉLECTRICIEN",
     "busca": "vieil électricien", "assinatura": ["vieil électricien", "vieux électricien"],
     "quem": "a retired French electrician with 50 years of house calls: dangers in old French homes, cheap fixes"},
    {"id": "okinawa-fr", "idioma": "fr", "arquetipo": "longevidade", "nome": "Centenaire d'Okinawa", "marca": "OKINAWA",
     "busca": "okinawa centenaires", "assinatura": ["okinawa"],
     "quem": "an Okinawan 100-year-old: longevity habits, food, garden, ikigai — told for French viewers"},
    {"id": "dormir-fr", "idioma": "fr", "arquetipo": "dormir", "nome": "Histoires de la ferme pour dormir", "marca": "POUR DORMIR",
     "busca": "histoire pour dormir adulte", "assinatura": ["pour dormir", "s'endormir"],
     "quem": "a slow, warm old French farm storyteller for 1-3 hour sleep videos"},
    {"id": "compagnon-du-devoir", "idioma": "fr", "arquetipo": "compagnon-du-devoir", "nome": "Compagnon du Devoir", "marca": "COMPAGNON",
     "busca": "compagnon du devoir", "assinatura": ["compagnon du devoir", "compagnons du devoir"],
     "quem": "an old Compagnon du Devoir (French craftsmen guild): carpentry, stone, roofing, the right way to fix a house"},
    {"id": "vigneron", "idioma": "fr", "arquetipo": "vigneron", "nome": "Vieux vigneron", "marca": "VIGNERON",
     "busca": "vieux vigneron", "assinatura": ["vieux vigneron", "vigneron d'autrefois"],
     "quem": "an old Burgundy winegrower: vines, cellar, seasons, the patience of the old ways"},
    {"id": "berger-basque", "idioma": "fr", "arquetipo": "pastor-basco", "nome": "Berger basque", "marca": "BERGER BASQUE",
     "busca": "berger basque", "assinatura": ["berger basque", "bergers basques"],
     "quem": "an old Basque shepherd in the Pyrenees (French side): sheep, cheese, mountain weather, self-reliance"},
    # ── Alemanha ──
    {"id": "nachkriegs-oma", "idioma": "de", "arquetipo": "avo-escassez", "nome": "Nachkriegs-Oma", "marca": "NACHKRIEGSZEIT",
     "busca": "rezepte nachkriegszeit", "assinatura": ["nachkriegszeit", "kriegszeit", "notzeit", "kriegsrezept"],
     "quem": "a German grandmother who lived the post-war hunger years (Nachkriegszeit): cooking from nothing, never wasting"},
    {"id": "oma-bauernhof", "idioma": "de", "arquetipo": "avo-roca", "nome": "Oma vom Bauernhof", "marca": "OMA",
     "busca": "oma bauernhof rezept", "assinatura": ["oma vom", "bauernhof-oma", "omas bauernhof"],
     "quem": "an old German farm grandmother: Garten, Einkochen, Hausmittel, the old farm year"},
    {"id": "kloster-moench", "idioma": "de", "arquetipo": "monge", "nome": "Klostermönch", "marca": "KLOSTER",
     "busca": "kloster mönch", "assinatura": ["mönch", "mönche", "klosterwissen", "hildegard"],
     "quem": "a German Benedictine monk (Hildegard von Bingen tradition): Klostergarten, herbs, bread, discipline"},
    {"id": "alter-bauer", "idioma": "de", "arquetipo": "velho-campones", "nome": "Alter Bauer", "marca": "ALTER BAUER",
     "busca": "alter bauer", "assinatura": ["alter bauer", "altbauer"],
     "quem": "an 85-year-old Bavarian farmer: 70 harvests, weather rules (Bauernregeln), soil and animals"},
    {"id": "alter-schrauber", "idioma": "de", "arquetipo": "velho-mecanico", "nome": "Alter Schrauber", "marca": "ALTER SCHRAUBER",
     "busca": "alter kfz meister", "assinatura": ["alter schrauber", "alter mechaniker", "alter kfz"],
     "quem": "an old German Kfz-Meister with 60 years in the workshop: what the dealer won't tell you, keep your car forever"},
    {"id": "alter-elektriker", "idioma": "de", "arquetipo": "velho-eletricista", "nome": "Alter Elektriker", "marca": "ALTER ELEKTRIKER",
     "busca": "alter elektromeister", "assinatura": ["alter elektriker", "alter elektromeister"],
     "quem": "a retired German Elektromeister: dangers in old houses, cheap fixes, what Germans get wrong"},
    {"id": "okinawa-de", "idioma": "de", "arquetipo": "longevidade", "nome": "Hundertjährige aus Okinawa", "marca": "OKINAWA",
     "busca": "okinawa hundertjährige", "assinatura": ["okinawa"],
     "quem": "an Okinawan 100-year-old: longevity habits, food, garden, ikigai — told for German viewers"},
    {"id": "dormir-de", "idioma": "de", "arquetipo": "dormir", "nome": "Bauernhof-Geschichten zum Einschlafen", "marca": "ZUM EINSCHLAFEN",
     "busca": "geschichten zum einschlafen erwachsene", "assinatura": ["zum einschlafen", "einschlafgeschichte"],
     "quem": "a slow, warm old German farm storyteller for 1-3 hour sleep videos"},
    {"id": "amish-de", "idioma": "de", "arquetipo": "amish", "nome": "Die Amischen", "marca": "AMISCHEN",
     "busca": "amische", "assinatura": ["amisch", "amische", "amischen", "amish"],
     "quem": "an Amish man (the Amish speak a German dialect — Germans see them as distant cousins): plain living, old farm wisdom"},
    {"id": "hutterer", "idioma": "de", "arquetipo": "hutterita", "nome": "Hutterer", "marca": "HUTTERER",
     "busca": "hutterer", "assinatura": ["hutterer", "hutterern"],
     "quem": "a Hutterite colony elder (German-speaking communal farmers): big-batch cooking, food storage, colony farming"},
    {"id": "ddr-oma", "idioma": "de", "arquetipo": "ddr-oma", "nome": "DDR-Oma", "marca": "DDR",
     "busca": "ddr rezepte oma", "assinatura": ["ddr", "ostalgie"],
     "quem": "an East German grandmother who lived the GDR: shortage economy, improvising everything, DDR recipes"},
    {"id": "foerster", "idioma": "de", "arquetipo": "foerster", "nome": "Alter Förster", "marca": "FÖRSTER",
     "busca": "alter förster", "assinatura": ["förster", "alter förster"],
     "quem": "an old German forester: forest, firewood, wild herbs, animals, the forest calendar"},
    # ── Espanha (e hispanicos dos EUA) ──
    {"id": "abuela-posguerra", "idioma": "es", "arquetipo": "avo-escassez", "nome": "Abuela de la posguerra", "marca": "POSGUERRA",
     "busca": "recetas de la posguerra", "assinatura": ["posguerra", "años del hambre", "cartilla de racionamiento"],
     "quem": "a Spanish grandmother who lived the post-civil-war hunger years (posguerra): cooking from nothing, never wasting"},
    {"id": "abuela-pueblo", "idioma": "es", "arquetipo": "avo-roca", "nome": "Abuela del pueblo", "marca": "ABUELA",
     "busca": "abuela del pueblo receta", "assinatura": ["abuela del pueblo", "abuela de pueblo", "abuelas del pueblo"],
     "quem": "an old Spanish village grandmother (abuela del pueblo): huerto, conservas, remedios de siempre"},
    {"id": "monje-benedictino", "idioma": "es", "arquetipo": "monge", "nome": "Monje benedictino", "marca": "MONJE",
     "busca": "monjes monasterio", "assinatura": ["monje", "monjes", "monasterio"],
     "quem": "a Spanish Benedictine monk (Silos, Montserrat): bread, herbs, liqueurs, silence and order"},
    {"id": "abuelo-agricultor", "idioma": "es", "arquetipo": "velho-campones", "nome": "Abuelo agricultor", "marca": "ABUELO",
     "busca": "abuelo agricultor", "assinatura": ["abuelo agricultor", "viejo agricultor", "agricultor de 90"],
     "quem": "an 85-year-old Spanish farmer from rural Castile: 70 harvests, weather sayings, soil and animals"},
    {"id": "viejo-mecanico", "idioma": "es", "arquetipo": "velho-mecanico", "nome": "Viejo mecánico", "marca": "VIEJO MECÁNICO",
     "busca": "viejo mecánico", "assinatura": ["viejo mecánico", "mecánico viejo", "mecánico de 80"],
     "quem": "an old Spanish-speaking mechanic with 60 years in the taller: what dealers won't tell you, keep your car forever"},
    {"id": "viejo-electricista", "idioma": "es", "arquetipo": "velho-eletricista", "nome": "Viejo electricista", "marca": "VIEJO ELECTRICISTA",
     "busca": "viejo electricista", "assinatura": ["viejo electricista", "electricista de 80"],
     "quem": "a retired Spanish-speaking electrician with 50 years of house calls: dangers at home, cheap fixes"},
    {"id": "okinawa-es", "idioma": "es", "arquetipo": "longevidade", "nome": "Centenario de Okinawa", "marca": "OKINAWA",
     "busca": "okinawa centenarios", "assinatura": ["okinawa"],
     "quem": "an Okinawan 100-year-old: longevity habits, food, garden, ikigai — told for Spanish-speaking viewers"},
    {"id": "dormir-es", "idioma": "es", "arquetipo": "dormir", "nome": "Historias del campo para dormir", "marca": "PARA DORMIR",
     "busca": "historias para dormir adultos", "assinatura": ["para dormir", "dormir profundamente"],
     "quem": "a slow, warm old Spanish farm storyteller for 1-3 hour sleep videos"},
    {"id": "menonitas", "idioma": "es", "arquetipo": "menonita", "nome": "Menonitas", "marca": "MENONITA",
     "busca": "menonitas", "assinatura": ["menonita", "menonitas"],
     "quem": "a Mennonite farmer from the colonies in Mexico (Chihuahua) or Bolivia: cheese, farming, plain living"},
    {"id": "vaquero", "idioma": "es", "arquetipo": "vaqueiro", "nome": "Viejo vaquero", "marca": "VAQUERO",
     "busca": "viejo vaquero rancho", "assinatura": ["vaquero", "vaqueros"],
     "quem": "an old ranch vaquero (Mexico/Texas): horses, cattle, self-reliance, fixing anything"},
    {"id": "pastor-vasco", "idioma": "es", "arquetipo": "pastor-basco", "nome": "Pastor vasco", "marca": "PASTOR VASCO",
     "busca": "pastor vasco", "assinatura": ["pastor vasco", "pastores vascos"],
     "quem": "an old Basque shepherd in the Pyrenees (Spanish side): sheep, Idiazabal cheese, mountain weather"},
    {"id": "pastor-trashumante", "idioma": "es", "arquetipo": "pastor-trashumante", "nome": "Pastor trashumante", "marca": "TRASHUMANCIA",
     "busca": "pastor trashumancia", "assinatura": ["trashumancia", "trashumante"],
     "quem": "an old Spanish transhumant shepherd walking the cañadas: sheep, seasons, sleeping under the stars"},
    {"id": "huertano", "idioma": "es", "arquetipo": "huertano", "nome": "Huertano", "marca": "HUERTANO",
     "busca": "huertano huerta", "assinatura": ["huertano", "huertana"],
     "quem": "an old Valencian/Murcian huertano: irrigated huerta, vegetables all year, old water rules"},
]

# ⭐ as sementes de partida de cada mercado (virais da era antes da IA, na lingua nativa)
SEMENTES = {
    "en": ["how to pick a watermelon", "garden pests naturally", "bread from scratch", "save money on electricity",
           "raised bed garden", "cast iron skillet", "root cellar", "car maintenance tips", "homemade bread for beginners",
           "how to fix an outlet", "survival skills", "canning vegetables"],
    "fr": ["recette de grand-mère", "potager facile", "pain maison", "astuces de grand-mère", "économiser électricité",
           "conserves maison", "entretien voiture", "tailler les rosiers", "cuisine à l'ancienne", "bricolage maison"],
    "de": ["omas rezepte", "gemüsegarten anlegen", "brot backen", "hausmittel", "strom sparen", "einkochen",
           "auto pflege tipps", "kräutergarten", "rezepte wie früher", "heimwerker tipps"],
    "es": ["recetas de la abuela", "huerto en casa", "pan casero", "remedios caseros", "ahorrar luz",
           "conservas caseras", "mantenimiento del coche", "trucos de cocina", "comida de antes", "bricolaje en casa"],
}


def regiao_do_arquetipo(paises):
    """O pedaco do diagrama de Venn em palavras: 'comum aos 4', 'EN ∩ DE', 'só FR'."""
    ordem = [k for k in PAISES if k in paises]
    if len(ordem) == len(PAISES): return "comum aos 4"
    if len(ordem) == 1: return f"só {PAISES[ordem[0]]['sigla']}"
    return " ∩ ".join(PAISES[k]["sigla"] for k in ordem)


def _autoteste():
    ok = True
    def caso(nome, cond):
        nonlocal ok; print(("  OK  " if cond else "  ERRO"), nome); ok &= bool(cond)
    ids = [p["id"] for p in LOCAIS]
    caso("ids unicos", len(ids) == len(set(ids)))
    caso("todo local tem pais conhecido", all(p["idioma"] in PAISES for p in LOCAIS))
    caso("todo local tem assinatura e busca", all(p["assinatura"] and p["busca"] for p in LOCAIS))
    por_arq = {}
    for p in LOCAIS: por_arq.setdefault(p["arquetipo"], set()).add(p["idioma"])
    for us, arq in ARQUETIPO_DOS_EUA.items(): por_arq.setdefault(arq, set()).add("en")
    caso("⭐ a avo dos tempos dificeis existe nos 4", por_arq["avo-escassez"] == {"en", "fr", "de", "es"})
    caso("⭐ amish e' EUA ∩ DE (raiz alema)", por_arq["amish"] == {"en", "de"})
    caso("⭐ pastor basco e' FR ∩ ES", por_arq["pastor-basco"] == {"fr", "es"})
    caso("regiao em palavras", regiao_do_arquetipo({"en", "fr", "de", "es"}) == "comum aos 4"
         and regiao_do_arquetipo({"fr", "es"}) == "FR ∩ ES" and regiao_do_arquetipo({"de"}) == "só DE")
    caso("sementes nos 4 mercados", set(SEMENTES) == set(PAISES))
    caso("⛔ nenhuma assinatura generica demais", not any(a in ("abuela", "oma", "pastor", "agricultor", "bauer")
                                                        for p in LOCAIS for a in p["assinatura"]))
    print("\nautoteste:", "PASSOU" if ok else "FALHOU")
    return ok


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"): sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if "--autoteste" in sys.argv: sys.exit(0 if _autoteste() else 1)
