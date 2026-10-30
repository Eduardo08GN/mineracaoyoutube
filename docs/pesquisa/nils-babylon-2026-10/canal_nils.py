"""Lista os videos do canal da referencia (API YouTube) e o autocompletar do YouTube em espanhol para o titulo."""
import json, os, sys, urllib.request, urllib.parse
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "motor"))
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
from banco import Banco
from youtube import YouTube
import config, youtube as _y
_y.CUSTO.setdefault("playlistItems", 1)
yt = YouTube(Banco(), chaves=config.chaves())
v = yt.videos(["o_aRTyiXS40"])[0]; cid = v["canal_id"]
c = yt.canais([cid])[0]
d = yt._chamar("playlistItems", {"part": "contentDetails", "playlistId": "UU" + cid[2:], "maxResults": 50})
vs = sorted(yt.videos([i["contentDetails"]["videoId"] for i in d["items"]]), key=lambda x: x["publicado"])
print(f'{c["nome"]} criado {c["criado"]} insc {c["inscritos"]:,} videos {c["n_videos"]} views {c["views"]:,}')
for x in vs: print(f'  {x["publicado"]} {x["views"]:>10,} {x["duracao"]//60:>3}m | {x["titulo"]}')
json.dump({"canal": c, "videos": vs}, open("canal_nils.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("\nAUTOCOMPLETE ES:")
for q in ["la antigua babilonia", "babilonia era", "la antigua babilonia era más", "babilonia historia", "era más extraña de lo que", "era más rara de lo que", "más raro de lo que crees"]:
    for gl in ("MX", "ES"):
        u = "https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=es&gl=" + gl + "&q=" + urllib.parse.quote(q)
        try: s = json.loads(urllib.request.urlopen(u, timeout=15).read().decode("utf-8", "ignore"))[1]
        except Exception as e: s = [str(e)]
        print(f"  [{gl}] {q!r}: {s[:8]}")
