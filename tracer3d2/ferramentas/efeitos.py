# Tracer3D 2.0: posiciona os efeitos sonoros pelas batidas (v1/src/plano.json) por palavras-chave da descricao da batida
# e do texto falado, sem LLM. Saida: audio/efeitos_plano.json (formato do mixar.py). Regras: no maximo 1 efeito por
# batida, >= 6 s entre efeitos do mesmo id, camas (dur) mais baixas; variantes alternadas.
import json, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(f"{R}/v1/src/plano.json", encoding="utf-8"))
GAP = {"s01": 35, "s02": 40, "s03": 45, "s04": 90, "s05": 150, "s06": 60, "s07": 60, "s08": 70, "s09": 90, "s10": 90, "s11": 90, "s12": 90}   # intervalo minimo por efeito (s)
import glob as _g
VAR = {}   # variantes que existem de fato em audio/pe (o mapa de cada video define quantas)
for _f in _g.glob(f"{R}/audio/pe/*.flac"): _i = os.path.basename(_f).split("_")[0]; VAR[_i] = VAR.get(_i, 0) + 1
# (id, regex na descricao/fala, lufs, dur ou None = efeito inteiro, atraso s)
REGRAS = [
    ("s12", r"eisenbahnhaubitze|vierzig zentimeter|40 cm", -21, None, 0.2),
    ("s02", r"schlagen .*ein|einschlag|schl[aä]gt .*ein|impacto|trichter", -23, None, 0.3),
    ("s01", r"feuert|abschuss|schuss f[aä]llt|eröffnen sie das feuer|disparo|dispara", -22, None, 0.1),
    ("s03", r"kommen sie an|vierzehn sekunden|granate (steigt|f[aä]llt)|trajet[oó]ria", -27, None, 0.3),
    ("s06", r"leuchtkugel|signal|sinalizador|flare", -26, None, 0.1),
    ("s07", r"feldtelefon|telegramm|meldet|funk|br[uü]gge", -29, None, 0.2),
    ("s09", r"ballon|theodolit", -30, None, 0.2),
    ("s08", r"h[uü]lse|ladung|pulver|verschluss|estojo", -28, None, 0.2),
    ("s10", r"nebel|neblina|fog", -31, 9.0, 0.0),
    ("s04", r"trommelfeuer|sperrfeuer|feuerwalze|million granaten|barragem", -28, 9.0, 0.0),
    ("s11", r"graben|sch[uü]tzenl[oö]cher|trincheira|posten", -32, 9.0, 0.0),
    ("s05", r"nacht|kalt|windstill|noite|frio", -33, 10.0, 0.0),
]
woerter = P["woerter"]
def fala(b):
    return " ".join(w["w"] for w in woerter.get(b["kap"], []) if b["s"] <= w["s"] < b["e"]).lower()
plano, ult, uso = [], {}, {}
for b in P["beats"]:
    txt = (b.get("bild", "") + " " + fala(b)).lower()
    for i, rx, lufs, dur, atraso in REGRAS:
        if not re.search(rx, txt): continue
        t = round(b["s"] + atraso, 2)
        if t - ult.get(i, -99) < GAP.get(i, 6): continue
        e = {"t": t, "id": i, "var": uso.get(i, 0) % VAR[i], "lufs": lufs}
        if dur: e["dur"] = round(min(dur, b["e"] - b["s"] + 1.0), 1)
        plano.append(e); ult[i] = t; uso[i] = uso.get(i, 0) + 1
        break
json.dump(plano, open(f"{R}/audio/efeitos_plano.json", "w", encoding="utf-8"), indent=0)
from collections import Counter
print(len(plano), "efeitos:", dict(Counter(e["id"] for e in plano)))
