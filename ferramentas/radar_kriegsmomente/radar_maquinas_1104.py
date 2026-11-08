"""(04/11 tarde: rodada MÁQUINAS, com corrida de 90 dias.) Radar do recorte do Kriegsmomente (brief de 24/10/2026): guerras prussianas, 65% Franco-Prussiana 1870-71, 35% Austro-
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
T = [   # 04/11/2026 tarde: SÓ temas com máquina/engenharia no centro (regra do Eduardo), fora os já feitos (Krupp/artilharia, Dreyse/Chassepot, Mitrailleuse, telégrafo, ferrovia)
    ("1870", "Ballone + Ballonkanone Paris", "siege of paris balloons", "Ballone Belagerung Paris 1870", 2),
    ("1870", "Ballonabwehrkanone Krupp 1870", "first anti aircraft gun 1870", "Ballonabwehrkanone 1870", 2),
    ("1870", "Brieftauben Mikrofilm Paris", "pigeon post siege of paris microfilm", "Brieftauben Belagerung Paris", 2),
    ("1866", "Panzerschiffe Lissa Rammstoß", "battle of lissa ironclad ram", "Seeschlacht Lissa Panzerschiffe", 2),
    ("1866", "Whitehead Torpedo 1866", "whitehead torpedo invention", "Whitehead Torpedo Erfindung", 2),
    ("1870", "Pontonbrücken Pioniere 1870", "pontoon bridge prussian army", "Pontonbrücke Pioniere 1870", 2),
    ("1870", "Belagerung Straßburg Technik", "siege of strasbourg 1870", "Belagerung Straßburg 1870", 2),
    ("1870", "Seekrieg 1870 Blockade", "franco prussian war navy", "Seekrieg 1870 Marine", 2),
    ("1870", "Erbswurst Feldration", "erbswurst prussian army ration", "Erbswurst 1870", 1),
    ("1870", "Pickelhaube Helm Technik", "pickelhaube helmet history", "Pickelhaube Geschichte", 1),
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
        rec = lambda lado: sum(1 for l, v in top if l == lado and v["publicado"] >= "2026-08-06")
        E.sort(reverse=True); D.sort(reverse=True)
        em = statistics.median(E[:10]) if len(E) >= 3 else 0; dm = statistics.median(D[:10]) if D else 0
        gap = em / max(dm, 5000); score = math.log10(em + 1) * math.log10(gap + 1) * (1 + 0.5 * fit)
        res.append({"guerra": g, "tema": tema, "fit": fit, "en_med10": int(em), "en_max": E[0] if E else 0, "en_n": len(E),
                    "de_med10": int(dm), "de_max": D[0] if D else 0, "de_n": len(D), "buraco": round(gap, 1), "score": round(score, 2), "de_90d": rec("DE"), "en_90d": rec("EN")})
        for lado, v in sorted(top, key=lambda x: -x[1]["views"])[:6]:
            c = canais.get(v["canal_id"], {})
            linhas.append({"tema": tema, "lado": lado, "views": v["views"], "titulo": v["titulo"], "canal": v["canal"],
                           "inscritos": c.get("inscritos", 0), "publicado": v["publicado"], "url": f"https://youtu.be/{v['id']}"})
    res.sort(key=lambda r: -r["score"])
    for nome, dados in (("maquinas_temas_1104.csv", res), ("maquinas_top_videos_1104.csv", linhas)):
        with open(os.path.join(SAIDA, nome), "w", encoding="utf-8-sig", newline="") as f:
            w = csv.DictWriter(f, fieldnames=list(dados[0])); w.writeheader(); w.writerows(dados)
    print(f"{'guerra':6} {'tema':26} fit {'EN med10':>9} {'EN max':>10} {'EN n':>4} {'DE med10':>9} {'DE max':>9} {'DE n':>4} {'buraco':>7} score")
    for r in res:
        print(f"{r['guerra']:6} {r['tema'][:26]:26} {r['fit']:>3} {r['en_med10']:>9,} {r['en_max']:>10,} {r['en_n']:>4} {r['de_med10']:>9,} {r['de_max']:>9,} {r['de_n']:>4} {r['buraco']:>7} {r['score']}")
    print("cota livre depois:", yt.cota()["livres"])


if __name__ == "__main__":
    main()
