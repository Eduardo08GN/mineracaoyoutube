# K17 v2: direção do vídeo (Opus, 05/11). Gera v1/src/plano.json + v1/src/cenas/{karten,ui,clips,epoca,welt}.json
# a partir da narração já alinhada do K17 v1 (k17_pioniere/roteiro/frases.json). Uma batida = uma ação que DEMONSTRA a frase.
#   python regie.py            (reescreve os JSON; não toca no código do kit)
import json, os, shutil, subprocess

K1 = r"D:\kriegschronik\k17_pioniere"
V = r"D:\kriegschronik\k17_v2\v1"
FR = json.load(open(os.path.join(K1, "roteiro", "frases.json"), encoding="utf-8"))
SK = json.load(open(os.path.join(K1, "roteiro", "skript_de.json"), encoding="utf-8"))["kapitel"]
PAUSA = 0.45

def dur_wav(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                capture_output=True, text=True, check=True).stdout)

# capítulos: começo absoluto = soma das falas anteriores + 0,45 s de pausa (igual ao g4_voz_mux do v1)
kap, t = [], 0.0
for c in SK:
    d = dur_wav(os.path.join(K1, "voz", c["id"] + ".wav"))
    kap.append({"id": c["id"], "s": round(t, 3), "e": round(t + d + PAUSA, 3), "titel": c.get("titel", c["id"])})
    t += d + PAUSA
DAUER = round(t + 3.55, 2)  # 3,5 s de cauda depois da última palavra (igual ao plano.py do creme)
F = {f["id"]: f for f in FR}

# ---------------- paleta creme (tinta) ----------------
INK, ROT, BLAU, GRAU, OCKER = "#2a2622", "#a4402a", "#24384f", "#6b6152", "#8a6a48"  # tokens C.tinte/signal/preussen/grau/sepia
LL = {"Sedan": [4.9433, 49.7034], "Donchery": [4.8736, 49.6972], "Mézières": [4.72, 49.762], "Frénois": [4.8996, 49.6855],
      "Flize": [4.7761, 49.6979], "Bazeilles": [5.0305, 49.7143], "Remilly": [4.9932, 49.6508], "Metz": [6.176, 49.12],
      "Corny": [6.0596, 49.0351], "Novéant": [6.0436, 49.0232], "PAM": [6.0548, 48.9026], "Dieulouard": [6.0683, 48.8416],
      "Marbache": [6.0996, 48.7967], "Saint-Avold": [6.705, 49.104], "Forbach": [6.9, 49.188], "Mars-la-Tour": [5.887, 49.098],
      "Juvisy": [2.3738, 48.6904], "Paris": [2.352, 48.857], "Corbeil": [2.4818, 48.6138], "Nouvion": [4.7958, 49.7006],
      "Mouzon": [5.0757, 49.6066], "Verdun": [5.384, 49.16]}
BAHN_SEDAN_MEZ = [[4.9433, 49.7034], [4.905, 49.7], [4.8736, 49.6972], [4.835, 49.703], [4.7958, 49.7006], [4.758, 49.733], [4.72, 49.762]]
# 6 feste Moselbrücken südlich von Metz (GSW S. 130): genannt nur die belegten Orte; zwei Marken ohne Namen dazwischen
MOSEL6 = [{"id": "corny", "ll": [6.0596, 49.0351], "name": "Corny"}, {"id": "m2", "ll": [6.026, 48.984], "name": ""},
          {"id": "m3", "ll": [6.052, 48.946], "name": ""}, {"id": "pam", "ll": [6.0548, 48.9026], "name": "Pont-à-Mousson"},
          {"id": "dieu", "ll": [6.0683, 48.8416], "name": "Dieulouard"}, {"id": "marb", "ll": [6.0996, 48.7967], "name": "Marbache"}]
MAAS = [{"id": "nouv", "ll": [4.7958, 49.7006], "name": "Nouvion"}, {"id": "flize", "ll": [4.7761, 49.6979], "name": "Flize"},
        {"id": "don", "ll": [4.8736, 49.6972], "name": "Donchery"}, {"id": "fren", "ll": [4.8996, 49.6855], "name": "Frénois"},
        {"id": "baz", "ll": [5.0305, 49.7143], "name": "Bazeilles"}, {"id": "rem", "ll": [4.9932, 49.6508], "name": "Remilly"}]

def W(w, nach=0.0, plus=0.0):
    return {"wort": w, "nach": nach, "plus": plus}

R_LOR = {"bild": "karten2/lorena_creme.jpg", "grenzen": [4.5, 48.5, 7.0, 50.0]}
R_SEINE = {"bild": "karten2/seine_creme.jpg", "grenzen": [1.9, 48.45, 3.1, 48.95]}
R_MAAS = {"bild": "karten2/maas_hd_creme.jpg", "grenzen": [4.62, 49.58, 5.12, 49.82]}
R_MOSEL = {"bild": "karten2/mosel_hd_creme.jpg", "grenzen": [5.82, 48.74, 6.32, 49.16]}
def grund(*r):
    return {"modus": "auto", "rasters": [{**x, "rand": 0.06} for x in r[::-1]], "netz": 0, "grenzen": 0.7, "fluesse": 0.55}
def fluss(ids, em=0, dauer=1.6, breite=4.5, o=1.0):
    return {"typ": "geojson", "datei": "k17_fluesse.geojson", "filter": {"id": ids}, "em": em, "dauer": dauer,
            "stil": {"stroke": "#3f6f8f", "breite": breite, "glow": 0}, "o": o}
def ort(n, seite="r", em=0, gross=22, name=None):
    return {"typ": "ort", "ll": LL[n], "name": name or n, "seite": seite, "em": em, "gross": gross}

# ---------------- batidas ----------------
B = []  # (id, frase_ini, frase_fim, familia, comp, props)
def beat(i, a, z, fam, comp, props, schnitt=False):
    B.append(dict(id=i, a=a, z=z, fam=fam, comp=comp, props=props, schnitt=schnitt))

# ===== 01 Der Zug =====
beat("b01", "01_01", "01_01", "karten", "Karte", {
    "kamera": [[0, 5.5, 49.35, 0.11], [3.3, 4.95, 49.70, 0.035]], "grund": grund(R_LOR), "rahmen": False,
    "ebenen": [fluss(["maas"], 0.2, 2.2), ort("Sedan", em=1.2, gross=30),
               {"typ": "stempel", "xy": [1430, 250], "text": "31. August 1870", "unter": "Sedan", "farbe": INK, "dreh": -4, "groesse": 64, "em": 0.4}]})
beat("b02", "01_02", "01_03", "karten", "Karte", {
    "kamera": [[0, 4.95, 49.705, 0.012], [9.9, 4.90, 49.70, 0.009]], "grund": grund(R_MAAS, R_LOR), "rahmen": False,
    "titel": {"text": "Sedan", "unter": "EIN ZUG NACH WESTEN", "em": 0.3},
    "ebenen": [fluss(["maas"], 0, 0.1, 7), ort("Sedan", "r", gross=30), ort("Donchery", "l", em=W("Richtung")),
               {"typ": "linie", "pts": BAHN_SEDAN_MEZ[:3], "farbe": INK, "breite": 5, "kopf": True, "em": W("verlässt"), "dauer": 7.5},
               {"typ": "text", "xy": [1480, 700], "gross": "Pioniere", "farbe": BLAU, "groesse": 52, "align": "c", "em": W("Pioniere")},
               {"typ": "text", "xy": [1480, 780], "gross": "Werkzeug", "farbe": INK, "groesse": 52, "align": "c", "em": W("Werkzeug")},
               {"typ": "text", "xy": [1480, 860], "gross": "Pulver", "farbe": ROT, "groesse": 60, "align": "c", "em": W("Pulver")}]})
beat("b03", "01_04", "01_05", "karten", "Karte", {
    "kamera": [[0, 4.90, 49.70, 0.011], [6.5, 4.88, 49.698, 0.0075]], "grund": grund(R_MAAS, R_LOR), "rahmen": False,
    "titel": {"text": "Donchery", "unter": "DER AUFTRAG", "em": 0.3},
    "ebenen": [fluss(["maas"], 0, 0.1, 7), ort("Donchery", "l", gross=28),
               {"typ": "ziel", "ll": [4.8745, 49.6985], "r": 50, "farbe": ROT, "drehen": 20, "em": W("Brücke")},
               {"typ": "text", "xy": [1480, 300], "gross": "sprengen", "farbe": ROT, "groesse": 70, "align": "c", "em": W("sprengen")},
               {"typ": "pfeil", "pts": [[4.95, 49.66], [4.91, 49.675], [4.885, 49.69]], "breite": 34, "farbe": BLAU, "fill": "rgba(36,56,79,0.35)",
                "verlauf": [[W("Deutschen"), 0], [W("kommen", plus=0.8), 1]]},
               {"typ": "text", "xy": [1480, 860], "gross": "bevor die Deutschen kommen", "farbe": BLAU, "groesse": 46, "align": "c", "em": W("Deutschen")}]})
beat("b04", "01_06", "01_09", "clips", "Clip", {
    "datei": "aktion/zug_pulver.mp4", "inicio": 0,
    "kopf": {"titel": "Donchery, 31. August 1870", "sub": "Die Pioniere steigen aus", "em": 0.5},
    "deko": [{"typ": "chip", "text": "NACH MÉZIÈRES", "x": 1780, "y": 150, "farbe": INK, "ausr": "r", "em": W("Mézières")},
             {"typ": "chip", "text": "MIT DEM PULVER", "x": 1780, "y": 215, "farbe": ROT, "ausr": "r", "em": W("Pulver")},
             {"typ": "chip", "text": "MIT DEM WERKZEUG", "x": 1780, "y": 280, "farbe": INK, "ausr": "r", "em": W("Werkzeug")}]})
beat("b04b", "01_10", "01_10", "karten", "Karte", {
    "kamera": [[0, 4.80, 49.725, 0.016], [2.6, 4.875, 49.698, 0.0065]], "grund": grund(R_MAAS, R_LOR), "rahmen": False,
    "ebenen": [fluss(["maas"], 0, 0.1, 7), ort("Donchery", "l"), ort("Mézières", "r"),
               {"typ": "linie", "pts": BAHN_SEDAN_MEZ[2:], "farbe": INK, "breite": 4, "dash": "12 8", "em": 0},
               {"typ": "symbol", "liste": [{"ll": [4.8745, 49.6985]}], "form": "quadrat", "s": 18, "farbe": INK, "em": 0},
               {"typ": "stempel", "xy": [1180, 380], "text": "STEHT", "unter": "Maasbrücke Donchery", "farbe": INK, "dreh": -6, "groesse": 84, "em": 0.5}]})

# ===== 02 Fragen =====
beat("b05", "02_01", "02_03", "karten", "Karte", {
    "kamera": [[0, 5.45, 49.27, 0.10], [9, 5.50, 49.25, 0.094]], "grund": grund(R_LOR), "rahmen": False,
    "titel": {"text": "Sommer 1870", "unter": "BRÜCKE UM BRÜCKE", "em": W("Sommer")},
    "ebenen": [fluss(["mosel", "maas"], 0, 1.2, 4), ort("Metz", em=0.2), ort("Sedan", "l", em=0.2),
               {"typ": "symbol", "liste": [{"ll": b["ll"]} for b in MOSEL6] + [{"ll": b["ll"]} for b in MAAS if b["id"] in ("don", "baz", "nouv")]
                + [{"ll": [5.1077, 49.5401]}, {"ll": [5.0757, 49.6066]}],
                "form": "quadrat", "s": 24, "farbe": INK, "em": W("Brücke"), "stufe": 0.38},
               {"typ": "text", "xy": [1500, 860], "gross": "unversehrt", "farbe": INK, "groesse": 58, "align": "c", "em": W("unversehrt")}]})
beat("b06", "02_04", "02_07", "ui", "Liste", {
    "held": {"titel": "3 Antworten", "em": W("drei"), "hoch": W("Pontonbrücke", plus=-0.8)},
    "zeilen": [{"titel": "Was kann ein Ponton?", "detail": "die Maschine", "em": W("Pontonbrücke", plus=-0.3)},
               {"titel": "Welche Brücken fielen?", "detail": "gesprengt · nicht gesprengt", "em": W("Brücken")},
               {"titel": "Warum war das entscheidend?", "detail": "Stunden oder Wochen", "em": W("ausgerechnet"), "farbe": ROT}]})

# ===== 03 Der Ponton =====
beat("b07", "03_01", "03_01", "ui", "Titel", {"teil": "TEIL 1", "titel": "Die Maschine", "kicker": "DER PREUSSISCHE PONTON", "tippen": 14})
PONTON_SEITE = "M0,0 L1120,0 L1050,120 L70,120 Z"
beat("b08", "03_02", "03_02", "ui", "Hinweis", {
    "kopf": {"titel": "DER PONTON", "nr": "1", "thema": "Maße"},
    "deko": [{"typ": "pfad", "d": PONTON_SEITE, "x": 400, "y": 330, "farbe": INK, "strich": 4, "em": 0.3, "dur": 2.4},
             {"typ": "linie", "x1": 400, "y1": 500, "x2": 1520, "y2": 500, "farbe": ROT, "strich": 3, "em": W("sieben"), "dur": 1.0},
             {"typ": "text", "text": "gut 7 m", "x": 960, "y": 520, "groesse": 52, "farbe": ROT, "ausr": "m", "em": W("sieben", plus=0.6)},
             {"typ": "rechteck", "x": 400, "y": 640, "w": 1120, "h": 240, "rx": 60, "farbe": INK, "strich": 4, "em": W("eineinhalb", plus=-0.4), "dur": 1.0},
             {"typ": "linie", "x1": 1580, "y1": 640, "x2": 1580, "y2": 880, "farbe": ROT, "strich": 3, "em": W("breit", plus=-0.3)},
             {"typ": "text", "text": "1,5 m", "x": 1610, "y": 740, "groesse": 52, "farbe": ROT, "em": W("breit")},
             {"typ": "text", "text": "SEITE", "x": 400, "y": 290, "groesse": 30, "farbe": GRAU, "schrift": "mono", "em": 0.3},
             {"typ": "text", "text": "OBEN", "x": 400, "y": 610, "groesse": 24, "farbe": GRAU, "schrift": "mono", "em": W("eineinhalb", plus=-0.4)},
             {"typ": "kreis", "x": 300, "y": 652, "r": 16, "farbe": INK, "fuell": 0, "strich": 3, "em": W("eineinhalb")},
             {"typ": "pfad", "d": "M0,0 L0,110 M-34,30 L34,30 M0,110 L-26,190 M0,110 L26,190", "x": 300, "y": 670, "farbe": INK, "strich": 4, "em": W("eineinhalb")},
             {"typ": "text", "text": "1,75 m", "x": 300, "y": 900, "groesse": 24, "farbe": GRAU, "schrift": "mono", "ausr": "m", "em": W("breit")}]})
beat("b09", "03_03", "03_04", "ui", "Balken", {
    "max": 5000, "kopf": {"titel": "DER PONTON", "nr": "1", "thema": "Gewicht und Last"},
    "balken": [{"y": 380, "wert": 500, "label": "Eigengewicht", "einheit": "kg", "farbe": INK, "em": W("wiegt")},
               {"y": 640, "wert": 5000, "label": "Tragkraft", "pfx": "fast ", "einheit": "kg", "farbe": ROT, "em": W("trägt"), "dur": 1.4}],
    "faktor": {"text": "≈ 10 ×", "unter": "trägt das Zehnfache seines Gewichts", "em": W("Tonnen", plus=0.3)}})
beat("b10", "03_05", "03_05", "ui", "Foto", {
    "bild": "f/k17/epinal_pontonniers.jpg", "stil": "rahmen", "w": 560, "h": 790, "y": 90, "winkel": -2,
    "von": {"zoom": 1.0, "x": 0.5, "y": 0.45}, "bis": {"zoom": 1.15, "x": 0.5, "y": 0.6},
    "legende": "Pontoniere mit ihrem Train", "legendeKicker": "ZEITGENÖSSISCHER BILDERBOGEN",
    "deko": [{"typ": "text", "text": "1 Wagen · 6 Pferde", "x": 1290, "y": 230, "groesse": 54, "farbe": INK, "em": W("Pferden")},
             {"typ": "chip", "text": "PONTON", "x": 1290, "y": 330, "farbe": INK, "em": W("Ponton")},
             {"typ": "chip", "text": "BALKEN", "x": 1290, "y": 420, "farbe": INK, "em": W("Balken")},
             {"typ": "chip", "text": "BRETTER", "x": 1290, "y": 510, "farbe": INK, "em": W("Bretter")},
             {"typ": "chip", "text": "SEILE", "x": 1290, "y": 600, "farbe": INK, "em": W("Seile")},
             {"typ": "chip", "text": "ANKER", "x": 1290, "y": 690, "farbe": INK, "em": W("Anker")},
             {"typ": "text", "text": "= 1 Brückenfeld", "x": 1290, "y": 800, "groesse": 48, "farbe": ROT, "em": W("Anker", plus=0.5)}]})
beat("b11", "03_06", "03_06", "ui", "Zahl", {
    "kicker": "PONTON-KOLONNE · JE ARMEEKORPS", "wert": 30, "bis": 30, "zaehler": True, "pfx": "über ", "einheit": "Wagen",
    "y": 300, "groesse": 170, "unter": "nach dem Etat",
    "deko": [{"typ": "raster", "x": 330, "y": 560, "spalten": 10, "zeilen": 3, "w": 112, "h": 70, "abstand": 16, "farbe": INK,
              "em": W("Ponton-Kolonne"), "dauer": 3.2}]})
beat("b12", "03_07", "03_09", "clips", "Clip", {
    "datei": "aktion/brueckenschlag.mp4", "inicio": 0,
    "kopf": {"titel": "Der Brückenschlag", "sub": "Feld um Feld", "em": 0.5},
    "deko": [{"typ": "chip", "text": "ANKER GEGEN DIE STRÖMUNG", "x": 120, "y": 150, "farbe": INK, "em": W("verankern"), "ate": W("Längsbalken")},
             {"typ": "chip", "text": "5 LÄNGSBALKEN", "x": 120, "y": 150, "farbe": INK, "em": W("Längsbalken")},
             {"typ": "chip", "text": "BRETTER", "x": 120, "y": 215, "farbe": INK, "em": W("Bretter")}]})
FELD_W = 150
beat("b13", "03_10", "03_11", "ui", "Hinweis", {
    "kopf": {"titel": "DER BRÜCKENSCHLAG", "nr": "1", "thema": "von oben"},
    "deko": [{"typ": "rechteck", "x": 140, "y": 380, "w": 1640, "h": 330, "farbe": BLAU, "fuell": 0.10, "strich": 0, "schraffur": True, "em": 0, "dur": 0}]
    + [{"typ": "rechteck", "x": 140 + k * FELD_W, "y": 470, "w": FELD_W - 6, "h": 150, "farbe": INK, "fuell": 0.18, "strich": 3,
        "em": 0.3 + k * 0.62, "dur": 0.35} for k in range(11)]
    + [{"typ": "linie", "x1": 140, "y1": 760, "x2": 140 + FELD_W, "y2": 760, "farbe": ROT, "strich": 3, "em": W("vier", plus=-0.6)},
       {"typ": "text", "text": "gut 4 m", "x": 140 + FELD_W / 2, "y": 780, "groesse": 40, "farbe": ROT, "ausr": "m", "em": W("vier")},
       {"typ": "text", "text": "Feld {z}", "x": 1500, "y": 240, "groesse": 64, "farbe": INK, "em": 0.3,
        "zaehler": {"von": 1, "bis": 11, "em": 0.3, "dauer": 6.8, "stellen": 0}},
       {"typ": "text", "text": "Ufer", "x": 60, "y": 545, "groesse": 30, "farbe": GRAU, "schrift": "mono", "em": 0}]})

# ===== 04 Mosel =====
beat("b14", "04_01", "04_01", "ui", "Titel", {"teil": "TEIL 2", "titel": "Die Mosel", "kicker": "AUGUST 1870", "tippen": 14})
beat("b15", "04_02", "04_05", "karten", "Karte", {
    "kamera": [[0, 6.35, 49.10, 0.06], [6.5, 6.15, 49.02, 0.045], [12.5, 6.06, 48.95, 0.03]], "grund": grund(R_MOSEL, R_LOR), "rahmen": False,
    "titel": {"text": "Die Mosel", "unter": "AUGUST 1870", "em": 0.3},
    "ebenen": [ort("Metz", em=0.2, gross=30),
               {"typ": "pfeil", "pts": [[6.75, 49.12], [6.5, 49.12], [6.25, 49.12]], "breite": 40, "farbe": ROT, "verlauf": [[0.3, 0], [W("Metz", plus=0.4), 1]]},
               fluss(["mosel"], W("Mosel"), 1.8, 6),
               {"typ": "text", "xy": [190, 900], "gross": "← Paris", "farbe": INK, "groesse": 46, "em": W("Paris")},
               {"typ": "symbol", "liste": MOSEL6, "form": "quadrat", "s": 15, "farbe": INK, "em": W("sechs"), "stufe": 0.3,
                "namen": {"em": W("sechs", plus=1.0), "groesse": 22},
                "ereignisse": [{"art": "hell", "t": W("Keine"), "dauer": 1.2}]},
               {"typ": "zahl", "label": "FESTE BRÜCKEN", "zaehlt": {"von": 0, "bis": 6, "dauer": 1.8}, "em": W("sechs"), "top": 150, "right": 110,
                "phasen": [{"t": W("Keine"), "farbe": INK, "suffix": " von 6 stehen"}]}]})
beat("b16", "04_06", "04_07", "karten", "Karte", {
    "kamera": [[0, 6.06, 49.03, 0.012], [3, 6.05, 49.035, 0.009], [5, 6.0, 49.06, 0.035], [10.3, 5.98, 49.07, 0.04]],
    "grund": grund(R_MOSEL, R_LOR), "rahmen": False,
    "ebenen": [fluss(["mosel"], 0, 0.1, 7), ort("Novéant", "l", gross=26), ort("Mars-la-Tour", "l", em=W("Mars")),
               {"typ": "marke", "ll": [6.052, 49.029], "titel": "Hängebrücke", "unter": "Corny – Novéant", "farbe": INK, "seite": "r", "dx": 30, "em": W("Hängebrücke"), "gross": 32},
               {"typ": "uhr", "schritte": [{"t": W("Nacht"), "wert": 0.95, "text": "Nacht"}], "x": 1700, "y": 200},
               {"typ": "datum", "anker": [{"t": 0, "wert": 15}, {"t": W("sechzehnten"), "wert": 16}], "fmt": "{nn}.08.", "kopf": "AUGUST 1870", "right": 110, "top": 330},
               {"typ": "pfeil", "pts": [[6.25, 49.0], [6.12, 49.025], [6.05, 49.03], [5.98, 49.06], [5.887, 49.098]], "breite": 30, "farbe": BLAU,
                "verlauf": [[W("marschiert"), 0], [W("Mars", plus=0.6), 1]]}]})
beat("b17", "04_08", "04_08", "ui", "Foto", {
    "bild": "f/k17/lancon_pont_a_mousson.jpg", "stil": "voll", "von": {"zoom": 1.05, "x": 0.35, "y": 0.5}, "bis": {"zoom": 1.25, "x": 0.55, "y": 0.55},
    "legendeKicker": "AUGUSTE LANÇON · 14. AUGUST 1870", "legende": "Pont-à-Mousson: die Brücke *unversehrt*"})
beat("b18", "04_09", "04_10", "ui", "Hinweis", {
    "held": {"titel": "Wo ist der Pontontrain?", "em": W("fragt"), "groesse": 120,
             "unter": [{"text": "15. August · Stab des III. Korps", "em": W("Stab")}]},
    "deko": [{"typ": "text", "text": "?", "x": 960, "y": 700, "groesse": 260, "farbe": ROT, "ausr": "m", "em": W("Niemand"), "pop": True, "puls": True}]})
beat("b19", "04_11", "04_13", "karten", "Karte", {
    "kamera": [[0, 6.45, 49.03, 0.05], [5, 6.35, 49.03, 0.045], [8.5, 6.10, 49.0, 0.05], [12.3, 5.95, 49.05, 0.045]], "grund": grund(R_LOR), "rahmen": False,
    "ebenen": [fluss(["mosel"], 0, 0.1, 5), ort("Saint-Avold", "r", gross=28), ort("PAM", "l", name="Pont-à-Mousson", em=0.3), ort("Mars-la-Tour", "l", em=W("Schlacht")),
               {"typ": "lineal", "a": LL["Saint-Avold"], "b": [6.06, 48.93], "schrittKm": 10, "farbe": ROT, "text": "52 km", "zaehler": False, "em": W("Saint-Avold"), "dauer": 2.4},
               {"typ": "datum", "anker": [{"t": 0, "wert": 15}, {"t": W("sechzehnten"), "wert": 16}], "fmt": "{nn}.08.", "kopf": "AUGUST 1870", "right": 1500, "top": 150},
               {"typ": "uhr", "schritte": [{"t": W("Viertel"), "wert": 0.53, "text": "12.45 Uhr"}], "x": 230, "y": 470},
               {"typ": "linie", "pts": [LL["Saint-Avold"], [6.45, 49.0], [6.06, 48.93]], "farbe": INK, "breite": 5, "kopf": True, "em": W("erreicht"), "dauer": 2.6},
               {"typ": "blitz", "ll": LL["Mars-la-Tour"], "farbe": ROT, "r": 18, "n": 8, "em": W("tobt"), "bis": W("schon", plus=0.6)}]})
beat("b20", "04_14", "04_14", "ui", "Zitat", {
    "kicker": "PREUSSISCHE PIONIER-CHRONIK", "text": "… die Brücken seien unglaublicherweise unversehrt gewesen.", "autor": "sinngemäß", "quelle": "Pionier-Chronik"})

# ===== 05 Tempo =====
beat("b21", "05_01", "05_01", "ui", "Hinweis", {"held": {"titel": "Was hätte eine Sprengung gekostet?", "em": 0.2, "groesse": 110}})
beat("b22", "05_02", "05_02", "ui", "Foto", {
    "bild": "f/k17/pomm_pionierbat_s90.jpg", "stil": "rahmen", "w": 560, "h": 860, "y": 60, "winkel": 1.5,
    "von": {"zoom": 1.0, "x": 0.5, "y": 0.5}, "bis": {"zoom": 1.6, "x": 0.5, "y": 0.42},
    "legendeKicker": "QUELLE", "legende": "Geschichte des Pommerschen Pionier-Bataillons Nr. 2, S. 90"})
beat("b23", "05_03", "05_03", "karten", "Karte", {
    "kamera": [[0, 2.36, 48.80, 0.04], [7.5, 2.38, 48.70, 0.012]], "grund": grund(R_SEINE), "rahmen": False,
    "titel": {"text": "Juvisy an der Seine", "unter": "17. NOVEMBER 1870", "em": W("Juvisy")},
    "ebenen": [fluss(["seine"], 0, 1.6, 5), ort("Paris", em=0), ort("Juvisy", "l", em=W("Juvisy"), gross=28),
               {"typ": "linie", "pts": [[2.3895, 48.6955], [2.3925, 48.6945]], "farbe": ROT, "breite": 8, "em": W("Brücke"), "dauer": 1.5},
               {"typ": "text", "ll": [2.391, 48.695], "dx": 40, "dy": -50, "gross": "141 m", "farbe": ROT, "groesse": 56, "em": W("einhunderteinundvierzig")}]})
beat("b24", "05_04", "05_04", "ui", "Hinweis", {
    "kopf": {"titel": "JUVISY", "nr": "2", "thema": "141 m Pontonbrücke"},
    "deko": [{"typ": "rechteck", "x": 100, "y": 420, "w": 1720, "h": 260, "farbe": BLAU, "fuell": 0.10, "strich": 0, "schraffur": True, "em": 0, "dur": 0},
             {"typ": "raster", "x": 112, "y": 500, "spalten": 31, "zeilen": 1, "w": 46, "h": 100, "abstand": 9, "farbe": INK, "em": W("Pontons", plus=-0.9), "dauer": 2.6},
             {"typ": "rechteck", "x": 1700, "y": 470, "w": 100, "h": 160, "farbe": OCKER, "fuell": 0.3, "strich": 3, "em": W("Bock"), "text": "Bock"},
             {"typ": "text", "text": "31 Pontons", "x": 112, "y": 330, "groesse": 60, "farbe": INK, "em": W("Pontons")},
             {"typ": "linie", "x1": 960, "y1": 700, "x2": 960, "y2": 900, "farbe": ROT, "strich": 3, "em": W("tiefes", plus=-0.6)},
             {"typ": "text", "text": "über 3 m tief", "x": 990, "y": 830, "groesse": 48, "farbe": ROT, "em": W("tiefes")}]})
beat("b25", "05_05", "05_06", "ui", "Formel", {
    "kopf": {"titel": "JUVISY", "nr": "2", "thema": "Bautempo"},
    "formeln": [{"tex": "\\htmlClass{T1}{105\\ \\text{min}}\\;\\div\\;\\htmlClass{T2}{31\\ \\text{Pontons}}\\;\\approx\\;\\htmlClass{T3}{3{,}4\\ \\text{min}}",
                 "groesse": 96, "y": 620, "terme": [{"em": W("Dauer")}, {"em": W("Minuten", plus=-1.4)}, {"em": W("Minuten", plus=-0.3), "hi": [W("Minuten"), W("Ponton", plus=0.8)]}],
                 "marken": [{"n": 3, "text": "pro Ponton", "em": W("Ponton")}]}],
    "deko": [{"typ": "bogen", "x": 960, "y": 310, "r": 165, "von": -90, "bis": 225, "farbe": ROT, "strich": 10, "em": W("Dauer"), "dur": 1.6},
             {"typ": "text", "text": "1 ¾ Std.", "x": 960, "y": 290, "groesse": 48, "farbe": INK, "ausr": "m", "em": W("eindreiviertel")}]})
beat("b26", "05_07", "05_09", "ui", "Balken", {
    "max": 160, "kopf": {"titel": "DIE MOSEL", "nr": "2", "thema": "Breite gegen Brücke"},
    "balken": [{"y": 380, "wert": 150, "von": 110, "label": "Mosel (Übergänge)", "einheit": "m", "text": "110–150 m", "farbe": BLAU, "em": W("hundertzehn")},
               {"y": 640, "wert": 141, "label": "1 Ponton-Kolonne (Juvisy)", "einheit": "m", "farbe": INK, "em": W("Ponton-Kolonne"), "dur": 1.6}],
    "faktor": {"text": "< 2 Stunden", "unter": "für den ganzen Fluss", "em": W("weniger")}})

# ===== 05b Der Fluss =====
beat("b27", "05b_01", "05b_01", "ui", "Foto", {
    "bild": "f/k17/gartenlaube_suresnes.jpg", "stil": "voll", "von": {"zoom": 1.25, "x": 0.65, "y": 0.5}, "bis": {"zoom": 1.05, "x": 0.5, "y": 0.5},
    "legendeKicker": "DIE GARTENLAUBE · 1871", "legende": "Pontonbrücke bei Suresnes"})
beat("b28", "05b_02", "05b_02", "karten", "Karte", {
    "kamera": [[0, 6.10, 49.06, 0.03], [5.6, 6.045, 49.025, 0.01]], "grund": grund(R_MOSEL, R_LOR), "rahmen": False,
    "titel": {"text": "Novéant", "unter": "SEPTEMBER 1870", "em": W("September")},
    "ebenen": [fluss(["mosel"], 0, 0.8, 7), ort("Novéant", "l", gross=28, em=W("Novéant")), ort("Metz", em=0),
               {"typ": "linie", "pts": [[6.0415, 49.0262], [6.0468, 49.0262]], "farbe": BLAU, "breite": 8, "em": W("Pontonbrücke"), "dauer": 1.4},
               {"typ": "strahl", "liste": [{"a": [6.06, 49.06], "b": [6.052, 49.045]}, {"a": [6.05, 49.015], "b": [6.04, 49.0]}], "farbe": BLAU, "breite": 2, "dash": "6 6", "em": 1.0}]})
beat("b29", "05b_03", "05b_05", "clips", "Clip", {
    "datei": "aktion/noveant_a.mp4", "inicio": 0,
    "kopf": {"titel": "Novéant, 11. September", "sub": "Hochwasser", "em": 0.4},
    "deko": [{"typ": "text", "text": "Strömung > 1 m/s", "x": 1780, "y": 150, "groesse": 52, "farbe": ROT, "ausr": "r", "em": W("Strömung")},
             {"typ": "chip", "text": "FLOSS", "x": 1780, "y": 230, "farbe": ROT, "ausr": "r", "em": W("Floß")},
             {"typ": "text", "text": "Halbmond", "x": 1780, "y": 300, "groesse": 52, "farbe": INK, "ausr": "r", "em": W("Halbmond")}]})
beat("b30", "05b_06", "05b_07", "clips", "Clip", {
    "datei": "aktion/noveant_b.mp4", "inicio": 0,
    "deko": [{"typ": "text", "text": "1 Uhr nachts", "x": 140, "y": 170, "groesse": 60, "farbe": INK, "em": W("Uhr"), "ate": W("sieben", plus=-0.1)},
             {"typ": "text", "text": "7 Uhr morgens", "x": 140, "y": 170, "groesse": 60, "farbe": INK, "em": W("sieben"), "ate": 99},
             {"typ": "text", "text": "16 Pontons", "x": 1780, "y": 170, "groesse": 70, "farbe": ROT, "ausr": "r", "em": W("sechzehn"), "pop": True}]})

# ===== 05c Frankreich =====
beat("b31", "05c_01", "05c_02", "ui", "Foto", {
    "bild": "f/k17/blancard_champigny.jpg", "stil": "voll", "von": {"zoom": 1.1, "x": 0.5, "y": 0.35}, "bis": {"zoom": 1.3, "x": 0.5, "y": 0.5},
    "legendeKicker": "FRANZÖSISCHE PONTONBRÜCKE · MARNE 1870", "legende": "Auch Frankreich hatte Pontons"})
beat("b32", "05c_03", "05c_04", "ui", "Zahl", {
    "kicker": "FORBACH · 6. AUGUST 1870", "wert": 42, "bis": 42, "zaehler": True, "einheit": "Wagen", "y": 280, "groesse": 170,
    "unter": "französischer Brückentrain, von den Deutschen erbeutet",
    "deko": [{"typ": "raster", "x": 250, "y": 520, "spalten": 14, "zeilen": 3, "w": 92, "h": 62, "abstand": 14, "farbe": ROT, "em": W("erbeuten"), "dauer": 2.8},
             {"typ": "text", "text": "ohne Pferde", "x": 960, "y": 900, "groesse": 76, "farbe": ROT, "ausr": "m", "em": W("Ohne"), "pop": True}]})
beat("b33", "05c_05", "05c_07", "karten", "Karte", {
    "kamera": [[0, 4.75, 49.62, 0.035], [5, 4.85, 49.67, 0.028], [12.5, 4.90, 49.69, 0.022]], "grund": grund(R_MAAS, R_LOR), "rahmen": False,
    "titel": {"text": "An der Maas", "unter": "ENDE AUGUST 1870", "em": 0.3},
    "ebenen": [fluss(["maas"], 0.2, 1.4, 6), ort("Sedan", em=0), ort("Donchery", "l", em=0),
               {"typ": "pfeil", "pts": [[4.55, 49.58], [4.70, 49.62], [4.82, 49.66]], "breite": 40, "farbe": ROT, "verlauf": [[0.2, 0], [W("Armee"), 1]]},
               {"typ": "text", "ll": [4.7, 49.6], "dx": 0, "dy": 60, "gross": "kein Pontontrain", "farbe": ROT, "groesse": 46, "em": W("keinen")},
               {"typ": "symbol", "liste": [m for m in MAAS if m["id"] in ("flize", "don", "fren", "baz", "rem")], "form": "quadrat", "s": 15, "farbe": INK,
                "em": W("festen"), "stufe": 0.2, "namen": {"em": W("festen", plus=0.6), "groesse": 20}},
               {"typ": "text", "xy": [1480, 820], "gross": "Hindernis für den Feind", "farbe": BLAU, "groesse": 44, "align": "c", "em": W("Hindernis")},
               {"typ": "text", "xy": [1480, 900], "gross": "der eigene Ausweg", "farbe": ROT, "groesse": 54, "align": "c", "em": W("Ausweg")}]})

# ===== 06 Maas =====
beat("b34", "06_01", "06_01", "ui", "Titel", {"teil": "TEIL 3", "titel": "Die Maas", "kicker": "ZWEI WOCHEN SPÄTER", "tippen": 14})
beat("b35", "06_02", "06_03", "karten", "Karte", {
    "kamera": [[0, 5.2, 49.45, 0.09], [8.4, 5.05, 49.6, 0.07]], "grund": grund(R_LOR), "rahmen": False,
    "ebenen": [fluss(["maas", "mosel"], 0, 1.0, 4), ort("Metz", em=0), ort("Sedan", "l", em=0, gross=28), ort("Verdun", em=0.3),
               {"typ": "pfeil", "pts": [[4.6, 49.55], [5.0, 49.55], [5.4, 49.45]], "breite": 46, "farbe": ROT, "verlauf": [[W("MacMahon"), 0], [W("durchbrechen"), 0.75]]},
               {"typ": "front", "pts": [[5.6, 49.2], [5.4, 49.4], [5.2, 49.55]], "farbe": BLAU, "breite": 6, "em": W("Deutschen"),
                "dann": [{"pts": [[5.4, 49.5], [5.15, 49.62], [4.95, 49.66]], "t": W("Norden"), "dauer": 2.5}]},
               {"typ": "pfeil", "pts": [[5.0, 49.56], [4.97, 49.64], [4.95, 49.69]], "breite": 34, "farbe": ROT, "verlauf": [[W("Norden"), 0], [W("Sedan", plus=0.5), 1]]}]})
beat("b36", "06_04", "06_06", "karten", "Karte", {
    "kamera": [[0, 4.90, 49.69, 0.02], [7.5, 4.86, 49.695, 0.016], [11.5, 4.875, 49.698, 0.008]], "grund": grund(R_MAAS, R_LOR), "rahmen": False,
    "titel": {"text": "Befehl: zerstören", "unter": "MAAS-ÜBERGÄNGE", "em": W("befiehlt")},
    "ebenen": [fluss(["maas"], 0, 0.1, 6), ort("Sedan", em=0),
               {"typ": "symbol", "liste": [m for m in MAAS if m["id"] in ("flize", "nouv", "don", "fren")], "form": "quadrat", "s": 16, "farbe": INK, "em": 0.2,
                "namen": {"em": 0.4, "groesse": 21},
                "ereignisse": [{"ids": ["flize", "fren"], "art": "fall", "t": W("Frénois")}, {"ids": ["don"], "art": "hell", "t": W("Donchery"), "dauer": 1.5}]},
               {"typ": "ziel", "ll": LL["Frénois"], "r": 34, "farbe": ROT, "treffer": W("Frénois")},
               {"typ": "ziel", "ll": LL["Flize"], "r": 34, "farbe": ROT, "treffer": W("Flize")},
               {"typ": "stempel", "xy": [1300, 300], "text": "STEHT", "unter": "Donchery", "farbe": INK, "dreh": -5, "groesse": 72, "em": W("stehen")}]})
BRUECKE_SEITE = "M0,0 L1500,0 M0,0 L0,40 L1500,40 L1500,0 M300,40 L300,260 M750,40 L750,260 M1200,40 L1200,260"
beat("b37", "06_07", "06_08", "ui", "Hinweis", {
    "kopf": {"titel": "BAZEILLES", "nr": "3", "thema": "31. August, Eisenbahnbrücke"},
    "deko": [{"typ": "rechteck", "x": 100, "y": 640, "w": 1720, "h": 300, "farbe": BLAU, "fuell": 0.10, "strich": 0, "schraffur": True, "em": 0, "dur": 0},
             {"typ": "pfad", "d": BRUECKE_SEITE, "x": 210, "y": 400, "farbe": INK, "strich": 5, "em": 0.2},
             {"typ": "text", "text": "Pulverfässer", "x": 900, "y": 300, "groesse": 46, "farbe": ROT, "ausr": "m", "em": W("sprengen")}]
    + [{"typ": "kreis", "x": 820 + 70 * k, "y": 378, "r": 26, "farbe": ROT, "fuell": 0.5, "strich": 3, "em": W("sprengen", plus=0.2 * k), "ate": W("werfen", plus=0.5 + 0.35 * k),
        "bahn": [[W("werfen", plus=0.35 * k), 0, 0], [W("werfen", plus=0.35 * k + 0.9), 40 + 30 * k, 330]]} for k in range(3)]
    + [{"typ": "kreis", "x": 860 + 100 * k, "y": 720, "r": 60, "farbe": BLAU, "fuell": 0, "strich": 3, "ring": True, "em": W("werfen", plus=0.35 * k + 0.9)} for k in range(3)]
    + [{"typ": "text", "text": "Bayerische Jäger", "x": 1500, "y": 300, "groesse": 40, "farbe": BLAU, "em": W("Bayerische")}]})
beat("b38", "06_09", "06_09", "ui", "Foto", {
    "bild": "f/k17/kehl_pont_de_bateaux.jpg", "stil": "voll", "von": {"zoom": 1.05, "x": 0.4, "y": 0.5}, "bis": {"zoom": 1.25, "x": 0.6, "y": 0.5},
    "legendeKicker": "PONTONBRÜCKE BEI KEHL · 1870", "legende": "Wo keine Brücke steht, *bauen* die Deutschen eine"})
beat("b39", "06_10", "06_12", "karten", "Karte", {
    "kamera": [[0, 4.998, 49.662, 0.012], [10.7, 4.993, 49.6535, 0.0045]], "grund": grund(R_MAAS, R_LOR), "rahmen": False,
    "titel": {"text": "Remilly", "unter": "31. AUGUST / 1. SEPTEMBER", "em": 0.3},
    "ebenen": [fluss(["maas"], 0, 0.1, 7), ort("Remilly", "r", gross=28),
               {"typ": "linie", "pts": [[4.9905, 49.6548], [4.9955, 49.6545]], "farbe": BLAU, "breite": 7, "em": W("zwei"), "dauer": 1.6},
               {"typ": "linie", "pts": [[4.9915, 49.6522], [4.9965, 49.6520]], "farbe": BLAU, "breite": 7, "dash": "10 8", "em": W("zwei", plus=0.5), "dauer": 1.6},
               {"typ": "blitz", "ll": [4.985, 49.66], "farbe": ROT, "r": 12, "n": 10, "em": W("Beschuss"), "bis": W("Nacht")},
               {"typ": "uhr", "schritte": [{"t": W("Nacht"), "wert": 0.12, "text": "3.00 Uhr"}, {"t": W("zehn"), "wert": 0.135, "text": "3.10 Uhr", "dauer": 1.2}], "x": 1700, "y": 220},
               {"typ": "linie", "pts": [[4.9915, 49.6522], [4.9965, 49.6520]], "farbe": BLAU, "breite": 9, "em": W("erste"), "dauer": 1.4},
               {"typ": "text", "xy": [1500, 880], "gross": "nach 10 Minuten fertig", "farbe": INK, "groesse": 50, "align": "c", "em": W("zehn")}]})

# ===== 07 Donchery =====
beat("b40", "07_01", "07_01", "ui", "Titel", {"stil": "zeile", "kicker": "DONCHERY · 1. SEPTEMBER 1870", "titel": "Der seltsamste Moment", "tippen": 16})
beat("b41", "07_02", "07_02", "karten", "Karte", {
    "kamera": [[0, 4.88, 49.70, 0.012], [4.7, 4.871, 49.6975, 0.006]], "grund": grund(R_MAAS, R_LOR), "rahmen": False,
    "titel": {"text": "Donchery", "unter": "ZWEI BRÜCKEN", "em": 0.2},
    "ebenen": [fluss(["maas"], 0, 0.1, 7),
               {"typ": "symbol", "liste": [{"id": "str", "ll": [4.8745, 49.6985], "name": "Straßenbrücke", "nameSeite": "u"}], "form": "quadrat", "s": 15, "farbe": INK, "namen": {"em": 0.3}},
               {"typ": "linie", "pts": BAHN_SEDAN_MEZ[1:4], "farbe": INK, "breite": 4, "dash": "14 8", "em": W("Eisenbahnbrücke", plus=-0.5), "dauer": 1.4},
               {"typ": "marke", "ll": [4.866, 49.7005], "titel": "Eisenbahnbrücke", "unter": "unversehrt", "farbe": INK, "seite": "o", "dy": -30, "em": W("Eisenbahnbrücke"), "ring": True}]})
beat("b42", "07_03", "07_05", "ui", "Liste", {
    "kopf": {"titel": "DONCHERY", "nr": "4", "thema": "Was fehlte"},
    "zeilen": [{"ikon": "haken", "titel": "Sprengkammern gebohrt", "em": W("Sprengkammern")},
               {"ikon": "haken", "titel": "Material zum Verdämmen bereit", "em": W("Verdämmen")},
               {"ikon": "kreuz", "titel": "Pulver", "farbe": ROT, "titelfarbe": ROT, "em": W("Pulver"),
                "rechts": {"typ": "text", "text": "im Zug nach Mézières", "em": W("Zug")}}]})
beat("b43", "07_06", "07_06", "karten", "Karte", {
    "kamera": [[0, 4.87, 49.70, 0.009], [6.3, 4.866, 49.7005, 0.004]], "grund": grund(R_MAAS, R_LOR), "rahmen": False, "dunkel": 0.35,
    "ebenen": [fluss(["maas"], 0, 0.1, 8), ort("Donchery", "l"),
               {"typ": "uhr", "schritte": [{"t": W("zwei"), "wert": 0.08, "text": "2 Uhr nachts"}], "x": 1700, "y": 220},
               {"typ": "datum", "anker": [{"t": 0, "wert": 1}], "fmt": "{n}. September", "kopf": "1870", "right": 110, "top": 380},
               {"typ": "strahl", "a": [4.876, 49.705], "b": [4.8665, 49.7008], "farbe": BLAU, "breite": 4, "bog": 30, "em": W("preußische")},
               {"typ": "ziel", "ll": [4.866, 49.7005], "r": 40, "farbe": ROT, "drehen": 25, "em": W("sprengen")}]})
beat("b44", "07_07", "07_09", "clips", "Clip", {
    "datei": "aktion/donchery_lento.mp4", "inicio": 0,
    "kopf": {"titel": "Donchery, 2 Uhr nachts", "sub": "die französischen Kammern", "em": 0.3},
    "deko": [{"typ": "text", "text": "2 × 235 Pfund", "x": 140, "y": 170, "groesse": 60, "farbe": ROT, "em": W("Ladungen")},
             {"typ": "text", "text": "− 72 m", "x": 1780, "y": 170, "groesse": 80, "farbe": ROT, "ausr": "r", "em": W("zweiundsiebzig"), "pop": True}]})
beat("b45", "07_10", "07_11", "karten", "Karte", {
    "kamera": [[0, 4.87, 49.70, 0.03], [7.1, 4.94, 49.72, 0.04]], "grund": grund(R_MAAS, R_LOR), "rahmen": False,
    "ebenen": [fluss(["maas"], 0, 0.1, 6), ort("Sedan", "r", gross=30), ort("Donchery", "l"),
               {"typ": "pfeil", "pts": [[4.86, 49.64], [4.873, 49.69], [4.89, 49.74], [4.93, 49.76]], "breite": 36, "farbe": BLAU, "verlauf": [[W("marschieren"), 0], [W("Maas", plus=0.6), 1]]},
               {"typ": "pfeil", "pts": [[4.80, 49.65], [4.82, 49.70], [4.86, 49.75], [4.91, 49.775]], "breite": 36, "farbe": BLAU, "verlauf": [[W("zwei", plus=0.3), 0], [W("Maas", plus=1.0), 1]]},
               {"typ": "front", "pts": [[4.88, 49.77], [4.96, 49.775], [5.03, 49.74], [5.03, 49.68]], "farbe": BLAU, "breite": 7, "em": W("Ring", plus=-0.5)},
               {"typ": "uhr", "schritte": [{"t": W("elf"), "wert": 0.46, "text": "11 Uhr"}], "x": 1700, "y": 220},
               {"typ": "kreis", "ll": LL["Sedan"], "km": 4.5, "farbe": ROT, "dash": "10 8", "em": W("schließt"), "modus": "wachsen", "dauer": 1.2}]})

# ===== 08 Kosten =====
beat("b46", "08_01", "08_01", "ui", "Hinweis", {"held": {"titel": "Warum sprengte Frankreich nicht?", "em": 0.2, "groesse": 110}})
beat("b47", "08_02", "08_03", "ui", "Liste", {
    "held": {"titel": "Chaos", "em": W("Chaos"), "hoch": W("Befehle", plus=-0.5)},
    "zeilen": [{"ikon": "warnung", "titel": "Befehle zu spät", "em": W("Befehle")},
               {"ikon": "warnung", "titel": "Truppen erschöpft", "em": W("erschöpft")},
               {"ikon": "warnung", "titel": "ein Zug fuhr weiter", "farbe": ROT, "em": W("Zug")}]})
beat("b48", "08_04", "08_05", "ui", "Titel", {"stil": "zeile", "kicker": "DER ZWEITE TEIL DER ANTWORT", "titel": "Sprengen half wenig", "titelEm": W("Selbst"), "tippen": 16})
BRUECKE_KAPUTT = "M0,0 L520,0 L560,60 M760,90 L800,0 L1300,0 M0,0 L0,40 L520,40 M800,40 L1300,40 M260,40 L260,260 M1040,40 L1040,260"
beat("b49", "08_06", "08_07", "ui", "Hinweis", {
    "kopf": {"titel": "CORBEIL", "nr": "5", "thema": "September 1870"},
    "deko": [{"typ": "rechteck", "x": 100, "y": 560, "w": 1720, "h": 340, "farbe": BLAU, "fuell": 0.10, "strich": 0, "schraffur": True, "em": 0, "dur": 0},
             {"typ": "pfad", "d": BRUECKE_KAPUTT, "x": 300, "y": 330, "farbe": INK, "strich": 5, "em": W("gesprengte", plus=-0.4)},
             {"typ": "text", "text": "gesprengt", "x": 960, "y": 280, "groesse": 46, "farbe": ROT, "ausr": "m", "em": W("gesprengte")},
             {"typ": "raster", "x": 300, "y": 660, "spalten": 26, "zeilen": 1, "w": 40, "h": 70, "abstand": 10, "farbe": BLAU, "em": W("Pontonbrücke", plus=-1.2), "dauer": 2.2},
             {"typ": "text", "text": "140 m daneben", "x": 300, "y": 780, "groesse": 48, "farbe": BLAU, "em": W("hundertvierzig")},
             {"typ": "bogen", "x": 1650, "y": 230, "r": 90, "von": -90, "bis": 720, "farbe": ROT, "strich": 9, "em": W("Zweieinviertel"), "dur": 2.0},
             {"typ": "text", "text": "2 ¼ Std.", "x": 1650, "y": 230, "groesse": 36, "farbe": INK, "ausr": "m", "em": W("Stunden")}]})
beat("b50", "08_08", "08_08", "ui", "Foto", {
    "bild": "f/k17/braquehais_asnieres.jpg", "stil": "rahmen", "w": 1000, "h": 720, "y": 70, "winkel": -1.5,
    "von": {"zoom": 1.0, "x": 0.5, "y": 0.5}, "bis": {"zoom": 1.15, "x": 0.45, "y": 0.5},
    "legendeKicker": "ASNIÈRES 1871 · FOTO BRAQUEHAIS", "legende": "Pontonbrücke neben der gesprengten Brücke",
    "deko": [{"typ": "text", "text": "„… keine Verzögerung verursacht.“", "x": 1470, "y": 880, "groesse": 46, "farbe": INK, "ausr": "m", "em": W("Verzögerung", plus=-1.0), "tippen": 22}]})
TUNNEL = "M0,300 L0,120 Q0,0 160,0 Q320,0 320,120 L320,300"
beat("b51", "08_09", "08_10", "ui", "Hinweis", {
    "held": {"titel": "Die Eisenbahn", "em": 0.2, "hoch": W("Tunnel", plus=-0.6), "groesse": 130},
    "deko": [{"typ": "pfad", "d": TUNNEL, "x": 800, "y": 480, "farbe": INK, "strich": 6, "em": W("Tunnel")},
             {"typ": "wuerfel", "x": 900, "y": 700, "u": 46, "farbe": GRAU, "stapel": 3, "em": W("gesprengten")},
             {"typ": "wuerfel", "x": 1000, "y": 720, "u": 40, "farbe": GRAU, "stapel": 2, "em": W("gesprengten", plus=0.3)},
             {"typ": "text", "text": "Nanteuil", "x": 960, "y": 860, "groesse": 44, "farbe": INK, "ausr": "m", "em": W("Nanteuil")},
             {"typ": "text", "text": "Wochen", "x": 960, "y": 950, "groesse": 84, "farbe": ROT, "ausr": "m", "em": W("Wochen"), "pop": True}]})
beat("b52", "08_11", "08_11", "ui", "Foto", {
    "bild": "f/k17/montlouis_bogen.jpg", "stil": "voll", "von": {"zoom": 1.05, "x": 0.5, "y": 0.5}, "bis": {"zoom": 1.25, "x": 0.5, "y": 0.45},
    "legendeKicker": "MONTLOUIS AN DER LOIRE", "legende": "*17 Tage* ohne Züge"})
beat("b53", "08_12", "08_13", "ui", "Balken", {
    "max": 408, "kopf": {"titel": "WAS EINE SPRENGUNG KAUFT", "nr": "5", "thema": "Stunden gegen Wochen"},
    "balken": [{"y": 380, "wert": 2.25, "label": "gegen Pontons (Corbeil)", "text": "2 ¼ Stunden", "farbe": BLAU, "em": W("Pontons")},
               {"y": 640, "wert": 408, "label": "gegen Züge (Montlouis)", "text": "17 Tage", "farbe": ROT, "em": W("Züge"), "dur": 1.8}],
    "faktor": {"text": "≈ 180 ×", "unter": "länger", "em": W("Wochen", plus=0.2)}})

# ===== 09 Schluss =====
beat("b54", "09_01", "09_02", "karten", "Karte", {
    "kamera": [[0, 5.5, 49.35, 0.1], [7.8, 5.45, 49.38, 0.088]], "grund": grund(R_LOR), "rahmen": False,
    "titel": {"text": "Was wir sicher wissen", "unter": "", "em": 0.2},
    "ebenen": [fluss(["mosel", "maas"], 0, 0.1, 4), ort("Metz"), ort("Sedan", "l"),
               {"typ": "symbol", "liste": [{"ll": b["ll"]} for b in MOSEL6], "form": "quadrat", "s": 22, "farbe": INK, "em": W("sechs"), "stufe": 0.15},
               {"typ": "symbol", "liste": [{"ll": LL["Donchery"]}, {"ll": LL["Bazeilles"]}], "form": "quadrat", "s": 22, "farbe": INK, "em": W("Donchery"), "stufe": 0.4},
               {"typ": "text", "xy": [1500, 880], "gross": "blieben stehen", "farbe": INK, "groesse": 56, "align": "c", "em": W("blieben")}]})
beat("b55", "09_03", "09_03", "ui", "Foto", {
    "bild": "f/k17/gsw_s1115.jpg", "stil": "rahmen", "w": 560, "h": 860, "y": 60, "winkel": 1,
    "von": {"zoom": 1.0, "x": 0.5, "y": 0.5}, "bis": {"zoom": 1.7, "x": 0.5, "y": 0.85},
    "legendeKicker": "GENERALSTABSWERK", "legende": "Bd. II, S. 1115 · Fußnote"})
beat("b56", "09_04", "09_04", "ui", "Formel", {
    "kopf": {"titel": "BERECHNET", "nr": "6", "thema": "aus den Pionierberichten"},
    "formeln": [{"tex": "\\htmlClass{T1}{\\frac{141\\ \\text{m}}{1{,}75\\ \\text{h}}}\\;\\approx\\;\\htmlClass{T2}{80\\ \\text{m pro Stunde}}", "groesse": 92, "y": 520,
                 "terme": [{"em": W("Berechnet")}, {"em": W("Bautempo")}]}]})
beat("b57", "09_05", "09_07", "ui", "Vergleich", {
    "kopf": {"titel": "OFFEN", "nr": "6", "thema": "die französische Sicht"},
    "spalten": [{"farbe": INK, "kicker": "MOLTKE", "titel": "Erschöpfung", "em": W("Moltke")},
                {"farbe": GRAU, "kicker": "ANDERE", "titel": "Chaos des Rückzugs", "em": W("andere")}],
    "deko": [{"typ": "text", "text": "Warum wurde der Befehl nicht ausgeführt?", "x": 960, "y": 200, "groesse": 50, "farbe": INK, "ausr": "m", "em": W("Warum")},
             {"typ": "text", "text": "?", "x": 960, "y": 560, "groesse": 200, "farbe": ROT, "ausr": "m", "em": W("andere", plus=1.0), "pop": True}]})
beat("b58", "09_08", "09_10", "ui", "Vergleich", {
    "kopf": {"titel": "DIE ANTWORT", "nr": "", "thema": ""},
    "spalten": [{"farbe": INK, "kicker": "MOSEL · DONCHERY", "titel": "nicht gesprengt", "em": W("nicht", nach=6)},
                {"farbe": INK, "kicker": "MAAS", "titel": "zu spät gesprengt", "em": W("spät")},
                {"farbe": ROT, "kicker": "CORBEIL", "titel": "in 2 Std. ersetzt", "em": W("genau")}],
    "deko": [{"typ": "text", "text": "Frankreich verlor die Brücken nicht, weil es sie sprengte.", "x": 960, "y": 170, "groesse": 46, "farbe": INK, "ausr": "m", "em": W("Frankreich"), "tippen": 30},
             {"typ": "text", "text": "Stunden statt Wochen", "x": 960, "y": 860, "groesse": 96, "farbe": ROT, "ausr": "m", "schrift": "titel", "em": W("Stunden", nach=10, plus=0.4), "pop": True}]})

# ---------------- takes 3D extras (sobem o 3D de 9% para ~19%); o desenho 2D acima fica de reserva ----------------
EXTRA_3D = os.environ.get("K17_EXTRA_3D", "1") == "1"
TROCA = {
    "b09": {"datei": "aktion/ponton_last.mp4", "kopf": {"titel": "Der Ponton", "sub": "Gewicht und Last", "em": 0.3},
            "deko": [{"typ": "text", "text": "500 kg", "x": 140, "y": 170, "groesse": 70, "farbe": INK, "em": W("wiegt")},
                     {"typ": "text", "text": "Last {z} kg", "x": 140, "y": 260, "groesse": 70, "farbe": ROT, "em": 1.1,
                      "zaehler": {"von": 0, "bis": 4650, "em": 1.22, "dauer": 4.14, "stellen": 0}},
                     {"typ": "text", "text": "trägt fast 5 Tonnen", "x": 140, "y": 350, "groesse": 52, "farbe": INK, "em": W("trägt")}]},
    "b13": {"datei": "aktion/feld_um_feld.mp4", "kopf": {"titel": "Feld um Feld", "sub": "gut 4 m pro Ponton", "em": W("vier")},
            "deko": [{"typ": "text", "text": "Feld {z}", "x": 1780, "y": 170, "groesse": 64, "farbe": INK, "ausr": "r", "em": 0.3,
                      "zaehler": {"von": 1, "bis": 13, "em": 0.94, "dauer": 6.46, "stellen": 0}}]},
    "b24": {"datei": "aktion/juvisy_141.mp4", "kopf": {"titel": "Juvisy, 141 m", "sub": "eine Ponton-Kolonne", "em": 0.3},
            "deko": [{"typ": "chip", "text": "31 PONTONS", "x": 140, "y": 150, "farbe": INK, "em": W("Pontons")},
                     {"typ": "chip", "text": "1 BOCK", "x": 140, "y": 215, "farbe": INK, "em": W("Bock")},
                     {"typ": "chip", "text": "WASSER > 3 M TIEF", "x": 140, "y": 280, "farbe": ROT, "em": W("tiefes")}]},
    "b37": {"datei": "aktion/bazeilles_faesser.mp4", "kopf": {"titel": "Bazeilles, 31. August", "sub": "die Eisenbahnbrücke", "em": 0.3},
            "deko": [{"typ": "chip", "text": "PULVERFÄSSER", "x": 140, "y": 150, "farbe": ROT, "em": W("sprengen")},
                     {"typ": "chip", "text": "BAYERISCHE JÄGER", "x": 140, "y": 215, "farbe": BLAU, "em": W("Bayerische")}]},
    "b49": {"datei": "aktion/corbeil.mp4", "kopf": {"titel": "Corbeil an der Seine", "sub": "September 1870", "em": 0.3},
            "deko": [{"typ": "chip", "text": "GESPRENGT", "x": 140, "y": 150, "farbe": ROT, "em": W("gesprengte")},
                     {"typ": "text", "text": "{z} Std.", "x": 1780, "y": 170, "groesse": 70, "farbe": INK, "ausr": "r", "em": W("Zweieinviertel"),
                      "zaehler": {"von": 0, "bis": 2.25, "em": W("Zweieinviertel"), "dauer": 2.0, "stellen": 2}},
                     {"typ": "text", "text": "Pontonbrücke · 140 m", "x": 1780, "y": 250, "groesse": 48, "farbe": BLAU, "ausr": "r", "em": W("hundertvierzig")}]},
}
if EXTRA_3D:
    for b in B:
        if b["id"] in TROCA:
            b["reserva"] = {"comp": b["comp"], "props": b["props"]}
            b["fam"], b["comp"], b["props"] = "clips", "Clip", {"inicio": 0, **TROCA[b["id"]]}

# ---------------- cartões vivos: lugar/desenho técnico sob o papel, em deriva (régua: cartões estavam 76% parados) ----------------
U_LOR = lambda x, y: {"bild": "karten2/unter_lorena.jpg", "x": x, "y": y, "o": 0.3}
U = {"01_zug": {"bild": "karten2/unter_maas_hd.jpg", "x": 0.5, "y": 0.45, "o": 0.3}, "02_fragen": U_LOR(0.45, 0.45),
     "03_ponton": {"bild": "karten2/unter_mosel_hd.jpg", "x": 0.5, "y": 0.3, "o": 0.3},
     "04_mosel": {"bild": "karten2/unter_mosel_hd.jpg", "x": 0.5, "y": 0.5, "o": 0.3}, "05_tempo": {"bild": "karten2/unter_seine.jpg", "x": 0.4, "y": 0.5, "o": 0.3},
     "05b_fluss": {"bild": "karten2/unter_mosel_hd.jpg", "x": 0.45, "y": 0.6, "o": 0.3}, "05c_frankreich": U_LOR(0.8, 0.55),
     "06_maas": {"bild": "karten2/unter_maas_hd.jpg", "x": 0.4, "y": 0.5, "o": 0.3}, "07_donchery": {"bild": "karten2/unter_maas_hd.jpg", "x": 0.35, "y": 0.45, "o": 0.3},
     "08_kosten": {"bild": "karten2/unter_seine.jpg", "x": 0.6, "y": 0.6, "o": 0.3}, "09_schluss": U_LOR(0.5, 0.5)}
for b in B:
    if b["fam"] == "ui" and b["comp"] != "Foto":
        k = sum(1 for x in B[:B.index(b)] if x["fam"] == "ui")
        b["props"].setdefault("grundBild", {**U[F[b["a"]]["cap"]], "zoom": 1.6, "vx": 30 if k % 2 else -30, "vy": 10 if k % 3 else -10, "vz": 0.008})
    if b["comp"] == "Foto":   # Ken Burns de verdade: >= 30 % de zoom e deslocamento lateral
        v, n = b["props"]["von"], b["props"]["bis"]
        n["zoom"] = max(n["zoom"], v["zoom"] + 0.32)
        if abs(n.get("x", 0.5) - v.get("x", 0.5)) < 0.12: n["x"] = min(0.85, v.get("x", 0.5) + 0.15)

# ---------------- plano.json ----------------
ordem = [f["id"] for f in FR]
def idx(fid): return ordem.index(fid)
beats, n_kap = [], {}
for i, b in enumerate(B):
    a, z = F[b["a"]], F[b["z"]]
    s = 0.0 if i == 0 else round((F[ordem[idx(b["a"]) - 1]]["t1"] + a["t0"]) / 2, 3)
    b["s"] = s
for i, b in enumerate(B):
    b["e"] = B[i + 1]["s"] if i + 1 < len(B) else DAUER
    kp = F[b["a"]]["cap"]; n_kap[kp] = n_kap.get(kp, 0) + 1
    txt = " ".join(F[o]["texto"] for o in ordem[idx(b["a"]): idx(b["z"]) + 1])
    beats.append({"id": b["id"], "kap": kp, "n": n_kap[kp], "s": b["s"], "e": round(b["e"], 3), "dono": b["fam"], "bild": txt,
                  "wort": "", "zaehler": False, **({"schnitt": True} if b["schnitt"] else {})})
woerter = {}
for f in FR:
    woerter.setdefault(f["cap"], []).extend({"w": p["w"], "s": p["s"], "e": p["e"]} for p in f["palavras"])
plano = {"dauer": DAUER, "fps": 30, "kapitel": kap, "beats": beats, "woerter": woerter}

if __name__ == "__main__":
    os.makedirs(f"{V}/src/cenas", exist_ok=True)
    json.dump(plano, open(f"{V}/src/plano.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    fam = {}
    for b in B:
        fam.setdefault(b["fam"], {})[b["id"]] = {"comp": b["comp"], "props": b["props"]}
    for nome in ("karten", "ui", "clips", "epoca", "welt"):
        alvo = f"{V}/src/cenas/{nome}.json"
        dados = fam.get(nome, {})
        if nome == "karten":
            dados = {"_vorlagen": {}, **dados}
        json.dump(dados, open(alvo, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    # rios do K17 v1 como GeoJSON com id (Mosel/Maas/Seine destacados por camada)
    g = json.load(open(os.path.join(K1, "cena", "karte", "geo.json"), encoding="utf-8"))
    g2 = json.load(open(os.path.join(K1, "cena", "karte_seine", "geo.json"), encoding="utf-8"))
    feats = []
    for nome, linhas in {**g["rios"], **{"seine": g2["rios"]["seine"]}}.items():
        feats.append({"type": "Feature", "properties": {"id": nome}, "geometry": {"type": "MultiLineString", "coordinates": linhas}})
    os.makedirs(f"{V}/public/geo", exist_ok=True)
    json.dump({"type": "FeatureCollection", "features": feats}, open(f"{V}/public/geo/k17_fluesse.geojson", "w", encoding="utf-8"))
    # imagens de época (uma vez cada)
    os.makedirs(f"{V}/public/f/k17", exist_ok=True)
    for src, dst in [("09_epinal_pontonniers_et_train.jpg", "epinal_pontonniers.jpg"), ("03_lancon_pont-a-mousson_14aug1870.jpg", "lancon_pont_a_mousson.jpg"),
                     ("14_scan_pomm_pionierbat2_s90_juvisy_141m.jpg", "pomm_pionierbat_s90.jpg"), ("01_gartenlaube1871_pontonbruecke_suresnes.jpg", "gartenlaube_suresnes.jpg"),
                     ("04_blancard_champigny_pont_de_bateaux_marne.jpg", "blancard_champigny.jpg"), ("08_kehl_pont_de_bateaux_1870.jpg", "kehl_pont_de_bateaux.jpg"),
                     ("02_braquehais_asnieres_pontonbruecke_1870-71.png", "braquehais_asnieres.jpg"), ("05_blaise_montlouis_bogen_gesprengt.jpg", "montlouis_bogen.jpg"),
                     ("13_scan_generalstabswerk_s1115_donchery_fussnote.jpg", "gsw_s1115.jpg"), ("11_meyers1907_fig2_bock_pontonstrecke.jpg", "meyers_bock_strecke.jpg")]:
        from PIL import Image
        im = Image.open(os.path.join(K1, "ref", src)).convert("RGB")
        if max(im.size) > 3000: im.thumbnail((3000, 3000))
        im.save(f"{V}/public/f/k17/{dst}", quality=90)
    tot = {}
    for b in beats: tot[b["dono"]] = tot.get(b["dono"], 0) + b["e"] - b["s"]
    print("DAUER", DAUER, "batidas", len(beats), {k: f"{v:.0f}s {100 * v / DAUER:.0f}%" for k, v in tot.items()})
    print("mais longas:", sorted(((round(b["e"] - b["s"], 1), b["id"]) for b in beats), reverse=True)[:6])
