"""Radar do recorte do Kriegsmomente (brief de 24/10/2026): guerras prussianas, 65% Franco-Prussiana 1870-71, 35% Austro-
Prussiana 1866. Mesma metodologia limpa do radar_analise (relevancia no titulo, sem entretenimento, oferta DE so em alemao),
janela de 5 anos (nicho historico tem cauda longa). ~200 unidades por tema.
  python radar_prussia.py"""
import csv, math, os, statistics, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "motor"))  # banco.py, youtube.py, config.py do repo
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
SAIDA = os.environ.get("RADAR_SAIDA", AQUI)   # CSVs de saída fora do repo (ex.: D:/kriegschronik/radar_v2)
from banco import Banco
from youtube import YouTube
import config
from radar_grafo import alemao
from radar_analise import termos, relevante, ENTRETENIMENTO

DESDE = "2021-11-04"
# (guerra, tema, EN, DE, encaixe Tracer3D 0-2)
T = [   # 04/11/2026: so micronichos ABERTOS (fora: Sedan, Gravelotte, Paris, Mitrailleuse, Dreyse/Chassepot, Moltke, Koeniggraetz, 1866 geral, 1870 dia a dia, artilharia/Krupp)
    ("1870", "Emser Depesche", "ems dispatch bismarck", "Emser Depesche", 1),
    ("1870", "Belagerung von Metz / Bazaine", "siege of metz bazaine surrender", "Belagerung von Metz Bazaine", 2),
    ("1870", "Ballone Paris / Gambetta", "balloons siege of paris gambetta", "Ballonpost Paris 1870 Gambetta", 2),
    ("1870", "Mars-la-Tour Todesritt", "mars-la-tour death ride bredow", "Todesritt von Mars-la-Tour", 2),
    ("1870", "Spicheren", "battle of spicheren", "Schlacht bei Spichern", 2),
    ("1870", "Wörth / Reichshoffen", "battle of worth froeschwiller cuirassiers", "Schlacht bei Wörth 1870", 2),
    ("1870", "Belagerung Straßburg", "siege of strasbourg 1870", "Belagerung von Straßburg 1870", 2),
    ("1870", "Belfort", "siege of belfort 1870", "Belagerung von Belfort", 2),
    ("1870", "Franc-tireurs", "franc-tireurs franco-prussian war", "Franktireurs 1870", 1),
    ("1870", "5 Milliarden Reparationen", "french indemnity 1871 five billion", "Kriegsentschädigung 1871 fünf Milliarden", 1),
    ("1870", "Kriegsgefangene 1870", "french prisoners of war 1870", "Kriegsgefangene 1870 Franzosen", 1),
    ("1870", "Kaiserproklamation", "proclamation german empire versailles 1871", "Kaiserproklamation Versailles", 1),
    ("1870", "Pariser Kommune", "paris commune 1871", "Pariser Kommune 1871", 1),
    ("1870", "Pocken / Seuchen 1870", "smallpox franco-prussian war", "Pocken 1870 Krieg", 1),
    ("1870", "Feldtelegraf 1870", "telegraph franco-prussian war", "Feldtelegraf 1870", 2),
    ("1870", "Loire-Armee", "army of the loire 1870", "Loirearmee 1870", 1),
    ("1866", "Seeschlacht Lissa", "battle of lissa 1866 ironclads", "Seeschlacht von Lissa 1866", 2),
    ("1866", "Langensalza", "battle of langensalza", "Schlacht bei Langensalza", 2),
    ("1866", "Trautenau", "battle of trautenau", "Schlacht bei Trautenau", 2),
    ("1866", "Custoza 1866", "battle of custoza 1866", "Schlacht bei Custoza 1866", 1),
    ("1866", "Benedek", "ludwig von benedek", "Benedek Königgrätz", 1),
    ("1866", "Mainfeldzug", "main campaign 1866 bavaria", "Mainfeldzug 1866", 1),
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
    for nome, dados in (("prussia_temas_1104.csv", res), ("prussia_top_videos_1104.csv", linhas)):
        with open(os.path.join(SAIDA, nome), "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(dados[0])); w.writeheader(); w.writerows(dados)
    print(f"{'guerra':6} {'tema':26} fit {'EN med10':>9} {'EN max':>10} {'EN n':>4} {'DE med10':>9} {'DE max':>9} {'DE n':>4} {'buraco':>7} score")
    for r in res:
        print(f"{r['guerra']:6} {r['tema'][:26]:26} {r['fit']:>3} {r['en_med10']:>9,} {r['en_max']:>10,} {r['en_n']:>4} {r['de_med10']:>9,} {r['de_max']:>9,} {r['de_n']:>4} {r['buraco']:>7} {r['score']}")
    print("cota livre depois:", yt.cota()["livres"])


if __name__ == "__main__":
    main()
