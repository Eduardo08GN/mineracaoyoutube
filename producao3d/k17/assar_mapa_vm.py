# K17: assa a base do "atlas creme" NA G4 (roda na VM). Copernicus GLO-30 (Lorena/Ardenas: Mosela e Mosa) ->
# projeção equiretangular com escala verdadeira em 49,25° N (a MESMA fórmula do JS: x = R·cos(φ0)·(λ-λ0), y = R·φ) ->
# hillshade multidirecional + curvas de nível (gdaldem/gdal_contour, receitas srtm-stylesheets CC0) + DEM em PNG 16 bits
# + papel ambientCG (CC0). Saída em /content/k17_mapa/out. Fontes: Copernicus DEM © DLR/Airbus, ESA (licença livre com crédito).
import json, math, os, subprocess, urllib.request, zipfile
O = "/content/k17_mapa"; os.makedirs(f"{O}/tiles", exist_ok=True); os.makedirs(f"{O}/out", exist_ok=True)
LON0, LON1, LAT0, LAT1 = 4.5, 7.0, 48.5, 50.0
PHI0, LAM0, R = 49.25, 5.75, 6371000.0
sh = lambda c: subprocess.run(c, shell=True, check=True)
tifs = []
for lat in range(math.floor(LAT0), math.ceil(LAT1)):
    for lon in range(math.floor(LON0), math.ceil(LON1)):
        n = f"Copernicus_DSM_COG_10_N{lat:02d}_00_E{lon:03d}_00_DEM"
        p = f"{O}/tiles/{n}.tif"
        if not os.path.exists(p):
            urllib.request.urlretrieve(f"https://copernicus-dem-30m.s3.amazonaws.com/{n}/{n}.tif", p)
        tifs.append(p)
print("TILES", len(tifs), flush=True)
EQC = f"+proj=eqc +lat_ts={PHI0} +lon_0={LAM0} +R={R} +units=m +no_defs"
sh(f"gdalbuildvrt -q {O}/dem.vrt " + " ".join(tifs))
# 4096 px de largura: ~44 m/px; o bbox em graus vira retângulo em metros
x0 = R * math.cos(math.radians(PHI0)) * math.radians(LON0 - LAM0); x1 = R * math.cos(math.radians(PHI0)) * math.radians(LON1 - LAM0)
y0 = R * math.radians(LAT0); y1 = R * math.radians(LAT1)
W = 4096; H = round(W * (y1 - y0) / (x1 - x0))
sh(f"gdalwarp -q -overwrite -t_srs '{EQC}' -te {x0} {y0} {x1} {y1} -ts {W} {H} -r bilinear {O}/dem.vrt {O}/dem_eqc.tif")
sh(f"gdaldem hillshade -q -multidirectional -z 2.2 {O}/dem_eqc.tif {O}/hs.tif")
sh(f"gdal_translate -q -of PNG {O}/hs.tif {O}/out/hillshade.png")
# DEM normalizado em 16 bits (para o deslocamento 2.5D e a hipsometria) + faixa em metros no json
info = json.loads(subprocess.run(f"gdalinfo -json -stats {O}/dem_eqc.tif", shell=True, capture_output=True, text=True).stdout)
st = info["bands"][0]; zmin, zmax = float(st["minimum"]), float(st["maximum"])
sh(f"gdal_translate -q -ot UInt16 -scale {zmin} {zmax} 0 65535 -outsize 1024 0 -of PNG {O}/dem_eqc.tif {O}/out/dem16.png")
# curvas de nível a cada 50 m (finas) e 250 m (grossas), simplificadas, em lon/lat para o JS projetar igual
sh(f"gdal_contour -q -a z -i 50 {O}/dem_eqc.tif {O}/cont.gpkg")
sh(f"ogr2ogr -q -f GeoJSON -t_srs EPSG:4326 -simplify 60 -lco COORDINATE_PRECISION=5 {O}/out/curvas.geojson {O}/cont.gpkg")
# papel CC0 (ambientCG Paper002, 2K)
if not os.path.exists(f"{O}/out/papel.png"):
    rq = urllib.request.Request("https://ambientcg.com/get?file=Paper002_2K-JPG.zip", headers={"User-Agent": "Mozilla/5.0"})
    open(f"{O}/papel.zip", "wb").write(urllib.request.urlopen(rq, timeout=120).read())
    with zipfile.ZipFile(f"{O}/papel.zip") as z:
        n = [x for x in z.namelist() if "Color" in x][0]; open(f"{O}/papel.jpg", "wb").write(z.read(n))
    sh(f"gdal_translate -q -of PNG -outsize 1024 0 {O}/papel.jpg {O}/out/papel.png")
json.dump({"lon": [LON0, LON1], "lat": [LAT0, LAT1], "phi0": PHI0, "lam0": LAM0, "R": R, "x": [x0, x1], "y": [y0, y1], "px": [W, H], "z": [zmin, zmax]},
          open(f"{O}/out/meta.json", "w"))
print("ASSADO_OK", W, H, round(zmin), round(zmax), os.path.getsize(f"{O}/out/curvas.geojson") // 1024, "KB curvas", flush=True)
