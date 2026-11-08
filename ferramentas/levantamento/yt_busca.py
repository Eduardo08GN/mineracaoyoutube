# Busca na YouTube Data API v3 (chave do .env do repo, nunca impressa).
#   python -I yt_busca.py "consulta" [max=15] [lang=en]   -> id | canal | views | duracao | data | titulo
import json, os, re, sys, urllib.parse, urllib.request
env = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env"), encoding="utf-8").read()
ks = re.search(r"^YOUTUBE_API_KEYS\s*=\s*(.+)$", env, re.M).group(1).strip().strip('"').strip("'")
KEYS = [k.strip() for k in re.split(r"[,;\s]+", ks) if k.strip()]
def chamar(rec, p):
    for k in KEYS:
        try: return json.load(urllib.request.urlopen("https://www.googleapis.com/youtube/v3/" + rec + "?" + urllib.parse.urlencode({**p, "key": k}), timeout=30))
        except urllib.error.HTTPError as e:
            if e.code in (403, 400): continue
            raise
    raise SystemExit("SEM_COTA")
q = sys.argv[1]; n = int(sys.argv[2]) if len(sys.argv) > 2 else 15; lang = sys.argv[3] if len(sys.argv) > 3 else "en"
r = chamar("search", {"part": "snippet", "q": q, "type": "video", "maxResults": n, "relevanceLanguage": lang, "order": "relevance"})
ids = [i["id"]["videoId"] for i in r.get("items", [])]
if not ids: print("NADA"); sys.exit()
v = chamar("videos", {"part": "snippet,statistics,contentDetails", "id": ",".join(ids)})
for i in v["items"]:
    s = i["snippet"]; print(f'{i["id"]} | {s["channelTitle"][:28]} | {int(i["statistics"].get("viewCount", 0)):>9} | {i["contentDetails"]["duration"]:>9} | {s["publishedAt"][:10]} | {s["title"][:95]}')
