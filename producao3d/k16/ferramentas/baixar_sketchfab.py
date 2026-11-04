import sys; sys.stdout.reconfigure(encoding="utf-8")
import json, os, re, sys, urllib.request, zipfile
DEST = "D:/kriegschronik/k16_seekrieg/assets/sketchfab"
TOKEN = dict(l.strip().split("=", 1) for l in open(r"D:\reconstruccion\.env") if "=" in l)["SKETCHFAB_API_TOKEN"]
OK = {"by", "cc0"}
def api(path, auth=False):
    h = {"User-Agent": "batedor/1.0"}
    if auth: h["Authorization"] = f"Token {TOKEN}"
    return json.load(urllib.request.urlopen(urllib.request.Request("https://api.sketchfab.com/v3/" + path, headers=h), timeout=90))
creds = {}
os.makedirs(DEST, exist_ok=True)
for uid in sys.argv[1:]:
    m = api(f"models/{uid}"); L = m.get("license") or {}
    cred = {"uid": uid, "nome": m["name"], "autor": m["user"]["displayName"], "perfil": m["user"]["profileUrl"], "url": m["viewerUrl"], "licenca": L.get("label",""), "slug": L.get("slug",""), "faces": m.get("faceCount")}
    if cred["slug"] not in OK or not m.get("isDownloadable"): print("PULADO", m["name"], cred["slug"]); continue
    d = api(f"models/{uid}/download", auth=True); g = d.get("gltf") or d.get("glb")
    nome = re.sub(r"[^a-z0-9]+", "_", m["name"].lower()).strip("_")[:40]
    pasta = os.path.join(DEST, f"{nome}_{uid[:6]}"); os.makedirs(pasta, exist_ok=True)
    z = os.path.join(pasta, "m.zip"); urllib.request.urlretrieve(g["url"], z)
    with zipfile.ZipFile(z) as f: f.extractall(pasta)
    os.remove(z); json.dump(cred, open(os.path.join(pasta, "CREDITO.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    sz = sum(os.path.getsize(os.path.join(r, f)) for r, _, fs in os.walk(pasta) for f in fs)
    print("OK", m["name"], "|", cred["autor"], "|", cred["licenca"], "|", round(sz/1e6,1), "MB ->", pasta)
