"""Reconstructed (UCdZhRs4wM7SgVXoP9WSW2yA): inventario via YouTube Data API: uploads + faixas de legenda (captions.list).
O texto das legendas de canal de terceiros nao sai pela API (captions.download exige OAuth do dono): vem do yt-dlp (baixar.py)."""
import datetime as dt, json, sys
sys.path.insert(0, r"C:\Users\edlut\mineracaoyoutube\motor")
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from banco import Banco
import youtube; from youtube import YouTube
import config
youtube.CUSTO.update({"playlistItems": 1, "captions": 50})
AQUI = r"D:\pesquisa_tracer\reconstructed"; CID = "UCdZhRs4wM7SgVXoP9WSW2yA"; HOJE = dt.date(2026, 10, 29)
yt = YouTube(Banco(), chaves=config.chaves())
d = yt._chamar("channels", {"part": "snippet,statistics,contentDetails,brandingSettings", "id": CID})["items"][0]
pl = d["contentDetails"]["relatedPlaylists"]["uploads"]; ids, tok = [], None
while True:
    p = {"part": "contentDetails", "playlistId": pl, "maxResults": 50}
    if tok: p["pageToken"] = tok
    r = yt._chamar("playlistItems", p); ids += [i["contentDetails"]["videoId"] for i in r.get("items", [])]
    tok = r.get("nextPageToken")
    if not tok: break
vs = yt.videos(ids)
full = {}
for i in range(0, len(ids), 50):   # descricao e tags completas
    for it in yt._chamar("videos", {"part": "snippet", "id": ",".join(ids[i:i + 50])})["items"]:
        full[it["id"]] = {"descricao": it["snippet"].get("description", ""), "tags": it["snippet"].get("tags", []),
                          "categoria": it["snippet"].get("categoryId"), "audio_lang": it["snippet"].get("defaultAudioLanguage")}
for v in vs:
    v.update(full.get(v["id"], {}))
    v["legendas"] = [{"lang": c["snippet"]["language"], "tipo": c["snippet"]["trackKind"], "nome": c["snippet"].get("name", "")}
                     for c in yt._chamar("captions", {"part": "snippet", "videoId": v["id"]}).get("items", [])]
    v["dias"] = max(1, (HOJE - dt.date.fromisoformat(v["publicado"])).days)
canal = {"nome": d["snippet"]["title"], "criado": d["snippet"]["publishedAt"][:10], "descricao": d["snippet"].get("description", ""),
         "keywords": d.get("brandingSettings", {}).get("channel", {}).get("keywords", ""), **{k: int(x) for k, x in d["statistics"].items() if str(x).isdigit()}}
json.dump({"canal": canal, "videos": sorted(vs, key=lambda v: v["publicado"])}, open(AQUI + r"\inventario.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(canal["nome"], canal.get("subscriberCount"), canal.get("viewCount"), len(vs), "videos")
for v in sorted(vs, key=lambda v: v["publicado"]):
    print(f"{v['publicado']} {v['id']} {v['duracao']//60:>2}:{v['duracao']%60:02d} {v['views']:>9,} | {v['titulo'][:60]} | legendas {[(c['lang'], c['tipo']) for c in v['legendas']]}")
print("cota livre:", yt.cota()["livres"])
