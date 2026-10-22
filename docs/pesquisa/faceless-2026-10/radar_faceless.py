"""Radar de canais faceless recentes e virais (animação, simulação 3D, POV, explicadores) pela YouTube Data API.
Usa o motor do projeto (motor/youtube.py: cota contada por chave, busca cacheada no dia).
Saída em D:\\whatif_es\\pesquisa_faceless\\ (JSON bruto + ranking CSV)."""
import csv, json, os, sys
from datetime import date, datetime

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "motor"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from banco import Banco
from youtube import YouTube
import config

SAIDA = r"D:\whatif_es\pesquisa_faceless"
DESDE = "2026-07-24"           # vídeos dos últimos 90 dias
CANAL_DESDE = "2025-10-22"     # canal criado nos últimos 12 meses
HOJE = date(2026, 10, 22)

# (consulta, idioma, região, nicho)
CONSULTAS = [
    # nosso nicho: what if / simulação 3D
    ("what if earth", "en", "US", "what if / simulação"), ("what if you", "en", "US", "what if / simulação"),
    ("what if the sun", "en", "US", "what if / simulação"), ("what if simulation 3d", "en", "US", "what if / simulação"),
    ("what happens if", "en", "US", "what if / simulação"), ("3d simulation", "en", "US", "what if / simulação"),
    ("physics simulation", "en", "US", "what if / simulação"), ("qué pasaría si", "es", "MX", "what if / simulação"),
    ("simulación 3d", "es", "MX", "what if / simulação"), ("e se a terra", "pt", "BR", "what if / simulação"),
    ("simulação 3d", "pt", "BR", "what if / simulação"),
    # escala e comparações
    ("size comparison 3d", "en", "US", "comparação de escala"), ("universe size comparison", "en", "US", "comparação de escala"),
    ("scale comparison", "en", "US", "comparação de escala"), ("comparación de tamaño", "es", "MX", "comparação de escala"),
    ("how deep", "en", "US", "comparação de escala"), ("speed comparison", "en", "US", "comparação de escala"),
    # POV / sobrevivência / pré-história
    ("pov you are", "en", "US", "POV animado"), ("pov animation", "en", "US", "POV animado"),
    ("survive prehistoric", "en", "US", "POV animado"), ("dinosaur pov", "en", "US", "POV animado"),
    ("could you survive", "en", "US", "POV animado"), ("zombie apocalypse animation", "en", "US", "POV animado"),
    ("pov sobrevivir", "es", "MX", "POV animado"),
    # história e documentário animado
    ("history animated", "en", "US", "história animada"), ("animated documentary", "en", "US", "história animada"),
    ("ancient history explained", "en", "US", "história animada"), ("life in medieval times", "en", "US", "história animada"),
    ("worst jobs in history", "en", "US", "história animada"), ("historia animada", "es", "MX", "história animada"),
    ("história animada", "pt", "BR", "história animada"),
    # mapas, linhas do tempo, dados
    ("map animation", "en", "US", "mapas e dados"), ("every year timeline", "en", "US", "mapas e dados"),
    ("countries compared", "en", "US", "mapas e dados"), ("population comparison", "en", "US", "mapas e dados"),
    ("history of every country", "en", "US", "mapas e dados"),
    # ciência e espaço explicados
    ("space documentary", "en", "US", "ciência e espaço"), ("inside a black hole", "en", "US", "ciência e espaço"),
    ("what's inside", "en", "US", "ciência e espaço"), ("how it works animation", "en", "US", "ciência e espaço"),
    ("human body animation", "en", "US", "ciência e espaço"), ("documental espacio", "es", "MX", "ciência e espaço"),
    ("universo documentário", "pt", "BR", "ciência e espaço"),
    # animação 2D / stickman / histórias
    ("stickman animation", "en", "US", "2D / stickman"), ("2d animation story", "en", "US", "2D / stickman"),
    ("animated story", "en", "US", "2D / stickman"), ("story animation reddit", "en", "US", "2D / stickman"),
    ("animación historia corta", "es", "MX", "2D / stickman"),
    # estilos de documentário faceless (IA / cinematográfico)
    ("cinematic documentary ai", "en", "US", "doc cinematográfico IA"), ("ai animated documentary", "en", "US", "doc cinematográfico IA"),
    ("mystery documentary", "en", "US", "doc cinematográfico IA"), ("ocean depth", "en", "US", "doc cinematográfico IA"),
    ("evolution of", "en", "US", "doc cinematográfico IA"), ("documental animado", "es", "MX", "doc cinematográfico IA"),
    # rodada 2: outros nichos faceless (o pedido nao e' so o nosso nicho)
    ("true crime documentary", "en", "US", "crime real"), ("cold case solved", "en", "US", "crime real"),
    ("crimen real documental", "es", "MX", "crime real"), ("caso resolvido", "pt", "BR", "crime real"),
    ("scary animated stories", "en", "US", "terror animado"), ("horror story animated", "en", "US", "terror animado"),
    ("historias de terror animadas", "es", "MX", "terror animado"), ("reddit stories", "en", "US", "reddit / narração"),
    ("aita story", "en", "US", "reddit / narração"), ("revenge story", "en", "US", "reddit / narração"),
    ("ai story animation", "en", "US", "histórias com IA"), ("moral story animation", "en", "US", "histórias com IA"),
    ("cuentos animados", "es", "MX", "histórias com IA"), ("historia emocionante", "pt", "BR", "histórias com IA"),
    ("bible stories animated", "en", "US", "bíblia / religião"), ("historias de la biblia", "es", "MX", "bíblia / religião"),
    ("histórias bíblicas", "pt", "BR", "bíblia / religião"), ("explained finance", "en", "US", "finanças / negócios"),
    ("how this company", "en", "US", "finanças / negócios"), ("business explained animation", "en", "US", "finanças / negócios"),
    ("top 10 most", "en", "US", "top 10 / listas"), ("most dangerous", "en", "US", "top 10 / listas"),
    ("unsolved mysteries", "en", "US", "mistério"), ("lost civilization", "en", "US", "mistério"),
    ("misterios sin resolver", "es", "MX", "mistério"), ("sleep documentary", "en", "US", "sono / relaxamento"),
    ("boring history for sleep", "en", "US", "sono / relaxamento"), ("relaxing nature 4k", "en", "US", "sono / relaxamento"),
    ("stoic motivation", "en", "US", "motivação / filosofia"), ("psychology facts", "en", "US", "motivação / filosofia"),
    ("dark psychology", "en", "US", "motivação / filosofia"), ("filosofía estoica", "es", "MX", "motivação / filosofia"),
    ("minecraft but", "en", "US", "games animados"), ("roblox animation", "en", "US", "games animados"),
    ("satisfying compilation", "en", "US", "compilação / satisfatório"), ("oddly satisfying", "en", "US", "compilação / satisfatório"),
    ("cooking asmr animation", "en", "US", "compilação / satisfatório"), ("countryballs", "en", "US", "mapas e dados"),
    ("animal documentary", "en", "US", "natureza / animais"), ("wild animals fight", "en", "US", "natureza / animais"),
    ("war documentary animated", "en", "US", "guerra / militar"), ("military comparison", "en", "US", "guerra / militar"),
    ("curiosidades increíbles", "es", "MX", "curiosidades"), ("curiosidades", "pt", "BR", "curiosidades"),
    ("did you know facts", "en", "US", "curiosidades"),
]


def main():
    os.makedirs(SAIDA, exist_ok=True)
    yt = YouTube(Banco(), chaves=config.chaves())
    print("cota antes:", yt.cota()["livres"])
    vids, origem = {}, {}
    for q, lang, reg, nicho in CONSULTAS:
        for vid in yt.buscar(q, depois=DESDE, ordem="viewCount", maximo=50, idioma=lang, regiao=reg):
            origem.setdefault(vid, set()).add(nicho)
    print("videos achados:", len(origem))
    for v in yt.videos(list(origem)):
        if v["kids"]: continue
        v["nichos"] = sorted(origem.get(v["id"], []))
        vids[v["id"]] = v
    canais = {c["id"]: c for c in yt.canais([v["canal_id"] for v in vids.values()])}
    print("canais:", len(canais), "| cota depois:", yt.cota()["livres"])
    json.dump({"videos": list(vids.values()), "canais": list(canais.values())},
              open(os.path.join(SAIDA, "bruto.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    linhas = []
    for c in canais.values():
        if not c["criado"] or c["criado"] < CANAL_DESDE: continue
        dias = max(1, (HOJE - datetime.strptime(c["criado"], "%Y-%m-%d").date()).days)
        dos = [v for v in vids.values() if v["canal_id"] == c["id"]]
        top = max(dos, key=lambda v: v["views"])
        linhas.append({
            "canal": c["nome"], "id": c["id"], "url": f"https://www.youtube.com/channel/{c['id']}", "criado": c["criado"],
            "dias": dias, "inscritos": c["inscritos"], "views_total": c["views"], "videos": c["n_videos"],
            "views_por_dia": round(c["views"] / dias), "media_por_video": round(c["views"] / max(1, c["n_videos"])),
            "pais": c["pais"], "nichos": ", ".join(sorted({n for v in dos for n in v["nichos"]})),
            "top_titulo": top["titulo"], "top_views": top["views"], "top_url": f"https://youtu.be/{top['id']}",
            "top_duracao_s": top["duracao"], "top_thumb": top["thumb"], "lingua": top["lingua"],
        })
    linhas.sort(key=lambda r: r["views_por_dia"], reverse=True)
    with open(os.path.join(SAIDA, "ranking_canais_novos.csv"), "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(linhas[0].keys())); w.writeheader(); w.writerows(linhas)
    print("canais novos (<= 12 meses):", len(linhas))
    for r in linhas[:40]:
        print(f"{r['views_por_dia']:>10,}/dia {r['inscritos']:>9,} insc {r['videos']:>4} vids  {r['criado']}  {r['canal'][:38]:38}  [{r['nichos'][:40]}]")


if __name__ == "__main__":
    main()
