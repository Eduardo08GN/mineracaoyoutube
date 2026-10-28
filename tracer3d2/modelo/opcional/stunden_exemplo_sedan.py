"""Serie hora a hora do contador (video 7, Sedan). Ancoras [Q] de fakten.md / geo/zaehler_sedan.md; entre elas MODELO [M]
(curva do batedor de dados, reescalada aos valores finais usados na narracao). Saida: stunden.json (copiar para v1/src)."""
import json
# zeit, de_feld (im Anmarsch / im Gefecht), de_gesch, fr_feld (im Feld / im Kessel), de_verl, fr_verl (T+V), fr_gef, ereignis
P = [
    ("1870-08-23T08:00", 200000, 774, 130000, 0, 0, 0, "Armee von Chalons bricht auf"),
    ("1870-08-30T12:00", 200000, 774, 130000, 0, 0, 0, "Beaumont"),
    ("1870-08-30T20:00", 200000, 774, 122500, 0, 0, 0, "nach Beaumont"),
    ("1870-08-31T20:00", 200000, 774, 120000, 0, 0, 0, "Sedan"),
    ("1870-09-01T04:00", 25000, 60, 120000, 0, 0, 0, "Bazeilles"),
    ("1870-09-01T05:00", 40000, 120, 119000, 300, 500, 0, ""),
    ("1870-09-01T06:00", 55000, 160, 117500, 950, 1400, 0, "MacMahon verwundet"),
    ("1870-09-01T07:00", 70000, 210, 116000, 1600, 2700, 0, ""),
    ("1870-09-01T08:00", 90000, 260, 114000, 2350, 4000, 0, "Wimpffen"),
    ("1870-09-01T09:00", 115000, 340, 111000, 3200, 5700, 0, ""),
    ("1870-09-01T10:00", 135000, 420, 107000, 4100, 8000, 500, ""),
    ("1870-09-01T11:00", 150000, 500, 102000, 4900, 10400, 1500, "Bazeilles genommen"),
    ("1870-09-01T12:00", 165000, 560, 97000, 5650, 12300, 2500, ""),
    ("1870-09-01T13:00", 180000, 620, 92000, 6400, 13700, 3500, "Floing"),
    ("1870-09-01T14:00", 195000, 700, 87000, 7250, 15100, 5000, "Ring bei Illy geschlossen"),
    ("1870-09-01T14:30", 200000, 740, 80000, 7700, 15600, 12000, "Bois de la Garenne"),
    ("1870-09-01T15:00", 200000, 760, 77000, 8100, 16000, 15000, ""),
    ("1870-09-01T16:00", 200000, 774, 72000, 8850, 16600, 18000, "Balan"),
    ("1870-09-01T16:30", 200000, 774, 69000, 9200, 16900, 20000, "Feuer endet"),
    ("1870-09-01T18:00", 200000, 774, 66000, 9860, 17000, 21000, "Reille mit dem Brief"),
    ("1870-09-02T09:00", 200000, 774, 66000, 9860, 17000, 21000, "Waffenruhe"),
    ("1870-09-02T11:00", 200000, 774, 0, 9860, 17000, 104000, "Kapitulation"),
    ("1870-09-03T12:00", 200000, 774, 0, 9860, 17000, 104000, "Lager des Elends"),
]
K = ["zeit", "de_feld", "de_gesch", "fr_feld", "de_verl_kum", "fr_verl_kum", "fr_gef_kum", "ereignis"]
# fr_feld no dia 1/9 = 120 000 - perdas - presos (fecha com os 83 000 da capitulacao)
P = [(z, d, g, (120000 - fv - fg if z[:10] in ("1870-09-01", "1870-09-02") and fg < 104000 and z >= "1870-09-01T04:00" else f), dv, fv, fg, e)
     for z, d, g, f, dv, fv, fg, e in P]
doc = {"_info": "Sedan 1870, Stuetzpunkte (zeit lokal). Ankers: 200 000 / 774 (Grant, Howard); 120-130 000 (Grant); Beaumont 7 500; "
       "Gefangene 21 000 am 1.9. (WP-de) + 83 000 = 104 000 (Clodfelter); Verluste dt. 9 860 (Clodfelter), frz. ~17 000 T+V (WP-de). "
       "Dazwischen Modell (linear zwischen Stuetzpunkten). fr_feld = kampffaehig (Gefangene und Verluste abgezogen).",
       "punkte": [dict(zip(K, p)) for p in P]}
json.dump(doc, open("stunden.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(P), "pontos")
