# Tracer3D 2.0: posiciona os efeitos sonoros pelas batidas (v1/src/plano.json) por palavras-chave da descricao da batida
# e do texto falado, sem LLM. Saida: audio/efeitos_plano.json (formato do mixar.py). Regras: no maximo 1 efeito por
# batida, >= 6 s entre efeitos do mesmo id, camas (dur) mais baixas; variantes alternadas.
import json, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(f"{R}/v1/src/plano.json", encoding="utf-8"))
GAP = {"s01": 30, "s02": 25, "s03": 40, "s04": 60, "s05": 45, "s06": 60, "s07": 60, "s08": 50, "s09": 60, "s10": 60, "s11": 45, "s12": 60}   # intervalo minimo por efeito (s)
import glob as _g
VAR = {}   # variantes que existem de fato em audio/pe (o mapa de cada video define quantas)
for _f in _g.glob(f"{R}/audio/pe/*.flac"): _i = os.path.basename(_f).split("_")[0]; VAR[_i] = VAR.get(_i, 0) + 1
# (id, regex na descricao/fala, lufs, dur ou None = efeito inteiro, atraso s)
REGRAS = [
    ("s04", r"munitionslager|paiol|depot.*(explo|vernicht)|explodierte|lager.*explo", -20, None, 0.3),
    ("s02", r"einschlag|schl[aä]gt .*ein|impacto|trifft|aufschlag|cratera|krater", -22, None, 0.3),
    ("s01", r"abschuss|dann der abschuss|feuert|erster schuss|disparo|verl[aä]sst das rohr|sai do tubo|tiro", -21, None, 0.1),
    ("s03", r"fliegt|im flug|granate.*(steigt|f[aä]llt)|trajet[oó]ria|apogeu|gipfel", -27, None, 0.3),
    ("s10", r"stuka|luftwaffe|luftangriff|bomben auf|jagdflugzeug|ca[cç]as", -26, None, 0.2),
    ("s05", r"z[uü]ge|zug |trem|vag[oõ]|eisenbahn|gleis|ferrovia|rollen", -29, 9.0, 0.0),
    ("s11", r"portalkr[aä]n|guindaste|montag|setzen .*zusammen|zusammengebaut", -27, None, 0.2),
    ("s08", r"verschluss|culatra|drehgestell|truque|fahrgestell|lafette|ladung", -27, None, 0.2),
    ("s07", r"aufgeschnitten|einschnitt|vala|escava|arbeiten daran|tag und nacht", -31, 9.0, 0.0),
    ("s09", r"trommelfeuer|gro[sß]angriff|st[oö]rfang|artillerie in masse|belager", -28, 9.0, 0.0),
    ("s12", r"schwarzen meer|bucht|ba[ií]a|k[uü]ste|ostseek[uü]ste|meer hinaus", -31, 9.0, 0.0),
    ("s06", r"krim|steppe|h[uü]gel|tal bei|bachtschyssarai", -33, 10.0, 0.0),
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
