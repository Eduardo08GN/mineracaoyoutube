"""Radar v2 (24/10/2026): grafo amplo de temas de historia militar e tecnica (fora do micronicho de canhoes), mesma busca
em ingles (US) e alemao (DE), ultimos 36 meses. Mede demanda EN x oferta DE, outliers e encaixe no formato Tracer3D.
Saida em radar/ (videos.csv, temas.csv, RANKING.md).
  python radar_grafo.py [--max N]   (cada tema custa ~200 unidades de cota; 3 chaves = 30 000/dia)"""
import csv, json, math, os, re, statistics, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "motor"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from banco import Banco
from youtube import YouTube
import config

SAIDA = os.path.dirname(os.path.abspath(__file__))
DESDE = "2023-10-24"
# (dominio, tema, busca EN, busca DE, encaixe Tracer3D 0-2: fisica/engenharia/simulacao/mapa)
G = [
    # navios e mar
    ("mar", "Bismarck", "battleship bismarck", "Schlachtschiff Bismarck", 2),
    ("mar", "Yamato", "battleship yamato", "Schlachtschiff Yamato", 2),
    ("mar", "Tirpitz", "tirpitz battleship tallboy", "Tirpitz Schlachtschiff", 2),
    ("mar", "Graf Spee", "admiral graf spee river plate", "Admiral Graf Spee", 1),
    ("mar", "Wilhelm Gustloff", "wilhelm gustloff sinking", "Wilhelm Gustloff Untergang", 1),
    ("mar", "U-Boot-Krieg", "u-boat war atlantic", "U-Boot Krieg Atlantik", 2),
    ("mar", "Midway", "battle of midway", "Schlacht um Midway", 1),
    ("mar", "Pearl Harbor", "pearl harbor attack explained", "Angriff auf Pearl Harbor", 1),
    ("mar", "Flugzeugträger", "aircraft carrier how it works", "Flugzeugträger wie funktioniert", 2),
    ("mar", "Kursk U-Boot 2000", "kursk submarine disaster", "Kursk U-Boot Unglück", 2),
    ("mar", "Titanic Physik", "titanic sinking simulation", "Titanic Untergang Simulation", 2),
    ("mar", "Torpedo", "how torpedoes work", "wie funktioniert ein Torpedo", 2),
    ("mar", "Dreadnought", "hms dreadnought battleship", "Dreadnought Schlachtschiff", 1),
    # luft
    ("luft", "Me 262", "messerschmitt me 262 jet", "Messerschmitt Me 262", 2),
    ("luft", "Me 163 Komet", "me 163 komet rocket plane", "Me 163 Komet Raketenflugzeug", 2),
    ("luft", "SR-71", "sr-71 blackbird", "SR-71 Blackbird", 2),
    ("luft", "Dambusters Rollbombe", "dambusters bouncing bomb", "Rollbombe Möhnetalsperre", 2),
    ("luft", "Hindenburg", "hindenburg disaster", "Hindenburg Katastrophe Lakehurst", 2),
    ("luft", "Roter Baron", "red baron", "Roter Baron Richthofen", 1),
    ("luft", "Stuka", "stuka dive bomber", "Stuka Sturzkampfbomber", 2),
    ("luft", "B-29 Enola Gay", "enola gay hiroshima mission", "Enola Gay Hiroshima", 2),
    ("luft", "Luftbrücke Berlin", "berlin airlift", "Berliner Luftbrücke", 2),
    ("luft", "Bombenkrieg Dresden", "bombing of dresden", "Luftangriff Dresden 1945", 1),
    ("luft", "Feuersturm Hamburg", "hamburg firestorm 1943", "Feuersturm Hamburg 1943", 2),
    ("luft", "Concorde", "concorde supersonic", "Concorde Überschall", 2),
    ("luft", "MiG-25", "mig-25 foxbat", "MiG-25", 2),
    ("luft", "Battle of Britain", "battle of britain", "Luftschlacht um England", 1),
    # land e blindados
    ("land", "Tiger-Panzer", "tiger tank", "Tiger Panzer", 2),
    ("land", "Panzer Maus", "panzer viii maus", "Panzer Maus", 2),
    ("land", "Kursk Panzerschlacht", "battle of kursk", "Schlacht bei Kursk", 1),
    ("land", "Stalingrad", "battle of stalingrad", "Schlacht von Stalingrad", 1),
    ("land", "D-Day", "d-day normandy landings", "D-Day Landung Normandie", 1),
    ("land", "Atlantikwall", "atlantic wall", "Atlantikwall", 2),
    ("land", "Maginot-Linie", "maginot line", "Maginot-Linie", 2),
    ("land", "Westwall", "siegfried line", "Westwall", 2),
    ("land", "Eben-Emael", "fort eben-emael glider assault", "Eben-Emael Fallschirmjäger", 2),
    ("land", "Ardennenoffensive", "battle of the bulge", "Ardennenoffensive", 1),
    ("land", "Verdun", "battle of verdun", "Schlacht um Verdun", 1),
    ("land", "Somme", "battle of the somme", "Schlacht an der Somme", 1),
    ("land", "Minen Messines", "messines mines explosion 1917", "Minensprengung Messines 1917", 2),
    ("land", "Gaskrieg", "chemical weapons ww1 gas attack", "Giftgas Erster Weltkrieg", 1),
    ("land", "Grabenkrieg", "trench warfare explained", "Grabenkrieg erklärt", 1),
    ("land", "Panzer Erster Weltkrieg", "first tanks ww1", "erste Panzer Erster Weltkrieg", 2),
    ("land", "Kalaschnikow", "ak-47 how it works", "AK-47 Kalaschnikow wie funktioniert", 2),
    ("land", "MG 42", "mg 42 machine gun", "MG 42", 2),
    # raketas e nuclear
    ("nuklear", "V2-Rakete", "v2 rocket", "V2 Rakete", 2),
    ("nuklear", "Peenemünde", "peenemunde", "Peenemünde", 2),
    ("nuklear", "Tsar Bomba", "tsar bomba", "Zar-Bombe", 2),
    ("nuklear", "Hiroshima", "hiroshima atomic bomb explained", "Hiroshima Atombombe", 2),
    ("nuklear", "Manhattan-Projekt", "manhattan project", "Manhattan-Projekt", 2),
    ("nuklear", "Deutsche Atombombe", "nazi atomic bomb program", "deutsche Atombombe Uranprojekt", 2),
    ("nuklear", "Atom-U-Boot", "nuclear submarine how it works", "Atom U-Boot wie funktioniert", 2),
    ("nuklear", "Interkontinentalrakete", "icbm how it works", "Interkontinentalrakete", 2),
    ("nuklear", "Atombunker", "nuclear bunker", "Atombunker", 2),
    ("nuklear", "Atomtest Bikini", "operation crossroads bikini", "Atomtest Bikini Atoll", 2),
    # explosoes e desastres de guerra
    ("explosao", "Helgoland Big Bang", "heligoland big bang explosion", "Helgoland Sprengung 1947", 2),
    ("explosao", "Halifax 1917", "halifax explosion 1917", "Explosion Halifax 1917", 2),
    ("explosao", "Beirut 2020", "beirut explosion analysis", "Explosion Beirut", 2),
    ("explosao", "Oppau 1921", "oppau explosion 1921", "Explosion Oppau 1921", 2),
    ("explosao", "Größte Explosionen", "biggest explosions in history", "größte Explosionen der Geschichte", 2),
    ("explosao", "Blindgänger", "unexploded bombs ww2 germany", "Blindgänger Weltkriegsbombe", 2),
    # fortificacoes e bunkers
    ("bunker", "Führerbunker", "fuhrerbunker", "Führerbunker", 2),
    ("bunker", "Wolfsschanze", "wolf's lair", "Wolfsschanze", 2),
    ("bunker", "Regierungsbunker", "government bunker cold war germany", "Regierungsbunker Ahrweiler", 2),
    ("bunker", "Berliner Mauer", "berlin wall how it worked", "Berliner Mauer Grenzanlagen", 2),
    ("bunker", "Innerdeutsche Grenze", "inner german border", "innerdeutsche Grenze Todesstreifen", 2),
    ("bunker", "Projekt Riese", "project riese", "Projekt Riese", 2),
    ("bunker", "Flaktürme", "flak towers", "Flaktürme Wien Berlin", 2),
    # antigos e medievais
    ("antigo", "Varusschlacht", "battle of teutoburg forest", "Varusschlacht", 1),
    ("antigo", "Trebuchet", "trebuchet physics", "Trebuchet Physik", 2),
    ("antigo", "Griechisches Feuer", "greek fire", "Griechisches Feuer", 1),
    ("antigo", "Römische Legion", "roman legion explained", "römische Legion", 1),
    ("antigo", "Konstantinopel 1453", "fall of constantinople 1453", "Fall Konstantinopels 1453", 1),
    ("antigo", "Wikinger Langschiff", "viking longship", "Wikinger Langschiff", 2),
    ("antigo", "Mongolen", "mongol empire military", "Mongolen Kriegsführung", 1),
    ("antigo", "Langbogen Agincourt", "longbow agincourt", "Langbogen Azincourt", 2),
    ("antigo", "Ritterrüstung", "medieval armor how effective", "Ritterrüstung wie effektiv", 2),
    ("antigo", "Hannibal Alpen", "hannibal crossing the alps", "Hannibal Alpenüberquerung", 1),
    ("antigo", "Thermopylen", "battle of thermopylae", "Schlacht bei den Thermopylen", 1),
    ("antigo", "Burgbelagerung", "medieval siege warfare", "Belagerung Burg Mittelalter", 2),
    # guerra fria e espionagem
    ("fria", "Kubakrise", "cuban missile crisis", "Kubakrise", 1),
    ("fria", "U-2 Abschuss", "u-2 incident gary powers", "U-2 Zwischenfall", 2),
    ("fria", "Enigma", "enigma machine how it works", "Enigma Maschine wie funktioniert", 2),
    ("fria", "Stasi", "stasi surveillance", "Stasi Überwachung", 1),
    ("fria", "Fulda Gap", "fulda gap", "Fulda Gap Kalter Krieg", 2),
    ("fria", "Atomkrieg Deutschland", "nuclear war germany simulation", "Atomkrieg Deutschland Simulation", 2),
    ("fria", "Raumfahrt Wettlauf", "space race explained", "Wettlauf ins All", 2),
    ("fria", "Spionage-U-Boot", "submarine espionage cold war", "U-Boot Spionage Kalter Krieg", 2),
    # logistica e engenharia de guerra
    ("logistica", "Eisstraße Leningrad", "road of life leningrad", "Eisstraße Ladogasee", 2),
    ("logistica", "Red Ball Express", "red ball express", "Red Ball Express Nachschub", 2),
    ("logistica", "Mulberry Häfen", "mulberry harbours", "Mulberry Hafen", 2),
    ("logistica", "Remagen Brücke", "bridge at remagen", "Brücke von Remagen", 2),
    ("logistica", "Panzerfahrt Ardennen 1940", "sichelschnitt 1940 ardennes", "Sichelschnitt Ardennen 1940", 2),
    ("logistica", "Treibstoff Wehrmacht", "germany oil shortage ww2", "Treibstoffmangel Wehrmacht", 2),
    ("logistica", "Pferde Wehrmacht", "horses in ww2 german army", "Pferde Wehrmacht", 1),
    # "what if" e ciencia de guerra
    ("ciencia", "Schallmauer", "sound barrier explained", "Schallmauer durchbrechen", 2),
    ("ciencia", "Radar", "how radar won the war", "Radar Zweiter Weltkrieg", 2),
    ("ciencia", "Tarnkappe Stealth", "how stealth works", "Tarnkappenbomber wie funktioniert", 2),
    ("ciencia", "Kugel Physik", "bullet physics slow motion", "Geschoss Physik", 2),
    ("ciencia", "Panzerung Physik", "tank armor how it works", "Panzerung wie funktioniert", 2),
    ("ciencia", "Fallschirm", "parachute how it works", "Fallschirmjäger Kreta", 1),
    ("ciencia", "Was wäre wenn Atomkrieg", "what if nuclear war", "was wäre wenn Atomkrieg", 2),
    ("ciencia", "Asteroideneinschlag", "asteroid impact simulation", "Asteroideneinschlag Simulation", 2),
    ("ciencia", "Vulkanausbruch", "supervolcano eruption simulation", "Supervulkan Ausbruch Simulation", 2),
    ("ciencia", "Tsunami", "tsunami simulation", "Tsunami Simulation", 2),
]


def alemao(t):
    # so palavras alemas contam: trema sozinho classificava "Battle of Königgrätz" (ingles, 2,1 mi) como oferta alema (24/10/2026)
    return bool(re.search(r"\b(der|die|das|und|wie|warum|ist|mit|von|zum|zur|im|nicht|eine?|den|dem|des|was|wäre|über|schlacht|krieg|gegen|als|auf|für|bei)\b", t.lower()))


def main():
    mx = int(sys.argv[sys.argv.index("--max") + 1]) if "--max" in sys.argv else len(G)
    yt = YouTube(Banco(), chaves=config.chaves()); print("cota livre:", yt.cota()["livres"], flush=True)
    achados = {}
    for i, (dom, tema, en, de, fit) in enumerate(G[:mx]):
        for lang, reg, q in (("en", "US", en), ("de", "DE", de)):
            try:
                for vid in yt.buscar(q, depois=DESDE, ordem="viewCount", maximo=50, idioma=lang, regiao=reg):
                    achados.setdefault(vid, set()).add((tema, lang))
            except Exception as e:
                print("ERRO busca", tema, lang, str(e)[:120], flush=True)
        if i % 10 == 9: print(f"{i + 1}/{mx} temas · cota livre {yt.cota()['livres']}", flush=True)
    vids = {v["id"]: v for v in yt.videos(list(achados))}
    canais = {c["id"]: c for c in yt.canais([v["canal_id"] for v in vids.values()])}
    linhas = []
    for vid, ts in achados.items():
        v = vids.get(vid)
        if not v or v["duracao"] < 240: continue
        c = canais.get(v["canal_id"], {}); lg = (v["lingua"] or "")[:2]
        lingua = lg or ("de" if alemao(v["titulo"]) else "en?")
        for tema, busca in ts:
            linhas.append({"tema": tema, "busca": busca, "lingua": lingua, "titulo": v["titulo"], "views": v["views"],
                           "minutos": round(v["duracao"] / 60, 1), "publicado": v["publicado"], "canal": c.get("nome", v["canal"]),
                           "inscritos": c.get("inscritos", 0), "outlier": round(v["views"] / max(1000, c.get("inscritos", 0)), 1),
                           "url": f"https://youtu.be/{vid}"})
    with open(os.path.join(SAIDA, "videos.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0])); w.writeheader(); w.writerows(linhas)
    temas = []
    for dom, tema, en, de, fit in G[:mx]:
        E = sorted([l["views"] for l in linhas if l["tema"] == tema and l["busca"] == "en" and l["lingua"] in ("en", "en?")], reverse=True)
        D = sorted([l["views"] for l in linhas if l["tema"] == tema and l["busca"] == "de" and l["lingua"] == "de"], reverse=True)
        out = max([l["outlier"] for l in linhas if l["tema"] == tema and l["busca"] == "en" and l["views"] > 200000] or [0])
        em = statistics.median(E[:10]) if E else 0; dm = statistics.median(D[:10]) if D else 0
        gap = em / max(dm, 5000)
        score = math.log10(em + 1) * math.log10(gap + 1) * (1 + 0.5 * fit)
        temas.append({"dominio": dom, "tema": tema, "fit": fit, "en_mediana10": int(em), "en_max": E[0] if E else 0,
                      "en_1mi": sum(1 for x in E if x >= 1_000_000), "de_mediana10": int(dm), "de_max": D[0] if D else 0,
                      "de_100k": sum(1 for x in D if x >= 100_000), "buraco": round(gap, 1), "outlier_max": out, "score": round(score, 2)})
    temas.sort(key=lambda t: -t["score"])
    with open(os.path.join(SAIDA, "temas.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(temas[0])); w.writeheader(); w.writerows(temas)
    print(f"\n{'#':>3} {'dominio':9} {'tema':26} fit {'EN med10':>10} {'EN max':>11} {'DE med10':>9} {'DE max':>10} {'buraco':>7} {'out':>5} score")
    for i, t in enumerate(temas[:40], 1):
        print(f"{i:>3} {t['dominio']:9} {t['tema'][:26]:26} {t['fit']:>3} {t['en_mediana10']:>10,} {t['en_max']:>11,} {t['de_mediana10']:>9,} {t['de_max']:>10,} {t['buraco']:>7} {t['outlier_max']:>5} {t['score']}")
    print("cota livre depois:", yt.cota()["livres"])


if __name__ == "__main__":
    main()
