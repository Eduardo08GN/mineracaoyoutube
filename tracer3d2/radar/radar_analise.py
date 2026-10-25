"""Radar v2 - analise limpa (24/10/2026). Le videos.csv do radar_grafo.py e corrige dois vieses medidos:
1) videos fora do tema (MrBeast em "nuclear bunker", clipe musical em "medieval armor", gameplay em "D-Day"):
   o titulo precisa conter um termo central do tema; canais de entretenimento ficam fora;
2) a busca "em alemao" devolve videos em ingles: oferta DE = so videos realmente em alemao (lingua 'de' ou titulo alemao),
   e, com --de-extra N, uma 2a busca alema por relevancia para os N melhores temas (100 unidades cada).
Exclui os micronichos ja feitos (1 video por micronicho; so repete se viralizar).
  python radar_analise.py [--de-extra 40]"""
import csv, math, os, re, statistics, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "motor"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)
from radar_grafo import G, DESDE, alemao

FEITOS = {"Paris-Geschütz", "Dicke Bertha", "V3", "Schwerer Gustav", "Artillerie bei Nacht"}   # micronichos encerrados
VIZINHOS_FEITOS = set()   # temas do grafo que caem num micronicho ja feito (nenhum por enquanto: o grafo v2 nao tem canhoes)
ENTRETENIMENTO = re.compile(r"mrbeast|ben azelart|chappell|vevo|call of duty|lego|minecraft|airsoft|champs network|brick science|"
                            r"tidal takedown|terragreen|binge society|movieclips|fortnite|roblox|gta", re.I)
GENERICO = set("how what why the a an of in on and to is are was were it its explained explanation history war ww1 ww2 wwii "
               "works work simulation inside battle best biggest largest most physics effective modern germany german nazi "
               "wie warum was der die das des den dem und ein eine erklärt funktioniert simulation schlacht krieg weltkrieg "
               "größte geschichte von im mit zum zur bei um".split())


def termos(q):
    return [w for w in re.findall(r"[a-zäöüß0-9-]+", q.lower()) if w not in GENERICO and len(w) > 2]


def _sem_acento(x):
    import unicodedata
    x = x.lower().replace("ß", "ss")
    return "".join(c for c in unicodedata.normalize("NFKD", x) if not unicodedata.combining(c))


def relevante(titulo, ts):
    t = _sem_acento(titulo)   # "Königgrätz" no titulo tem que casar com a busca "koniggratz" (24/10/2026)
    return any(_sem_acento(w) in t for w in ts)


def main():
    linhas = list(csv.DictReader(open(os.path.join(AQUI, "videos.csv"), encoding="utf-8-sig")))
    extra = int(sys.argv[sys.argv.index("--de-extra") + 1]) if "--de-extra" in sys.argv else 0
    res = []
    for dom, tema, en, de, fit in G:
        if tema in VIZINHOS_FEITOS: continue
        te, td = termos(en), termos(de) + termos(en)
        L = [l for l in linhas if l["tema"] == tema and not ENTRETENIMENTO.search(l["canal"] + " " + l["titulo"])]
        E = sorted([int(l["views"]) for l in L if l["busca"] == "en" and l["lingua"] in ("en", "en?") and not alemao(l["titulo"])
                    and relevante(l["titulo"], te)], reverse=True)
        D = sorted({(l["url"], int(l["views"])) for l in L if (l["lingua"] == "de" or alemao(l["titulo"])) and relevante(l["titulo"], td)},
                   key=lambda x: -x[1])
        D = [v for _, v in D]
        res.append({"dominio": dom, "tema": tema, "en": en, "de": de, "fit": fit, "E": E, "D": D, "te": te, "td": td})
    if extra:   # 2a busca alema por relevancia nos melhores (oferta DE real)
        from banco import Banco
        from youtube import YouTube
        import config
        yt = YouTube(Banco(), chaves=config.chaves())
        res.sort(key=lambda r: -pontua(r)["score"])
        for r in res[:extra]:
            ids = yt.buscar(r["de"], depois=DESDE, ordem="relevance", maximo=50, idioma="de", regiao="DE")
            vs = yt.videos(ids)
            novos = sorted([v["views"] for v in vs if v["duracao"] >= 240 and ((v["lingua"] or "")[:2] == "de" or alemao(v["titulo"]))
                            and relevante(v["titulo"], r["td"]) and not ENTRETENIMENTO.search(v["titulo"])], reverse=True)
            r["D"] = sorted(set(r["D"]) | set(novos), reverse=True)
        print("cota livre:", yt.cota()["livres"])
    temas = [pontua(r) for r in res]
    temas.sort(key=lambda t: -t["score"])
    with open(os.path.join(AQUI, "temas_limpo.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(temas[0])); w.writeheader(); w.writerows(temas)
    print(f"{'#':>3} {'dom':9} {'tema':24} fit {'EN med10':>10} {'EN n':>4} {'EN>1M':>5} {'DE med10':>9} {'DE max':>10} {'DE n':>4} {'buraco':>7} score")
    for i, t in enumerate(temas[:45], 1):
        print(f"{i:>3} {t['dominio']:9} {t['tema'][:24]:24} {t['fit']:>3} {t['en_mediana10']:>10,} {t['en_n']:>4} {t['en_1mi']:>5} {t['de_mediana10']:>9,} {t['de_max']:>10,} {t['de_n']:>4} {t['buraco']:>7} {t['score']}")


def pontua(r):
    E, D = r["E"], r["D"]
    em = statistics.median(E[:10]) if len(E) >= 3 else 0          # poucos videos relevantes = demanda nao comprovada
    dm = statistics.median(D[:10]) if D else 0
    gap = em / max(dm, 5000)
    score = math.log10(em + 1) * math.log10(gap + 1) * (1 + 0.5 * r["fit"])
    return {"dominio": r["dominio"], "tema": r["tema"], "fit": r["fit"], "en_mediana10": int(em), "en_n": len(E),
            "en_1mi": sum(1 for x in E if x >= 1_000_000), "de_mediana10": int(dm), "de_max": D[0] if D else 0, "de_n": len(D),
            "buraco": round(gap, 1), "score": round(score, 2)}


if __name__ == "__main__":
    main()
