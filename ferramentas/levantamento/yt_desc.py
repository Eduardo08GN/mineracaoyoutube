# python -I yt_desc.py v|c id1,id2  -> descricao de videos (v) ou canais (c, por id ou @handle). Chave nunca impressa.
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
modo, ids = sys.argv[1], sys.argv[2]
if modo == "v":
    for i in chamar("videos", {"part": "snippet", "id": ids})["items"]:
        print("=====", i["id"], "|", i["snippet"]["channelId"], i["snippet"]["channelTitle"], "|", i["snippet"]["title"]); print(i["snippet"]["description"]); print("TAGS:", i["snippet"].get("tags"))
elif modo == "c":
    for h in ids.split(","):
        p = {"part": "snippet,statistics,contentDetails"}
        if h.startswith("@"): p["forHandle"] = h
        else: p["id"] = h
        for i in chamar("channels", p).get("items", []):
            print("=====", i["id"], "|", i["snippet"]["title"], "| subs", i["statistics"].get("subscriberCount"), "| uploads", i["contentDetails"]["relatedPlaylists"]["uploads"]); print(i["snippet"]["description"])
elif modo == "u":  # ultimos uploads de uma playlist
    r = chamar("playlistItems", {"part": "snippet", "playlistId": ids, "maxResults": 20})
    for i in r["items"]: print(i["snippet"]["resourceId"]["videoId"], "|", i["snippet"]["publishedAt"][:10], "|", i["snippet"]["title"])
