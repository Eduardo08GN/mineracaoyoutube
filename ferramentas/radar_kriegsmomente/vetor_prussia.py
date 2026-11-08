"""Vetor de viralizacao no recorte prussiano (27/10/2026): qual termo do TITULO puxa views no publico alemao?
Amostra larga de videos DE sobre 1864/1866/1870-71 (viewCount + relevancia), mede views/inscrito e views/dia por
presenca de termos no titulo, e lista os uploads do Kriegsmomente e do KriegsChronik.
  python vetor_prussia.py"""
import csv, datetime as dt, os, re, statistics, sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "motor"))  # banco.py, youtube.py, config.py do repo
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
AQUI = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, AQUI)
SAIDA = os.environ.get("RADAR_SAIDA", AQUI)   # CSVs de saída fora do repo (ex.: D:/kriegschronik/radar_v2)
from banco import Banco
import youtube
from youtube import YouTube
import config
from radar_grafo import alemao

youtube.CUSTO["playlistItems"] = 1
DESDE = "2021-01-01"
HOJE = dt.date(2026, 11, 4)
Q = ["Deutsch-Französischer Krieg", "Deutsch-Französischer Krieg 1870", "Krieg 1870 1871", "Preußen Frankreich 1870",
     "Preußen gegen Frankreich", "Warum verlor Frankreich 1870", "Sedan 1870", "Gravelotte 1870", "Belagerung Paris 1870",
     "Moltke Preußen", "Bismarck Krieg 1870", "Reichsgründung 1871 Krieg", "Preußische Armee", "Preußen Krieg",
     "Deutscher Krieg 1866", "Königgrätz 1866", "Preußen Österreich 1866", "Zündnadelgewehr", "Krupp Kanone 1870",
     "Chassepot", "Mitrailleuse 1870", "Deutsch-Dänischer Krieg 1864", "Einigungskriege", "Preußen Schlacht"]
CANAIS = {"Kriegsmomente": os.environ.get("KRIEGSMOMENTE_CANAL_ID", "")}   # ID só no ambiente/.env local (repo público)
TERMOS = {
    "Deutsch-Französisch": r"deutsch[- ]?franz",
    "Preußen/preußisch": r"preu(ß|ss)",
    "Frankreich/Franzosen/französisch": r"frankreich|franzos|französ|franzoes",
    "Österreich": r"österreich|oesterreich",
    "1870 ou 1871": r"187[01]",
    "1866": r"1866",
    "Krieg (palavra)": r"\bkrieg",
    "Schlacht": r"schlacht",
    "Bismarck": r"bismarck",
    "Moltke": r"moltke",
    "Kaiser/Reich": r"kaiser|reich\b|kaiserreich|reichsgr",
    "nome de batalha": r"sedan|gravelotte|königgrätz|koeniggraetz|mars-la-tour|wörth|spichern|metz|düppel",
    "arma (Krupp/Dreyse/Chassepot...)": r"krupp|zündnadel|dreyse|chassepot|mitrailleuse|kanone",
    "número grande": r"\d{1,3}[.,]\d{3}|\d+ ?(mann|soldaten|tausend)",
    "pergunta Warum/Wie": r"\b(warum|wie|wieso)\b",
    "CAIXA-ALTA de impacto": r"\b[A-ZÄÖÜ]{5,}\b",
}


def uploads(yt, cid):
    d = yt._chamar("channels", {"part": "contentDetails", "id": cid})
    pl = d["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]
    ids, tok = [], None
    while True:
        p = {"part": "contentDetails", "playlistId": pl, "maxResults": 50}
        if tok: p["pageToken"] = tok
        d = yt._chamar("playlistItems", p)
        ids += [i["contentDetails"]["videoId"] for i in d.get("items", [])]
        tok = d.get("nextPageToken")
        if not tok: return ids


def main():
    yt = YouTube(Banco(), chaves=config.chaves()); print("cota livre:", yt.cota()["livres"], flush=True)
    ids = set()
    for q in Q:
        for ordem in ("viewCount", "relevance"):
            ids |= set(yt.buscar(q, depois=DESDE, ordem=ordem, idioma="de", regiao="DE"))
    vids = [v for v in yt.videos(list(ids)) if v["duracao"] >= 240 and alemao(v["titulo"])
            and re.search(r"186[0-9]|187[01]|preu(ß|ss)|bismarck|moltke|franz|sedan|königgrätz|zündnadel|krupp|chassepot|mitrailleuse|gravelotte|reichsgr|einigungskrieg",
                          v["titulo"].lower())]
    can = {c["id"]: c for c in yt.canais([v["canal_id"] for v in vids])}
    for v in vids:
        v["insc"] = can.get(v["canal_id"], {}).get("inscritos", 0) or 1
        v["dias"] = max(7, (HOJE - dt.date.fromisoformat(v["publicado"])).days)
        v["vpd"] = v["views"] / v["dias"]
        v["ratio"] = v["views"] / max(v["insc"], 500)
    print(f"\namostra DE: {len(vids)} videos, {len({v['canal_id'] for v in vids})} canais\n")
    med = lambda xs: statistics.median(xs) if xs else 0
    base_r, base_d = med([v["ratio"] for v in vids]), med([v["vpd"] for v in vids])
    print(f"base: mediana views/inscrito {base_r:.2f} · views/dia {base_d:.1f}\n")
    linhas = []
    for nome, rx in TERMOS.items():
        com = [v for v in vids if re.search(rx, v["titulo"], 0 if "CAIXA" in nome else re.I)]
        sem = [v for v in vids if v not in com]
        if len(com) < 5: continue
        r1, r0 = med([v["ratio"] for v in com]), med([v["ratio"] for v in sem])
        d1, d0 = med([v["vpd"] for v in com]), med([v["vpd"] for v in sem])
        out = sum(v["ratio"] >= 3 for v in com) / len(com)
        linhas.append((nome, len(com), r1, r0, r1 / max(r0, 1e-9), d1, d0, out))
    linhas.sort(key=lambda x: -x[4])
    print(f"{'termo no título':34} {'n':>4} {'v/insc com':>10} {'sem':>6} {'lift':>5} {'v/dia com':>9} {'sem':>6} {'% outlier≥3x':>12}")
    for n, k, r1, r0, l, d1, d0, o in linhas:
        print(f"{n:34} {k:4} {r1:10.2f} {r0:6.2f} {l:5.2f} {d1:9.1f} {d0:6.1f} {o*100:11.0f}%")
    with open(os.path.join(SAIDA, "vetor_termos.csv"), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(["termo", "n", "ratio_com", "ratio_sem", "lift", "vpd_com", "vpd_sem", "pct_outlier"])
        w.writerows(linhas)
    print("\ntop 25 outliers (views/inscrito):")
    for v in sorted(vids, key=lambda v: -v["ratio"])[:25]:
        print(f"  {v['ratio']:6.1f}x {v['views']:>8} v · {v['insc']:>7} insc · {v['publicado']} | {v['titulo'][:95]} | {v['canal'][:28]}")
    with open(os.path.join(SAIDA, "vetor_videos.csv"), "w", newline="", encoding="utf-8-sig") as f:
        w = csv.writer(f); w.writerow(["views", "insc", "ratio", "vpd", "publicado", "titulo", "canal", "id"])
        for v in sorted(vids, key=lambda v: -v["ratio"]):
            w.writerow([v["views"], v["insc"], round(v["ratio"], 2), round(v["vpd"], 1), v["publicado"], v["titulo"], v["canal"], v["id"]])
    for nome, cid in CANAIS.items():
        try:
            us = yt.videos(uploads(yt, cid))
        except Exception as e:
            print(nome, "falhou:", e); continue
        print(f"\n{nome}:")
        for v in sorted(us, key=lambda v: v["publicado"]):
            dias = max(1, (HOJE - dt.date.fromisoformat(v["publicado"])).days)
            print(f"  {v['publicado']} {v['views']:>7} v ({v['views']/dias:7.0f}/dia) {v['duracao']//60:>3} min | {v['titulo']}")
    print("\ncota livre:", yt.cota()["livres"])


if __name__ == "__main__":
    main()
