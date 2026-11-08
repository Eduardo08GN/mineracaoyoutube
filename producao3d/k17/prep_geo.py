# K17: recorta os dados geográficos de 1870 (OpenHistoricalMap/OSM, ODbL; ver tracer3d_06_1870/geo/CREDITOS.md) na caixa do
# mapa (Lorena/Ardenas) com margem e grava cena/karte/geo.json em lon/lat (o JS projeta com a mesma fórmula do assado).
import json
G = r"D:/kriegschronik/tracer3d_06_1870/geo"; OUT = r"D:/kriegschronik/k17_pioniere/cena/karte/geo.json"
LON0, LON1, LAT0, LAT1, M = 4.5, 7.0, 48.5, 50.0, 0.6
dentro = lambda p: LON0 - M <= p[0] <= LON1 + M and LAT0 - M <= p[1] <= LAT1 + M
def linhas(geom):
    t, c = geom["type"], geom["coordinates"]
    if t == "LineString": return [c]
    if t == "MultiLineString": return c
    if t == "Polygon": return c
    if t == "MultiPolygon": return [r for p in c for r in p]
    return []
def corta(ls, passo=1):
    out = []
    for l in ls:
        cur = []
        for p in l[::passo]:
            if dentro(p): cur.append([round(p[0], 4), round(p[1], 4)])
            elif len(cur) > 1: out.append(cur); cur = []
            else: cur = []
        if len(cur) > 1: out.append(cur)
    return out
geo = {"rios": {}, "fronteiras": {}, "cidades": {}}
for f in json.load(open(f"{G}/fluesse_1870.geojson", encoding="utf-8"))["features"]:
    ls = corta(linhas(f["geometry"]))
    if ls: geo["rios"][f["properties"]["id"]] = ls
for f in json.load(open(f"{G}/grenzen_1870_fundo.geojson", encoding="utf-8"))["features"]:
    # polígonos INTEIROS (recortar anel cria cordas falsas); só entram os que tocam a caixa
    rings = [[[round(p[0], 4), round(p[1], 4)] for p in r[::2]] for r in linhas(f["geometry"])]
    rings = [r for r in rings if any(dentro(p) for p in r)]
    if rings: geo["fronteiras"][f["properties"]["id"]] = rings
# cidades e travessias (lat/lon de referência; as travessias reais entram com o dossiê)
geo["cidades"] = {"Metz": [6.176, 49.120], "Pont-à-Mousson": [6.054, 48.905], "Nancy": [6.184, 48.692], "Thionville": [6.168, 49.357],
                  "Verdun": [5.384, 49.160], "Sedan": [4.940, 49.702], "Donchery": [4.873, 49.698], "Saarbrücken": [6.997, 49.234],
                  "Toul": [5.891, 48.675], "Mézières": [4.720, 49.762]}
json.dump(geo, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print({k: (len(v) if isinstance(v, dict) else v) for k, v in geo.items()}, sum(len(x) for v in geo["rios"].values() for x in v), "pts rios")
