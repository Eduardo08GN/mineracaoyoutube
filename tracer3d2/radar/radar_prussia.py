"""Radar do recorte do Kriegsmomente (brief de 24/10/2026): guerras prussianas, 65% Franco-Prussiana 1870-71, 35% Austro-
Prussiana 1866. Mesma metodologia limpa do radar_analise (relevancia no titulo, sem entretenimento, oferta DE so em alemao),
janela de 5 anos (nicho historico tem cauda longa). ~200 unidades por tema.
  python radar_prussia.py"""
import csv, math, os, statistics, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "motor"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
from banco import Banco
from youtube import YouTube
import config
from radar_grafo import alemao
from radar_analise import termos, relevante, ENTRETENIMENTO

DESDE = "2021-10-24"
# (guerra, tema, EN, DE, encaixe Tracer3D 0-2)
T = [
    ("1870", "Sedan / Napoleon III", "battle of sedan 1870", "Schlacht bei Sedan 1870", 2),
    ("1870", "Gravelotte–St. Privat", "battle of gravelotte", "Schlacht bei Gravelotte", 2),
    ("1870", "Mars-la-Tour Todesritt", "mars-la-tour death ride", "Todesritt von Mars-la-Tour", 2),
    ("1870", "Belagerung von Paris", "siege of paris 1870", "Belagerung von Paris 1870", 2),
    ("1870", "Ballonpost Paris", "balloons siege of paris 1870", "Ballonpost Paris 1870", 2),
    ("1870", "Mitrailleuse", "mitrailleuse", "Mitrailleuse", 2),
    ("1870", "Chassepot vs Dreyse", "chassepot vs dreyse", "Chassepot Zündnadelgewehr", 2),
    ("1870", "Krupp-Kanonen 1870", "krupp guns franco-prussian war", "Krupp Kanonen 1870", 2),
    ("1870", "Moltke", "helmuth von moltke", "Moltke der Ältere", 1),
    ("1870", "Bismarck Emser Depesche", "ems dispatch bismarck", "Emser Depesche", 1),
    ("1870", "Kaiserproklamation", "proclamation german empire versailles 1871", "Kaiserproklamation Versailles", 1),
    ("1870", "Belagerung von Metz", "siege of metz 1870", "Belagerung von Metz", 2),
    ("1870", "Deutsch-Französischer Krieg", "franco-prussian war explained", "Deutsch-Französischer Krieg 1870", 1),
    ("1870", "Armeegrößen 1870", "franco-prussian war armies size", "Heeresstärke 1870 Preußen Frankreich", 2),
    ("1866", "Königgrätz", "battle of koniggratz", "Schlacht bei Königgrätz", 2),
    ("1866", "Zündnadelgewehr", "dreyse needle gun", "Zündnadelgewehr", 2),
    ("1866", "Seeschlacht Lissa", "battle of lissa 1866 ironclads", "Seeschlacht von Lissa 1866", 2),
    ("1866", "Eisenbahn Aufmarsch", "prussian railways war 1866", "Eisenbahn Aufmarsch 1866", 2),
    ("1866", "Deutscher Krieg 1866", "austro-prussian war explained", "Deutscher Krieg 1866", 1),
    ("1866", "Langensalza", "battle of langensalza", "Schlacht bei Langensalza", 1),
]


def main():
    yt = YouTube(Banco(), chaves=config.chaves()); print("cota livre:", yt.cota()["livres"], flush=True)
    achados = {}
    for g, tema, en, de, fit in T:
        for lang, reg, q in (("en", "US", en), ("de", "DE", de)):
            for vid in yt.buscar(q, depois=DESDE, ordem="viewCount", maximo=50, idioma=lang, regiao=reg):
                achados.setdefault(vid, set()).add((tema, lang))
    vids = {v["id"]: v for v in yt.videos(list(achados))}
    canais = {c["id"]: c for c in yt.canais([v["canal_id"] for v in vids.values()])}
    res, linhas = [], []
    for g, tema, en, de, fit in T:
        te, td = termos(en), termos(de) + termos(en)
        E, D, top = [], [], []
        for vid, ts in achados.items():
            v = vids.get(vid)
            if not v or v["duracao"] < 240 or ENTRETENIMENTO.search(v["titulo"] + " " + v["canal"]): continue
            lg = (v["lingua"] or "")[:2]; de_ = lg == "de" or alemao(v["titulo"])
            if (tema, "en") in ts and not de_ and lg in ("", "en") and relevante(v["titulo"], te): E.append(v["views"]); top.append(("EN", v))
            if de_ and relevante(v["titulo"], td) and any(t == tema for t, _ in ts): D.append(v["views"]); top.append(("DE", v))
        E.sort(reverse=True); D.sort(reverse=True)
        em = statistics.median(E[:10]) if len(E) >= 3 else 0; dm = statistics.median(D[:10]) if D else 0
        gap = em / max(dm, 5000); score = math.log10(em + 1) * math.log10(gap + 1) * (1 + 0.5 * fit)
        res.append({"guerra": g, "tema": tema, "fit": fit, "en_med10": int(em), "en_max": E[0] if E else 0, "en_n": len(E),
                    "de_med10": int(dm), "de_max": D[0] if D else 0, "de_n": len(D), "buraco": round(gap, 1), "score": round(score, 2)})
        for lado, v in sorted(top, key=lambda x: -x[1]["views"])[:4]:
            c = canais.get(v["canal_id"], {})
            linhas.append({"tema": tema, "lado": lado, "views": v["views"], "titulo": v["titulo"], "canal": v["canal"],
                           "inscritos": c.get("inscritos", 0), "publicado": v["publicado"], "url": f"https://youtu.be/{v['id']}"})
    res.sort(key=lambda r: -r["score"])
    for nome, dados in (("prussia_temas.csv", res), ("prussia_top_videos.csv", linhas)):
        with open(os.path.join(AQUI, nome), "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(dados[0])); w.writeheader(); w.writerows(dados)
    print(f"{'guerra':6} {'tema':26} fit {'EN med10':>9} {'EN max':>10} {'EN n':>4} {'DE med10':>9} {'DE max':>9} {'DE n':>4} {'buraco':>7} score")
    for r in res:
        print(f"{r['guerra']:6} {r['tema'][:26]:26} {r['fit']:>3} {r['en_med10']:>9,} {r['en_max']:>10,} {r['en_n']:>4} {r['de_med10']:>9,} {r['de_max']:>9,} {r['de_n']:>4} {r['buraco']:>7} {r['score']}")
    print("cota livre depois:", yt.cota()["livres"])


if __name__ == "__main__":
    main()
