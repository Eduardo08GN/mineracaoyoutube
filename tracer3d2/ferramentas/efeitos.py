# Tracer3D 2.0: posiciona os efeitos sonoros pelas batidas (v1/src/plano.json) por palavras-chave da descricao da batida
# e do texto falado, sem LLM. Saida: audio/efeitos_plano.json (formato do mixar.py). Regras: no maximo 1 efeito por
# batida, >= 6 s entre efeitos do mesmo id, camas (dur) mais baixas; variantes alternadas.
import json, os, re
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
P = json.load(open(f"{R}/v1/src/plano.json", encoding="utf-8"))
GAP = {"s01": 25, "s02": 18, "s04": 15, "s06": 30, "s07": 30, "s09": 30}   # intervalo minimo por efeito (s)
VAR = {"s01": 3, "s02": 3, "s03": 2, "s04": 3, "s05": 1, "s06": 1, "s07": 1, "s08": 2, "s09": 1, "s10": 2, "s11": 2, "s12": 2}
# (id, regex na descricao/fala, lufs, dur ou None = efeito inteiro, atraso s)
REGRAS = [
    ("s08", r"explo\w* .*(liberator|drohne|drone|suffolk|em voo|in der luft)|(liberator|suffolk).*explo", -24, None, 0.3),
    ("s04", r"tallboy.*(explo|detona|einschlag|impacto)|terremoto|erdbeben|desab|einst[uü]rz|bombe.*(explo|kalk|fels)", -20, None, 0.3),
    ("s02", r"igni|z[uü]nd|c[aâ]mara|kammer|carga lateral|seitenkammer|blow-by", -24, None, 0.2),
    ("s01", r"dispar|abschuss|feuert\b|erster schuss|sai do tubo|verl[aä]sst die", -22, None, 0.1),
    ("s03", r"supers[oô]nic|überschall|mach\s?[23]|knall|estrondo", -26, None, 0.2),
    ("s05", r"lancaster|bomber|bombardeiro|forma[cç][aã]o", -29, 10.0, 0.0),
    ("s12", r"mustang|ca[cç]a\b|tiefflug", -27, None, 0.0),
    ("s10", r"luxemb\w*.*(impact|einschlag|treffer|explo)|stadtgebiet", -25, None, 0.2),
    ("s09", r"misdroy|wollin|wolin|ostsee|b[aá]ltico|mar\b", -31, 9.0, 0.0),
    ("s11", r"segment|flange|parafus|verschraub|werkstatt|oficina", -27, None, 0.2),
    ("s07", r"t[uú]nel|stollen|galeria|subterr|unter tage|bunker", -32, 9.0, 0.0),
    ("s06", r"colina|h[uü]gel|campo|felder|zona rural|kalkh[uü]gel", -33, 10.0, 0.0),
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
