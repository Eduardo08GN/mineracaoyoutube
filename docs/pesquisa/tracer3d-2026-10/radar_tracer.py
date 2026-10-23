"""Radar do "no" do Tracer Project: simulacoes de catastrofe/fenomeno com dados reais (asteroide, tsunami, vulcao, bomba,
terremoto, espaco...). Para cada tema, a mesma busca em ingles, espanhol e portugues nos ultimos 12 meses:
demanda (views dos virais) x oferta por idioma, titulos virais e outliers (views muito acima do tamanho do canal).
Usa o motor do projeto (cota por chave, cache do dia). Saida em D:\\pesquisa_tracer\\radar\\."""
import csv, json, os, sys
from collections import Counter, defaultdict

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motor"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from banco import Banco
from youtube import YouTube
import config

SAIDA = r"D:\pesquisa_tracer\radar"
DESDE = "2025-10-23"   # ultimos 12 meses

# tema: (ingles, espanhol, portugues)
TEMAS = {
    "asteroide / impacto": ("what if an asteroid hit earth", "qué pasaría si un asteroide impactara la tierra", "e se um asteroide atingisse a terra"),
    "simulação de impacto": ("asteroid impact simulation", "simulación impacto asteroide", "simulação impacto asteroide"),
    "tsunami": ("tsunami simulation", "simulación tsunami", "simulação tsunami"),
    "megatsunami": ("megatsunami", "megatsunami", "megatsunami"),
    "supervulcão": ("supervolcano eruption", "erupción supervolcán", "erupção supervulcão"),
    "vulcão em cidade": ("volcano eruption simulation", "simulación erupción volcán", "simulação erupção vulcão"),
    "bomba nuclear em cidade": ("nuclear bomb on city simulation", "bomba nuclear en ciudad simulación", "bomba nuclear cidade simulação"),
    "terremoto": ("earthquake simulation", "simulación terremoto", "simulação terremoto"),
    "tempestade solar": ("solar storm hit earth", "tormenta solar tierra", "tempestade solar terra"),
    "lua": ("what if the moon", "qué pasaría si la luna", "e se a lua"),
    "buraco negro / espaço": ("black hole hit earth", "agujero negro tierra", "buraco negro terra"),
    "barragem / enchente": ("dam failure simulation", "rotura presa simulación", "rompimento barragem simulação"),
    "furacão": ("hurricane simulation", "simulación huracán", "simulação furacão"),
    "calor extremo / clima": ("what if earth temperature", "qué pasaría si la tierra se calienta", "e se a terra esquentar"),
    "segundo a segundo": ("second by second", "segundo a segundo", "segundo a segundo"),
    "o quão longe você está": ("how far away would you need to be", "a qué distancia tendrías que estar", "a que distância você precisaria estar"),
    "cientistas simularam": ("scientists simulated", "científicos simularon", "cientistas simularam"),
    "acidente reconstruído 3D": ("3d reconstruction disaster", "reconstrucción 3d accidente", "reconstrução 3d acidente"),
    "fim da terra / sol": ("what if the sun", "qué pasaría si el sol", "e se o sol"),
    "pandemia / colapso": ("what if humans disappeared", "qué pasaría si los humanos desaparecieran", "e se os humanos desaparecessem"),
}
IDIOMAS = [("en", "US"), ("es", "MX"), ("pt", "BR")]


def main():
    os.makedirs(SAIDA, exist_ok=True)
    yt = YouTube(Banco(), chaves=config.chaves())
    print("cota livre antes:", yt.cota()["livres"])
    achados = defaultdict(set)   # video -> {(tema, idioma)}
    for tema, qs in TEMAS.items():
        for (lang, reg), q in zip(IDIOMAS, qs):
            for vid in yt.buscar(q, depois=DESDE, ordem="viewCount", maximo=50, idioma=lang, regiao=reg):
                achados[vid].add((tema, lang))
    vids = {v["id"]: v for v in yt.videos(list(achados)) if not v["kids"]}
    canais = {c["id"]: c for c in yt.canais([v["canal_id"] for v in vids.values()])}
    print("videos:", len(vids), "| canais:", len(canais), "| cota livre depois:", yt.cota()["livres"])

    linhas = []
    for vid, v in vids.items():
        c = canais.get(v["canal_id"], {})
        lang_v = (v["lingua"] or "")[:2]
        for tema, lang_busca in achados[vid]:
            linhas.append({"tema": tema, "idioma_busca": lang_busca, "idioma_video": lang_v, "titulo": v["titulo"], "views": v["views"],
                           "minutos": round(v["duracao"] / 60, 1), "publicado": v["publicado"], "canal": c.get("nome", v["canal"]),
                           "inscritos": c.get("inscritos", 0), "canal_criado": c.get("criado", ""),
                           "outlier": round(v["views"] / max(1000, c.get("inscritos", 0)), 1),
                           "url": f"https://youtu.be/{vid}", "canal_url": f"https://www.youtube.com/channel/{v['canal_id']}"})
    with open(os.path.join(SAIDA, "videos.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0])); w.writeheader(); w.writerows(linhas)

    # demanda x oferta por tema: soma das views de videos LONGOS (>= 4 min) cujo idioma real bate com o da busca
    res = []
    for tema in TEMAS:
        d = {}
        for lang, _ in IDIOMAS:
            ls = [l for l in linhas if l["tema"] == tema and l["idioma_busca"] == lang and l["minutos"] >= 4
                  and (l["idioma_video"] in ("", lang))]
            d[lang] = (sum(l["views"] for l in ls), sum(1 for l in ls if l["views"] >= 1_000_000), len({l["canal"] for l in ls}))
        res.append((tema, d))
    with open(os.path.join(SAIDA, "temas.json"), "w", encoding="utf-8") as f:
        json.dump({t: d for t, d in res}, f, ensure_ascii=False, indent=1)
    print(f"\n{'tema':26} {'EN views':>12} {'EN 1M+':>6} | {'ES views':>11} {'ES 1M+':>6} {'ES canais':>9} | {'PT views':>11} | EN/ES")
    for tema, d in sorted(res, key=lambda x: -x[1]["en"][0]):
        en, es, pt = d["en"], d["es"], d["pt"]
        print(f"{tema:26} {en[0]:>12,} {en[1]:>6} | {es[0]:>11,} {es[1]:>6} {es[2]:>9} | {pt[0]:>11,} | {en[0]/max(es[0],1):>6.1f}x")


if __name__ == "__main__":
    main()
